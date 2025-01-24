# import sys
# import json
# import ollama
# def generate_summary(input_data, query):
#     """
#     Generate a summary using the local Ollama Llama3.2 model.
#     """
#     if not isinstance(input_data, list) or not all('result' in item and 'relevance' in item for item in input_data):
#         return "Invalid input: Each item must be a dictionary with 'result' and 'relevance' keys."

#     # Sort data by relevance and combine the text
#     sorted_data = sorted(input_data, key=lambda x: x['relevance'], reverse=True)
#     combined_text = "\n".join([item['result'] for item in sorted_data])

#     # Improved, more specific prompt to guide the model
#     prompt = f"""
#         You are an expert summarizer tasked with creating a concise and direct summary based on the following content.
#         The information is sorted by relevance, with the most important points appearing first.

#         Your job is to:
#         1. Summarize the content by extracting the core message without analyzing each individual entry.
#         2. Provide a high-level overview, focusing only on the most relevant and important points.
#         3. Avoid unnecessary explanations or phrases like "It appears" or "This content" or "Here are the summaries:".
#         4. Keep the summary clear, direct, and to the point without recommendations or actions unless absolutely essential.
#         5. Understand it properly then make the answer.

#         Note: This combine text data is a search vector data, search based on the query to make your task more related and efficient, so always understand them.

#         Query: "{query}"?

#         Text to summarize:
#         "{combined_text}"
#         """


#     try:
#         # Use Ollama to generate the summary
#         response = ollama.chat(
#             model="llama3.2",
#             messages=[{
#                 "role": "system",
#                 "content": "You are a helpful assistant that generates concise, informative summaries."
#             },{
#                 "role": "user",
#                 "content": prompt
#             }]
#         )

#         # Extract and return the summary
#         return response['message']['content']

#     except Exception as e:
#         return f"Error generating summary: {str(e)}"

# def generate_recommendations(summary):
#     """
#     Generate actionable recommendations using the local Ollama Llama3.2 model.
#     """
#     prompt = f"""
#         Based on the following summary:
#         "{summary}"

#         You are an expert at providing actionable workplace safety recommendations. Your task is to:
#         1. Identify areas for improvement based on the content.
#         2. Provide specific, actionable recommendations in three categories:
#             - Policies to implement.
#             - Corrective actions to address current issues.
#             - Preventive measures to avoid future problems.
#         3. Structure your response as:
#             - Policies:
#             - Corrective Actions:
#             - Preventive Measures:

#         Keep the language clear and professional.
#     """

#     try:
#         # Use Ollama to generate recommendations
#         response = ollama.chat(
#             model="llama3.2",
#             messages=[{
#                 "role": "system",
#                 "content": "You are a helpful assistant that generates actionable workplace recommendations."
#             }, {
#                 "role": "user",
#                 "content": prompt
#             }]
#         )

#         # Extract and return the recommendations
#         return response['message']['content']

#     except Exception as e:
#         return f"Error generating recommendations: {str(e)}"


# def generate_anomalies(input_data):
#     """
#     Detect anomalies in safety incident data using the local Ollama Llama3.2 model.
#     """
#     if not isinstance(input_data, list) or not all('incident_type' in item and 'severity' in item for item in input_data):
#         return "Invalid input: Each item must be a dictionary with 'incident_type' and 'severity' keys."

#     # Combine data for analysis
#     combined_data = "\n".join([f"Incident: {item['incident_type']}, Severity: {item['severity']}" for item in input_data])

#     # Prompt to guide the model in anomaly detection
#     prompt = f"""
#         You are an expert in safety data analysis. Your task is to detect any anomalies in the following incident data.

#         The data includes safety incidents with varying levels of severity. You need to:
#         1. Analyze the data and categorize anomalies into the following groups:
#             - Critical Anomalies: Incidents that require immediate attention due to high severity or unusual occurrences.
#             - Potential Anomalies: Incidents that may need further investigation or monitoring.
#             - Normal: Regular incidents that do not indicate any immediate risks or unusual patterns.
#         2. For each category, provide a brief explanation of why the incident is classified as such.

#         Here is the incident data to analyze:
#         "{combined_data}"
#         """

#     try:
#         # Use Ollama to generate anomaly detection results
#         response = ollama.chat(
#             model="llama3.2",
#             messages=[{
#                 "role": "system",
#                 "content": "You are a safety expert who detects and categorizes anomalies in safety data."
#             }, {
#                 "role": "user",
#                 "content": prompt
#             }]
#         )

#         # Extract and return the anomalies detection result
#         return response['message']['content']

#     except Exception as e:
#         return f"Error detecting anomalies: {str(e)}"





# # def generate_formatted_output(query, summary, recommendations):
# #     """
# #     Generate a formatted HTML output using the summary and recommendations.
# #     """
# #     prompt = f"""
# #     Based on the following summary and recommendations, generate a clean and structured HTML output:

# #     Query:
# #     {query}

# #     Summary:
# #     {summary}


# #     Recommendations:
# #     {recommendations}

