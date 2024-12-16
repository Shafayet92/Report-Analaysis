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
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to upload files');
                }
                return response.json();  // Attempt to parse the JSON response
            })
            .then(data => {
                console.log('Files uploaded successfully:', data);
                alertElement.style.display = 'block';  // Show the success alert
                setTimeout(() => {
                    alertElement.style.display = 'none';  // Hide the success alert
                }, 3000);

                // After upload success, re-fetch and update the file list
                displayFiles(); // Ensure updated list is displayed without a manual refresh
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

// Slider and Input Synchronization
const slider = document.getElementById("summary-length-slider");
const numberInput = document.getElementById("summary-length-value");

// Initialize number input value to match slider
numberInput.value = slider.value;

// Update number input when slider changes
slider.addEventListener("input", () => {
    numberInput.value = slider.value;
});

// Update slider when number input changes
numberInput.addEventListener("input", () => {
    // Ensure number input stays within slider range
    if (numberInput.value < slider.min)
        numberInput.value = slider.min;
    if (numberInput.value > slider.max)
        numberInput.value = slider.max;
    slider.value = numberInput.value;
});



document.addEventListener('DOMContentLoaded', function () {
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
                setTimeout(() => {
                    alertElement.style.display = 'none';  // Hide the error alert
                }, 3000);
            });
    }

    // Initial fetch to display files on page load
    displayFiles();

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
});


// Night Mode Toggle
document.addEventListener("DOMContentLoaded", function () {
    const nightModeButton = document.getElementById("toggleNightMode");

    // Check for saved night mode preference in localStorage
    const isNightMode = localStorage.getItem("nightMode") === "true";

    // Apply the night mode if previously enabled
    if (isNightMode) {
        document.body.classList.add("night-mode");
        document.querySelectorAll(".card").forEach(card => card.classList.add("night-mode"));
        document.querySelectorAll(".nav-button").forEach(button => button.classList.add("night-mode"));
        document.querySelectorAll("button").forEach(button => button.classList.add("night-mode"));
        document.querySelectorAll("input[type='file']").forEach(input => input.classList.add("night-mode"));
        document.querySelectorAll("#alert").forEach(alert => alert.classList.add("night-mode"));
    }

    // Toggle Night Mode when the button is clicked
    nightModeButton.addEventListener("click", function () {
        document.body.classList.toggle("night-mode");
        document.querySelectorAll(".card").forEach(card => card.classList.toggle("night-mode"));
        document.querySelectorAll(".nav-button").forEach(button => button.classList.toggle("night-mode"));
        document.querySelectorAll("button").forEach(button => button.classList.toggle("night-mode"));
        document.querySelectorAll("input[type='file']").forEach(input => input.classList.toggle("night-mode"));
        document.querySelectorAll("#alert").forEach(alert => alert.classList.toggle("night-mode"));

        // Save the user preference in localStorage
        const isNightModeEnabled = document.body.classList.contains("night-mode");
        localStorage.setItem("nightMode", isNightModeEnabled.toString());
    });
});

// Customization Toggle
const toggleButton = document.getElementById('toggleCustomization');
const customizationOptions = document.getElementById('customizationOptions');
let isVisible = true;

toggleButton.addEventListener('click', function () {
    if (isVisible) {
        customizationOptions.style.display = 'none';
        toggleButton.innerHTML = 'Hide Customization';
    } else {
        customizationOptions.style.display = 'block';
        toggleButton.innerHTML = 'Show Customization';
    }
    isVisible = !isVisible;
});

// document.addEventListener('DOMContentLoaded', function () {
//     const generateButton = document.getElementById('generateButton');
//     const queryText = document.querySelector('textarea');  // Get the query textarea
//     const similarityAmountInput = document.getElementById('similarity-amount');
//     const progressBar = document.getElementById('progressBar');
//     const progressText = document.getElementById('progressText');
//     const progressBarContainer = document.getElementById('progressBarContainer');
//     const resultsContainer = document.getElementById('resultsContainer');

//     // Function to start the report generation
//     generateButton.addEventListener('click', (event) => {
//         event.preventDefault();  // Prevent form submission
//         const query = queryText.value.trim();
//         if (similarityAmountInput.value === '' || similarityAmountInput.value <= 0) {
//             event.preventDefault();  // Prevent form submission
//             alert('Please enter a valid similarity data amount');
//         }
//         if (query) {
//             generateReport(query);
//         } else {
//             alert('Please enter a query to proceed.');
//             progressBarContainer.style.display = 'none';  // Hide progress bar when query is not provided
//         }
//     });

//     function generateReport(query) {
//         // Show progress bar
//         progressBarContainer.style.display = 'block';
//         progressText.style.display = 'block';
//         progressBar.style.width = '0%';
//         progressText.textContent = '0% Analysis';

//         fetch('/generate_report', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ query }),
//         })
//             .then(response => {
//                 if (!response.ok) {
//                     throw new Error('Failed to start report generation');
//                 }
//                 return response.json();
//             })
//             .then(data => {
//                 console.log(data.message);
//                 trackProgress();  // Start tracking the progress
//             })
//             .catch(error => {
//                 console.error('Error starting report generation:', error);
//                 progressBarContainer.style.display = 'none';  // Hide progress bar if error occurs
//                 alert('Error starting report generation. Please try again.');
//             });
//     }

//     function trackProgress() {
//         const interval = setInterval(() => {
//             fetch('/get_progress')
//                 .then(response => response.json())
//                 .then(data => {
//                     const progress = data.progress;

//                     // Update the progress bar and text
//                     progressBar.style.width = progress + '%';
//                     progressText.textContent = progress + '% Analysis';

//                     // If the analysis is complete, display the results
//                     if (progress === 100) {
//                         clearInterval(interval);
//                         displayResults(data.results);
//                     }
//                 })
//                 .catch(error => {
//                     console.error('Error fetching progress:', error);
//                     clearInterval(interval);
//                     progressBarContainer.style.display = 'none';  // Hide progress bar if an error occurs
//                     alert('Error fetching progress. Please try again.');
//                 });
//         }, 500); // Poll every 500 ms
//     }

//     function displayResults(results) {

//         resultsContainer.innerHTML = '';  // Clear previous results

//         if (results && results.length > 0) {
//             const table = document.createElement('table');
//             table.classList.add('result-table');

//             // Create the table header
//             const header = table.createTHead();
//             const headerRow = header.insertRow();
//             const headers = ['#', 'Result', 'Relevance'];
//             headers.forEach((text) => {
//                 const th = document.createElement('th');
//                 th.textContent = text;
//                 headerRow.appendChild(th);
//             });

//             // Populate the table with results
//             const tbody = table.createTBody();
//             results.forEach((result, index) => {
//                 const row = tbody.insertRow();
//                 row.insertCell().textContent = index + 1;
//                 row.insertCell().textContent = result.result;

//                 const relevanceCell = row.insertCell();
//                 if (typeof result.relevance !== 'undefined') {
//                     relevanceCell.textContent = `${(result.relevance * 100).toFixed(2)}%`;
//                 } else {
//                     relevanceCell.textContent = 'N/A';
//                 }
//             });

//             resultsContainer.appendChild(table);
//         } else {
//             resultsContainer.innerHTML = '<div>No relevant results found.</div>';
//         }
//     }
// });
