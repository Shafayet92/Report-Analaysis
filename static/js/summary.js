document.addEventListener("DOMContentLoaded", function () {
    const summaryContainer = document.getElementById("summaryContainer");
    const summaryButton = document.getElementById("summaryButton");
    const queryText = document.getElementById("queryInput");
    const progressBar = document.getElementById("loaderFill");
    const progressText = document.getElementById("loaderText");
    const loaderWrapper = document.querySelector(".loader-wrapper"); // Added reference to the loader wrapper


    // References to the tabs
    const tabs = {
        query: document.querySelector('.tab-content1'),
        records: document.querySelector('.tab-content2'),
        report: document.querySelector('.tab-content3'),
    };

    // Select all navigation buttons
    const navButtons = document.querySelectorAll('.nav-button');

    // Function to switch tabs
    function switchTab(tabName) {
        // Hide all tabs
        Object.values(tabs).forEach((tab) => (tab.style.display = 'none'));

        // Show the selected tab
        tabs[tabName].style.display = 'block';

        // Update the active class for navigation buttons
        navButtons.forEach((button) => {
            button.classList.remove('active');
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            }
        });
    }

    // Add click event listeners to navigation buttons
    navButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            if (tabs[tabName]) {
                switchTab(tabName);
            }
        });
    });

    // Ensure button and input elements exist before adding listeners
    if (!summaryButton || !queryText || !summaryContainer) {
        console.error("Missing required DOM elements. Ensure the page includes the required elements.");
        return;
    }

    // Function to animate the progress bar (based on server completion)
    async function animateProgressBar() {
        let progress = 0;
        progressBar.style.width = '0%';  // Reset progress bar to 0% initially
        progressText.textContent = '0% Analysis';

        // Start animation once the request begins
        const interval = setInterval(() => {
            if (progress < 100) {
                progress++;
                progressBar.style.width = progress + '%';
                progressText.textContent = progress + '% Analysis';
            }
        }, 50);  // Update every 30ms for smoother animation

        // Wait for the backend task (summary generation) to complete
        await new Promise((resolve) => {
            setTimeout(resolve, 50000); // Simulate waiting for the backend to finish (can be replaced by actual request completion)
        });

        // Stop the progress bar when the task is completed
        clearInterval(interval);
        progressBar.style.width = '100%';
        progressText.textContent = '100% Completed';
    }


    // Function to fetch summary from the server and display it in summaryContainer
    summaryButton.addEventListener("click", async function () {
        // Check if query input is empty
        const query = queryText.value.trim();
        if (!query) {
            summaryContainer.innerHTML = "<p>Please enter a query before generating a summary.</p>";
            return;
        }

        // Programmatically switch to the Reports tab
        switchTab('report');

        // Show the loader and reset progress bar
        loaderWrapper.style.display = "block";
        progressBar.style.width = '0%';
        progressText.textContent = '0% Analysis';


        // Get all clickable rows and their corresponding full-text rows
        const tableRows = document.querySelectorAll('#similarityTable tbody tr.clickable-row');

        // Process each row and extract full text, file_name, and relevance
        const formattedData = Array.from(tableRows).map((row, index) => {
            const shortText = row.querySelector('.short-text')?.textContent.trim() || '';
            const fileName = row.cells[2]?.textContent.trim() || 'N/A';
            const relevance = parseFloat(row.cells[3]?.textContent) || 0;

            // Find the corresponding extra-row that contains full text
            const extraRow = row.nextElementSibling; // The next row should be the full-text row
            const fullText = extraRow?.classList.contains('extra-row')
                ? extraRow.querySelector('.full-text')?.textContent.trim()
                : shortText; // Fallback to shortText if full text is not found

            return {
                result: fullText, // Send full text instead of short text
                file_name: fileName, // Include file name
                relevance: relevance // Include relevance score
            };
        });

        // Log the formatted data for debugging
        console.log("Formatted Data:", formattedData);

        try {
            // Wait for the progress bar animation to complete
            await animateProgressBar();

            // Payload for the POST request
            const payload = {
                data: formattedData, // Send the vectorized data (table data) to the backend
                query: query, // Include the query
            };

            // Send a POST request to generate the summary
            const response = await fetch("/generate_summary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); // Fetch response data

            // Hide the loader and display the summary
            loaderWrapper.style.display = "none";

            if (data.success) {
                const formattedOutput = data.formatted_output; // Fetch the formatted Markdown output

                // Parse the Markdown into HTML using marked.js (or a similar library)
                const htmlContent = marked.parse(formattedOutput);

                // Display the parsed HTML content inside the summaryContainer
                summaryContainer.innerHTML = htmlContent;

            } else {
                summaryContainer.innerHTML = `<p>Error: ${data.error}</p>`;
            }
        } catch (error) {
            console.error("Error generating summary:", error);
            summaryContainer.innerHTML = "<p>Error generating summary. Please try again later.</p>";
            loaderWrapper.style.display = "none"; // Ensure loader is hidden in case of errors
        }
    });

});
