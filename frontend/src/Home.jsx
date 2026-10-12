import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, callApi } from './AppContext';

export default function Home() {
  const { displayName, primaryColor } = useApp();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);

  // Lấy danh sách chủ đề để hiện ở trang chủ
  useEffect(() => {
    callApi('/api/topics')
      .then((data) => setTopics(data))
      .catch(() => setTopics([]));
  }, []);

  return (
    <div>
      <h2>Xin chào, {displayName}!</h2>
      <p>Chọn mục ở thanh bên để quản lý ghi chú của bạn.</p>

      {topics.length > 0 && <h3>Chủ đề của bạn</h3>}
      <div className="note-grid">
        {topics.map((t) => (
          <button key={t.id}
                  onClick={() => navigate('/notes', { state: { topic: t.id } })}
                  style={{ textAlign: 'left', padding: '16px', borderRadius: '8px', borderLeft: '4px solid ' + primaryColor }}>
            <strong style={{ fontSize: '16px' }}>{t.name}</strong>
            <div style={{ marginTop: '6px' }}>{t.noteCount} ghi chú</div>
          </button>
        ))}
      </div>
    </div>
  );
}
