# Danh sách API

Base URL: `http://localhost:5000` · Dữ liệu gửi/nhận: JSON (`Content-Type: application/json`)

## Sprint 1 – Profile
| Method | URL | Body gửi lên | Trả về |
|---|---|---|---|
| GET | `/api/profile` | – | `{ displayName, theme, primaryColor, hasPassword }` (không trả mật khẩu) |
| PUT | `/api/profile` | `{ displayName, theme, primaryColor, password, oldPassword }` | `{ success, message }` |

- Gửi trường nào thì cập nhật trường đó. `theme`: `"light"` | `"dark"`; `primaryColor`: dạng `#RRGGBB`.
- `password` để trống `""` = giữ mật khẩu cũ. Có giá trị (≥ 4 ký tự) = đặt mật khẩu mới, Backend **băm bằng bcrypt** trước khi lưu.
- Nếu đã có mật khẩu thì phải gửi kèm `oldPassword` đúng, sai → 401 "Mật khẩu cũ không đúng".

## Sprint 2 – Ghi chú thường (`:topic` = id chủ đề, ví dụ `hoc-tap`)
| Method | URL | Body gửi lên | Trả về |
|---|---|---|---|
| GET | `/api/notes/:topic` | – | Mảng ghi chú (`[]` nếu chưa có) |
| POST | `/api/notes/:topic` | `{ title, content }` | `{ success, note }` |
| PUT | `/api/notes/:topic/:id` | `{ title, content }` | `{ success, message }` |
| DELETE | `/api/notes/:topic/:id` | – | `{ success, message }` |

Một ghi chú: `{ "id", "title", "content", "createdAt", "updatedAt" }` — `title` bắt buộc, không được toàn dấu cách.

## Chủ đề
| Method | URL | Body gửi lên | Trả về |
|---|---|---|---|
| GET | `/api/topics` | – | `[{ id, name, createdAt, noteCount }]` |
| POST | `/api/topics` | `{ name }` | `{ success, topic }` — id sinh từ tên: "Ý tưởng" → `y-tuong` |
| PUT | `/api/topics/:id` | `{ name }` | `{ success, topic }` (id giữ nguyên) |
| DELETE | `/api/topics/:id` | – | `{ success, message }` — xóa luôn ghi chú của chủ đề |

## Tìm kiếm
| Method | URL | Trả về |
|---|---|---|
| GET | `/api/search?q=tu-khoa` | Ghi chú khớp tiêu đề/nội dung (không phân biệt hoa thường, dấu), kèm `topicId`, `topicName`. Không tìm trong vùng kín. |

## Sprint 3 – Vùng kín
| Method | URL | Body gửi lên | Trả về |
|---|---|---|---|
| POST | `/api/private/auth` | `{ password }` | `{ success: true }` hoặc 401 `{ success: false, message: "Sai mật khẩu!" }` |
| GET | `/api/private/notes` | – | Mảng ghi chú riêng tư |
| POST | `/api/private/notes` | `{ title, content }` | `{ success, note }` |
| PUT | `/api/private/notes/:id` | `{ title, content }` | `{ success, message }` |
| DELETE | `/api/private/notes/:id` | – | `{ success, message }` |

## Mã lỗi
| Mã | Ý nghĩa |
|---|---|
| 400 | Dữ liệu không hợp lệ (thiếu tiêu đề, theme/màu sai, mật khẩu < 4 ký tự, chủ đề trùng tên, JSON sai cú pháp) |
| 401 | Sai mật khẩu, sai mật khẩu cũ, hoặc chưa tạo mật khẩu vùng kín |
| 404 | Không tìm thấy ghi chú hoặc API |
| 500 | Lỗi đọc/ghi file |
