import logging
import ollama
from typing import Optional, List

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
        - Write in a paragraph only
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
