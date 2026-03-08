import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, apiJson } from '../api/client.js';
import Sidebar from '../components/Sidebar.jsx';
import Board from '../components/Board.jsx';
import TaskList from '../components/TaskList.jsx';
import TaskDetail from '../components/TaskDetail.jsx';
export default function Dashboard() {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const path = location.pathname;
  const isBoardView = path === '/app' || path === '/app/';
  const currentView = path.endsWith('/completed') ? 'completed' : isBoardView ? 'board' : 'category';
  const effectiveCategoryId = currentView === 'category' ? categoryId : null;

  const fetchCategories = useCallback(async () => {
    try {
      const { categories: data } = await apiJson('/api/categories');
      setCategories(data);
      setCategoriesLoaded(true);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (currentView === 'completed') {
        const { tasks: data } = await apiJson('/api/tasks/completed');
        setTasks(data);
        setCategoryTitle('Completed Tasks');
      } else if (effectiveCategoryId) {
        const { tasks: data } = await apiJson(`/api/categories/${effectiveCategoryId}/tasks`);
        const cat = categories.find((c) => String(c.id) === String(effectiveCategoryId)) || { name: 'Category' };
        setCategoryTitle(cat.name);
        setTasks(data);
      } else {
        setTasks([]);
        setCategoryTitle('');
      }
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentView, effectiveCategoryId, categories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (currentView === 'category' && !effectiveCategoryId && categories.length > 0) {
      navigate(`/app/category/${categories[0].id}`, { replace: true });
      return;
    }
    if (currentView === 'category' && effectiveCategoryId) {
      const cat = categories.find((c) => String(c.id) === String(effectiveCategoryId));
      if (cat) setCategoryTitle(cat.name);
    }
    if (currentView !== 'board') fetchTasks();
  }, [currentView, effectiveCategoryId, categories.length, fetchTasks, navigate, categories]);

  const refreshTasks = useCallback(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = useCallback(
    async (title, categoryIdOverride) => {
      const targetCategoryId = categoryIdOverride ?? effectiveCategoryId;
      if (!targetCategoryId) return;
      try {
        await apiJson(`/api/categories/${targetCategoryId}/tasks`, {
          method: 'POST',
          body: JSON.stringify({ title }),
        });
        refreshTasks();
      } catch (err) {
        console.error(err);
      }
    },
    [effectiveCategoryId, refreshTasks]
  );

  const handleToggleTask = useCallback(
    async (taskId, completed) => {
      try {
        await apiJson(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed }),
        });
        refreshTasks();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshTasks]
  );

  const handleUpdateTask = useCallback(
    async (taskId, updates) => {
      try {
        await apiJson(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        refreshTasks();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshTasks]
  );

  const handleDeleteTask = useCallback(
    async (taskId) => {
      try {
        await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
        setSelectedTaskId((id) => (id === taskId ? null : id));
        refreshTasks();
      } catch (err) {
        console.error(err);
      }
    },
    [refreshTasks]
  );

  const showAddTask = currentView === 'category' ? !!effectiveCategoryId : false;
  const handleCloseTaskDetail = useCallback(() => setSelectedTaskId(null), []);

  return (
    <div className="dashboard">
      <Sidebar
        categories={categories}
        currentView={currentView}
        currentCategoryId={effectiveCategoryId}
        onCategoriesChange={fetchCategories}
        user={user}
      />
      <main className="dashboard-main">
        {currentView === 'board' ? (
          <>
            <header className="dashboard-header">
              <h1>Planning Board</h1>
            </header>
            {!categoriesLoaded ? (
              <p className="dashboard-loading">Loading…</p>
            ) : (
              <Board categoryCount={categories.length} onCategoriesChange={fetchCategories} />
            )}
          </>
        ) : (
          <>
            <header className="dashboard-header">
              <h1>{categoryTitle}</h1>
            </header>
            {loading ? (
              <p className="dashboard-loading">Loading…</p>
            ) : (
              <TaskList
                tasks={tasks}
                view={currentView}
                onToggle={handleToggleTask}
                onSelectTask={setSelectedTaskId}
                onAddTask={showAddTask ? handleAddTask : null}
                categoryId={effectiveCategoryId}
                categories={categories}
              />
            )}
          </>
        )}
      </main>
      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          onClose={handleCloseTaskDetail}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
