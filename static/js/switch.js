document.addEventListener('DOMContentLoaded', function () {
    var modeToggle = document.getElementById('mode-toggle');
    var modeLabel = document.getElementById('mode-label');
    var similarityAmountInput = document.getElementById('similarity-amount');
    var similarityAmountGroup = similarityAmountInput.closest('.form-group'); // To target the entire group div

    // Initial state setup: hide the "Similarity Data Amount" when in Chroma + LLM Mode
    similarityAmountGroup.style.display = 'block'; // Hide initially if in Chroma + LLM mode

    modeToggle.addEventListener('change', function () {
        if (this.checked) {
            // Chroma + LLM Mode
            modeLabel.textContent = 'Chroma + LLM Mode';
            similarityAmountGroup.style.display = 'none'; // Hide similarity amount input
            console.log('Switched to Chroma + LLM Mode');
        } else {
            // Pure Chroma Mode
            modeLabel.textContent = 'Pure Chroma Mode';
            similarityAmountGroup.style.display = 'block'; // Show similarity amount input
            console.log('Switched to Pure Chroma Mode');
        }
    });
});
