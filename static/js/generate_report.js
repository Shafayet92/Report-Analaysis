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
                        displayResultsPerFile(data.results);
                    }
                })
                .catch((error) => {
                    console.error('Error fetching progress:', error);
                    clearInterval(interval);
                });
        }, 500); // Check progress every 500ms
    }

    function displayResultsPerFile(results) {
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.innerHTML = ''; // Clear any previous content

        // Group results by file name.
        const groupedResults = results.reduce((acc, item) => {
            const fileName = item.file_name || 'Unknown';
            if (!acc[fileName]) {
                acc[fileName] = [];
            }
            acc[fileName].push(item);
            return acc;
        }, {});

        // Loop over each group to create an independent table.
        Object.keys(groupedResults).forEach((fileName, fileIndex) => {
            // Create a section container for each file's table.
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'file-section';
            sectionDiv.style.marginBottom = '20px'; // Add spacing between sections



            // Create a responsive container similar to the CodePen example.
            const containerDiv = document.createElement('div');
            containerDiv.className = 'container';
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            const colDiv = document.createElement('div');
            colDiv.className = 'col-xs-12';

            // Create the table element with the desired classes.
            const table = document.createElement('table');
            table.id = 'table-' + fileIndex; // unique id for initialization
            table.className = 'table table-bordered table-hover dt-responsive';

            // Create and set the caption (if desired).
            const caption = document.createElement('caption');
            caption.className = 'text-center';
            caption.style.marginBottom = '8px';
            caption.innerHTML = `Results for <strong>${fileName}</strong>`;
            table.appendChild(caption);

            // Create table header.
            const thead = document.createElement('thead');
            thead.innerHTML = `
            <tr>
                <th>No</th>
                <th>Result</th>
                <th>Relevance</th>
            </tr>
            `;
            table.appendChild(thead);

            // Create table body.
            const tbody = document.createElement('tbody');
            groupedResults[fileName].forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.classList.add('clickable-row'); // Add clickable class

                const preview = getFirstSentence(item.result);
                tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${preview}</td>
                <td>${item.relevance ? (item.relevance * 100).toFixed(2) + '%' : 'N/A'}</td>
            `;
                // Save the full result so it can be shown on click.
                tr.dataset.full = item.result || 'N/A';

                tbody.appendChild(tr);

            });
            table.appendChild(tbody);


            // Append the table inside the Bootstrap grid structure.
            colDiv.appendChild(table);
            rowDiv.appendChild(colDiv);
            containerDiv.appendChild(rowDiv);
            sectionDiv.appendChild(containerDiv);
            resultsContainer.appendChild(sectionDiv);

            // Initialize DataTables on this table.
            $(`#${table.id}`).DataTable({
                responsive: true,
                paging: true,
                searching: true,
                ordering: true,
                autoWidth: false,
            });

            // Use delegated event binding to toggle the row’s child content.
            $(`#${table.id} tbody`).on('click', 'tr.clickable-row', function () {
                var tableApi = $(`#${table.id}`).DataTable();
                var row = tableApi.row(this);
                if (row.child.isShown()) {
                    // Hide child row if visible
                    row.child.hide();
                    $(this).removeClass('shown');
                } else {
                    // Show child row with full text from data attribute.
                    row.child(`<div class="full-text">${this.dataset.full}</div>`).show();
                    $(this).addClass('shown');
                }
            });


        });
    }






    // // Function to display results
    // function displayResults(results) {
    //     const resultsTableBody = document.getElementById('resultsTableBody');
    //     resultsTableBody.innerHTML = ''; // Clear previous results

    //     if (results && results.length > 0) {
    //         results.forEach((result, index) => {
    //             // Extract the first sentence for preview or truncate based on 100 words
    //             const firstSentence = getFirstSentence(result.result) || 'N/A';

    //             // Create a normal table row
    //             const row = document.createElement('tr');
    //             row.classList.add('clickable-row');

    //             // Create the short-text cell with only the first sentence or preview text
    //             const shortTextCell = document.createElement('td');
    //             shortTextCell.classList.add('short-text');
    //             shortTextCell.textContent = firstSentence;

    //             // Create the normal row with file name and relevance
    //             row.innerHTML = `
    //             <td>${index + 1}</td>
    //         `;
    //             row.appendChild(shortTextCell); // Append the dynamically created short-text cell
    //             row.innerHTML += `
    //             <td>${result.file_name || 'N/A'}</td> <!-- Display the file name -->
    //             <td>${result.relevance ? `${(result.relevance * 100).toFixed(2)}%` : 'N/A'}</td>
    //         `;

    //             // Create a hidden row for full content (full result)
    //             const extraRow = document.createElement('tr');
    //             extraRow.classList.add('extra-row');
    //             extraRow.style.display = 'none'; // Initially hidden
    //             extraRow.innerHTML = `
    //             <td colspan="4" class="full-text">${result.result || 'N/A'}</td> <!-- Full text -->
    //         `;

    //             // Append both rows (normal row and extra row) to the table body
    //             resultsTableBody.appendChild(row);
    //             resultsTableBody.appendChild(extraRow);
    //         });

    //         // Add click event to toggle row visibility (expand/collapse the full content)
    //         document.querySelectorAll('.clickable-row').forEach((row) => {
    //             row.addEventListener('click', function () {
    //                 const nextRow = this.nextElementSibling; // The extra-row
    //                 if (nextRow && nextRow.classList.contains('extra-row')) {
    //                     nextRow.style.display = nextRow.style.display === 'none' ? 'table-row' : 'none';
    //                 }
    //             });
    //         });

    //         // Initialize DataTable (if needed)
    //         if ($.fn.DataTable.isDataTable('#similarityTable')) {
    //             $('#similarityTable').DataTable().destroy();
    //         }
    //         $('#similarityTable').DataTable({
    //             responsive: true,
    //             paging: true,
    //             searching: true,
    //             ordering: true,
    //             autoWidth: false,
    //         });

    //         // Add additional CSS to handle text wrapping in expanded rows
    //         const style = document.createElement('style');
    //         style.innerHTML = `
    //         #similarityTable td.full-text {
    //             white-space: normal !important;
    //             word-wrap: break-word !important;
    //             word-break: break-word !important;
    //             max-width: 100% !important;
    //             overflow: visible !important;
    //             padding: 10px !important;
    //         }

    //         #similarityTable .extra-row {
    //             background-color: #f9f9f9;
    //         }
    //     `;
    //         document.head.appendChild(style);
    //     } else {
    //         resultsTableBody.innerHTML = '<tr><td colspan="4">No relevant results found.</td></tr>';
    //     }

    //     // Hide progress bar
    //     progressBarContainer.style.display = 'none';
    //     progressText.style.display = 'none';
    // }

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
