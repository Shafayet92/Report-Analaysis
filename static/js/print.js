document.addEventListener("DOMContentLoaded", () => {
    const pdfButton = document.querySelector(".btn-pdf");
    const docButton = document.querySelector(".btn-doc");
    const printButton = document.querySelector(".btn-print");
    const summaryContainer = document.getElementById("summaryContainer");

    // Generate a timestamp for the file name
    const now = new Date();
    const fileName = `report${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getFullYear()).slice(-2)}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;


    // Export to PDF
    pdfButton.addEventListener("click", () => {
        const reportContent = summaryContainer.innerText; // Extract plain text
        exportToPDF(reportContent);
    });

    // Export to DOCX
    docButton.addEventListener("click", () => {
        const reportContent = summaryContainer.innerText; // Extract plain text

        exportToDOCX(reportContent);
    });

    // Print Report
    printButton.addEventListener("click", () => {
        const reportContent = summaryContainer.innerHTML; // Preserve HTML formatting
        printReport(reportContent);
    });
});

// Function to generate a timestamped file name
function generateFileName(baseName, extension) {
    const now = new Date();
    const timestamp = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getFullYear()).slice(-2)}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    return `${baseName}${timestamp}.${extension}`;
}

// Function to export the report to PDF
function exportToPDF(content) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.text(content, 10, 10); // Add plain text content to the PDF
    pdf.save(generateFileName("report", "pdf")); // Save the file as Report.pdf
}




// Function to export the report to DOCX
function exportToDOCX(content) {
    try {
        if (!content.trim()) {
            alert("No content available to export to DOCX.");
            return;
        }

        // Create a new Word document
        const doc = new docx.Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new docx.Paragraph({
                            text: content, // Add the plain text content
                            spacing: { after: 200 }, // Optional spacing
                        }),
                    ],
                },
            ],
        });

        // Generate the document and download it
        docx.Packer.toBlob(doc).then((blob) => {
            console.log("DOCX Blob generated:", blob);
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob); // Create a blob URL


            link.download = generateFileName("report", "doc");
            link.click(); // Trigger the download
        }).catch((error) => {
            console.error("Error generating DOCX file:", error);
            alert("Failed to generate DOCX file. Please try again.");
        });
    } catch (error) {
        console.error("Unexpected error during DOCX generation:", error);
        alert("An unexpected error occurred while generating the DOCX file.");
    }
}


// Function to print the report
function printReport(content) {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                </style>
            </head>
            <body>${content}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}
