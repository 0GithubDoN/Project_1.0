document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
});

function setupEventListeners() {
    document.querySelector("#menuToggleBtn").addEventListener("click", toggleMenu);
    document.querySelector("#printBtn").addEventListener("click", printPage);
    document.querySelector("#exportImageBtn").addEventListener("click", exportAsImage);
    document.querySelector("#exportPdfBtn").addEventListener("click", correctedExportAsPDF);
    document.querySelector("#convertPdfBtn").addEventListener("click", triggerPdfInput);
    document.querySelector("#pdfInput").addEventListener("change", processPDFtoXLSX);
    document.querySelector("#importXlsxBtn").addEventListener("click", triggerXlsxInput);
    document.querySelector("#xlsxInput").addEventListener("change", importXLSX);
    document.querySelector("#addEmployeeBtn").addEventListener("click", addEmployee);
    document.querySelector("#saveChangesBtn").addEventListener("click", saveChanges);
}

function toggleMenu() {
    var menuContent = document.querySelector('.menu-content');
    menuContent.classList.toggle('show');
}

function printPage() {
    window.print();
}

function exportAsImage() {
    html2canvas(document.querySelector("#scheduleTable")).then(canvas => {
        let link = document.createElement('a');
        link.download = 'schedule.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(error => {
        console.error('Error exporting image:', error);
        alert('Failed to export image. Please try again.');
    });
}

function correctedExportAsPDF() {
    html2canvas(document.querySelector("#scheduleTable"), {
        scale: 3,
        useCORS: true
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('schedule.pdf');
    }).catch(error => {
        console.error('Error exporting PDF:', error);
        alert('Failed to export PDF. Please try again.');
    });
}

function triggerPdfInput() {
    document.querySelector("#pdfInput").click();
}

async function processPDFtoXLSX(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = async (e) => {
            try {
                console.log('FileReader has loaded the file.');
                const pdfDoc = await PDFLib.PDFDocument.load(e.target.result);
                console.log(`PDF loaded with ${pdfDoc.getPageCount()} page(s).`);
            } catch (error) {
                console.error('Error processing PDF:', error);
                alert('Failed to process PDF. Please check the file format.');
            }
        };
        reader.onerror = (e) => {
            console.error('Error reading file:', e);
        };
        console.log('Starting file read process...');
        reader.readAsArrayBuffer(file);
    }
}

function triggerXlsxInput() {
    document.querySelector("#xlsxInput").click();
}

function importXLSX(event) {
    showLoadingAnimation();
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = (e) => {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, { type: 'array' });
        let worksheet = workbook.Sheets[workbook.SheetNames[0]];
        let json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        updateTableWithEditableCellsAndDeleteButton(json);
        hideLoadingAnimation();
    };
    reader.readAsArrayBuffer(file);
}

function updateTableWithEditableCellsAndDeleteButton(data) {
    let table = document.querySelector("#scheduleTable");
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
    for (let i = 0; i < data.length; i++) {
        let row = table.insertRow();
        for (let j = 0; j < data[i].length; j++) {
            let cell = row.insertCell();
            cell.contentEditable = "true";
            cell.innerHTML = data[i][j];
        }
        let deleteCell = row.insertCell();
        deleteCell.innerHTML = '<button onclick="deleteRow(this)">Delete</button>';
        deleteCell.className = 'no-print';
    }
}

function addEmployee() {
    var table = document.querySelector("#scheduleTable");
    var row = table.insertRow(-1);
    var cellCount = table.rows[0].cells.length;

    for (let i = 0; i < cellCount; i++) {
        let cell = row.insertCell(i);
        cell.contentEditable = "true";
        if (i === 0) {
            cell.innerHTML = "New Employee";
        } else {
            cell.innerHTML = "";
        }
    }
    var deleteCell = row.insertCell(cellCount - 1);
    deleteCell.innerHTML = '<button onclick="deleteRow(this)">Delete</button>';
    deleteCell.className = 'no-print';
}

function deleteRow(btn) {
    var row = btn.parentNode.parentNode;
    row.parentNode.removeChild(row);
}

function saveChanges() {
    var data = { employees: [] };
    var rows = document.querySelectorAll("#scheduleTable tr:not(:first-child)");
    rows.forEach(function(row) {
        var employee = {
            name: row.cells[0].textContent.trim(),
            days: []
        };
        for (var i = 1; i < row.cells.length - 1; i++) {
            employee.days.push(row.cells[i].textContent.trim());
        }
        data.employees.push(employee);
    });

    fetch('save_schedule.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Data saved successfully!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving data!');
    });
}

function showLoadingAnimation() {
    // Add code to show loading animation here
    console.log('Loading animation displayed.');
}

function hideLoadingAnimation() {
    // Add code to hide loading animation here
    console.log('Loading animation hidden.');
}
