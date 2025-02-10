import hashlib
import os
import re
from sentence_transformers import CrossEncoder
import torch
import pandas as pd
import logging
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain.schema import Document
import numpy as np
from docx import Document as DocxDocument  # For handling DOCX files
from typing import List, Tuple, Any

UPLOAD_FOLDER = './uploads'
PERSIST_DIRECTORY = 'data/db'
SIMILARITY_THRESHOLD = 0.3  # Cosine similarity threshold
BATCH_SIZE = 1000  # Batch size for processing

# Initialize the reranker (outside the class for reuse)
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PERSIST_DIRECTORY, exist_ok=True)

logging.basicConfig(level=logging.INFO)


def load_pdf(file_path):
    """ Load PDF and add file name metadata """
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    file_name = os.path.basename(file_path)

    # Attach metadata to every document chunk
    for doc in documents:
        doc.metadata = {"file_name": file_name}  # Ensure metadata is stored

    return documents


# Function to load Excel files
def load_excel(file_path):
    """ Load Excel and add file name metadata """
    df = pd.read_excel(file_path)
    documents = []
    file_name = os.path.basename(file_path)

    for i in range(0, len(df), BATCH_SIZE):
        chunk = df.iloc[i:i + BATCH_SIZE]
        text = chunk.to_string(index=False)
        documents.append(Document(page_content=text, metadata={"file_name": file_name}))

    return documents


def load_csv(file_path):
    """ Load CSV and add file name metadata """
    df = pd.read_csv(file_path)
    documents = []
    file_name = os.path.basename(file_path)

    for i in range(0, len(df), BATCH_SIZE):
        chunk = df.iloc[i:i + BATCH_SIZE]
        text = chunk.to_string(index=False)
        documents.append(Document(page_content=text, metadata={"file_name": file_name}))

    return documents

# Function to load DOCX files
def load_docx(file_path):
    """ Load DOCX and add file name metadata """
    doc = DocxDocument(file_path)
    file_name = os.path.basename(file_path)

    documents = [Document(page_content=para.text, metadata={"file_name": file_name})
                 for para in doc.paragraphs if para.text.strip()]
    return documents

# Function to split documents into smaller chunks
# def text_split(extracted_data, chunk_size=1000, chunk_overlap=150):

#     separators = ["\n\n", "\n", ". ", " ", ""]

#     text_splitter = RecursiveCharacterTextSplitter(
#         chunk_size=chunk_size,
#         chunk_overlap=chunk_overlap,
#         separators=separators
#     )

#     # Split the document
#     text_chunks = text_splitter.split_documents(extracted_data)

#     # Remove empty or redundant chunks
#     filtered_chunks = [chunk for chunk in text_chunks if len(chunk.page_content.strip()) > 0]

#     return filtered_chunks

def text_split(extracted_data, max_sentences=3, chunk_size=1000, overlap=1):
    """
    Hybrid chunking: Sentence-based but ensures chunk size is reasonable.
    :param extracted_data: List of Document objects.
    :param max_sentences: Number of sentences per chunk.
    :param chunk_size: Character limit for each chunk.
    :param overlap: Number of overlapping sentences.
    """
    all_chunks = []

    for doc in extracted_data:
        text = doc.page_content.strip()
        file_name = doc.metadata.get("file_name", "Unknown")

        # Step 1: Split into full sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)

        # Step 2: Combine sentences into chunks, ensuring they don't exceed chunk_size
        current_chunk = []
        current_length = 0

        for sentence in sentences:
            if current_length + len(sentence) > chunk_size and current_chunk:
                chunk_text = " ".join(current_chunk)
                all_chunks.append(Document(page_content=chunk_text, metadata={"file_name": file_name}))
                current_chunk = current_chunk[-overlap:]  # Retain overlap
                current_length = sum(len(s) for s in current_chunk)

            current_chunk.append(sentence)
            current_length += len(sentence)

        # Add last chunk
        if current_chunk:
            chunk_text = " ".join(current_chunk)
            all_chunks.append(Document(page_content=chunk_text, metadata={"file_name": file_name}))

    return all_chunks



# Get embedding model
def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="multi-qa-MiniLM-L6-cos-v1",
        model_kwargs={'device': 'cuda' if torch.cuda.is_available() else 'cpu'}
    )

