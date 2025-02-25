document.addEventListener('DOMContentLoaded', function () {
    var modeToggle = document.getElementById('mode-toggle');
    modeToggle.addEventListener('change', function () {
        var modeLabel = document.getElementById('mode-label');
        if (this.checked) {
            modeLabel.textContent = 'Chroma + LLM Mode';
            console.log('Switched to Chroma + LLM Mode');
        } else {
            modeLabel.textContent = 'Pure Chroma Mode';
            console.log('Switched to Pure Chroma Mode');
        }
    });
});
