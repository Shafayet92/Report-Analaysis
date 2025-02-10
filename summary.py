import logging
import ollama
from flask import Flask, request, jsonify
from typing import Optional


# Configure logging
logging.basicConfig(level=logging.INFO)

def call_ollama(agent_role: str, prompt: str, model: str = "llama3.2") -> Optional[str]:
    """ Call the local Ollama model to generate a response. """
    try:
        response = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": f"You are a helpful assistant specializing in {agent_role}."},
                {"role": "user", "content": prompt}
            ]
        )
        return response['message']['content'].strip()

    except Exception as e:
        logging.error(f"Error calling Ollama for role '{agent_role}': {e}", exc_info=True)
        return None

def call_deepseek_r1(prompt: str) -> Optional[str]:
    """ Use DeepSeek-R1 for query refinement and step optimization. """
    try:
        response = ollama.chat(
            model="deepseek-r1",
            messages=[
                {"role": "system", "content": "You are an advanced prompt optimizer that improves task clarity and step efficiency."},
                {"role": "user", "content": prompt}
            ]
        )
        return response['message']['content'].strip()

    except Exception as e:
        logging.error(f"Error calling DeepSeek-R1 for prompt optimization: {e}", exc_info=True)
        return None

def prompt_optimizer(user_query: str, context) -> Optional[str]:
    """ Optimizes user instructions using DeepSeek-R1. """
    prompt = (
        f"""Optimize the following user instruction or user_query based on the given or Provided Context. Improve clarity, structure, and step efficiency to ensure precise AI-generated reports.

        - **Refine vague or broad queries** into well-defined, structured instructions.
        - **Incorporate relevant context** into the query to make it more specific.
        - **Break down complex requests** into a sequence of clear steps.
        - **Ensure the instruction aligns with industry standards** for structured reporting.
        - **Remove unnecessary words or ambiguity** to improve efficiency.

        ### User Instruction:
        {user_query}

        ### Provided Context:
        {context}

        Return the optimized instruction for prompt in a **concise ollama model** format that ensures the best possible response.
        """
    )
    return call_deepseek_r1(prompt)

def retrieval_agent(optimized_instruction: str, context) -> Optional[str]:
    """ Retrieves relevant content. """
    prompt = (
        f"""Find the most relevant and detailed data for the following request. Extract full information, including statistics, incident records, expert opinions, and any supporting evidence.

        Ensure the response includes:
        - Historical background and trends.
        - Relevant technical details.
        - Risk assessments and real-world implications.
        - Regulations and compliance considerations.

        Format the response as detailed paragraphs at the end.
         ### Optimized Instruction:
            {optimized_instruction}

        ### Context:
            {context}

        """

    )
    return call_ollama("Retrieval Agent", prompt)

def filtering_agent(retrieved_context: str) -> Optional[str]:
    """ Filters out irrelevant, redundant, or low-quality information. """
    prompt = (
        f"""
        Refine the extracted data by removing irrelevant, redundant, or overly generic information.

        Keep:
        - Specific technical details.
        - Data-driven insights.
        - Real-world incidents or case studies.
        - Actionable recommendations.

        Ensure the response remains well-structured and improves clarity while maintaining depth.


        "{retrieved_context}"""
    )
    return call_ollama("Filtering Agent", prompt)

def analysis_agent(filtered_context: str) -> Optional[str]:
    """ Extracts structured key points. """
    prompt = (
        f"""Analyze the following data and extract the key findings in a **detailed and structured** manner.

        For each key issue:
        - Provide a full explanation with causes and implications.
        - Discuss any historical or statistical relevance.
        - Highlight industry regulations and best practices.

        Use full paragraphs instead of just bullet points to ensure a **comprehensive analysis**.

        "{filtered_context}"""
    )
    return call_ollama("Analysis Agent", prompt)

