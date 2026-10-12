# ĐỒ ÁN MÔN HỌC: ỨNG DỤNG QUẢN LÝ GHI CHÚ (REACTJS & NODEJS)

**Giảng viên hướng dẫn:** Nguyễn Hoàng Việt
**Nhóm thực hiện:** Nguyễn Văn Nhật Nam, Nguyễn Thành Nhơn
**Thành viên:**
1. Nguyễn Văn Nhật Nam - 0306231131 - Vai trò: Project Manager (PM), Backend Developer
2. Nguyễn Thành Nhơn - 0306231319 - Vai trò: QA (Tester), Frontend Developer

## Chức năng chính
- **Cài đặt:** tên hiển thị, theme Sáng/Tối, màu chủ đạo (áp dụng ngay, lưu xuống file), tạo/đổi mật khẩu vùng kín.
- **Ghi chú thường:** thêm, sửa, xóa chủ đề; thêm, xem, sửa, xóa ghi chú trong từng chủ đề.
- **Tìm kiếm:** theo từ khóa trong tiêu đề hoặc nội dung (không phân biệt dấu).
- **Vùng riêng tư:** lần đầu yêu cầu tạo mật khẩu; mỗi lần vào đều hiện Popup nhập mật khẩu; mật khẩu băm bằng bcrypt.
- **Giao diện:** responsive (điện thoại có menu ☰), loading khi đọc/ghi, thông báo Toast khi thành công/thất bại.

## 1. Công nghệ sử dụng
- **Frontend:** ReactJS (Vite), React Router DOM, Context API.
- **Backend:** Node.js, Express.js, bcryptjs (băm mật khẩu).
- **Cơ sở dữ liệu:** File System (lưu trữ bằng định dạng `.json` để dễ quản lý và triển khai).

## 2. Yêu cầu môi trường
- Máy tính cần cài đặt sẵn **Node.js** phiên bản **v22 LTS** (tối thiểu v20.19). Kiểm tra bằng lệnh `node -v`.

## 3. Hướng dẫn Cài đặt & Chạy dự án (Rất quan trọng)
Dự án được chia làm 2 phần chạy độc lập. Vui lòng mở **2 cửa sổ Terminal** (Command Prompt) để chạy song song.

### Bước 1: Khởi động Backend (Máy chủ API)
Mở Terminal 1, di chuyển vào thư mục `backend` (thư mục có file `package.json`) và chạy lệnh:
```bash
cd backend
npm install
node server.js
```
**Lưu ý:** Backend sẽ chạy tại http://localhost:5000 (mở địa chỉ này sẽ thấy dòng "Backend đang chạy"). Có thể chạy `npm test` để kiểm thử tự động 23 bước API. Dữ liệu lưu trong thư mục `backend/data/` (nếu xóa thư mục này, Backend sẽ tự tạo lại khi chạy). Vui lòng không xóa thư mục này khi đang chạy ứng dụng.

### Bước 2: Khởi động Frontend (Giao diện)
Mở Terminal 2, di chuyển vào thư mục `frontend` và chạy lệnh:
```bash
cd frontend
npm install
npm run dev
```
**Lưu ý:** Frontend sẽ chạy tại http://localhost:5173 (hoặc cổng khác hiển thị trên terminal). Mở đường dẫn này trên trình duyệt (Khuyến nghị Google Chrome) để sử dụng hệ thống.

## 4. Tài khoản / Mật khẩu Demo
- Web không yêu cầu đăng nhập tài khoản.
- Thư mục `backend/data` có sẵn dữ liệu mẫu: 4 chủ đề (Học tập, Công việc, Cá nhân, Ý tưởng dự án) và vài ghi chú. Vùng kín chưa có mật khẩu.
- Lần đầu bấm vào **"Vùng kín"**, hệ thống hiện Popup yêu cầu **tạo mật khẩu** (tối thiểu 4 ký tự). Những lần sau nhập mật khẩu đó để mở khóa.
- Có thể đổi mật khẩu trong **"Cài đặt"** (cần nhập đúng mật khẩu cũ).

## 5. Cấu trúc thư mục
```
├── backend/
│   ├── server.js                # Toàn bộ API (chia module theo Sprint)
│   ├── scripts/smoke-test.js    # Kiểm thử tự động API: npm test
│   ├── postman_collection.json  # Import vào Postman để test API
│   └── data/                    # dữ liệu mẫu: profile.json, topics.json, private.json, notes/*.json
├── frontend/
│   └── src/                     # main, App, AppContext, Layout, Home, Settings, Notes,
│                                # NoteBoard, Search, PrivateNotes, Toast, index.css
├── API.md                       # Danh sách API
└── README.md
```

## 6. Xử lý sự cố thường gặp
- **Giao diện báo "Không kết nối được server":** Backend chưa chạy — kiểm tra Terminal 1.
- **Lỗi `EADDRINUSE` cổng 5000:** có chương trình khác đang dùng cổng 5000, tắt chương trình đó rồi chạy lại.
- **Quên mật khẩu vùng kín:** tắt Backend, mở `backend/data/profile.json`, xóa giá trị trường `"password"` (để `""`), chạy lại Backend rồi tạo mật khẩu mới.
