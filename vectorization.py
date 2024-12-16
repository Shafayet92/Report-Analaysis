import os
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

UPLOAD_FOLDER = './uploads'
PERSIST_DIRECTORY = 'data/db'
SIMILARITY_THRESHOLD = 0.3  # Cosine similarity threshold
BATCH_SIZE = 500  # Batch size for processing

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PERSIST_DIRECTORY, exist_ok=True)

logging.basicConfig(level=logging.INFO)

# Function to load PDF files
def load_pdf(file_path):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    return documents

# Function to load Excel files
def load_excel(file_path):
    df = pd.read_excel(file_path)
    documents = []
    for i in range(0, len(df), BATCH_SIZE):
        chunk = df.iloc[i:i + BATCH_SIZE]
        text = chunk.to_string(index=False)
        documents.append(Document(page_content=text))
    return documents

# Function to load CSV files
def load_csv(file_path):
    df = pd.read_csv(file_path)
    documents = []
    for i in range(0, len(df), BATCH_SIZE):
        chunk = df.iloc[i:i + BATCH_SIZE]
        text = chunk.to_string(index=False)
        documents.append(Document(page_content=text))
    return documents

# Function to load DOCX files
def load_docx(file_path):
    doc = DocxDocument(file_path)
    documents = [Document(page_content=para.text) for para in doc.paragraphs if para.text.strip()]
    return documents

# Function to split documents into smaller chunks
def text_split(extracted_data):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    text_chunks = text_splitter.split_documents(extracted_data)
    return text_chunks

# Get embedding model
def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cuda' if torch.cuda.is_available() else 'cpu'}
    )

# VectorStore class to manage vectorized data
class VectorStore:
    def __init__(self):
        self.embeddings = get_embeddings()
        self.vectordb = None
        self.initialize_store()

    def initialize_store(self):
        # Initialize the Chroma vector store with existing data if available
        if os.path.exists(PERSIST_DIRECTORY):
            self.vectordb = Chroma(
                persist_directory=PERSIST_DIRECTORY,
                embedding_function=self.embeddings
            )
        else:
            self.vectordb = Chroma(
                embedding_function=self.embeddings,
                persist_directory=PERSIST_DIRECTORY
            )

    def reset_store(self):
        """ Clears the vector store data, useful on a system restart if you want a fresh start """
        self.vectordb.clear()
        print("Cleared the Chroma vector store.")  # Debugging log

    def add_documents(self, documents):
        # Process documents in batches
        text_chunks = text_split(documents)
        total_chunks = len(text_chunks)

        for i in range(0, total_chunks, BATCH_SIZE):
            batch = text_chunks[i:i + BATCH_SIZE]
            if not self.vectordb:
                self.vectordb = Chroma.from_documents(
                    documents=batch,
                    embedding=self.embeddings,
                    persist_directory=PERSIST_DIRECTORY
                )
            else:
                self.vectordb.add_documents(batch)

            # Chroma should automatically persist to the specified directory without needing explicit save or persist calls.
            print(f"Processed batch {i//BATCH_SIZE + 1}/{(total_chunks + BATCH_SIZE - 1)//BATCH_SIZE}")

        return total_chunks


    def normalize_score(self, score):
        # Convert cosine similarity to [0, 1] range
        return (score + 1) / 2

    def similarity_search(self, query, k=30):
        if not self.vectordb:
            logging.warning("Vector store is not initialized. Returning empty results.")
            return []

        # Handle common misspellings
        query = query.lower().strip()
        common_corrections = {
            'safty': 'safety',
            'quite': 'quit',
            # Add more corrections as needed
        }

        # Correct the spelling errors in the entire query
        query_tokens = query.split()
        corrected_query_tokens = [common_corrections.get(token, token) for token in query_tokens]
        query = ' '.join(corrected_query_tokens)

        try:
            # Perform the similarity search
            results = self.vectordb.similarity_search_with_relevance_scores(query, k=k)

            # Normalize scores and filter based on the threshold
            filtered_results = [
                (doc, (score + 1) / 2)  # Normalize score to range [0, 1]
                for doc, score in results
                if (score + 1) / 2 >= SIMILARITY_THRESHOLD
            ]

            # Log a message if no relevant results were found
            if not filtered_results:
                logging.info("No relevant results found for the given query.")

            return filtered_results

        except Exception as e:
            logging.error(f"Error during similarity search: {str(e)}")
            return []

# Utility function to process files
def process_file(file_path, file_extension):
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

# Singleton instance for use across the Flask application
vector_store = VectorStore()

def vectorize_and_search(query, k):
    # Perform similarity search using the singleton vector_store instance
    return vector_store.similarity_search(query, k)
