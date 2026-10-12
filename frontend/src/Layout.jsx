import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from './AppContext';

export default function Layout() {
  const { displayName, theme, primaryColor } = useApp();
  const [menuOpen, setMenuOpen] = useState(false); // dùng cho điện thoại
  const dark = theme === 'dark';

  const colors = {
    bg: dark ? '#222' : '#fff',
    text: dark ? '#f1f1f1' : '#222',
    sidebar: dark ? '#111' : '#f0f2f5',
  };

  // Truyền màu xuống CSS (index.css dùng var(--primary), var(--bg)...)
  const cssVars = {
    '--primary': primaryColor,
    '--bg': colors.bg,
    '--text': colors.text,
    '--sidebar': colors.sidebar,
    '--input-bg': dark ? '#2d2d2d' : '#fff',
    '--btn-bg': dark ? '#3a3a3a' : '#e4e6eb',
    '--border': dark ? '#555' : '#ccc',
  };

  const linkStyle = ({ isActive }) => ({
    display: 'block',
    padding: '10px 12px',
    marginBottom: '6px',
    borderRadius: '6px',
    textDecoration: 'none',
    color: isActive ? '#fff' : colors.text,
    background: isActive ? primaryColor : 'transparent',
  });

  return (
    <div className="app" style={cssVars}>
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-top">
          <h3>👤 {displayName}</h3>
          {/* Nút ☰ chỉ hiện trên điện thoại */}
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
        <nav style={{ marginTop: '20px' }} onClick={() => setMenuOpen(false)}>
          <NavLink to="/" style={linkStyle} end>Trang chủ</NavLink>
          <NavLink to="/notes" style={linkStyle}>Ghi chú</NavLink>
          <NavLink to="/search" style={linkStyle}>Tìm kiếm</NavLink>
          <NavLink to="/private" style={linkStyle}>Vùng kín</NavLink>
          <NavLink to="/settings" style={linkStyle}>Cài đặt</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
