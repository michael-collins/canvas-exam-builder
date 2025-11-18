/**
 * Main Application Logic
 * Handles file upload, parsing, and QTI generation
 */

let currentQuizData = null;
let currentQtiExporter = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeDropZone();
    initializeModal();
    initializeButtons();
});

/**
 * Initialize drag and drop functionality
 */
function initializeDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    // Click to browse
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // Drag over
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    // Drag leave
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    // Drop
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    });
}

/**
 * Initialize modal functionality
 */
function initializeModal() {
    const modal = document.getElementById('jsonModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/**
 * Initialize button event listeners
 */
function initializeButtons() {
    const viewJsonBtn = document.getElementById('viewJsonBtn');
    const downloadQtiBtn = document.getElementById('downloadQtiBtn');
    const copyJsonBtn = document.getElementById('copyJsonBtn');

    viewJsonBtn.addEventListener('click', showJsonModal);
    downloadQtiBtn.addEventListener('click', downloadQti);
    copyJsonBtn.addEventListener('click', copyJsonToClipboard);
}

/**
 * Handle file upload
 */
async function handleFile(file) {
    // Validate file type
    if (!file.name.endsWith('.docx')) {
        showStatus('Please select a .docx file', 'error');
        return;
    }

    showStatus('Processing document...', 'info');
    hideResults();

    try {
        // Parse the DOCX file
        const parser = new DocxParser();
        await parser.parseDocx(file);
        currentQuizData = parser.toJSON();

        // Validate that we found questions
        if (currentQuizData.questions.length === 0) {
            showStatus('No questions found in the document. Please check the format.', 'error');
            return;
        }

        // Create QTI exporter and validate
        try {
            currentQtiExporter = new QtiExporter(currentQuizData);
            // Try to generate QTI to validate
            currentQtiExporter.generateQTI();
        } catch (validationError) {
            showStatus(`Validation Error: ${validationError.message}`, 'error');
            return;
        }

        // Show results
        showResults();
        showStatus(`Successfully extracted ${currentQuizData.questions.length} question(s)`, 'success');

    } catch (error) {
        console.error('Error processing file:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = 'status-message status-' + type;
    statusEl.style.display = 'block';
}

/**
 * Show results section
 */
function showResults() {
    const resultsEl = document.getElementById('results');
    const countEl = document.getElementById('questionCount');
    
    countEl.textContent = `${currentQuizData.questions.length} questions (${currentQuizData.metadata.totalPoints} points)`;
    resultsEl.style.display = 'block';
}

/**
 * Hide results section
 */
function hideResults() {
    const resultsEl = document.getElementById('results');
    resultsEl.style.display = 'none';
}

/**
 * Show JSON modal
 */
function showJsonModal() {
    const modal = document.getElementById('jsonModal');
    const jsonDisplay = document.getElementById('jsonDisplay');
    
    jsonDisplay.textContent = JSON.stringify(currentQuizData, null, 2);
    modal.style.display = 'block';
}

/**
 * Copy JSON to clipboard
 */
async function copyJsonToClipboard() {
    const jsonText = JSON.stringify(currentQuizData, null, 2);
    
    try {
        await navigator.clipboard.writeText(jsonText);
        showStatus('JSON copied to clipboard!', 'success');
    } catch (error) {
        console.error('Failed to copy:', error);
        showStatus('Failed to copy to clipboard', 'error');
    }
}

/**
 * Download QTI file
 */
async function downloadQti() {
    if (!currentQtiExporter) {
        showStatus('No quiz data available', 'error');
        return;
    }

    try {
        showStatus('Generating QTI package...', 'info');
        
        // Set the selected version
        const version = document.getElementById('qtiVersion').value;
        currentQtiExporter.setVersion(version);
        
        await currentQtiExporter.download('canvas-quiz');
        showStatus(`QTI ${version} package downloaded successfully!`, 'success');
    } catch (error) {
        console.error('Error downloading QTI:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}
