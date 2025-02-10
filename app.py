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
    k = data.get('similarityAmount')

    def run_analysis():
        global progress_data
        with lock:
            progress_data['progress'] = 0
            progress_data['results'] = []

        try:
            results = vectorize_and_search(query, k)
            with lock:
                progress_data['results'] = [
                    {
                        "result": doc.page_content,
                        "relevance": round(score, 4),
                        "file_name": doc.metadata.get("file_name", "Unknown")  # Ensuring file_name is included
                    }
                    for doc, score in results
                ]
                progress_data['progress'] = 100

        except Exception as e:
            with lock:
                progress_data['progress'] = 100
                progress_data['results'] = [
                    {"result": f"Error during analysis: {str(e)}", "relevance": 0, "file_name": "N/A"}
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
