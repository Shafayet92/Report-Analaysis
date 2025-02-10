document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const generateButton = document.getElementById('generateButton');
    const similarityAmountInput = document.getElementById('similarity-amount');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const resultsContainer = document.getElementById('resultsContainer');
    const queryText = document.getElementById('queryInput');

    // Tab References
    const tabs = {
        query: document.querySelector('.tab-content1'),
        records: document.querySelector('.tab-content2'),
        report: document.querySelector('.tab-content3'),
    };

    const navButtons = document.querySelectorAll('.nav-button');

    // Function to switch tabs
    function switchTab(tabName) {
        Object.values(tabs).forEach((tab) => (tab.style.display = 'none')); // Hide all tabs
        tabs[tabName].style.display = 'block'; // Show the target tab

        // Update active class for navigation buttons
        navButtons.forEach((button) => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });
    }

    // Add click listeners to navigation buttons
    navButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            if (tabs[tabName]) switchTab(tabName);
        });
    });

    // Event listener for Generate Button
    generateButton.addEventListener('click', () => {
        const query = queryText.value.trim();
        const similarityAmount = similarityAmountInput.value.trim();

        // Validate inputs
        if (!similarityAmount || similarityAmount <= 0) {
            alert('Please enter a valid similarity data amount.');
            return;
        }
        if (!query) {
            alert('Please enter a query to generate the report.');
            return;
        }

        // Switch to Records tab
        switchTab('records');

        // Display progress bar
        progressBarContainer.style.display = 'block';
        progressText.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0% Analysis';

        // Send request to start report generation
        fetch('/start_analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, similarityAmount: parseInt(similarityAmount) }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Report generation started:', data.message);
                trackProgress(); // Track the progress after initiating
            })
            .catch((error) => {
                console.error('Error starting report generation:', error);
                alert('An error occurred while starting report generation.');
            });
    });

    // Function to track progress
    function trackProgress() {
        const interval = setInterval(() => {
            fetch('/get_progress')
                .then((response) => response.json())
                .then((data) => {
                    const progress = data.progress;
                    progressBar.style.width = progress + '%';
                    progressText.textContent = progress + '% Analysis';

                    // When progress reaches 100%
                    if (progress === 100) {
                        clearInterval(interval);
                        displayResults(data.results);
                    }
                })
                .catch((error) => {
                    console.error('Error fetching progress:', error);
                    clearInterval(interval);
                });
        }, 500); // Check progress every 500ms
    }

    // Function to display results
    function displayResults(results) {
        const resultsTableBody = document.getElementById('resultsTableBody');
        resultsTableBody.innerHTML = ''; // Clear previous results

        if (results && results.length > 0) {
            results.forEach((result, index) => {
                // Extract the first sentence for preview or truncate based on 100 words
                const firstSentence = getFirstSentence(result.result) || 'N/A';

                // Create a normal table row
                const row = document.createElement('tr');
                row.classList.add('clickable-row');

                // Create the short-text cell with only the first sentence or preview text
                const shortTextCell = document.createElement('td');
                shortTextCell.classList.add('short-text');
                shortTextCell.textContent = firstSentence;

                // Create the normal row with file name and relevance
                row.innerHTML = `
                <td>${index + 1}</td>
            `;
                row.appendChild(shortTextCell); // Append the dynamically created short-text cell
                row.innerHTML += `
                <td>${result.file_name || 'N/A'}</td> <!-- Display the file name -->
                <td>${result.relevance ? `${(result.relevance * 100).toFixed(2)}%` : 'N/A'}</td>
            `;

                // Create a hidden row for full content (full result)
                const extraRow = document.createElement('tr');
                extraRow.classList.add('extra-row');
                extraRow.style.display = 'none'; // Initially hidden
                extraRow.innerHTML = `
                <td colspan="4" class="full-text">${result.result || 'N/A'}</td> <!-- Full text -->
            `;

                // Append both rows (normal row and extra row) to the table body
                resultsTableBody.appendChild(row);
                resultsTableBody.appendChild(extraRow);
            });

            // Add click event to toggle row visibility (expand/collapse the full content)
            document.querySelectorAll('.clickable-row').forEach((row) => {
                row.addEventListener('click', function () {
                    const nextRow = this.nextElementSibling; // The extra-row
                    if (nextRow && nextRow.classList.contains('extra-row')) {
                        nextRow.style.display = nextRow.style.display === 'none' ? 'table-row' : 'none';
                    }
                });
            });

            // Initialize DataTable (if needed)
            if ($.fn.DataTable.isDataTable('#similarityTable')) {
                $('#similarityTable').DataTable().destroy();
            }
            $('#similarityTable').DataTable({
                responsive: true,
                paging: true,
                searching: true,
                ordering: true,
                autoWidth: false,
            });

            // Add additional CSS to handle text wrapping in expanded rows
            const style = document.createElement('style');
            style.innerHTML = `
            #similarityTable td.full-text {
                white-space: normal !important;
                word-wrap: break-word !important;
                word-break: break-word !important;
                max-width: 100% !important;
                overflow: visible !important;
                padding: 10px !important;
            }

            #similarityTable .extra-row {
                background-color: #f9f9f9;
            }
        `;
            document.head.appendChild(style);
        } else {
            resultsTableBody.innerHTML = '<tr><td colspan="4">No relevant results found.</td></tr>';
        }

        // Hide progress bar
        progressBarContainer.style.display = 'none';
        progressText.style.display = 'none';
    }

    // Helper function to extract the first 25 words or truncate based on word count
    function getFirstSentence(text) {
        if (!text) return '';

        // Split the text into words by spaces
        const words = text.split(' ');

        // If there are more than 25 words, truncate the text and add ellipsis
        if (words.length > 25) {
            return words.slice(0, 25).join(' ') + '...';
        }

        // If there are 25 or fewer words, return the full text
        return text;
    }


});
