import { useEffect, useState } from 'react';
import { useApp, callApi } from './AppContext';

const EMPTY = { id: null, title: '', content: '' };

// url: '/api/notes/hoc-tap' hoặc '/api/private/notes'
// onChanged: báo cho trang cha biết đã thêm/xóa (để cập nhật số ghi chú)
export default function NoteBoard({ url, accent, saveLabel = 'Thêm mới', onChanged }) {
  const { showToast, primaryColor } = useApp();
  const color = accent || primaryColor;
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchNotes = () => {
    setLoading(true);
    callApi(url)
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch((err) => {
        setNotes([]);
        showToast(err.message, 'error');
      })
      .finally(() => setLoading(false));
  };

  // Gọi lại mỗi khi đổi url (đổi chủ đề)
  useEffect(() => {
    fetchNotes();
    setForm(EMPTY);
  }, [url]);

  const handleSave = () => {
    if (!form.title.trim()) {
      showToast('Vui lòng nhập tiêu đề', 'error');
      return;
    }
    const isEdit = Boolean(form.id);
    setSaving(true);
    callApi(isEdit ? url + '/' + form.id : url, isEdit ? 'PUT' : 'POST', {
      title: form.title,
      content: form.content,
    })
      .then(() => {
        showToast(isEdit ? 'Đã cập nhật ghi chú' : 'Đã thêm ghi chú');
        setForm(EMPTY);   // xóa trắng form
        fetchNotes();     // làm mới danh sách
        if (onChanged) onChanged();
      })
      .catch((err) => showToast(err.message, 'error')) // lỗi thì giữ nguyên form
      .finally(() => setSaving(false));
  };

  const handleDelete = (note) => {
    if (!window.confirm('Bạn có chắc muốn xóa ghi chú "' + note.title + '"?')) return;
    callApi(url + '/' + note.id, 'DELETE')
      .then(() => {
        showToast('Đã xóa ghi chú');
        if (form.id === note.id) setForm(EMPTY);
        fetchNotes();
        if (onChanged) onChanged();
      })
      .catch((err) => showToast(err.message, 'error'));
  };

  const handleEdit = (note) => {
    setForm({ id: note.id, title: note.title, content: note.content });
    window.scrollTo(0, 0); // cuộn lên form để sửa
  };

  // Sắp xếp: ghi chú mới sửa nằm trên
  const sortedNotes = [...notes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <div>
      {/* Form thêm / sửa */}
      <div style={{ border: '1px solid ' + color, borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>{form.id ? 'Sửa ghi chú' : 'Thêm ghi chú mới'}</h3>
        <input
          placeholder="Tiêu đề" value={form.title} maxLength={200}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={{ display: 'block', width: '100%', marginBottom: '10px' }}
        />
        <textarea
          placeholder="Nội dung" value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          style={{ display: 'block', width: '100%', height: '90px', marginBottom: '10px' }}
        />
        <button onClick={handleSave} disabled={saving}
                style={{ background: color, color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 14px' }}>
          {saving ? 'Đang lưu...' : form.id ? 'Cập nhật' : saveLabel}
        </button>
        {form.id && (
          <button onClick={() => setForm(EMPTY)} style={{ marginLeft: '10px', padding: '8px 14px' }}>Hủy</button>
        )}
      </div>

      {/* Danh sách thẻ */}
      {loading && <div className="loading-row"><span className="spinner"></span> Đang tải ghi chú...</div>}
      {!loading && notes.length === 0 && <p>Chưa có ghi chú nào.</p>}
      <div className="note-grid">
        {sortedNotes.map((note) => (
          <div key={note.id} className="note-card"
               style={{ border: '1px solid ' + color, padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>{note.title}</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
            <small>
              Tạo: {new Date(note.createdAt).toLocaleString('vi-VN')}<br />
              Cập nhật: {new Date(note.updatedAt).toLocaleString('vi-VN')}
            </small>
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => handleEdit(note)} style={{ marginRight: '10px' }}>✏️ Sửa</button>
              <button onClick={() => handleDelete(note)} className="btn-danger">🗑️ Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