# #     Your task is to:
# #     1. Create an HTML structure with:
# #         - A <h3> heading for the summary.
# #         - A <h4> heading for the recommendations.
# #         - An ordered list (<ol>) for policies, corrective actions, and preventive measures.
# #     2. Structure the output in the following order:
# #         - A summary section with a heading.
# #         - A recommendations section with three subsections:
# #             - Policies
# #             - Corrective Actions
# #             - Preventive Measures
# #     3. Ensure the HTML output is clean and professional, suitable for display on a website.
# #     4. Do not write any other words except this formate.


# #     Your output should look like this:

# #     <h3 style="margin-top: 20px;">Query:</h3>
# #     <p>The content of the Query goes here.</p>

# #     <h3 style="margin-top: 20px;">Summary:</h3>
# #     <p>The content of the summary goes here.</p>

# #     <h3 style="margin-top: 20px;">Recommendations:</h3>

# #     <h4 style="margin-top: 20px;">Policy:</h4>
# #     <ol style="margin-left: 20px; padding-left: 20px;">
# #         <li>Policy 1</li>
# #         <li>Policy 2</li>
# #     </ol>

# #     <h4 style="margin-top: 20px;">Corrective Actions:</h4>
# #     <ol style="margin-left: 20px; padding-left: 20px;">
# #         <li>Action 1</li>
# #         <li>Action 2</li>
# #     </ol>

# #     <h4 style="margin-top: 20px;">Preventive Measures:</h4>
# #     <ol style="margin-left: 20px; padding-left: 20px;">
# #         <li>Measure 1</li>
# #         <li>Measure 2</li>
# #     </ol>


# #     """

# #     try:
# #         # Use Ollama to generate formatted HTML output
# #         response = ollama.chat(
# #             model="llama3.2",
# #             messages=[{
# #                 "role": "system",
# #                 "content": "You are an assistant that generates structured HTML output."
# #             }, {
# #                 "role": "user",
# #                 "content": prompt
# #             }]
# #         )

# #         # Return the generated HTML
# #         return response['message']['content']

# #     except Exception as e:
# #         return f"Error generating formatted output: {str(e)}"


# def generate_formatted_output(query, summary, recommendations):
#     """
#     Generate a formatted Markdown output using the summary and recommendations.
#     """
#     prompt = f"""
#     Based on the following summary and recommendations, generate a clean and structured Markdown output:

#     Query:
#     {query}

#     Summary:
#     {summary}


#     Recommendations:
#     {recommendations}

#     Your task is to:
#     1. Create a Markdown structure with:
#         - A top-level heading (#) for the query.
#         - A second-level heading (##) for the summary.
#         - A second-level heading (##) for the recommendations.
#         - Subsections (###) for Policies, Corrective Actions, and Preventive Measures.
#         - Use unordered lists (-) for each subsection.
#     2. Structure the output in the following order:
#         - A query section with a heading.
#         - A summary section with a heading.
#         - A recommendations section with three subsections:
#             - Policies
#             - Corrective Actions
#             - Preventive Measures
#     3. Ensure the Markdown output is clean and professional, suitable for display on a Markdown-supported platform.
#     4. Do not include any additional text except the required Markdown structure.

#     Your output should look like this:

#     ## Query: \n
#     The content of the query goes here.

#     ## Summary: \n
#     The content of the summary goes here.

#     ## Recommendations: \n

#     ### Policies:
#     - Policy 1
#     - Policy 2

#     ### Corrective Actions:
#     - Action 1
#     - Action 2

#     ### Preventive Measures:
#     - Measure 1
#     - Measure 2
#     """

#     try:
#         # Use Ollama to generate formatted Markdown output
#         response = ollama.chat(
#             model="llama3.2",
#             messages=[{
#                 "role": "system",
#                 "content": "You are an assistant that generates structured Markdown output."
#             }, {
#                 "role": "user",
#                 "content": prompt
#             }]
#         )

#         # Return the generated Markdown
#         return response['message']['content']

#     except Exception as e:
#         return f"Error generating formatted output: {str(e)}"

import sys
import json
import ollama
def generate_summary(input_data, query):
    """
    Generate a summary using the local Ollama Llama3.2 model.
    """
    if not isinstance(input_data, list) or not all('result' in item and 'relevance' in item for item in input_data):
        return "Invalid input: Each item must be a dictionary with 'result' and 'relevance' keys."

    # Sort data by relevance and combine the text
    sorted_data = sorted(input_data, key=lambda x: x['relevance'], reverse=True)
    combined_text = "\n".join([item['result'] for item in sorted_data])

    # Improved, more specific prompt to guide the model
    prompt = f"""
        You are an expert report writter tasked with creating a concise and based on the following content.
        The information is sorted by relevance, with the most important points appearing first.

        Your job is to:
        1. Follow command and the content by extracting the core message without analyzing each individual entry.
        2. Always add a high-level overview, focusing only on the most relevant and important points.
        3. Avoid unnecessary explanations or phrases like "It appears" or "This content" or "Here are the summaries:".
        4. Keep the writing clear, direct, and to the point without recommendations or actions unless absolutely essential.
        5. Understand it properly then make the answer.

        Note: This combine text data is a search vector data, search based on the query to make your task more related and efficient, so always understand them.

        command: "{query}"

        metadata:
        "{combined_text}"
        """


    try:
        # Use Ollama to generate the summary
        response = ollama.chat(
            model="llama3.2",
            messages=[{
                "role": "system",
                "content": "You are a helpful assistant that generates concise, informative report."
            },{
                "role": "user",
                "content": prompt
            }]
        )

        # Extract and return the summary
        return response['message']['content']

    except Exception as e:
        return f"Error generating summary: {str(e)}"

