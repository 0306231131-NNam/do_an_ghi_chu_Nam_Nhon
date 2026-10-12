/**
 * Kiểm thử nhanh toàn bộ API (chạy: npm test)
 * Dùng một thư mục data tạm -> KHÔNG ảnh hưởng dữ liệu thật trong backend/data.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-test-'));
process.env.DATA_DIR = tmpDir;
const app = require('../server');

let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    console.error(`  ✘ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

async function main() {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const call = async (method, url, body) => {
    const res = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  };
  const readFile = (f) => JSON.parse(fs.readFileSync(path.join(tmpDir, f), 'utf8'));

  console.log('Sprint 4 – Khởi tạo dữ liệu');
  await step('Tự tạo profile.json, topics.json, private.json, notes/ và ghi chú mẫu', () => {
    for (const f of ['profile.json', 'topics.json', 'private.json', 'notes/hoc-tap.json']) {
      assert.ok(fs.existsSync(path.join(tmpDir, f)), `thiếu ${f}`);
    }
  });

  console.log('Sprint 1 – Profile');
  await step('GET /api/profile không trả về mật khẩu', async () => {
    const { data } = await call('GET', '/profile');
    assert.deepStrictEqual(data, { displayName: 'Sinh viên', theme: 'light', primaryColor: '#007bff', hasPassword: false });
  });
  await step('PUT /api/profile đổi tên + theme + đặt mật khẩu', async () => {
    const { data } = await call('PUT', '/profile', { displayName: 'Nam', theme: 'dark', primaryColor: '#FF5722', password: '1234' });
    assert.strictEqual(data.success, true);
    const file = readFile('profile.json');
    assert.strictEqual(file.theme, 'dark');
    assert.strictEqual(file.primaryColor, '#ff5722');
    assert.strictEqual((await call('GET', '/profile')).data.hasPassword, true);
    assert.ok(file.password.startsWith('$2'), 'mật khẩu phải được băm bcrypt');
    assert.ok(!JSON.stringify(file).includes('1234'), 'không được lưu mật khẩu gốc');
  });
  await step('PUT với password rỗng giữ nguyên mật khẩu cũ', async () => {
    const before = readFile('profile.json').password;
    await call('PUT', '/profile', { displayName: 'Nam', theme: 'light', password: '' });
    assert.strictEqual(readFile('profile.json').password, before);
  });
  await step('PUT chặn tên rỗng / theme sai / mật khẩu < 4 ký tự', async () => {
    assert.strictEqual((await call('PUT', '/profile', { displayName: '   ' })).status, 400);
    assert.strictEqual((await call('PUT', '/profile', { theme: 'blue' })).status, 400);
    assert.strictEqual((await call('PUT', '/profile', { password: '12' })).status, 400);
    assert.strictEqual((await call('PUT', '/profile', { primaryColor: 'red' })).status, 400);
  });

  console.log('Sprint 2 – Ghi chú thường');
  let id;
  await step('GET chủ đề chưa có file -> []', async () => {
    assert.deepStrictEqual((await call('GET', '/notes/cong-viec')).data, []);
  });
  await step('POST thêm 2 ghi chú vào Học tập', async () => {
    const r = await call('POST', '/notes/hoc-tap', { title: 'Ôn thi giữa kỳ', content: 'Chương 1-3' });
    assert.strictEqual(r.data.success, true);
    id = r.data.note.id;
    await new Promise((ok) => setTimeout(ok, 5));
    await call('POST', '/notes/hoc-tap', { title: 'Nộp bài tập', content: '' });
    assert.strictEqual((await call('GET', '/notes/hoc-tap')).data.length, 3); // + 1 ghi chú mẫu
  });
  await step('Chủ đề Công việc vẫn trống (dữ liệu tách theo chủ đề)', async () => {
    assert.strictEqual((await call('GET', '/notes/cong-viec')).data.length, 0);
  });
  await step('POST tiêu đề toàn dấu cách -> 400 "Vui lòng nhập tiêu đề"', async () => {
    const r = await call('POST', '/notes/hoc-tap', { title: '    ', content: 'x' });
    assert.strictEqual(r.status, 400);
    assert.strictEqual(r.data.message, 'Vui lòng nhập tiêu đề');
  });
  await step('PUT sửa ghi chú, updatedAt thay đổi', async () => {
    await new Promise((ok) => setTimeout(ok, 5));
    await call('PUT', `/notes/hoc-tap/${id}`, { title: 'Ôn thi cuối kỳ', content: 'Chương 1-6' });
    const note = (await call('GET', '/notes/hoc-tap')).data.find((n) => n.id === id);
    assert.strictEqual(note.title, 'Ôn thi cuối kỳ');
    assert.ok(note.updatedAt > note.createdAt);
  });
  await step('DELETE xóa ghi chú; xóa lại -> 404', async () => {
    assert.strictEqual((await call('DELETE', `/notes/hoc-tap/${id}`)).status, 200);
    assert.strictEqual((await call('DELETE', `/notes/hoc-tap/${id}`)).status, 404);
  });
  await step('Chặn tên chủ đề nguy hiểm (../../profile)', async () => {
    assert.strictEqual((await call('GET', '/notes/..%2F..%2Fprofile')).status, 400);
  });

  console.log('Chủ đề & Tìm kiếm');
  await step('GET /api/topics: 3 chủ đề mặc định kèm số ghi chú', async () => {
    const { data } = await call('GET', '/topics');
    assert.deepStrictEqual(data.map((t) => t.id), ['hoc-tap', 'cong-viec', 'ca-nhan']);
    assert.strictEqual(data[0].noteCount, 2);
  });
  await step('POST "Ý tưởng mới" -> id y-tuong-moi; trùng tên/rỗng -> 400', async () => {
    const r = await call('POST', '/topics', { name: 'Ý tưởng mới' });
    assert.strictEqual(r.data.topic.id, 'y-tuong-moi');
    assert.strictEqual((await call('POST', '/topics', { name: 'ý tưởng MỚI' })).status, 400);
    assert.strictEqual((await call('POST', '/topics', { name: '  ' })).status, 400);
  });
  await step('PUT đổi tên chủ đề, ghi chú bên trong còn nguyên', async () => {
    await call('POST', '/notes/y-tuong-moi', { title: 'App học từ vựng', content: 'Dùng React' });
    const r = await call('PUT', '/topics/y-tuong-moi', { name: 'Ý tưởng' });
    assert.strictEqual(r.data.topic.name, 'Ý tưởng');
    assert.strictEqual((await call('GET', '/notes/y-tuong-moi')).data.length, 1);
  });
  await step('Tìm không dấu "hoc tu vung" ra ghi chú + tên chủ đề', async () => {
    const { data } = await call('GET', '/search?q=hoc%20tu%20vung');
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].topicName, 'Ý tưởng');
    assert.deepStrictEqual((await call('GET', '/search?q=')).data, []);
  });
  await step('DELETE chủ đề xóa luôn file ghi chú', async () => {
    assert.strictEqual((await call('DELETE', '/topics/y-tuong-moi')).status, 200);
    assert.ok(!fs.existsSync(path.join(tmpDir, 'notes', 'y-tuong-moi.json')));
    assert.strictEqual((await call('DELETE', '/topics/y-tuong-moi')).status, 404);
  });

  console.log('Sprint 3 – Vùng kín');
  await step('Auth sai mật khẩu -> success: false', async () => {
    const r = await call('POST', '/private/auth', { password: 'abcde' });
    assert.strictEqual(r.status, 401);
    assert.strictEqual(r.data.success, false);
  });
  await step('Auth đúng mật khẩu -> success: true', async () => {
    assert.strictEqual((await call('POST', '/private/auth', { password: '1234' })).data.success, true);
  });
  await step('CRUD ghi chú riêng tư', async () => {
    const r = await call('POST', '/private/notes', { title: 'Tài khoản ngân hàng', content: 'Bí mật' });
    const pid = r.data.note.id;
    assert.strictEqual((await call('PUT', `/private/notes/${pid}`, { title: 'TK ngân hàng', content: 'Đã đổi' })).status, 200);
    assert.strictEqual((await call('GET', '/private/notes')).data[0].content, 'Đã đổi');
    assert.strictEqual((await call('DELETE', `/private/notes/${pid}`)).status, 200);
    assert.strictEqual((await call('GET', '/private/notes')).data.length, 0);
  });
  await step('Đổi mật khẩu: thiếu/sai mật khẩu cũ -> 401', async () => {
    assert.strictEqual((await call('PUT', '/profile', { password: '5678' })).status, 401);
    assert.strictEqual((await call('PUT', '/profile', { password: '5678', oldPassword: 'sai' })).status, 401);
  });
  await step('Đổi mật khẩu đúng mk cũ: mk cũ hết hiệu lực, mk mới dùng được', async () => {
    assert.strictEqual((await call('PUT', '/profile', { password: '5678', oldPassword: '1234' })).status, 200);
    assert.strictEqual((await call('POST', '/private/auth', { password: '1234' })).data.success, false);
    assert.strictEqual((await call('POST', '/private/auth', { password: '5678' })).data.success, true);
  });

  console.log('Khác');
  await step('JSON sai cú pháp -> 400; API không tồn tại -> 404', async () => {
    assert.strictEqual((await call('PUT', '/profile', '{sai json')).status, 400);
    assert.strictEqual((await call('GET', '/khong-co')).status, 404);
  });

  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`\n${passed} bước PASS${process.exitCode ? ' — CÓ BƯỚC FAIL' : ''}`);
}

main();
