export default function TaskTableRow({ task, view, section, onToggle, onSelect }) {
  const due = task.due_date ? new Date(task.due_date) : null;
  const reminder = task.reminder ? new Date(task.reminder) : null;
  const isOverdue = due && !task.completed && due < new Date() && due.toDateString() !== new Date().toDateString();
  const isToday = due && due.toDateString() === new Date().toDateString();

  const formatDate = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  const formatDateTime = (d) => d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const raw = task.updated_at;
  const completedAt = raw ? new Date(/Z$/i.test(raw) ? raw : raw.replace(' ', 'T') + 'Z') : null;
  const isCompletedLayout = view === 'completed' || (view === 'category' && section === 'completed');
  const showCategoryColumn = view !== 'category';
  const showCheckbox = !isCompletedLayout;

  return (
    <tr className={`task-table-row ${!isCompletedLayout && task.completed ? 'completed' : ''}`}>
      {showCheckbox && (
        <td className="task-table-cell task-table-check">
          <button
            type="button"
            className="task-item-checkbox"
            onClick={() => onToggle(task.id, !task.completed)}
            aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {task.completed ? '✓' : ''}
          </button>
        </td>
      )}
      <td className="task-table-cell task-table-title">
        <button type="button" className="task-table-title-btn" onClick={() => onSelect(task.id)}>
          {task.title}
        </button>
      </td>
      {showCategoryColumn && (
        <td className="task-table-cell task-table-list">{task.category_name || '—'}</td>
      )}
      {isCompletedLayout ? (
        <>
          <td className="task-table-cell task-table-completed">
            {completedAt ? formatDateTime(completedAt) : '—'}
          </td>
          <td className="task-table-cell task-table-notes" title={task.notes || undefined}>
            {task.notes ? task.notes : '—'}
          </td>
        </>
      ) : (
        <>
          <td className={`task-table-cell task-table-due ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''}`}>
            {due ? (isToday ? 'Today' : formatDate(due)) : '—'}
          </td>
          <td className="task-table-cell task-table-reminder">
            {reminder ? formatDateTime(reminder) : '—'}
          </td>
          <td className="task-table-cell task-table-important">
            {task.important ? '★' : '—'}
          </td>
        </>
      )}
    </tr>
  );
}
