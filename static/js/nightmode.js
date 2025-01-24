document.addEventListener("DOMContentLoaded", () => {
    const nightModeButton = document.getElementById("toggleNightMode");
    const navButtons = document.querySelectorAll(".nav-button");

    // Elements to apply night mode to
    const nightModeTargets = [
        "body",
        ".card",
        "button",
        "input[type='file']",
        "#alert",
    ];

    // Check for saved night mode preference in localStorage
    const isNightMode = localStorage.getItem("nightMode") === "true";

    // Apply the saved night mode preference
    toggleNightMode(isNightMode);

    // Toggle Night Mode when the button is clicked
    nightModeButton.addEventListener("click", () => {
        const isNightModeActive = document.body.classList.contains("night-mode");
        toggleNightMode(!isNightModeActive);
    });

    // Function to toggle night mode
    function toggleNightMode(enable) {
        nightModeTargets.forEach((selector) => {
            document.querySelectorAll(selector).forEach((element) => {
                if (enable) {
                    element.classList.add("night-mode");
                } else {
                    element.classList.remove("night-mode");
                }
            });
        });

        // Update the localStorage preference
        localStorage.setItem("nightMode", enable.toString());

        // Apply night mode to navigation buttons
        applyNightModeToNavButtons(enable);
    }

    // Apply night mode styles to navigation buttons
    function applyNightModeToNavButtons(enable) {
        navButtons.forEach((button) => {
            if (enable) {
                if (button.classList.contains("active")) {
                    button.classList.add("night-mode");
                }
            } else {
                button.classList.remove("night-mode");
            }
        });
    }
});
