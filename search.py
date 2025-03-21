import logging
import ollama
from typing import Any, Optional, List

# Configure logging
logging.basicConfig(level=logging.INFO)

def summarize_data(data: str, model: str = "llama3.2") -> Optional[str]:
    """
    Calls the local Ollama model to generate a clear, concise, and structured summary of the provided content.
    """
    prompt = (
        f"""Please summarize the following content in a clear, concise, and formal paragraph:

        - Focus on the key points and essential details.
        - Maintain the context necessary for understanding.
        - Avoid unnecessary repetition and extraneous information.
        - Write in a paragraph only.
        - Write the summary as a single paragraph without mentioning the process.

        ### Content:
        {data}

        Return the final summary as a single formal paragraph.
        """
    )
    try:
        response = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant specializing in summarization."},
                {"role": "user", "content": prompt}
            ]
        )
        return response['message']['content'].strip()
    except Exception as e:
        logging.error(f"Error calling Ollama: {e}", exc_info=True)
        return None

def fullsummarization(summaries: List[str]) -> Optional[str]:
    """
    Combines a list of individual file summaries into a single full summary.
    """
    try:
        combined_data = "\n".join(summaries)
        full_summary = summarize_data(combined_data)
        return full_summary
    except Exception as e:
        logging.error(f"Error during full summarization: {e}", exc_info=True)
        return None




def llm_response_search(query: str, result: List[Any], model: str = "llama3.2") -> Optional[str]:

    """
    Calls the local Ollama model to assess whether additional search results are relevant.

    Args:
        query (str): The original search query.
        result (List[Any]): A list of additional results to evaluate.
        model (str): The Ollama model to use. Defaults to "llama3.2".

    Returns:
        Optional[str]: "Yes" if results are relevant, "No" otherwise, or None in case of an error.
    """
    # Handle empty result scenario
    if not result:
        return "No"

    prompt = (
        f"Query: {query}\n\n"
        f"Additional results (key summary information):\n"
        f"{[str(item) for item in result]}\n\n"
        "Are these additional results relevant enough to include? Answer 'Yes' if they add relevant "
        "information to the query, or 'No' if they do not. Avoid using any other words rather than yes or, no. "
    )

    try:
        response = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant specializing in evaluating topic relevance."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.get('message', {}).get('content', '').strip()
    except Exception as e:
        logging.error(f"Error calling Ollama: {e}", exc_info=True)
        return None
