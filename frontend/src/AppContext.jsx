import { createContext, useContext, useEffect, useState } from 'react';
import Toast from './Toast';

const API = 'http://localhost:5000';
const AppContext = createContext();
export const useApp = () => useContext(AppContext);

// Hàm gọi API dùng chung cho cả app
// Nếu backend báo lỗi thì ném ra lỗi kèm message của backend để hiện Toast
export async function callApi(url, method = 'GET', body = null) {
  let res;
  try {
    res = await fetch(API + url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Không kết nối được server');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra');
  }
  return data;
}

export function AppProvider({ children }) {
  const [displayName, setDisplayName] = useState('Sinh viên');
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#007bff');
  const [hasPassword, setHasPassword] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Hiện thông báo góc màn hình, 3 giây tự tắt
  // type = 'success' (xanh) hoặc 'error' (đỏ)
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 3000);
  };

  // Lấy profile khi mở app
  useEffect(() => {
    callApi('/api/profile')
      .then((data) => {
        setDisplayName(data.displayName);
        setTheme(data.theme);
        setPrimaryColor(data.primaryColor);
        setHasPassword(data.hasPassword);
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setProfileLoaded(true));
  }, []);

  return (
    <AppContext.Provider
      value={{
        API, showToast, profileLoaded,
        displayName, setDisplayName,
        theme, setTheme,
        primaryColor, setPrimaryColor,
        hasPassword, setHasPassword,
      }}
    >
      {children}
      <Toast toasts={toasts} />
    </AppContext.Provider>
  );
}
