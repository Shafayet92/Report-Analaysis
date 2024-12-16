document.addEventListener('DOMContentLoaded', function () {
    const generateButton = document.getElementById('generateButton');
    const similarityAmountInput = document.getElementById('similarity-amount');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const resultsContainer = document.getElementById('resultsContainer');
    const queryText = document.getElementById('queryInput');

    // Function to start the report generation process
    generateButton.addEventListener('click', () => {
        const query = queryText.value.trim();
        const similarityAmount = similarityAmountInput.value.trim();
        if (similarityAmount === '' || similarityAmount <= 0) {
            alert('Please enter a valid similarity data amount');
            return;
        }

        if (!query) {
            alert('Please enter a query to generate the report.');
            return;
        }

        // Show progress bar
        progressBarContainer.style.display = 'block';
        progressText.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0% Analysis';

        // Send POST request with the query
        fetch('/generate_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query, similarityAmount: parseInt(similarityAmount) }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data.message);
                trackProgress(); // Start tracking the progress
            })
            .catch((error) => {
                console.error('Error starting report generation:', error);
            });
    });

    // Function to track the progress of the analysis
    function trackProgress() {
        const interval = setInterval(() => {
            fetch('/get_progress')
                .then((response) => response.json())
                .then((data) => {
                    const progress = data.progress;

                    // Update the progress bar and text
                    progressBar.style.width = progress + '%';
                    progressText.textContent = progress + '% Analysis';

                    // If the analysis is complete, display the results
                    if (progress === 100) {
                        clearInterval(interval);
                        displayResults(data.results);
                    }
                })
                .catch((error) => {
                    console.error('Error fetching progress:', error);
                });
        }, 500); // Poll every 500 ms
    }

    // Function to display the analysis results in a DataTables table
    function displayResults(results) {
        resultsContainer.innerHTML = '';  // Clear previous results

        if (results && results.length > 0) {
            // Create the table element with an id that matches the DataTables setup

            const table = document.createElement('table');
            table.id = 'similarityTable';
            table.classList.add('table', 'table-bordered', 'table-hover', 'dt-responsive', 'nowrap');

            // Create the table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const headers = ['No', 'Result', 'Relevance'];
            headers.forEach((text) => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Populate the table body
            const tbody = document.createElement('tbody');
            results.forEach((result, index) => {
                const row = document.createElement('tr');

                // Add row cells
                const indexCell = document.createElement('td');
                indexCell.textContent = index + 1;

                const resultCell = document.createElement('td');
                resultCell.textContent = result.result || "N/A";  // Provide default text if data is missing

                const relevanceCell = document.createElement('td');
                relevanceCell.textContent = result.relevance ? `${(result.relevance * 100).toFixed(2)}%` : "N/A";

                // Append cells to the row
                row.appendChild(indexCell);
                row.appendChild(resultCell);
                row.appendChild(relevanceCell);

                // Append row to the table body
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            resultsContainer.appendChild(table);

            // Initialize the DataTable, destroy if it already exists
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

        // Hide the progress bar after completion
        progressBarContainer.style.display = 'none';
        progressText.style.display = 'none';
    }

});