def generate_recommendations(data):
    """
    Generate actionable recommendations using the local Ollama Llama3.2 model.
    """
    prompt = f"""
        Based on the following data:
        "{data}"

        You are an expert at providing actionable workplace safety recommendations. Your task is to:
        1. Identify areas for improvement based on the content.
        2. Provide specific, actionable recommendations in three categories:
            - Policies to implement.
            - Corrective actions to address current issues.
            - Preventive measures to avoid future problems.
        3. Structure your response as:
            - Policies:
            - Corrective Actions:
            - Preventive Measures:

        Keep the language clear and professional.
    """

    try:
        # Use Ollama to generate recommendations
        response = ollama.chat(
            model="llama3.2",
            messages=[{
                "role": "system",
                "content": "You are a helpful assistant that generates actionable workplace recommendations."
            }, {
                "role": "user",
                "content": prompt
            }]
        )

        # Extract and return the recommendations
        return response['message']['content']

    except Exception as e:
        return f"Error generating recommendations: {str(e)}"


def generate_anomalies(input_data):
    """
    Detect anomalies in safety incident data using the local Ollama Llama3.2 model.
    """
    if not isinstance(input_data, list) or not all('incident_type' in item and 'severity' in item for item in input_data):
        return "Invalid input: Each item must be a dictionary with 'incident_type' and 'severity' keys."

    # Combine data for analysis
    combined_data = "\n".join([f"Incident: {item['incident_type']}, Severity: {item['severity']}" for item in input_data])

    # Prompt to guide the model in anomaly detection
    prompt = f"""
        You are an expert in safety data analysis. Your task is to detect any anomalies in the following incident data.

        The data includes safety incidents with varying levels of severity. You need to:
        1. Analyze the data and categorize anomalies into the following groups:
            - Critical Anomalies: Incidents that require immediate attention due to high severity or unusual occurrences.
            - Potential Anomalies: Incidents that may need further investigation or monitoring.
            - Normal: Regular incidents that do not indicate any immediate risks or unusual patterns.
        2. For each category, provide a brief explanation of why the incident is classified as such.

        Here is the incident data to analyze:
        "{combined_data}"
        """

    try:
        # Use Ollama to generate anomaly detection results
        response = ollama.chat(
            model="llama3.2",
            messages=[{
                "role": "system",
                "content": "You are a safety expert who detects and categorizes anomalies in safety data."
            }, {
                "role": "user",
                "content": prompt
            }]
        )

        # Extract and return the anomalies detection result
        return response['message']['content']

    except Exception as e:
        return f"Error detecting anomalies: {str(e)}"






def generate_formatted_output(query, summary, recommendations):
    """
    Generate a formatted Markdown output using the summary and recommendations.
    """
    prompt = f"""
    Based on the following summary and recommendations, generate a clean and structured Markdown output:

    Query:
    {query}

    Summary:
    {summary}


    Recommendations:
    {recommendations}

    Your task is to:
    1. Create a Markdown structure with:
        - A top-level heading (#) for the query.
        - A second-level heading (##) for the summary.
        - A second-level heading (##) for the recommendations.
        - Subsections (###) for Policies, Corrective Actions, and Preventive Measures.
        - Use unordered lists (-) for each subsection.
    2. Structure the output in the following order:
        - A query section with a heading.
        - A summary section with a heading.
        - A recommendations section with three subsections:
            - Policies
            - Corrective Actions
            - Preventive Measures
    3. Ensure the Markdown output is clean and professional, suitable for display on a Markdown-supported platform.
    4. Do not include any additional text except the required Markdown structure.

    Your output should look like this:

    ## Query: \n
    The content of the query goes here.

    ## Summary: \n
    The content of the summary goes here.

    ## Recommendations: \n

    ### Policies:
    - Policy 1
    - Policy 2

    ### Corrective Actions:
    - Action 1
    - Action 2

    ### Preventive Measures:
    - Measure 1
    - Measure 2
    """

    try:
        # Use Ollama to generate formatted Markdown output
        response = ollama.chat(
            model="llama3.2",
            messages=[{
                "role": "system",
                "content": "You are an assistant that generates structured Markdown output."
            }, {
                "role": "user",
                "content": prompt
            }]
        )

        # Return the generated Markdown
        return response['message']['content']

    except Exception as e:
        return f"Error generating formatted output: {str(e)}"





