import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, callApi } from './AppContext';

export default function Search() {
  const { showToast, primaryColor } = useApp();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Gõ xong 0.3 giây mới tìm, tránh gọi API liên tục mỗi lần bấm phím
  useEffect(() => {
    if (keyword.trim() === '') {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      callApi('/api/search?q=' + encodeURIComponent(keyword.trim()))
        .then((data) => {
          setResults(data);
          setSearched(true);
        })
        .catch((err) => showToast(err.message, 'error'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div>
      <h2>Tìm kiếm ghi chú</h2>
      <input
        placeholder="Nhập từ khóa trong tiêu đề hoặc nội dung..." value={keyword} autoFocus
        onChange={(e) => setKeyword(e.target.value)}
        style={{ width: '100%', maxWidth: '560px', padding: '10px', marginBottom: '16px' }}
      />
      <p style={{ marginTop: 0 }}>Không phân biệt hoa/thường và có dấu/không dấu. Không tìm trong Vùng kín.</p>

      {loading && <div className="loading-row"><span className="spinner"></span> Đang tìm...</div>}
      {!loading && searched && results.length === 0 && <p>Không tìm thấy ghi chú nào.</p>}
      {!loading && results.length > 0 && <p>Tìm thấy {results.length} ghi chú:</p>}

      <div className="note-grid">
        {results.map((note) => (
          <div key={note.topicId + '-' + note.id} className="note-card"
               style={{ border: '1px solid ' + primaryColor, padding: '15px', borderRadius: '8px' }}>
            <span className="badge">{note.topicName}</span>
            <h4 style={{ margin: '10px 0' }}>{note.title}</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
            <button onClick={() => navigate('/notes', { state: { topic: note.topicId } })}>Mở chủ đề →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
