var Orders = [];
var database = firebase.database();
let stdNo = 1;

function GetData() {
    const dbRef = firebase.database().ref();
    const listOfDataRef = dbRef.child('Danhsach');
    
    // Lắng nghe sự thay đổi dữ liệu từ Firebase
    listOfDataRef.on('value', snapshot => {
        console.log("Data received from Firebase: ", snapshot.val());  // Kiểm tra dữ liệu nhận được

        // Làm trống danh sách Orders trước khi cập nhật
        Orders = [];
        
        // Duyệt qua các bản ghi trong snapshot và thêm vào Orders
        snapshot.forEach(childSnapshot => {
            const order = childSnapshot.val();
            Orders.push(order);
        });
        
        console.log("Orders Array after update: ", Orders);  // Kiểm tra dữ liệu sau khi thêm vào Orders

        // Làm trống bảng trước khi thêm dữ liệu mới
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = '';  // Xóa các hàng cũ trong bảng

        // Thêm các bản ghi mới vào bảng
        Orders.forEach(order => {
            const tr = document.createElement('tr');
            const trContent = `
                <td>${order.id}</td>    
                <td>${order.studentIDs}</td>
                <td>${order.time}</td>
                <td><button onclick="deleteFingerprint('${order.id}')">Delete</button></td>
            `;
            tr.innerHTML = trContent;

            // Thêm dòng vào bảng
            tbody.insertBefore(tr, tbody.firstChild);
        });
    });

    // Lắng nghe sự kiện thêm bản ghi mới
    listOfDataRef.on('child_added', snapshot => {
        const order = snapshot.val();
        console.log("Child added:", order);  // Kiểm tra bản ghi mới được thêm

        if (order && order.id && order.studentIDs && order.time) {
            const tr = document.createElement('tr');
            const trContent = `
                <td>${order.id}</td>
                <td>${order.studentIDs}</td>
                <td>${order.time}</td>
                <td><button onclick="deleteFingerprint('${order.id}')">Delete</button></td>
            `;
            tr.innerHTML = trContent;

            // Thêm bản ghi vào bảng
            const tbody = document.querySelector('table tbody');
            tbody.insertBefore(tr, tbody.firstChild);
        }
    });

    // Lắng nghe sự kiện bản ghi bị thay đổi
    listOfDataRef.on('child_changed', snapshot => {
        const updatedOrder = snapshot.val();
        const orderId = snapshot.key;
        console.log("Child changed:", updatedOrder);  // Kiểm tra bản ghi thay đổi

        // Tìm và cập nhật bản ghi trong bảng
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            if (row.children[0].textContent === orderId) {
                row.children[1].textContent = updatedOrder.studentIDs;
                row.children[2].textContent = updatedOrder.time;
            }
        });
    });

    // Lắng nghe sự kiện bản ghi bị xóa
    listOfDataRef.on('child_removed', snapshot => {
        const orderId = snapshot.key;
        console.log("Child removed:", orderId);  // Kiểm tra bản ghi bị xóa

        // Tìm và xóa hàng khỏi bảng
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            if (row.children[0].textContent === orderId) {
                row.remove();
            }
        });
    });
}

// Hàm để cập nhật trường "delete" với id và trường status = "on"
// và xóa bản ghi trong Danhsach
function deleteFingerprint(id) {
    const deleteRef = firebase.database().ref('delete'); // Tham chiếu đến node "delete" ở cấp root
    const danhsachRef = firebase.database().ref(`Danhsach/${id}`); // Tham chiếu đến bản ghi trong Danhsach với ID cụ thể
    const listOfDataRef = firebase.database().ref(`ListOfdata/${id}`); // Tham chiếu đến bản ghi trong ListOfdata với ID cụ thể

    // Cập nhật trường delete với ID và status là "on"
    deleteRef.update({ 
        id: parseInt(id, 10), // Đảm bảo ID là số nguyên
        status: 'on'          // Đặt status thành "on"
    })
    .then(() => {
        console.log(`Fingerprint with ID ${id} has been marked for deletion with status 'on'.`);

        // Xóa bản ghi tương ứng trong Danhsach
        return danhsachRef.remove();
    })
    .then(() => {
        console.log(`Record with ID ${id} in Danhsach has been deleted.`);
        
        // Xóa bản ghi tương ứng trong ListOfdata
        return listOfDataRef.remove();
    })
    .then(() => {
        console.log(`Record with ID ${id} in ListOfdata has been deleted.`);
    })
    .catch(error => {
        console.error("Error updating delete field or deleting records in Danhsach or ListOfdata:", error);
    });
}

function exportTableToExcel() {
    const table = document.getElementById("dataTable");

    // Kiểm tra nếu bảng không có dữ liệu
    if (!table || !table.getElementsByTagName("tbody")[0].hasChildNodes()) {
        alert("Không có dữ liệu để xuất ra Excel.");
        return;
    }

    // Tạo workbook từ bảng
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
    const worksheet = workbook.Sheets["Sheet1"];

    // Xác định phạm vi dữ liệu hiện tại
    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    // Loại bỏ cột cuối cùng trong worksheet
    range.e.c -= 1; // Giảm giá trị cột cuối đi 1
    worksheet["!ref"] = XLSX.utils.encode_range(range); // Cập nhật phạm vi mới không có cột cuối

    // Duyệt qua từng ô trong cột thời gian và đặt định dạng thành chuỗi
    for (let row = range.s.r + 1; row <= range.e.r; row++) { // bắt đầu từ hàng thứ hai (bỏ qua tiêu đề)
        const cellAddress = `C${row + 1}`; // Cột C là cột chứa thời gian
        const cell = worksheet[cellAddress];
        if (cell && typeof cell.v === "string" && cell.v.includes("T")) { // Kiểm tra định dạng thời gian
            cell.t = "s"; // Đặt kiểu dữ liệu thành chuỗi (string)
        }
    }

    // Xuất file Excel
    XLSX.writeFile(workbook, "DanhSachDangKy.xlsx");
}


window.addEventListener('load', GetData);
