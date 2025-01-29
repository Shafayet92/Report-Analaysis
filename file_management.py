import os
from flask import jsonify
from werkzeug.utils import secure_filename
from vectorization import process_file, VectorStore  # Ensure this module exists and is correctly implemented

UPLOAD_FOLDER = 'uploads/'
ALLOWED_EXTENSIONS = {'pdf', 'xlsx', 'csv', 'docx'}

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize a single instance of VectorStore
vector_store = VectorStore()

def allowed_file(filename):
    """Check if the file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def upload_files(request):
    """Handle file uploads and vectorization."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    files = request.files.getlist('file')
    if not files or files[0].filename == '':
        return jsonify({'error': 'No selected files'}), 400

    uploaded_files = []
    for file in files:
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file format'}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        uploaded_files.append({'filename': filename, 'path': file_path})

    # Process and vectorize files
    try:
        for file in uploaded_files:
            file_extension = file['filename'].split('.')[-1].lower()
            documents = process_file(file['path'], file_extension)
            vector_store.add_documents(documents)
    except Exception as e:
        return jsonify({'error': f'Error processing files: {str(e)}'}), 500

    return jsonify({'uploaded_files': uploaded_files}), 200

def delete_file(filename):
    """Delete a specific file from the uploads folder."""
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'message': f'File {filename} deleted successfully'})
    return jsonify({'error': 'File not found'}), 404

def count_files():
    """Return the count of files in the uploads folder."""
    try:
        files = os.listdir(UPLOAD_FOLDER)
        return jsonify({'file_count': len([f for f in files if os.path.isfile(os.path.join(UPLOAD_FOLDER, f))])}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_files():
    """Retrieve a list of all files in the uploads folder."""
    try:
        files = os.listdir(UPLOAD_FOLDER)
        file_list = [f for f in files if os.path.isfile(os.path.join(UPLOAD_FOLDER, f))]
        return jsonify({'files': file_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