def contextualization_agent(key_points: str) -> Optional[str]:
    """ Enhances key points with missing insights or explanations. """
    prompt = (
        f"""Expand on the key points below by **adding missing insights, real-world examples, historical context, and regulatory considerations**.

        For each key point:
        - **Explain the background**: Why is this issue important? Has it been a problem in the past?
        - **Provide industry-specific regulations**: Are there any laws, safety standards, or compliance requirements related to this?
        - **Identify potential risks**: What happens if this issue is ignored? What are the short-term and long-term consequences?
        - **Incorporate real-world case studies**: Reference past incidents or industry best practices.
        - **Explore future implications**: How might this issue evolve? Are there emerging technologies or solutions to address it?

        Ensure the response has **clear logical flow**, maintains a **formal and professional tone**, and avoids redundant explanations.

        "{key_points}"""
    )
    return call_ollama("Contextualization Agent", prompt)

def summarization_agent(enhanced_key_points: str) -> Optional[str]:
    """ Generates a structured business report in Markdown format. """
    prompt = (
        f"""Using the detailed key points and formal writing, generate a **comprehensive business report**.

        The report should contain:
        - **Introduction**: A well-written overview explaining the background and significance of the issue.
        - **Key Findings**: A structured analysis of major risks and their implications.
        - **Corrective Actions**: A well-organized list of immediate steps to mitigate risks.
        - **Ongoing Monitoring & Compliance**: Long-term strategies for maintaining safety and operational standards.
        - **Training & Awareness**: The role of crew education and drills in preventing failures.
        - **Recommendations**: Clear, actionable solutions with explanations.

        Use full paragraphs, **formal business tone**, and make sure the report is engaging, well-reasoned, and **not too short**.
        Note: Avoid phrases like "It appears" or "This content" or "Here are the summaries:" or "Comprehensive Business Report".

        "{enhanced_key_points}"""
    )
    return call_ollama("Summarization Agent", prompt)

def refinement_agent(summary_report: str) -> Optional[str]:
    """ Refines the final report for clarity, readability, and proper formatting. """
    prompt = (
        f"""Refine the following report to ensure **clarity, logical flow, and strong formatting of Markdown**.

        - Expand on technical explanations where needed.
        - Improve transitions between sections.
        - Ensure **a smooth narrative flow** instead of isolated bullet points.
        - Format properly with headings and well-structured paragraphs.
        - Make output as Markdown formatted.
        - Use only 3rd person formate or formal format to make the report
        - Avoid phrases like "It appears" or "This content" or "Here are the summaries:" or "Comprehensive Business Report".

        The final result should read like a **professionally prepared industry report** in Markdown format.

        Report:
        "{summary_report}"""
    )
    return call_ollama("Refinement Agent", prompt)

def multi_agent_pipeline(user_instruction: str, context) -> Optional[str]:
    """
    Multi-agent pipeline that:
      1. Optimizes the user query (DeepSeek-R1).
      2. Retrieves relevant content.
      3. Filters unnecessary data.
      4. Extracts structured key points.
      5. Adds missing insights.
      6. Summarizes into a business report.
      7. Refines the final output.

    Returns:
         The final must be report Markdown formatted.
    """
    # Step 1: Optimize query using DeepSeek-R1
    optimized_instruction = prompt_optimizer(user_instruction, context)
    if not optimized_instruction:
        logging.error("Prompt optimization failed.")
        return None

    # Step 2: Retrieve content
    retrieved_context = retrieval_agent(optimized_instruction, context)
    if not retrieved_context:
        logging.error("Retrieval agent failed.")
        return None

    # Step 3: Filter out irrelevant data
    filtered_context = filtering_agent(retrieved_context)
    if not filtered_context:
        logging.error("Filtering agent failed.")
        return None

    # Step 4: Extract key insights
    key_points = analysis_agent(filtered_context)
    if not key_points:
        logging.error("Analysis agent failed.")
        return None

    # Step 5: Add missing insights
    enhanced_key_points = contextualization_agent(key_points)
    if not enhanced_key_points:
        logging.error("Contextualization agent failed.")
        return None

    # Step 6: Generate structured Markdown report
    summary_report = summarization_agent(enhanced_key_points)
    if not summary_report:
        logging.error("Summarization agent failed.")
        return None

    # Step 7: Final refinement
    final_report = refinement_agent(summary_report)
    if not final_report:
        logging.error("Refinement agent failed.")
        return None

    return final_report


