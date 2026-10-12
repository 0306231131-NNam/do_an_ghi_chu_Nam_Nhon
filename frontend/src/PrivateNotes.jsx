import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, callApi } from './AppContext';
import NoteBoard from './NoteBoard';

export default function PrivateNotes() {
  const { showToast, hasPassword, setHasPassword, profileLoaded } = useApp();
  const navigate = useNavigate();
  // Chỉ nằm trong state => F5 hoặc rời trang là tự khóa lại
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [busy, setBusy] = useState(false);

  // Đã có mật khẩu: gửi lên backend kiểm tra
  const handleUnlock = () => {
    if (!passwordInput) {
      showToast('Vui lòng nhập mật khẩu', 'error');
      return;
    }
    setBusy(true);
    callApi('/api/private/auth', 'POST', { password: passwordInput })
      .then(() => {
        setIsUnlocked(true);
        showToast('Đã mở khóa vùng kín');
      })
      .catch((err) => showToast(err.message, 'error')) // "Sai mật khẩu!"
      .finally(() => {
        setPasswordInput('');
        setBusy(false);
      });
  };

  // Lần đầu chưa có mật khẩu: tạo mật khẩu mới
  const handleSetup = () => {
    if (passwordInput.length < 4) {
      showToast('Mật khẩu phải có ít nhất 4 ký tự', 'error');
      return;
    }
    if (passwordInput !== confirmInput) {
      showToast('Mật khẩu nhập lại không khớp', 'error');
      return;
    }
    setBusy(true);
    callApi('/api/profile', 'PUT', { password: passwordInput })
      .then(() => {
        setHasPassword(true);
        setIsUnlocked(true);
        showToast('Đã tạo mật khẩu vùng kín');
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => {
        setPasswordInput('');
        setConfirmInput('');
        setBusy(false);
      });
  };

  // ---- Chưa mở khóa: hiện Popup nhập mật khẩu ----
  if (!isUnlocked) {
    return (
      <div style={{ padding: '50px 0', textAlign: 'center' }}>
        <h2>🔒 Khu vực bảo mật</h2>
        <p>Nội dung vùng kín đang bị khóa.</p>

        {!profileLoaded && <div className="loading-row" style={{ justifyContent: 'center' }}><span className="spinner"></span> Đang tải...</div>}

        {profileLoaded && (
          <div className="modal-backdrop">
            <div className="modal">
              {hasPassword ? (
                <div>
                  <h3>🔒 Nhập mật khẩu</h3>
                  <p>Vui lòng nhập mật khẩu để truy cập</p>
                  <input type="password" value={passwordInput} autoFocus placeholder="Nhập mật khẩu..."
                         onChange={(e) => setPasswordInput(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }} />
                </div>
              ) : (
                <div>
                  <h3>🔐 Tạo mật khẩu vùng kín</h3>
                  <p>Lần đầu sử dụng, hãy đặt mật khẩu bảo vệ (ít nhất 4 ký tự)</p>
                  <input type="password" value={passwordInput} autoFocus placeholder="Mật khẩu mới"
                         onChange={(e) => setPasswordInput(e.target.value)} />
                  <input type="password" value={confirmInput} placeholder="Nhập lại mật khẩu"
                         onChange={(e) => setConfirmInput(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') handleSetup(); }} />
                </div>
              )}
              <div className="actions">
                <button className="btn-primary" disabled={busy} style={{ padding: '8px 16px' }}
                        onClick={hasPassword ? handleUnlock : handleSetup}>
                  {busy ? 'Đang kiểm tra...' : hasPassword ? 'Mở khóa' : 'Lưu mật khẩu'}
                </button>
                <button onClick={() => navigate('/')} style={{ padding: '8px 16px' }}>Hủy</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Đã mở khóa: dùng lại NoteBoard ----
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ color: '#d32f2f' }}>🔓 Khu vực ghi chú riêng tư</h2>
        <button onClick={() => setIsUnlocked(false)} style={{ padding: '8px 14px' }}>🔒 Khóa lại</button>
      </div>
      <NoteBoard url="/api/private/notes" accent="#d32f2f" saveLabel="Lưu bí mật" />
    </div>
  );
}
