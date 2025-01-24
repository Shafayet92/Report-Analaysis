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
        fetch('/generate_report', {
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
        resultsContainer.innerHTML = ''; // Clear previous results

        if (results && results.length > 0) {
            // Create table
            const table = document.createElement('table');
            table.id = 'similarityTable';
            table.classList.add('table', 'table-bordered', 'table-hover', 'dt-responsive', 'nowrap');

            // Table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>No</th>
                    <th>Result</th>
                    <th>Relevance</th>
                </tr>
            `;
            table.appendChild(thead);

            // Table body
            const tbody = document.createElement('tbody');
            results.forEach((result, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${result.result || 'N/A'}</td>
                    <td>${result.relevance ? `${(result.relevance * 100).toFixed(2)}%` : 'N/A'}</td>
                `;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            resultsContainer.appendChild(table);

            // Initialize DataTable
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
        } else {
            resultsContainer.innerHTML = '<div>No relevant results found.</div>';
        }

        // Hide progress bar
        progressBarContainer.style.display = 'none';
        progressText.style.display = 'none';
    }
});
