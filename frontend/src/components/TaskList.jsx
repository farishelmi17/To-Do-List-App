import { useState, useEffect } from 'react';
import TaskItem from './TaskItem.jsx';
import TaskTableRow from './TaskTableRow.jsx';
export default function TaskList({ tasks, view, onToggle, onSelectTask, onAddTask, categoryId, categories = [] }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addToCategoryId, setAddToCategoryId] = useState(categoryId || (categories[0]?.id ?? ''));
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  useEffect(() => {
    if (view === 'completed') {
      const firstId = categories[0]?.id ?? '';
      setAddToCategoryId((prev) => (categories.some((c) => String(c.id) === String(prev)) ? prev : firstId));
    }
  }, [view, categories]);

  const isTableView = view === 'completed';
  const isCategoryView = view === 'category';
  const canAdd = !!onAddTask;
  const addTaskCategoryId = isTableView ? addToCategoryId : categoryId;

  const openTasks = isCategoryView ? tasks.filter((t) => !t.completed) : [];
  const completedTasksInCategory = isCategoryView
    ? [...tasks.filter((t) => t.completed)].sort((a, b) => {
        const au = a.updated_at ? new Date(a.updated_at.replace(' ', 'T') + (a.updated_at.endsWith('Z') ? '' : 'Z')).getTime() : 0;
        const bu = b.updated_at ? new Date(b.updated_at.replace(' ', 'T') + (b.updated_at.endsWith('Z') ? '' : 'Z')).getTime() : 0;
        return bu - au;
      })
    : [];

  function handleSubmit(e) {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title || !onAddTask) return;
    const targetCategoryId = isTableView ? addTaskCategoryId : categoryId;
    if (!targetCategoryId) return;
    const categoryIdArg = isCategoryView ? categoryId : (isTableView ? targetCategoryId : undefined);
    onAddTask(title, categoryIdArg);
    setNewTaskTitle('');
  }

  if (isTableView) {
    const isCompletedView = view === 'completed';
    const filteredTasks = isCompletedView
      ? tasks.filter((t) => {
          const matchCategory = filterCategoryId === '' || String(t.category_id) === String(filterCategoryId);
          const q = filterSearch.trim().toLowerCase();
          const matchSearch =
            q === '' ||
            (t.title && t.title.toLowerCase().includes(q)) ||
            (t.notes && t.notes.toLowerCase().includes(q));
          return matchCategory && matchSearch;
        })
      : tasks;

    return (
      <div className="task-list">
        {isCompletedView && (
          <div className="task-list-filters">
            <div className="task-list-filter-group">
              <label className="task-list-filter-label" htmlFor="completed-filter-category">Category</label>
              <select
                id="completed-filter-category"
                className="task-list-filter-select"
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="task-list-filter-group">
              <label className="task-list-filter-label" htmlFor="completed-filter-search">Search</label>
              <input
                id="completed-filter-search"
                type="search"
                className="task-list-filter-search"
                placeholder="Task or notes…"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                aria-label="Search task or notes"
              />
            </div>
          </div>
        )}
        <div className="task-list-table-wrap">
          <table className="task-list-table">
            <thead>
              <tr>
                {!isCompletedView && <th className="task-table-th task-table-check"></th>}
                <th className="task-table-th">Task</th>
                <th className="task-table-th">Category</th>
                {isCompletedView ? (
                  <>
                    <th className="task-table-th">Completed</th>
                    <th className="task-table-th">Notes</th>
                  </>
                ) : (
                  <>
                    <th className="task-table-th">Due date</th>
                    <th className="task-table-th">Reminder</th>
                    <th className="task-table-th">Important</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={isCompletedView ? 4 : 6}
                    className="task-list-empty-cell"
                  >
                    {tasks.length === 0
                      ? 'No completed tasks yet.'
                      : 'No completed tasks match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <TaskTableRow
                    key={task.id}
                    task={task}
                    view={view}
                    onToggle={onToggle}
                    onSelect={onSelectTask}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isCategoryView) {
    return (
      <div className="task-list category-view">
        {canAdd && (
          <form className="task-list-add" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Add a task"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="task-list-input"
            />
          </form>
        )}
        <section className="category-section open-tasks-section" aria-label="Open tasks">
          <h2 className="section-title">Open Tasks</h2>
          <div className="task-list-table-wrap">
            <table className="task-list-table">
              <thead>
                <tr>
                  <th className="task-table-th task-table-check" scope="col" aria-label="Complete" />
                  <th className="task-table-th">Task</th>
                  <th className="task-table-th">Due date</th>
                  <th className="task-table-th">Reminder</th>
                  <th className="task-table-th">Important</th>
                </tr>
              </thead>
              <tbody>
                {openTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="task-list-empty-cell">No open tasks</td>
                  </tr>
                ) : (
                  openTasks.map((task) => (
                    <TaskTableRow
                      key={task.id}
                      task={task}
                      categories={categories}
                      view="category"
                      section="open"
                      onToggle={onToggle}
                      onSelect={onSelectTask}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="category-section completed-tasks-section" aria-label="Completed tasks">
          <h2 className="section-title">Completed Tasks</h2>
          <div className="task-list-table-wrap">
            <table className="task-list-table">
              <thead>
                <tr>
                  <th className="task-table-th">Task</th>
                  <th className="task-table-th">Completed</th>
                  <th className="task-table-th">Notes</th>
                </tr>
              </thead>
              <tbody>
                {completedTasksInCategory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="task-list-empty-cell">No completed tasks</td>
                  </tr>
                ) : (
                  completedTasksInCategory.map((task) => (
                    <TaskTableRow
                      key={task.id}
                      task={task}
                      categories={categories}
                      view="category"
                      section="completed"
                      onToggle={onToggle}
                      onSelect={onSelectTask}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="task-list">
      {canAdd && (
        <form className="task-list-add" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Add a task"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="task-list-input"
          />
        </form>
      )}
      <ul className="task-list-ul">
        {tasks.length === 0 ? (
          <li className="task-list-empty">
            {!canAdd && 'Select a category to add tasks.'}
            {canAdd && 'No tasks yet. Add one above.'}
          </li>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onSelect={() => onSelectTask(task.id)}
              showListTitle={false}
            />
          ))
        )}
      </ul>
    </div>
  );
}
