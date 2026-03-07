import { useState, useEffect, useRef } from 'react';
import { apiJson } from '../api/client.js';

const AUTO_SAVE_DELAY_MS = 600;

export default function TaskDetail({ taskId, onClose, onUpdate, onDelete }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminder, setReminder] = useState('');
  const [important, setImportant] = useState(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setPanelOpen(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    initialLoadDone.current = false;
    (async () => {
      setLoading(true);
      try {
        const t = await apiJson(`/api/tasks/${taskId}`);
        if (!cancelled) {
          setTask(t);
          setTitle(t.title);
          setNotes(t.notes || '');
          setDueDate(t.due_date ? t.due_date.slice(0, 10) : '');
          setReminder(t.reminder ? t.reminder.slice(0, 16) : '');
          setImportant(!!t.important);
          initialLoadDone.current = true;
        }
      } catch (err) {
        if (!cancelled) setTask(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [taskId]);

  useEffect(() => {
    if (!task || !initialLoadDone.current) return;
    const hasChanges =
      (title.trim() || task.title) !== (task.title || '') ||
      (notes.trim() || '') !== (task.notes || '') ||
      (dueDate || '') !== (task.due_date ? task.due_date.slice(0, 10) : '') ||
      (reminder || '') !== (task.reminder ? task.reminder.slice(0, 16) : '') ||
      important !== !!task.important;
    if (!hasChanges) return;
    const timeoutId = setTimeout(() => {
      const updates = {
        title: title.trim() || task.title,
        notes: notes.trim() || null,
        due_date: dueDate || null,
        reminder: reminder || null,
        important,
      };
      const p = onUpdate(taskId, updates);
      if (p && typeof p.then === 'function') p.catch((err) => console.error(err));
    }, AUTO_SAVE_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [task, taskId, title, notes, dueDate, reminder, important, onUpdate]);

  function handleDelete() {
    if (confirm('Delete this task?')) {
      onDelete(taskId);
      onClose();
    }
  }

  if (loading) return (
    <div className="task-detail-overlay" onClick={onClose}>
      <div className={`task-detail-panel ${panelOpen ? 'is-open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="task-detail task-detail-loading">Loading…</div>
      </div>
    </div>
  );
  if (!task) return (
    <div className="task-detail-overlay" onClick={onClose}>
      <div className={`task-detail-panel ${panelOpen ? 'is-open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="task-detail">Task not found.</div>
      </div>
    </div>
  );

  return (
    <div className="task-detail-overlay" onClick={onClose}>
      <div className={`task-detail-panel ${panelOpen ? 'is-open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="task-detail">
        <div className="task-detail-header">
          <h2>Task details</h2>
          <button type="button" className="task-detail-close" onClick={onClose}>×</button>
        </div>
        <div className="task-detail-body">
          <label className="task-detail-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="task-detail-input"
            placeholder="Task title"
          />
          <label className="task-detail-label">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="task-detail-input"
          />
          <label className="task-detail-label">Remind me</label>
          <input
            type="datetime-local"
            value={reminder}
            onChange={e => setReminder(e.target.value)}
            className="task-detail-input"
          />
          <label className="task-detail-row task-detail-check">
            <input
              type="checkbox"
              checked={important}
              onChange={e => setImportant(e.target.checked)}
            />
            <span>Important</span>
          </label>
          <label className="task-detail-label">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="task-detail-textarea"
            placeholder="Add notes…"
            rows={4}
          />
        </div>
        <div className="task-detail-footer">
          <div className="task-detail-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="button" className="task-detail-delete" onClick={handleDelete}>Delete</button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
