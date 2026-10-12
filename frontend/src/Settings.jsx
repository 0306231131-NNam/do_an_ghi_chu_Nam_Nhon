import { useEffect, useState } from 'react';
import { useApp, callApi } from './AppContext';

// Các màu cho người dùng chọn nhanh
const COLORS = ['#007bff', '#0e7c86', '#2e7d32', '#ff5722', '#8e24aa', '#d81b60'];

export default function Settings() {
  const {
    showToast, displayName, setDisplayName, theme, setTheme,
    primaryColor, setPrimaryColor, hasPassword, setHasPassword,
  } = useApp();
  const [form, setForm] = useState({ displayName: '', theme: 'light', primaryColor: '#007bff' });
  const [pw, setPw] = useState({ oldPassword: '', password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  // Đổ dữ liệu từ Context vào form
  useEffect(() => {
    setForm({ displayName: displayName, theme: theme, primaryColor: primaryColor });
  }, [displayName, theme, primaryColor]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePwChange = (e) => setPw({ ...pw, [e.target.name]: e.target.value });

  // Lưu tên, theme, màu chủ đạo
  const handleSave = () => {
    if (!form.displayName.trim()) {
      showToast('Tên hiển thị không được để trống', 'error');
      return;
    }
    setSaving(true);
    callApi('/api/profile', 'PUT', form)
      .then(() => {
        // cập nhật Context => giao diện đổi ngay, không cần F5
        setDisplayName(form.displayName.trim());
        setTheme(form.theme);
        setPrimaryColor(form.primaryColor);
        showToast('Lưu thành công!');
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setSaving(false));
  };

  // Tạo mới hoặc đổi mật khẩu vùng kín
  const handleSavePassword = () => {
    if (hasPassword && !pw.oldPassword) {
      showToast('Vui lòng nhập mật khẩu cũ', 'error');
      return;
    }
    if (pw.password.length < 4) {
      showToast('Mật khẩu mới phải có ít nhất 4 ký tự', 'error');
      return;
    }
    if (pw.password !== pw.confirm) {
      showToast('Mật khẩu nhập lại không khớp', 'error');
      return;
    }
    callApi('/api/profile', 'PUT', { password: pw.password, oldPassword: pw.oldPassword })
      .then(() => {
        showToast(hasPassword ? 'Đã đổi mật khẩu vùng kín' : 'Đã tạo mật khẩu vùng kín');
        setHasPassword(true);
        setPw({ oldPassword: '', password: '', confirm: '' });
      })
      .catch((err) => showToast(err.message, 'error')); // vd: "Mật khẩu cũ không đúng"
  };

  return (
    <div>
      <h2>Cài đặt hệ thống</h2>

      <div className="panel">
        <h3>Hồ sơ và giao diện</h3>
        <div className="form-row">
          <label>Tên hiển thị:</label>
          <input name="displayName" value={form.displayName} maxLength={50} onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>Giao diện:</label>
          <select name="theme" value={form.theme} onChange={handleChange}>
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
        </div>
        <div className="form-row">
          <label>Màu chủ đạo:</label>
          <span className="swatches">
            {COLORS.map((c) => (
              <button key={c} title={c}
                      className={form.primaryColor === c ? 'swatch active' : 'swatch'}
                      style={{ background: c }}
                      onClick={() => setForm({ ...form, primaryColor: c })}></button>
            ))}
            {/* hoặc tự chọn màu khác */}
            <input type="color" name="primaryColor" value={form.primaryColor} onChange={handleChange}
                   style={{ width: '40px', height: '30px', padding: '2px' }} />
          </span>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}
                style={{ marginTop: '20px', padding: '8px 16px' }}>
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="panel">
        <h3>Mật khẩu vùng kín</h3>
        <p style={{ marginTop: 0 }}>
          {hasPassword ? 'Đổi mật khẩu dùng để mở Vùng kín.' : 'Chưa có mật khẩu. Hãy tạo mật khẩu để dùng Vùng kín.'}
        </p>
        {hasPassword && (
          <div className="form-row">
            <label>Mật khẩu cũ:</label>
            <input type="password" name="oldPassword" value={pw.oldPassword} onChange={handlePwChange} />
          </div>
        )}
        <div className="form-row">
          <label>Mật khẩu mới:</label>
          <input type="password" name="password" value={pw.password} onChange={handlePwChange} placeholder="Ít nhất 4 ký tự" />
        </div>
        <div className="form-row">
          <label>Nhập lại mật khẩu:</label>
          <input type="password" name="confirm" value={pw.confirm} onChange={handlePwChange} />
        </div>
        <button className="btn-primary" onClick={handleSavePassword} style={{ marginTop: '20px', padding: '8px 16px' }}>
          {hasPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu'}
        </button>
      </div>
    </div>
  );
}
