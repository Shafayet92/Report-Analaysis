# from flask import Flask, render_template

# app = Flask(__name__)

# @app.route('/')
# def index():
#     return render_template('reportdashboard.html')

# if __name__ == '__main__':
#     app.run(debug=True)


from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
import os
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads/'
PERSIST_DIRECTORY = 'data/db'  # Directory for persisting ChromaDB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load PDF and extract data
def load_pdf(file_path):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    return documents

# Create text chunks from documents
def text_split(extracted_data):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=20)
    text_chunks = text_splitter.split_documents(extracted_data)
    return text_chunks

# Download HuggingFace embeddings model
def download_hugging_face_embeddings():
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return embeddings

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    # Save the uploaded file
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    # Load, split, and create embeddings for the uploaded file
    try:
        documents = load_pdf(file_path)
        text_chunks = text_split(documents)

        # Download embeddings
        embeddings = download_hugging_face_embeddings()

        # Store the text chunks into ChromaDB
        vectordb = Chroma.from_documents(documents=text_chunks, embedding=embeddings, persist_directory=PERSIST_DIRECTORY)
        vectordb.persist()  # Save the vector DB to disk

        return jsonify({'message': 'File processed successfully', 'num_chunks': len(text_chunks)})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/')
def index():
    return render_template('reportdashboard.html')

if __name__ == '__main__':
    app.run(debug=True)



from flask import Flask, request, render_template, redirect, url_for, flash, jsonify
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.secret_key = 'f4a58b0132410f3d7f26d4c8b98f56f5'  # Required for flash messages

# Define upload folder with an absolute path
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed extensions for file upload
ALLOWED_EXTENSIONS = {'pdf', 'xlsx', 'csv', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('reportdashboard.html')

@app.route('/upload', methods=['POST'])
# def upload_file():
#     if 'file' not in request.files:
#         flash('No file part')  # Flash message for no file selection
#         return redirect(request.url)

#     files = request.files.getlist('file')
#     for file in files:
#         if file and allowed_file(file.filename):
#             filename = secure_filename(file.filename)
#             file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
#             # Additional processing logic for each file can go here

#     flash('Files successfully uploaded')  # Flash success message
#     return redirect(url_for('index'))




@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400  # Respond with JSON error message

    files = request.files.getlist('file')
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    return jsonify({"message": "Files uploaded successfully"}), 200  # Respond with success message


if __name__ == "__main__":
    app.run(debug=True)
