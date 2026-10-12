// Khung thông báo (Toast) ở góc dưới bên phải
export default function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={'toast toast-' + t.type}>
          {t.type === 'error' ? '⚠️ ' : '✅ '}
          {t.message}
        </div>
      ))}
    </div>
  );
}
