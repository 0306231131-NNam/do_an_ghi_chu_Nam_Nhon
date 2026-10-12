/**
 * ============================================================================
 * BACKEND: HỆ THỐNG QUẢN LÝ GHI CHÚ VÀ THÔNG TIN RIÊNG TƯ
 * Author: Nguyễn Văn Nhật Nam (0306231131) – Backend Dev
 * Công nghệ: Node.js + Express, lưu trữ bằng file JSON (module fs)
 *
 * Cấu trúc dữ liệu (tự động tạo khi chạy lần đầu – Sprint 4):
 *   data/
 *     profile.json      -> { displayName, theme, primaryColor, password (đã hash bcrypt) }
 *     topics.json       -> Danh sách chủ đề [{ id, name, createdAt }]
 *     private.json      -> Danh sách ghi chú riêng tư
 *     notes/
 *       hoc-tap.json    -> Ghi chú chủ đề Học tập
 *       cong-viec.json  -> Ghi chú chủ đề Công việc
 *       ca-nhan.json    -> Ghi chú chủ đề Cá nhân
 *
 * [CẢNH BÁO TRÁNH XUNG ĐỘT]:
 * - FE Team: Các API nhận và trả về JSON đúng như đã chốt ở Sprint 0-3.
 *   Không tự ý đổi tên key.
 * - BE Team: Mỗi Sprint là một khối MODULE riêng. Sửa module nào chỉ đụng khối đó.
 *   Đổi đường dẫn lưu file phải báo PM.
 * ============================================================================
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors()); // Cho phép FE (localhost:5173) gọi API
app.use(express.json()); // Đọc dữ liệu JSON từ FE gửi lên

/* ============================================================================
   MODULE 0: CẤU HÌNH, HÀM DÙNG CHUNG & KHỞI TẠO DỮ LIỆU (Sprint 4)
   Xóa trắng thư mục data/ rồi chạy lại server -> mọi file tự được tạo lại.
   ============================================================================ */
const PORT = process.env.PORT || 5000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const notesDir = path.join(DATA_DIR, 'notes');
const profilePath = path.join(DATA_DIR, 'profile.json');
const privateNotesFile = path.join(DATA_DIR, 'private.json');
const topicsPath = path.join(DATA_DIR, 'topics.json');

const DEFAULT_TOPICS = [
  { id: 'hoc-tap', name: 'Học tập' },
  { id: 'cong-viec', name: 'Công việc' },
  { id: 'ca-nhan', name: 'Cá nhân' },
];

