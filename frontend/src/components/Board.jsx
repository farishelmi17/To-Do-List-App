import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api, apiJson } from '../api/client.js';
import TaskDetail from './TaskDetail.jsx';

export default function Board({ categoryCount = 0, onCategoriesChange }) {
  const [data, setData] = useState({ categories: [] });
  const [todayFocus, setTodayFocus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTaskCategoryIdToday, setNewTaskCategoryIdToday] = useState(null);
  const [newTaskTitleToday, setNewTaskTitleToday] = useState('');
  const [newTaskCategoryIdOpen, setNewTaskCategoryIdOpen] = useState(null);
  const [newTaskTitleOpen, setNewTaskTitleOpen] = useState('');
  const [addTaskToTodayFocus, setAddTaskToTodayFocus] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const editCategoryInputRef = useRef(null);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [boardRes, focusRes] = await Promise.all([
        apiJson('/api/board'),
        apiJson('/api/board/today-focus').catch(() => ({ tasks: [] })),
      ]);
      setData(boardRes);
      setTodayFocus(focusRes.tasks || []);
    } catch (err) {
      console.error(err);
      setLoadError(err.message || 'Could not load board');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard, categoryCount]);

  useEffect(() => {
    if (editingCategoryId != null && editCategoryInputRef.current) {
      editCategoryInputRef.current.focus();
      editCategoryInputRef.current.select();
    }
  }, [editingCategoryId]);

  const refresh = useCallback(() => {
    fetchBoard();
  }, [fetchBoard]);

  const focusTaskIds = useMemo(() => new Set((todayFocus || []).map((t) => t.id)), [todayFocus]);

  /** Show in Open Tasks if: not in today focus, and (incomplete OR completed today — clears after midnight like Today Focus) */
  function isShownInOpenTasks(task) {
    if (focusTaskIds.has(task.id)) return false;
    if (!task.completed) return true;
    if (!task.updated_at) return false;
    // Backend stores UTC; parse as UTC so local "today" comparison is correct
    const raw = task.updated_at;
    const updatedDate = /Z$/i.test(raw) ? new Date(raw) : new Date(raw.replace(' ', 'T') + 'Z');
    const today = new Date();
    return (
      updatedDate.getFullYear() === today.getFullYear() &&
      updatedDate.getMonth() === today.getMonth() &&
      updatedDate.getDate() === today.getDate()
    );
  }

  const handleAddToTodayFocus = useCallback(
    async (taskId) => {
      try {
        await apiJson('/api/board/today-focus', { method: 'POST', body: JSON.stringify({ task_id: taskId }) });
        refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [refresh]
  );

  const handleRemoveFromTodayFocus = useCallback(
    async (taskId) => {
      try {
        await api(`/api/board/today-focus/${taskId}`, { method: 'DELETE' });
        refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [refresh]
  );

  const handleAddTask = useCallback(
    async (categoryId, title, fromTodaySection) => {
      const t = title.trim();
      if (!t) return;
      try {
        const task = await apiJson(`/api/categories/${categoryId}/tasks`, {
          method: 'POST',
          body: JSON.stringify({ title: t }),
        });
        if (fromTodaySection) {
          setNewTaskTitleToday('');
          setNewTaskCategoryIdToday(null);
        } else {
          setNewTaskTitleOpen('');
          setNewTaskCategoryIdOpen(null);
        }
        if (fromTodaySection && task?.id) {
          await apiJson('/api/board/today-focus', {
            method: 'POST',
            body: JSON.stringify({ task_id: task.id }),
          });
        }
        refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [refresh]
  );

  const handleToggleTask = useCallback(
    async (taskId, completed) => {
      try {
        await apiJson(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed }),
        });
        refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [refresh]
  );

  const handleUpdateTask = useCallback(
    async (taskId, updates) => {
      try {
        await apiJson(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [refresh]
  );

  const handleDeleteTask = useCallback(
    async (taskId) => {
      try {
        await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
        setSelectedTaskId((id) => (id === taskId ? null : id));
        refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [refresh]
  );

  const handleAddCategory = useCallback(
    async (e) => {
      e.preventDefault();
      const name = newCategoryName.trim();
      if (!name) return;
      try {
        await apiJson('/api/categories', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
        setNewCategoryName('');
        setShowAddCategory(false);
        onCategoriesChange?.();
        refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [newCategoryName, onCategoriesChange, refresh]
  );

  const handleRenameCategory = useCallback(
    async (categoryId, name) => {
      const n = name.trim();
      if (!n) {
        setEditingCategoryId(null);
        return;
      }
      try {
        await apiJson(`/api/categories/${categoryId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: n }),
        });
        setEditingCategoryId(null);
        setEditCategoryName('');
        onCategoriesChange?.();
        refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [onCategoriesChange, refresh]
  );

  const handleDeleteCategory = useCallback(
    async (categoryId) => {
      if (!confirm('Delete this category and all its tasks?')) return;
      try {
        await api(`/api/categories/${categoryId}`, { method: 'DELETE' });
        setEditingCategoryId(null);
        onCategoriesChange?.();
        refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [onCategoriesChange, refresh]
  );

  function renderCategoryTitle(cat) {
    const isEditing = Number(editingCategoryId) === Number(cat.id);
    return (
      <div className="board-column-title-wrap">
        {isEditing ? (
          <input
            ref={editCategoryInputRef}
            type="text"
            className="board-column-title-input"
            value={editCategoryName}
            onChange={(e) => setEditCategoryName(e.target.value)}
            onBlur={() => handleRenameCategory(cat.id, editCategoryName)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleRenameCategory(cat.id, editCategoryName);
              }
              if (e.key === 'Escape') {
                setEditingCategoryId(null);
                setEditCategoryName('');
              }
            }}
          />
        ) : (
          <>
            <h3
              className="board-column-title"
              onDoubleClick={(e) => {
                e.preventDefault();
                setEditingCategoryId(cat.id);
                setEditCategoryName(cat.name || '');
              }}
              title="Double-click to rename"
            >
              {cat.name}
            </h3>
            <div className="board-column-title-actions">
              <button
                type="button"
                className="board-column-title-btn board-column-title-edit"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingCategoryId(cat.id);
                  setEditCategoryName(cat.name || '');
                }}
                title="Rename category"
              >
                ✎
              </button>
              <button
                type="button"
                className="board-column-title-btn board-column-title-delete"
                onClick={() => handleDeleteCategory(cat.id)}
                title="Delete category"
              >
                🗑
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (loading) return <div className="board-loading">Loading…</div>;

  if (loadError) {
    return (
      <div className="board board-empty board-error">
        <p>Could not load the board. Check that you're signed in and try again.</p>
      </div>
    );
  }

  const hasColumns = data.categories?.length > 0;

  const addCategoryControl = (
    <div className="board-add-category">
      {showAddCategory ? (
        <form className="board-add-category-form" onSubmit={handleAddCategory}>
          <input
            type="text"
            name="categoryName"
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            autoFocus
            aria-label="Category name"
          />
          <div className="board-add-category-actions">
            <button type="button" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}>
              Cancel
            </button>
            <button type="submit">Add</button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="board-add-category-trigger"
          onClick={() => setShowAddCategory(true)}
          title="Add category"
        >
          <span className="board-add-category-btn">+</span>
          <span className="board-add-category-label">Add category</span>
        </button>
      )}
    </div>
  );

  if (!hasColumns) {
    return (
      <div className="board board-empty">
        <p>Create a category (e.g. Client A, Client B) to get started.</p>
        <div className="board-empty-add">{addCategoryControl}</div>
      </div>
    );
  }

  const focusByCategory = (data.categories || []).map((cat) => ({
    ...cat,
    focusTasks: (todayFocus || []).filter((t) => Number(t.category_id) === Number(cat.id)),
  }));

  return (
    <div className="board">
      <section className="board-top">
        <div className="board-section-header">
          <h2 className="board-section-title">Today Focus</h2>
          {addCategoryControl}
        </div>
        <div className="board-columns">
          {focusByCategory.map((cat) => (
            <div key={cat.id} className="board-column">
              {renderCategoryTitle(cat)}
              <form
                className="board-add-task"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTask(cat.id, newTaskTitleToday, true);
                }}
              >
                <input
                  type="text"
                  placeholder="Add a task"
                  value={newTaskCategoryIdToday === cat.id ? newTaskTitleToday : ''}
                  onChange={(e) => setNewTaskTitleToday(e.target.value)}
                  onFocus={() => {
                    setNewTaskCategoryIdToday(cat.id);
                    setAddTaskToTodayFocus(true);
                  }}
                />
              </form>
              <ul className="board-task-list">
                {cat.focusTasks.length === 0 ? (
                  <li className="board-column-empty">No focus tasks</li>
                ) : (
                  cat.focusTasks.map((task) => (
                    <li key={task.id} className={`board-task board-task-row board-task-focus-row ${task.completed ? 'completed' : ''}`}>
                      <button
                        type="button"
                        className="board-task-check"
                        onClick={() => handleToggleTask(task.id, !task.completed)}
                      >
                        {task.completed ? '✓' : ''}
                      </button>
                      <button
                        type="button"
                        className="board-task-title"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        {task.title}
                      </button>
                      <button
                        type="button"
                        className="board-task-focus-btn board-task-remove-focus-btn"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFromTodayFocus(task.id); }}
                        title="Remove from Today Focus"
                      >
                        × Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
        {todayFocus.length === 0 && (
          <p className="board-today-focus-empty">No tasks in focus for today. Add open tasks below.</p>
        )}
      </section>

      <section className="board-bottom">
        <div className="board-section-header">
          <h2 className="board-section-title">Open Tasks</h2>
          {addCategoryControl}
        </div>
        <div className="board-columns">
          {data.categories?.map((cat) => (
            <div key={cat.id} className="board-column">
              {renderCategoryTitle(cat)}
              <form
                className="board-add-task"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTask(cat.id, newTaskTitleOpen, false);
                }}
              >
                <input
                  type="text"
                  placeholder="Add a task"
                  value={newTaskCategoryIdOpen === cat.id ? newTaskTitleOpen : ''}
                  onChange={(e) => setNewTaskTitleOpen(e.target.value)}
                  onFocus={() => {
                    setNewTaskCategoryIdOpen(cat.id);
                    setAddTaskToTodayFocus(false);
                  }}
                />
              </form>
              <ul className="board-task-list">
                {(cat.tasks || []).filter(isShownInOpenTasks).map((task) => (
                  <li key={task.id} className={`board-task board-task-row ${task.completed ? 'completed' : ''}`}>
                    <button
                      type="button"
                      className="board-task-check"
                      onClick={() => handleToggleTask(task.id, !task.completed)}
                    >
                      {task.completed ? '✓' : ' '}
                    </button>
                    <button
                      type="button"
                      className="board-task-title"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      {task.title}
                    </button>
                    {!task.completed && (
                      <button
                        type="button"
                        className="board-task-focus-btn"
                        onClick={(e) => { e.stopPropagation(); handleAddToTodayFocus(task.id); }}
                        title="Add to Today Focus"
                      >
                        {focusTaskIds.has(task.id) ? '✓ In focus' : '+ Focus'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
