// --- dothi.js ---
let checkedInCount = 0;  // Số lượng children đã điểm danh
let totalCount = 0;      // Tổng số lượng children trong Danhsach

// Function to get data from Firebase
function GetData() {
    const dbRef = firebase.database().ref();
    const listOfDataRef = dbRef.child('ListOfdata');
    const danhSachRef = dbRef.child('Danhsach');

    // Lấy tổng số children từ 'Danhsach'
    danhSachRef.once('value').then(snapshot => {
        totalCount = snapshot.numChildren();
        console.log('Total children in Danhsach:', totalCount);
    });

    // Lấy dữ liệu điểm danh từ 'ListOfdata'
    listOfDataRef.on('value', snapshot => {
        checkedInCount = 0;

        snapshot.forEach(childSnapshot => {
            checkedInCount++;
        });

        console.log('Checked-in children count:', checkedInCount);

        // Vẽ biểu đồ khi đã có dữ liệu
        drawPieChart();
    });
}

// Function to draw the pie chart
function drawPieChart() {
    const canvas = document.getElementById('myPieChart');
    if (!canvas) {
        console.error("Canvas element with ID 'myPieChart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');

    const totalCheckedIn = checkedInCount;
    const totalNotCheckedIn = totalCount - totalCheckedIn;

    const data = {
        labels: ['Đã điểm danh', 'Chưa điểm danh'],
        datasets: [{
            data: [totalCheckedIn, totalNotCheckedIn],
            backgroundColor: ['#4CAF50', '#FFC107'],
        }]
    };

    if (window.myPieChart && typeof window.myPieChart.destroy === 'function') {
        window.myPieChart.destroy();
    }

    window.myPieChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const percentage = ((value / totalCount) * 100).toFixed(2);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// --- orders.js ---
var Orders = [];

function GetDataOrders() {
    const dbRef = firebase.database().ref();
    const listOfDataRef = dbRef.child('ListOfdata');
    const danhSachRef = dbRef.child('Danhsach');

    const dataCleared = localStorage.getItem('dataCleared');
    const lastClearedDataId = localStorage.getItem('lastClearedDataId') || null;

    listOfDataRef.on('value', snapshot => {
        console.log("Data from ListOfdata:", snapshot.val());
        Orders = [];
        let hasNewData = false;

        snapshot.forEach(childSnapshot => {
            const order = childSnapshot.val();

            if (order.id !== lastClearedDataId) {
                hasNewData = true;

                danhSachRef.once('value', studentSnapshot => {
                    const studentData = studentSnapshot.val();

                    if (studentData && studentData[order.id]) {
                        order.studentIDs = studentData[order.id].studentIDs;
                    } else {
                        order.studentIDs = "N/A";
                    }

                    Orders.push(order);
                    UpdateTable();
                });
            }
        });

        if (!hasNewData && dataCleared === "true") {
            console.log("No new data available after clearing.");
        }
    });
}

function UpdateTable() {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';

    Orders.forEach(order => {
        const tr = document.createElement('tr');
        const trContent = `
            <td>${order.id}</td>
            <td>${order.studentIDs}</td>
            <td>${order.time}</td>
        `;
        tr.innerHTML = trContent;
        tbody.insertBefore(tr, tbody.firstChild);
    });
}

function clearData() {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = "";
    Orders = [];

    const listOfDataRef = firebase.database().ref('ListOfdata');
    listOfDataRef.once('value', snapshot => {
        snapshot.forEach(childSnapshot => {
            const childKey = childSnapshot.key;
            const studentIDs = childSnapshot.val().studentIDs;

            listOfDataRef.child(childKey).set({ studentIDs });
        });
    }).then(() => {
        console.log("Cleared id and time from Firebase, kept studentIDs.");
    }).catch(error => {
        console.error("Error clearing data in Firebase:", error);
    });

    localStorage.setItem('dataCleared', 'true');
}

function exportTableToExcel() {
    const table = document.getElementById("dataTable");
    if (!table || !table.getElementsByTagName("tbody")[0].hasChildNodes()) {
        alert("Không có dữ liệu để xuất ra Excel.");
        return;
    }

    const workbook = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
    const worksheet = workbook.Sheets["Sheet1"];

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellAddress = `C${row + 1}`;
        const cell = worksheet[cellAddress];
        if (cell && typeof cell.v === "string" && cell.v.includes("T")) {
            cell.t = "s";
        }
    }

    XLSX.writeFile(workbook, "DanhSachDiemDanh.xlsx");
}

// Lắng nghe sự kiện tải trang
window.addEventListener('load', () => {
    GetData();
    GetDataOrders();
});
