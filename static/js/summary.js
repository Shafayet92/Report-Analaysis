document.addEventListener("DOMContentLoaded", function () {
    const summaryContainer = document.getElementById("summaryContainer");
    const summaryButton = document.getElementById("summaryButton");
    const queryText = document.getElementById("queryInput");

    // Ensure button and input elements exist before adding listeners
    if (!summaryButton || !queryText || !summaryContainer) {
        console.error("Missing required DOM elements. Ensure the page includes the required elements.");
        return;
    }

    // Function to fetch summary from the server and display it in summaryContainer
    summaryButton.addEventListener("click", function () {
        // Check if query input is empty
        const query = queryText.value.trim();
        if (!query) {
            summaryContainer.innerHTML = "<p>Please enter a query before generating a summary.</p>";
            return;
        }

        // Retrieve table data using DataTables API
        const tableData = $("#similarityTable")
            .DataTable()
            .rows()
            .data()
            .toArray();

        // Log the tableData to check its structure
        console.log("Table Data:", tableData);

        // Validate table data structure
        if (!Array.isArray(tableData) || tableData.length === 0) {
            summaryContainer.innerHTML = "<p>No data available in the table to process.</p>";
            return;
        }

        // Format table data as needed for the backend
        const formattedData = tableData.map(row => ({
            index: row[0],
            result: row[1],
            relevance: row[2]
        }));

        // Log the formatted data for debugging
        console.log("Formatted Data:", formattedData);

        // Payload for the POST request
        const payload = {
            data: formattedData,  // Send the vectorized data (table data) to the backend
            query: query,
        };

        // Send a POST request to generate the summary
        fetch("/generate_summary", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(response => {
                // Check if the response is ok (status code 2xx)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const formattedOutput = data.formatted_output;  // Fetch the formatted HTML output

                    // Display the formatted summary and recommendations inside the summaryContainer
                    summaryContainer.innerHTML = formattedOutput;
                } else {
                    summaryContainer.innerHTML = `<p>Error: ${data.error}</p>`;
                }
            })
            .catch(error => {
                // Handle fetch errors and display a generic message
                console.error("Error generating summary:", error);
                summaryContainer.innerHTML = "<p>Error generating summary. Please try again later.</p>";
            });
    });
});