// Đọc file JSON; nếu file chưa có hoặc bị hỏng thì trả về giá trị mặc định
function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Không đọc được file ${file}:`, error.message);
    return fallback;
  }
}

// Ghi file JSON (đẹp, thụt lề 2 dấu cách)
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Kiểm tra dữ liệu ghi chú gửi lên: tiêu đề bắt buộc, không được toàn dấu cách
function validateNote(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content : '';
  if (!title) return { error: 'Vui lòng nhập tiêu đề' };
  if (title.length > 200) return { error: 'Tiêu đề tối đa 200 ký tự' };
  return { title, content };
}

function initData() {
  fs.mkdirSync(notesDir, { recursive: true });

  if (!fs.existsSync(profilePath)) {
    writeJson(profilePath, { displayName: 'Sinh viên', theme: 'light', primaryColor: '#007bff', password: '' });
  }
  if (!fs.existsSync(topicsPath)) {
    const now = new Date().toISOString();
    const topics = DEFAULT_TOPICS.map((t) => {
      return { id: t.id, name: t.name, createdAt: now };
    });
    writeJson(topicsPath, topics);
  }
  if (!fs.existsSync(privateNotesFile)) {
    writeJson(privateNotesFile, []);
  }
  // Dữ liệu mẫu để giao diện không trống trơn khi thầy cô mở lên
  const sampleFile = path.join(notesDir, 'hoc-tap.json');
  if (!fs.existsSync(sampleFile)) {
    const now = new Date().toISOString();
    writeJson(sampleFile, [
      {
        id: Date.now().toString(),
        title: 'Kế hoạch bảo vệ đồ án',
        content: '- Hoàn thiện slide trình bày\n- Tập demo 2 lần\n- Nộp file Source.zip và Slide.pptx',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }
}

/* ============================================================================
   MODULE 1: PROFILE & CÀI ĐẶT (Sprint 1)
   GET /api/profile  -> { displayName, theme, primaryColor, hasPassword }  (KHÔNG trả về mật khẩu)
   PUT /api/profile  -> nhận { displayName, theme, primaryColor, password, oldPassword }
     - password để trống: giữ mật khẩu cũ
     - password có giá trị: băm bằng bcrypt rồi mới lưu (không lưu chữ thường)
     - Đã có mật khẩu mà muốn đổi: bắt buộc gửi oldPassword đúng
   ============================================================================ */
app.get('/api/profile', (req, res) => {
  try {
    const { displayName, theme, primaryColor, password } = readJson(profilePath, {});
    res.json({
      displayName: displayName || 'Sinh viên',
      theme: theme || 'light',
      primaryColor: primaryColor || '#007bff',
      hasPassword: Boolean(password),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đọc file' });
  }
});

app.put('/api/profile', (req, res) => {
  try {
    const profile = readJson(profilePath, {});
    const { displayName, theme, primaryColor, password, oldPassword } = req.body || {};

    if (primaryColor !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
        return res.status(400).json({ success: false, message: 'Màu chủ đạo phải có dạng #RRGGBB' });
      }
      profile.primaryColor = primaryColor.toLowerCase();
    }

    if (displayName !== undefined) {
      const name = String(displayName).trim();
      if (!name) return res.status(400).json({ success: false, message: 'Tên hiển thị không được để trống' });
      profile.displayName = name;
    }
    if (theme !== undefined) {
      if (!['light', 'dark'].includes(theme)) {
        return res.status(400).json({ success: false, message: "Theme chỉ nhận 'light' hoặc 'dark'" });
      }
      profile.theme = theme;
    }
    if (typeof password === 'string' && password !== '') {
      if (password.length < 4) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 4 ký tự' });
      }
      // Đã có mật khẩu -> phải nhập đúng mật khẩu cũ mới được đổi
      if (profile.password && !bcrypt.compareSync(String(oldPassword || ''), profile.password)) {
        return res.status(401).json({ success: false, message: 'Mật khẩu cũ không đúng' });
      }
      profile.password = bcrypt.hashSync(password, 10);
    }

    // Ghi đè dữ liệu mới vào file
    writeJson(profilePath, profile);
    res.json({ success: true, message: 'Đã cập nhật Profile' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi ghi file' });
  }
});

/* ============================================================================
   MODULE 2: QUẢN LÝ GHI CHÚ THÔNG THƯỜNG (Sprint 2)
   GET    /api/notes/:topic       -> danh sách (file chưa có thì trả [])
   POST   /api/notes/:topic       -> thêm { title, content }
   PUT    /api/notes/:topic/:id   -> sửa  { title, content }
   DELETE /api/notes/:topic/:id   -> xóa
   ============================================================================ */
// Chỉ chấp nhận tên chủ đề dạng "hoc-tap" -> chặn kiểu tấn công "../../profile"
const isValidTopic = (topic) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic);
const getFilePath = (topic) => path.join(notesDir, `${topic}.json`);

app.get('/api/notes/:topic', (req, res) => {
  if (!isValidTopic(req.params.topic)) return res.status(400).json({ message: 'Chủ đề không hợp lệ' });
  try {
    res.json(readJson(getFilePath(req.params.topic), []));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đọc danh sách ghi chú' });
  }
});

app.post('/api/notes/:topic', (req, res) => {
  if (!isValidTopic(req.params.topic)) return res.status(400).json({ message: 'Chủ đề không hợp lệ' });
  const { title, content, error } = validateNote(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const filePath = getFilePath(req.params.topic);
    const notes = readJson(filePath, []);
    const now = new Date().toISOString();
    const newNote = { id: Date.now().toString(), title, content, createdAt: now, updatedAt: now };
    notes.push(newNote);
    writeJson(filePath, notes);
    res.json({ success: true, note: newNote });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thêm ghi chú' });
  }
});

app.put('/api/notes/:topic/:id', (req, res) => {
  if (!isValidTopic(req.params.topic)) return res.status(400).json({ message: 'Chủ đề không hợp lệ' });
  const { title, content, error } = validateNote(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const filePath = getFilePath(req.params.topic);
    const notes = readJson(filePath, []);
    const index = notes.findIndex((n) => n.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });

    notes[index].title = title;
    notes[index].content = content;
    notes[index].updatedAt = new Date().toISOString();
    writeJson(filePath, notes);
    res.json({ success: true, message: 'Đã sửa thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật ghi chú' });
  }
});

app.delete('/api/notes/:topic/:id', (req, res) => {
  if (!isValidTopic(req.params.topic)) return res.status(400).json({ message: 'Chủ đề không hợp lệ' });
  try {
    const filePath = getFilePath(req.params.topic);
    const notes = readJson(filePath, []);
    const newNotes = notes.filter((n) => n.id !== req.params.id);
    if (newNotes.length === notes.length) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    writeJson(filePath, newNotes);
    res.json({ success: true, message: 'Đã xóa thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa ghi chú' });
  }
});

/* ============================================================================
   MODULE 2B: QUẢN LÝ CHỦ ĐỀ (TOPICS)
   GET    /api/topics       -> [{ id, name, createdAt, noteCount }]
   POST   /api/topics       -> tạo { name }  (id tự sinh từ tên: "Ý tưởng" -> "y-tuong")
   PUT    /api/topics/:id   -> đổi tên { name } (id = tên file giữ nguyên)
   DELETE /api/topics/:id   -> xóa chủ đề và file ghi chú của chủ đề đó
   ============================================================================ */
// Bỏ dấu tiếng Việt: "Học tập" -> "Hoc tap"
// normalize('NFD') tách chữ và dấu ra riêng, sau đó xóa phần dấu đi
function removeTones(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Tạo id cho chủ đề từ tên: "Ý tưởng mới" -> "y-tuong-moi"
function slugify(str) {
  const slug = removeTones(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // ký tự không phải chữ/số thành dấu -
    .replace(/^-+|-+$/g, '');    // bỏ dấu - ở đầu và cuối
  return slug.slice(0, 40) || 'chu-de';
}

const readTopics = () => readJson(topicsPath, []);

function checkTopicName(name, topics, exceptId) {
  const clean = typeof name === 'string' ? name.trim() : '';
  if (!clean) return { error: 'Vui lòng nhập tên chủ đề' };
  if (clean.length > 40) return { error: 'Tên chủ đề tối đa 40 ký tự' };
  if (topics.some((t) => t.id !== exceptId && t.name.toLowerCase() === clean.toLowerCase())) {
    return { error: 'Chủ đề này đã tồn tại' };
  }
  return { name: clean };
}

app.get('/api/topics', (req, res) => {
  try {
    const topics = readTopics();
    // đếm số ghi chú của từng chủ đề
    for (const t of topics) {
      t.noteCount = readJson(getFilePath(t.id), []).length;
    }
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đọc danh sách chủ đề' });
  }
});

app.post('/api/topics', (req, res) => {
  try {
    const topics = readTopics();
    const { name, error } = checkTopicName(req.body.name, topics);
    if (error) return res.status(400).json({ success: false, message: error });

    // Sinh id từ tên, nếu trùng thì thêm -2, -3...
    const base = slugify(name);
    let id = base;
    for (let i = 2; topics.some((t) => t.id === id); i++) id = `${base}-${i}`;

    const topic = { id, name, createdAt: new Date().toISOString() };
    topics.push(topic);
    writeJson(topicsPath, topics);
    res.json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo chủ đề' });
  }
});

app.put('/api/topics/:id', (req, res) => {
  try {
    const topics = readTopics();
    const topic = topics.find((t) => t.id === req.params.id);
    if (!topic) return res.status(404).json({ success: false, message: 'Không tìm thấy chủ đề' });
    const { name, error } = checkTopicName(req.body.name, topics, topic.id);
    if (error) return res.status(400).json({ success: false, message: error });

    topic.name = name;
    writeJson(topicsPath, topics);
    res.json({ success: true, topic });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đổi tên chủ đề' });
  }
});

app.delete('/api/topics/:id', (req, res) => {
  try {
    const topics = readTopics();
    if (!topics.some((t) => t.id === req.params.id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chủ đề' });
    }
    if (topics.length === 1) {
      return res.status(400).json({ success: false, message: 'Phải giữ lại ít nhất 1 chủ đề' });
    }
    writeJson(topicsPath, topics.filter((t) => t.id !== req.params.id));
    const file = getFilePath(req.params.id);
    if (isValidTopic(req.params.id) && fs.existsSync(file)) fs.unlinkSync(file);
    res.json({ success: true, message: 'Đã xóa chủ đề' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa chủ đề' });
  }
});

/* ============================================================================
   MODULE 2C: TÌM KIẾM GHI CHÚ
   GET /api/search?q=tu-khoa
   - Tìm trong tiêu đề + nội dung của mọi chủ đề (KHÔNG tìm trong vùng kín)
   - Không phân biệt hoa/thường và dấu: gõ "hoc tap" vẫn ra "Học tập"
   ============================================================================ */
app.get('/api/search', (req, res) => {
  try {
    // chuyển về chữ thường, không dấu để so sánh
    const norm = (text) => removeTones(text || '').toLowerCase();
    const q = norm(req.query.q).trim();
    if (!q) return res.json([]);

    const results = [];
    for (const t of readTopics()) {
      for (const n of readJson(getFilePath(t.id), [])) {
        if (norm(n.title).includes(q) || norm(n.content).includes(q)) {
          results.push({ ...n, topicId: t.id, topicName: t.name });
        }
      }
    }
    results.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tìm kiếm' });
  }
});

/* ============================================================================
   MODULE 3: BẢO MẬT & GHI CHÚ RIÊNG TƯ (Sprint 3)
   POST   /api/private/auth        -> { password } => { success: true|false }
   GET    /api/private/notes       -> danh sách ghi chú kín
   POST   /api/private/notes       -> thêm { title, content }
   PUT    /api/private/notes/:id   -> sửa
   DELETE /api/private/notes/:id   -> xóa
   ============================================================================ */
app.post('/api/private/auth', (req, res) => {
  try {
    const profile = readJson(profilePath, {});
    if (!profile.password) {
      return res.status(401).json({
        success: false,
        message: 'Chưa có mật khẩu. Vui lòng vào Cài đặt để tạo mật khẩu vùng kín!',
      });
    }
    // So sánh mật khẩu nhập vào với mật khẩu đã băm trong profile.json
    const ok = bcrypt.compareSync(String(req.body.password || ''), profile.password);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Sai mật khẩu!' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống xác thực' });
  }
});

app.get('/api/private/notes', (req, res) => {
  try {
    res.json(readJson(privateNotesFile, []));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đọc ghi chú riêng tư' });
  }
});

app.post('/api/private/notes', (req, res) => {
  const { title, content, error } = validateNote(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const notes = readJson(privateNotesFile, []);
    const now = new Date().toISOString();
    const newNote = { id: Date.now().toString(), title, content, createdAt: now, updatedAt: now };
    notes.push(newNote);
    writeJson(privateNotesFile, notes);
    res.json({ success: true, note: newNote });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thêm ghi chú kín' });
  }
});

app.put('/api/private/notes/:id', (req, res) => {
  const { title, content, error } = validateNote(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const notes = readJson(privateNotesFile, []);
    const index = notes.findIndex((n) => n.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });

    notes[index].title = title;
    notes[index].content = content;
    notes[index].updatedAt = new Date().toISOString();
    writeJson(privateNotesFile, notes);
    res.json({ success: true, message: 'Đã sửa thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật ghi chú kín' });
  }
});

app.delete('/api/private/notes/:id', (req, res) => {
  try {
    const notes = readJson(privateNotesFile, []);
    const newNotes = notes.filter((n) => n.id !== req.params.id);
    if (newNotes.length === notes.length) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    writeJson(privateNotesFile, newNotes);
    res.json({ success: true, message: 'Đã xóa thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa ghi chú kín' });
  }
});

/* ============================================================================
   MODULE 4: XỬ LÝ LỖI CHUNG & KHỞI ĐỘNG SERVER
   ============================================================================ */
// Mở http://localhost:5000 trên trình duyệt -> báo Backend đang chạy
app.get('/', (req, res) => {
  res.type('text/plain; charset=utf-8').send('Backend đang chạy. Mở giao diện tại http://localhost:5173');
});

// Gọi sai đường dẫn API -> trả JSON thay vì trang HTML lỗi
app.use('/api', (req, res) => res.status(404).json({ message: 'Không tìm thấy API' }));

// FE gửi JSON sai cú pháp
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Dữ liệu JSON không hợp lệ' });
  res.status(500).json({ message: 'Lỗi máy chủ' });
});

initData();
if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend chạy tại http://localhost:${PORT}`));
}

module.exports = app; // để file test (npm test) dùng lại
