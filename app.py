import json
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
import os
import time
import threading
import subprocess
import logging
from vectorization import VectorStore, convert_to_serializable, process_file, vectorize_and_search  # Importing your vectorization classes and functions
from summary import generate_formatted_output, generate_recommendations, generate_summary  # Import the function from summary.py


app = Flask(__name__)
UPLOAD_FOLDER = 'uploads/'
PERSIST_DIRECTORY = 'data/db'  # Directory for persisting ChromaDB

# Set up upload folder and create it if it doesn't exist
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Allowed file extensions for uploads
ALLOWED_EXTENSIONS = {'pdf', 'xlsx', 'csv', 'docx'}

# Lock for thread safety
lock = threading.Lock()

# Create an instance of VectorStore to manage vectorization
vector_store = VectorStore()

# Check if the file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('reportdashboard.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    files = request.files.getlist('file')
    if len(files) == 0:
        return jsonify({'error': 'No selected files'}), 400

    uploaded_files = []
    for file in files:
        if file.filename == '':
            continue
        # Check if the file has an allowed extension
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file format'}), 400

        # Save the uploaded file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        uploaded_files.append({'filename': filename, 'path': file_path})

    # Vectorize the uploaded files
    try:
        for file in uploaded_files:
            file_path = file['path']
            file_extension = file['filename'].split('.')[-1].lower()
            documents = process_file(file_path, file_extension)
            vector_store.add_documents(documents)
    except Exception as e:
        return jsonify({'error': f'Error processing files: {str(e)}'}), 500

    # Return the list of uploaded files for preview
    return jsonify({'uploaded_files': uploaded_files}), 200

@app.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'message': f'File {filename} deleted successfully'})
    return jsonify({'error': 'File not found'}), 404

@app.route('/count_files', methods=['GET'])
def count_files():
    try:
        files = os.listdir(app.config['UPLOAD_FOLDER'])
        file_list = [file for file in files if os.path.isfile(os.path.join(app.config['UPLOAD_FOLDER'], file))]
        return jsonify({'file_count': len(file_list)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_files', methods=['GET'])
def get_files():
    try:
        files = os.listdir(app.config['UPLOAD_FOLDER'])
        file_list = [file for file in files if os.path.isfile(os.path.join(app.config['UPLOAD_FOLDER'], file))]
        return jsonify({'files': file_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Global dictionary to store progress
progress_data = {"progress": 0, "results": []}

@app.route('/generate_report', methods=['POST'])
def generate_report():
    data = request.get_json()  # Get JSON input
    if not data or 'query' not in data:
        return jsonify({'error': 'No query provided'}), 400

    query = data['query'].strip()
    k = data.get('similarityAmount')

    # Start the analysis in a separate thread to avoid blocking the main thread
    def run_analysis():
        global progress_data
        with lock:
            progress_data['progress'] = 0
            progress_data['results'] = []  # Reset progress and results

        # Simulating analysis progress
        for i in range(0, 50):  # Simulating some progress before vector search
            with lock:
                progress_data['progress'] = i
            time.sleep(0.05)  # Simulate time taken for the analysis

        # Perform the actual vector search
        try:
            results = vectorize_and_search(query, k)
            with lock:
                progress_data['results'] = [
                    {"result": doc.page_content, "relevance": score}
                    for doc, score in results
                ]
                progress_data['progress'] = 100
        except Exception as e:
            with lock:
                progress_data['progress'] = 100
                progress_data['results'] = [{"result": f"Error during analysis: {str(e)}", "relevance": 0}]

    threading.Thread(target=run_analysis).start()
    return jsonify({"message": "Analysis started"}), 202

@app.route('/get_progress', methods=['GET'])
def get_progress():
    with lock:
        try:
            # Ensure progress_data is JSON-serializable
            serializable_data = convert_to_serializable(progress_data)
            return jsonify(serializable_data)
        except Exception as e:
            # Log the error and return an error response
            logging.error(f"Error in get_progress: {e}")
            return jsonify({"error": "An error occurred"}), 500


# @app.route('/generate_summary', methods=['POST'])
# def generate_summary_subprocess():
#     try:
#         # Get the data (similarity results) from the request
#         data = request.json.get('data', [])

#         # Call summary.py with the JSON-formatted data
#         result = subprocess.run(
#             ['python', 'summary.py'],
#             input=json.dumps(data).encode(),
#             capture_output=True,
#             text=True
#         )

#         if result.returncode == 0:
#             # Get the generated summary from the output
#             summary = result.stdout.strip()
#             return jsonify({'success': True, 'summary': summary})
#         else:
#             logging.error(f"Error in summary.py: {result.stderr}")
#             return jsonify({'success': False, 'error': 'Summary generation failed.'})

#     except Exception as e:
#         logging.error(f"Error in /generate_summary: {str(e)}")
#         return jsonify({'success': False, 'error': 'An error occurred.'})


@app.route('/generate_summary', methods=['POST'])
def generate_summary_subprocess():
    try:
        # Retrieve data and query from the request
        data = request.json.get('data', [])
        query = request.json.get('query')

        # Log the received data for debugging
        print(f"Received data: {data}")
        print(f"Received query: {query}")

        # Validate input
        if not isinstance(data, list):
            return jsonify({'success': False, 'error': 'Invalid input format, expected a list.'})

        if not query or not isinstance(query, str):
            return jsonify({'success': False, 'error': 'Query is required and should be a string.'})

        # Generate the summary
        summary = generate_summary(data, query)

        # Check for errors in summary generation
        if isinstance(summary, str) and summary.startswith("Error"):
            return jsonify({'success': False, 'error': summary})

        # Generate recommendations based on the summary
        recommendations = generate_recommendations(summary)

        # Check for errors in recommendations generation
        if isinstance(recommendations, str) and recommendations.startswith("Error"):
            return jsonify({'success': False, 'error': recommendations})

        # Generate formatted output
        formatted_output = generate_formatted_output(query, summary, recommendations)

        # Return the formatted output in the response
        return jsonify({
            'success': True,
            'formatted_output': formatted_output
        })

    except Exception as e:
        # Handle unexpected errors
        print(f"Unexpected error: {e}")  # Log the exception for debugging
        return jsonify({'success': False, 'error': f"Unexpected error: {str(e)}"})



if __name__ == "__main__":
    vector_store.initialize_store()  # Re-initialize the store

    app.run(debug=True)
