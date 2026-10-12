import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp, callApi } from './AppContext';
import NoteBoard from './NoteBoard';

export default function Notes() {
  const { showToast } = useApp();
  const location = useLocation();
  const [topics, setTopics] = useState([]);
  // Nếu đi từ trang Tìm kiếm / Trang chủ sang thì mở đúng chủ đề đó
  const [topic, setTopic] = useState(location.state && location.state.topic ? location.state.topic : 'hoc-tap');
  const [newName, setNewName] = useState('');

  // Lấy danh sách chủ đề (có số ghi chú) từ backend
  const loadTopics = () => {
    return callApi('/api/topics')
      .then((list) => {
        setTopics(list);
        // chủ đề đang chọn bị xóa thì chuyển về chủ đề đầu tiên
        setTopic((cur) => (list.find((t) => t.id === cur) ? cur : list[0].id));
      })
      .catch((err) => showToast(err.message, 'error'));
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const current = topics.find((t) => t.id === topic);

  const handleAddTopic = () => {
    if (!newName.trim()) {
      showToast('Vui lòng nhập tên chủ đề', 'error');
      return;
    }
    callApi('/api/topics', 'POST', { name: newName })
      .then((data) => {
        showToast('Đã tạo chủ đề "' + data.topic.name + '"');
        setNewName('');
        loadTopics().then(() => setTopic(data.topic.id));
      })
      .catch((err) => showToast(err.message, 'error'));
  };

  const handleRenameTopic = () => {
    const name = window.prompt('Tên mới cho chủ đề:', current.name);
    if (name === null) return; // bấm Hủy
    callApi('/api/topics/' + topic, 'PUT', { name: name })
      .then(() => {
        showToast('Đã đổi tên chủ đề');
        loadTopics();
      })
      .catch((err) => showToast(err.message, 'error'));
  };

  const handleDeleteTopic = () => {
    if (!window.confirm('Xóa chủ đề "' + current.name + '" và toàn bộ ghi chú bên trong?')) return;
    callApi('/api/topics/' + topic, 'DELETE')
      .then(() => {
        showToast('Đã xóa chủ đề');
        loadTopics();
      })
      .catch((err) => showToast(err.message, 'error'));
  };

  return (
    <div>
      <h2>Ghi chú công khai</h2>

      {/* Các nút chọn chủ đề */}
      <div className="topic-tabs">
        {topics.map((t) => (
          <button key={t.id} onClick={() => setTopic(t.id)}
                  className={topic === t.id ? 'btn-primary' : ''}
                  style={{ border: 'none', borderRadius: '4px', padding: '8px 14px' }}>
            {t.name} ({t.noteCount})
          </button>
        ))}
      </div>

      {/* Thêm / đổi tên / xóa chủ đề */}
      <div className="topic-tools">
        <input placeholder="Tên chủ đề mới" value={newName} maxLength={40}
               onChange={(e) => setNewName(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') handleAddTopic(); }} />
        <button onClick={handleAddTopic}>+ Thêm chủ đề</button>
        {current && <button onClick={handleRenameTopic}>✏️ Đổi tên chủ đề</button>}
        {current && <button onClick={handleDeleteTopic} className="btn-danger">🗑️ Xóa chủ đề</button>}
      </div>

      <NoteBoard url={'/api/notes/' + topic} onChanged={loadTopics} />
    </div>
  );
}
