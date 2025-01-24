document.addEventListener("DOMContentLoaded", () => {
    const navButtons = document.querySelectorAll(".nav-button");
    const leftPanel = document.getElementById("left-panel");

    // Initial tab load (default "query")
    loadTabContent("query");

    // Event listener for each tab button
    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const tabName = button.getAttribute("data-tab");

            // Remove active class from all buttons and reset night mode
            navButtons.forEach((btn) => {
                btn.classList.remove("active");
                btn.classList.remove("night-mode");
            });

            button.classList.add("active");

            // Reapply night mode if enabled
            if (document.body.classList.contains("night-mode")) {
                button.classList.add("night-mode");
            }

            // Load the corresponding tab content based on the tabName
            loadTabContent(tabName);
        });
    });

    // Function to handle loading tab content
    function loadTabContent(tabName) {
        // Hide all tab contents initially
        document.querySelectorAll('.tab-content1, .tab-content2, .tab-content3').forEach(tabContent => {
            tabContent.classList.remove('active');
        });

        // Show the selected tab content based on the tab name
        const selectedTabContent = document.querySelector(`.tab-content${tabName === 'query' ? '1' : tabName === 'records' ? '2' : '3'}`);
        if (selectedTabContent) {
            selectedTabContent.classList.add('active');
        }
    }
});
