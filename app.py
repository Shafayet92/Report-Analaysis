import json
from flask import Flask, request, jsonify, render_template
import threading
import time
import logging
from vectorization import VectorStore, convert_to_serializable, vectorize_and_search
from summary import multi_agent_pipeline
from file_management import upload_files, delete_file, count_files, get_files  # Import file functions

app = Flask(__name__)

# Initialize the vector store
vector_store = VectorStore()

@app.route('/')
def index():
    return render_template('base.html')

@app.route('/content/<tab_name>')
def load_tab_content(tab_name):
    try:
        return render_template(f"{tab_name}.html")
    except:
        return "Content not found", 404

# File upload route (delegated to file_management.py)
@app.route('/upload', methods=['POST'])
def handle_upload():
    return upload_files(request)

# File deletion route (delegated to file_management.py)
@app.route('/delete/<filename>', methods=['DELETE'])
def handle_delete(filename):
    return delete_file(filename)

# File count route (delegated to file_management.py)
@app.route('/count_files', methods=['GET'])
def handle_count_files():
    return count_files()

# File listing route (delegated to file_management.py)
@app.route('/get_files', methods=['GET'])
def handle_get_files():
    return get_files()



# Global dictionary to store progress
progress_data = {"progress": 0, "results": []}
lock = threading.Lock()

@app.route('/start_analysis', methods=['POST'])
def start_analysis():
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({'error': 'No query provided'}), 400

    query = data['query'].strip()
    useLLM = data.get('useLLM', False)
    k = int(data.get('kvalue'))

    def run_analysis():
        global progress_data
        with lock:
            progress_data['progress'] = 0
            progress_data['results'] = []
            progress_data['file_names'] = []
            progress_data['file_summaries'] = []
            progress_data['full_summary'] = ""

        try:
            # Unpack the new variables from vectorize_and_search
            results, file_names, summaries, full_summary = vectorize_and_search(query, useLLM, k)

            with lock:
                # Process document results with relevancy levels
                progress_data['results'] = []
                for doc, score in results:
                    try:
                        # Handle string-based scores like "High", "Medium", "Low"
                        if isinstance(score, str):
                            relevancy = score
                        else:
                            # Normalize numeric scores from [-1, 1] to [0, 1]
                            norm_score = (float(score) + 1) / 2

                            # Assign relevancy levels
                            if norm_score >= 0.7:
                                relevancy = "High"
                            elif norm_score >= 0.4:
                                relevancy = "Medium"
                            else:
                                relevancy = "Low"

                        progress_data['results'].append({
                            "result": doc.page_content,
                            "relevance": relevancy,
                            "file_name": doc.metadata.get("file_name", "Unknown")
                        })

                    except (ValueError, TypeError) as ve:
                        logging.error(f"Invalid score value: {score} for doc: {doc}", exc_info=True)

                # Store individual file summaries and the full summary
                progress_data['file_summaries'] = summaries
                progress_data['file_names'] = file_names
                progress_data['full_summary'] = full_summary
                progress_data['progress'] = 100

        except Exception as e:
            logging.error(f"Error during analysis: {str(e)}", exc_info=True)
            with lock:
                progress_data['progress'] = 100
                progress_data['results'] = [
                    {"result": f"Error during analysis: {str(e)}", "relevance": "N/A", "file_name": "N/A"}
                ]

    threading.Thread(target=run_analysis).start()
    return jsonify({"message": "Analysis started"}), 202





@app.route('/get_progress', methods=['GET'])
def get_progress():
    with lock:
        try:
            return jsonify(convert_to_serializable(progress_data))
        except Exception as e:
            logging.error(f"Error in get_progress: {e}")
            return jsonify({"error": "An error occurred"}), 500

@app.route('/generate_summary', methods=['POST'])
def generate_summary_subprocess():
    try:
        data = request.json.get('data', [])
        query = request.json.get('query')

        if not isinstance(data, list) or not query or not isinstance(query, str):
            return jsonify({'success': False, 'error': 'Invalid input format or missing query'})


         # Sort the input data by relevance (highest first)
        sorted_data = sorted(data, key=lambda x: x['relevance'], reverse=True)

        # Combine the results from each item, preserving the order
        context = " ".join(
            [item['result'] for item in sorted_data]
        )

        # Execute the multi-agent pipeline to generate the report.
        formatted_output = multi_agent_pipeline(query, context)
        if not formatted_output:
            return jsonify({'success': False, 'error': 'Failed to generate summary'})
        return jsonify({
            'success': True,
            'formatted_output': formatted_output
        })

    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({'success': False, 'error': f"Unexpected error: {str(e)}"})

if __name__ == "__main__":
    vector_store.initialize_store()
    app.run(debug=True)
