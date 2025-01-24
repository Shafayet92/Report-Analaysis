document.addEventListener('DOMContentLoaded', function () {
    // File Upload Event Handling
    const uploadArea = document.getElementById('uploadArea');
    const fileUpload = document.getElementById('fileUpload');
    const filesProcessed = document.getElementById('filesProcessed');
    const lastUpdated = document.getElementById('lastUpdated');
    const alertElement = document.getElementById('alert');

    // Display file input when clicking the upload area
    uploadArea.addEventListener('click', () => fileUpload.click());

    // Handle drag-and-drop upload
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#2563eb';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#d1d5db';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#d1d5db';
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Trigger upload when files are selected
    fileUpload.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Handle file processing
    function handleFiles(files) {
        filesProcessed.textContent = files.length;
        lastUpdated.textContent = new Date().toLocaleString();
        uploadFiles(files);  // Automatically upload the files after selection
    }

    // Automatically upload files using fetch
    function uploadFiles(files) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())  // Attempt to parse the JSON response
            .then(data => {
                console.log('Files uploaded successfully:', data);
                alertElement.style.display = 'block';  // Show the success alert
                setTimeout(() => {
                    alertElement.style.display = 'none';  // Hide the success alert
                }, 3000);

                // After upload success, re-fetch and update the file list
                displayFiles();
            })
            .catch(error => {
                console.error('Error uploading files:', error);
                alertElement.style.display = 'block';  // Show the error alert
                alertElement.textContent = 'Error uploading files. Please try again.';
                setTimeout(() => {
                    alertElement.style.display = 'none';  // Hide the error alert
                }, 3000);
            });
    }

    // Function to fetch and display files as cards
    function displayFiles() {
        fetch('/get_files')
            .then(response => response.json())
            .then(data => {
                if (data.files) {
                    const fileCardsList = document.getElementById('fileCardsList');
                    fileCardsList.innerHTML = '';  // Clear previous cards

                    // Update the Stored Files count
                    const storedFilesCount = document.getElementById('selectedFields');
                    storedFilesCount.textContent = data.files.length;

                    // Iterate over each file and create a card for it
                    data.files.forEach(file => {
                        const fileCard = document.createElement('div');
                        fileCard.classList.add('card', 'file-card');
                        fileCard.style.marginTop = '1rem';

                        fileCard.innerHTML = `
                            <h3 class="card-title">${file}</h3>
                            <div class="card-body">
                                <div class="file-actions">
                                    <a href="/uploads/${file}" class="btn btn-primary download-btn" download>Download</a>
                                    <button class="btn btn-danger delete-file" data-file="${file}">Delete</button>
                                </div>
                            </div>
                        `;

                        // Append the new file card to the file cards container
                        fileCardsList.appendChild(fileCard);
                    });

                    // Attach delete event listeners to the delete buttons
                    document.querySelectorAll('.delete-file').forEach(button => {
                        button.addEventListener('click', function () {
                            const filename = this.getAttribute('data-file');
                            deleteFile(filename);  // Call the function to delete the file
                        });
                    });
                } else if (data.error) {
                    console.error('Error fetching files:', data.error);
                }
            })
            .catch(error => {
                console.error('Error fetching files:', error);
            });
    }

    // Function to delete a file via the backend
    function deleteFile(filename) {
        fetch(`/delete/${filename}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(`File ${filename} deleted successfully.`);
                    displayFiles();  // Re-fetch and update the file list
                } else {
                    console.error('Error deleting file:', data.error);
                }
            })
            .catch(error => {
                console.error('Error deleting file:', error);
            });
    }

    // Initial fetch to display files on page load
    displayFiles();
});
