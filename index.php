<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Schedule</title>
    <!-- Load external libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
    <!-- Load local JavaScript libraries -->
    <script src="js/jspdf.umd.min.js"></script>
    <script src="js/html2canvas.min.js"></script>
    <!-- Local styles -->
    <link rel="stylesheet" href="css/style.css">
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="images/favicon.ico">
</head>
<body>
    <!-- Loading overlay -->
    <div id="loadingOverlay">
        <div class="loader"></div>
    </div>

    <!-- Logo positioned in the top left corner -->
    <div class="logo-container">
        <img src="images/logo.png" alt="Work Schedule Tool Logo" class="logo">
    </div>
    
    <div class="container">
        <div class="top-right-buttons">
            <button id="printBtn" class="button">Print</button>
            <button id="convertPdfBtn" class="button">Convert PDF to XLSX</button>
        </div>
        <h1>Employee Schedule</h1>
        <div class="menu">
            <button id="menuToggleBtn" class="menu-toggle">Menu</button>
            <div class="menu-content">
                <button id="exportImageBtn" class="button">Export as Image</button>
                <button id="exportPdfBtn" class="button">Export as PDF</button>
                <button id="importXlsxBtn" class="button">Import from .xlsx</button>
            </div>
        </div>
        <?php include 'schedule.php'; ?>
        <input type="file" id="xlsxInput" accept=".xlsx" style="display: none;">
        <input type="file" id="pdfInput" accept=".pdf" style="display: none;">
        <div class="buttons-container">
            <button id="addEmployeeBtn">Add Employee</button>
            <button id="saveChangesBtn">Save Changes</button>
        </div>
    </div>
    <!-- Local scripts -->
    <script src="js/script.js"></script>
</body>
</html>
