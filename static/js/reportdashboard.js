// reportDashboard.js
document.addEventListener('DOMContentLoaded', function () {
    // Navigation
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // File Upload
    const uploadArea = document.getElementById('uploadArea');
    const fileUpload = document.getElementById('fileUpload');
    const filesProcessed = document.getElementById('filesProcessed');
    const lastUpdated = document.getElementById('lastUpdated');

    uploadArea.addEventListener('click', () => fileUpload.click());
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

    fileUpload.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        filesProcessed.textContent = files.length;
        lastUpdated.textContent = new Date().toLocaleString();
    }

    // Customization Toggle
    const toggleBtn = document.getElementById('toggleCustomization');
    const customizationOptions = document.getElementById('customizationOptions');
    toggleBtn.addEventListener('click', () => {
        const isVisible = customizationOptions.style.display !== 'none';
        customizationOptions.style.display = isVisible ? 'none' : 'block';
        toggleBtn.textContent = isVisible ? 'Show Customization' : 'Hide Customization';
    });

    // Form Submission
    const reportForm = document.getElementById('reportForm');
    const generateButton = document.getElementById('generateButton');
    const alert = document.getElementById('alert');

    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        generateButton.disabled = true;
        generateButton.innerHTML = '<span class="spinner">↻</span> Processing...';

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        generateButton.disabled = false;
        generateButton.textContent = 'Generate Report';

        // Show success message
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 3000);
    });


    // Update Selected Fields Count
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const selectedFieldsCount = document.getElementById('selectedFields');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const count = Array.from(checkboxes).filter(cb => cb.checked).length;
            selectedFieldsCount.textContent = count;
        });
    });
});

// Get the slider and number input elements
const slider = document.getElementById(
    "summary-length-slider"
);
const numberInput = document.getElementById(
    "summary-length-value"
);

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


// Get the button and the div containing the customization options
const toggleButton = document.getElementById('toggleCustomization');
const customizationOptions = document.getElementById('customizationOptions');

// Set an initial state for showing or hiding
let isVisible = true;

// Add an event listener to toggle the visibility when clicked
toggleButton.addEventListener('click', function () {
    // Toggle the visibility of the customization options
    if (isVisible) {
        customizationOptions.style.display = 'none';
        toggleButton.innerHTML = 'Hide Customization';
    } else {
        customizationOptions.style.display = 'block';
        toggleButton.innerHTML = 'Show Customization';
    }
    isVisible = !isVisible; // Toggle the visibility state
});

