document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const generateButton = document.getElementById('generateButton');
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

        const useLLM = document.getElementById('mode-toggle').checked; // true: Chroma + LLM Mode, false: Pure Chroma Mode

        const kvalue = parseInt(document.getElementById('similarity-amount').value, 10) || 0;


        // Validate inputs
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
            body: JSON.stringify({ query, useLLM, kvalue }),
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

                        // Display summaries using the new function
                        if (data.full_summary || data.file_summaries.length > 0) {
                            displaySummaries(data.full_summary, data.file_summaries, data.results, data.file_names);
                        } else {
                            console.warn("No summaries available");
                        }

                        // Display detailed results as before
                        if (data.results && data.results.length > 0) {
                            displayResultsPerFile(data.results);
                        } else {
                            console.warn("No results available");
                        }
                    }
                })
                .catch((error) => {
                    console.error('Error fetching progress:', error);
                    clearInterval(interval);
                });
        }, 500); // Check progress every 500ms
    }

    function displaySummaries(fullSummary, fileSummaries, results, file_names) {
        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) {
            console.error("resultsContainer element not found in the DOM.");
            return;
        }

        resultsContainer.innerHTML = ''; // Clear previous content

        if (fullSummary && fullSummary.length > 0) {
            // Full Summary Section
            const fullSummaryHeader = document.createElement('h2');
            fullSummaryHeader.textContent = 'Full Summary';
            resultsContainer.appendChild(fullSummaryHeader);

            const fullSummaryPara = document.createElement('p');
            fullSummaryPara.textContent = fullSummary || "No full summary available.";
            resultsContainer.appendChild(fullSummaryPara);
        }

        // File Summaries and Tables Section
        if (fileSummaries && fileSummaries.length > 0) {
            fileSummaries.forEach((summary, index) => {

                resultsContainer.appendChild(document.createElement('br'));
                // Display File Summary with filename
                const fileSummaryHeader = document.createElement('h3');
                fileSummaryHeader.textContent = `File Summary: ${file_names[index]}`;

                resultsContainer.appendChild(fileSummaryHeader);

                const filePara = document.createElement('p');
                filePara.textContent = summary ? summary + "\n" : "No summary available for this file.";
                resultsContainer.appendChild(filePara);

                // Display File Results Table
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'file-section';
                sectionDiv.style.marginBottom = '20px';

                const containerDiv = document.createElement('div');
                containerDiv.className = 'container';
                const rowDiv = document.createElement('div');
                rowDiv.className = 'row';
                const colDiv = document.createElement('div');
                colDiv.className = 'col-xs-12';

                const table = document.createElement('table');
                table.id = `table-${index}`;
                table.className = 'table table-bordered table-hover dt-responsive';

                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                const thNo = document.createElement('th');
                thNo.textContent = 'No';
                const thResult = document.createElement('th');
                thResult.textContent = 'Result';
                const thRelevance = document.createElement('th');
                thRelevance.textContent = 'Relevance';
                headerRow.appendChild(thNo);
                headerRow.appendChild(thResult);
                headerRow.appendChild(thRelevance);
                thead.appendChild(headerRow);
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                results.forEach((item, resultIndex) => {
                    const tr = document.createElement('tr');
                    tr.classList.add('clickable-row');

                    const preview = getFirstSentence(item.result);
                    tr.innerHTML = `
                    <td>${resultIndex + 1}</td>
                    <td>${preview}</td>
                    <td>${item.relevance}</td>
                `;
                    tr.dataset.full = item.result || 'N/A';

                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);

                colDiv.appendChild(table);
                rowDiv.appendChild(colDiv);
                containerDiv.appendChild(rowDiv);
                sectionDiv.appendChild(containerDiv);
                resultsContainer.appendChild(sectionDiv);

                $(`#${table.id}`).DataTable({
                    responsive: true,
                    paging: true,
                    searching: true,
                    ordering: true,
                    autoWidth: false,
                });

                $(`#${table.id} tbody`).on('click', 'tr.clickable-row', function () {
                    var tableApi = $(`#${table.id}`).DataTable();
                    var row = tableApi.row(this);
                    if (row.child.isShown()) {
                        row.child.hide();
                        $(this).removeClass('shown');
                    } else {
                        row.child(`<div class="full-text">${this.dataset.full}</div>`).show();
                        $(this).addClass('shown');
                    }
                });
            });
        }
    }



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
