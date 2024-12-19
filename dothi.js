let checkedInCount = 0;  // Số lượng children đã điểm danh
let totalCount = 0;      // Tổng số lượng children trong Danhsach

// Function to get data from Firebase
function GetData() {
    const dbRef = firebase.database().ref();
    const listOfDataRef = dbRef.child('ListOfdata');
    const danhSachRef = dbRef.child('Danhsach');

    // Lấy tổng số children từ 'Danhsach'
    danhSachRef.once('value').then(snapshot => {
        totalCount = snapshot.numChildren(); // Đếm tổng số children trong Danhsach
        console.log('Total children in Danhsach:', totalCount); // Log tổng số children trong Danhsach để kiểm tra
    });

    // Lấy dữ liệu điểm danh từ 'ListOfdata'
    listOfDataRef.on('value', snapshot => {
        checkedInCount = 0; // Xóa số lượng điểm danh cũ

        snapshot.forEach(childSnapshot => {
            checkedInCount++; // Tăng số lượng children đã điểm danh
        });

        console.log('Checked-in children count:', checkedInCount); // Log số lượng children đã điểm danh

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

    // Sử dụng tổng số children trong 'Danhsach' làm số lượng tối đa
    const totalCheckedIn = checkedInCount; // Số lượng children đã điểm danh
    const totalNotCheckedIn = totalCount - totalCheckedIn; // Số lượng children chưa điểm danh

    console.log('Checked-in children count:', totalCheckedIn);  // Log số lượng children đã điểm danh
    console.log('Total children:', totalCount);  // Log tổng số children trong Danhsach

    // Dữ liệu cho biểu đồ
    const data = {
        labels: ['Đã điểm danh', 'Chưa điểm danh'],
        datasets: [{
            data: [totalCheckedIn, totalNotCheckedIn],
            backgroundColor: ['#4CAF50', '#FFC107'],
        }]
    };

    // Nếu đã có biểu đồ cũ thì hủy bỏ nó
    if (window.myPieChart && typeof window.myPieChart.destroy === 'function') {
        window.myPieChart.destroy();
    }

    // Khởi tạo biểu đồ hình tròn
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

// Lắng nghe sự kiện tải trang để lấy dữ liệu
window.addEventListener('load', GetData);