# VectorStore class to manage vectorized data
class VectorStore:
    def __init__(self):
        self.embeddings = get_embeddings()
        self.vectordb = None
        self.document_hashes = set()  # Set to store hashes of existing documents
        self.initialize_store()

    def initialize_store(self):
        # Initialize the Chroma vector store with existing data if available
        if os.path.exists(PERSIST_DIRECTORY):
            self.vectordb = Chroma(
                persist_directory=PERSIST_DIRECTORY,
                embedding_function=self.embeddings
            )
            # Load existing document hashes from the vector store
            all_docs = self.vectordb.get()
            for doc in all_docs:
                # Ensure doc is a Document object before trying to access page_content
                if isinstance(doc, Document):
                    doc_hash = hashlib.md5(doc.page_content.encode('utf-8')).hexdigest()
                    self.document_hashes.add(doc_hash)
                else:
                    logging.warning(f"Skipping non-Document object: {doc}")
        else:
            self.vectordb = Chroma(
                embedding_function=self.embeddings,
                persist_directory=PERSIST_DIRECTORY
            )

    def clear_store(self):
        """ Clears the vector store data, useful on a system restart if you want a fresh start """
        self.vectordb.clear()
        print("Cleared the Chroma vector store.")  # Debugging log

    def add_documents(self, documents):
        # Process documents in batches
        text_chunks = text_split(documents)
        total_chunks = len(text_chunks)

        # Add documents to the vector store in batches
        for i in range(0, total_chunks, BATCH_SIZE):
            batch = text_chunks[i:i + BATCH_SIZE]
            unique_batch = []

            for doc in batch:
                doc_hash = hashlib.md5(doc.page_content.encode('utf-8')).hexdigest()

                # Check if the hash is already in the set of document hashes
                if doc_hash not in self.document_hashes:
                    unique_batch.append(doc)
                    self.document_hashes.add(doc_hash)

            if unique_batch:
                self.vectordb.add_documents(unique_batch)
                print(f"Processed batch {i // BATCH_SIZE + 1}/{(total_chunks + BATCH_SIZE - 1) // BATCH_SIZE}")
            else:
                print(f"Batch {i // BATCH_SIZE + 1} contains only duplicates. Skipping.")

        return total_chunks



    def normalize_score(self, score):
        # Convert cosine similarity to [0, 1] range
        return (score + 1) / 2


    def delete_chunks_by_file(self, file_name: str) -> bool:
        """
        Deletes all document chunks from the vector store that have a metadata field 'file_name'
        matching the provided file_name.

        Args:
            file_name (str): The file name whose chunks should be removed.

        Returns:
            bool: True if deletion was successful, False otherwise.
        """
        try:
            # Use where_document to target documents whose metadata has file_name equal to the provided value.
            self.vectordb.delete(where_document={"file_name": file_name})
            logging.info(f"Deleted all chunks with file_name '{file_name}' from the vector store.")

            # Rebuild the document_hashes set to reflect the current state of the vector store.
            self.document_hashes = set()
            all_docs = self.vectordb.get()
            for doc in all_docs:
                if isinstance(doc, Document):
                    doc_hash = hashlib.md5(doc.page_content.encode('utf-8')).hexdigest()
                    self.document_hashes.add(doc_hash)
            return True

        except Exception as e:
            logging.error(f"Error deleting chunks for file '{file_name}': {e}")
            return False






    # def similarity_search(self, query, k=30):
    #     if not self.vectordb:
    #         logging.warning("Vector store is not initialized. Returning empty results.")
    #         return []

    #     query = query.lower().strip()

    #     try:
    #         # Step 1: Retrieve initial results
    #         raw_results = self.vectordb.similarity_search_with_relevance_scores(query, k=k)

    #         # Extract only (doc, score) from each tuple, ignoring any extra values
    #         results = [(doc, score) for res in raw_results if isinstance(res, (tuple, list)) and len(res) >= 2 for doc, score in [res[:2]]]

    #         if not results:
    #             logging.info(f"No relevant results found for query: {query}")
    #             return []

    #         # Step 2: Normalize scores between 0 and 1
    #         normalized_results = [(doc, max(0, min((score + 1) / 2, 1))) for doc, score in results]

    #         # Step 3: Prepare for reranking
    #         docs = [doc.page_content for doc, _ in normalized_results]
    #         if not docs:
    #             logging.warning("No documents available for reranking.")
    #             return []

    #         rerank_scores = reranker.predict([(query, doc) for doc in docs])

    #         # Step 4: Sort by rerank score
    #         reranked_results = sorted(
    #             [(doc, rerank_score) for (doc, _), rerank_score in zip(normalized_results, rerank_scores)],
    #             key=lambda x: x[1],
    #             reverse=True
    #         )

    #         # Step 5: Return correct format (doc, score)
    #         return reranked_results

    #     except Exception as e:
    #         logging.error(f"Error during similarity search: {str(e)}")
    #         return []






    def similarity_search(self, query: str, k: int = 30) -> List[Tuple[Any, float]]:
        """
        Perform a similarity search on the vector database and optionally rerank the results.

        This function:
        1. Retrieves the top `k` results with relevance scores from the vector store.
        2. Normalizes these scores from an assumed range of [-1, 1] to [0, 1].
        3. Extracts page content from the documents for reranking if available.
        4. Uses the reranker (if available) to predict a new score based on the query and document's text.
        5. Returns a list of documents with their scores, sorted in descending order.

        Args:
            query (str): The search query.
            k (int, optional): The number of top results to retrieve. Defaults to 30.

        Returns:
            List[Tuple[Any, float]]: A list of tuples, each containing a document and its corresponding score.
        """
        if not self.vectordb:
            logging.warning("Vector store is not initialized. Returning empty results.")
            return []

        # Normalize the query.
        normalized_query = query.lower().strip()

        try:
            # Step 1: Retrieve initial results from the vector store.
            raw_results = self.vectordb.similarity_search_with_relevance_scores(normalized_query, k=k)
            if not raw_results:
                logging.info(f"No results returned from the vector store for query: '{normalized_query}'")
                return []

            # Extract valid (doc, score) tuples.
            results: List[Tuple[Any, float]] = []
            for res in raw_results:
                if isinstance(res, (tuple, list)) and len(res) >= 2:
                    doc, score = res[0], res[1]
                    results.append((doc, score))
                else:
                    logging.debug(f"Skipping result with invalid format: {res}")

            if not results:
                logging.info(f"No valid results found for query: '{normalized_query}'")
                return []

            # Step 2: Normalize scores from [-1, 1] to [0, 1].
            normalized_results = []
            for doc, score in results:
                norm_score = max(0.0, min((score + 1) / 2, 1.0))
                normalized_results.append((doc, norm_score))

            # Step 3: Extract page content for reranking.
            docs_texts = []
            for doc, _ in normalized_results:
                content = getattr(doc, 'page_content', None)
                if content:
                    docs_texts.append(content)
                else:
                    logging.debug(f"Document {doc} does not have a 'page_content' attribute; skipping.")

            # If reranker exists and there are documents to rerank, use it.
            if hasattr(self, "reranker") and self.reranker is not None and docs_texts:
                # Prepare (query, document) pairs for reranking.
                query_doc_pairs = [(normalized_query, doc_text) for doc_text in docs_texts]
                rerank_scores = self.reranker.predict(query_doc_pairs)
                if len(rerank_scores) != len(normalized_results):
                    logging.warning("Mismatch between the number of rerank scores and the number of retrieved documents.")
                    # Optionally, you can choose to return the normalized results instead.
                    return sorted(normalized_results, key=lambda x: x[1], reverse=True)

                # Step 4: Combine documents with their rerank scores and sort them.
                reranked_results = sorted(
                    [(doc, score) for ((doc, _), score) in zip(normalized_results, rerank_scores)],
                    key=lambda x: x[1],
                    reverse=True
                )
                return reranked_results
            else:
                # If no reranker is available, log info and return normalized results.
                logging.info("Reranker not available; returning normalized results without reranking.")
                return sorted(normalized_results, key=lambda x: x[1], reverse=True)

        except Exception as e:
            logging.error(f"Error during similarity search: {e}", exc_info=True)
            return []



def convert_to_serializable(obj):
    if isinstance(obj, dict):
        return {key: convert_to_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    elif isinstance(obj, np.float32):  # Specifically handle NumPy float32
        return float(obj)
    elif isinstance(obj, np.ndarray):  # Handle NumPy arrays
        return obj.tolist()
    else:
        return obj


# Utility function to process files
def process_file(file_path, file_extension):
    try:
        if file_extension == 'pdf':
            return load_pdf(file_path)
        elif file_extension == 'xlsx':
            return load_excel(file_path)
        elif file_extension == 'csv':
            return load_csv(file_path)
        elif file_extension == 'docx':
            return load_docx(file_path)
        else:
            raise ValueError("Unsupported file type")
    except Exception as e:
        logging.error(f"Error processing file {file_path}: {str(e)}")
        return []

# Singleton instance for use across the Flask application
vector_store = VectorStore()

def vectorize_and_search(query, k):
    # Perform similarity search using the singleton vector_store instance
    try:
        results = vector_store.similarity_search(query, k)
        for doc, score in results:
            print(doc.metadata)
    except Exception as e:
        logging.error(f"Error during vectorization or search: {str(e)}")
        return []
    return results

