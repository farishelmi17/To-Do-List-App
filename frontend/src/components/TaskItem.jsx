export default function TaskItem({ task, onToggle, onSelect, showListTitle }) {
  const due = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = due && !task.completed && due < new Date() && due.toDateString() !== new Date().toDateString();
  const isToday = due && due.toDateString() === new Date().toDateString();

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>
      <button
        type="button"
        className="task-item-checkbox"
        onClick={() => onToggle(task.id, !task.completed)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed ? '✓' : ''}
      </button>
      <button type="button" className="task-item-body" onClick={onSelect}>
        <span className="task-item-title">{task.title}</span>
        {(showListTitle && (task.category_name || task.list_title)) || due || task.important ? (
          <span className="task-item-meta">
            {showListTitle && (task.category_name || task.list_title) && <span className="task-item-list">{task.category_name || task.list_title}</span>}
            {task.important && <span className="task-item-important">★</span>}
            {due && (
              <span className={`task-item-due ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''}`}>
                {isToday ? 'Today' : due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: due.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
              </span>
            )}
          </span>
        ) : null}
      </button>
    </li>
  );
}
