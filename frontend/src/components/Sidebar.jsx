import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api, apiJson } from '../api/client.js';
export default function Sidebar({ categories = [], currentView, currentCategoryId, onCategoriesChange, user }) {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await apiJson('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setNewCategoryName('');
      setAddingCategory(false);
      onCategoriesChange?.();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRenameCategory(id, name) {
    const n = name.trim();
    if (!n) return;
    try {
      await apiJson(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: n }),
      });
      setEditingId(null);
      setEditName('');
      onCategoriesChange?.();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm('Delete this category and all its tasks?')) return;
    try {
      await api(`/api/categories/${id}`, { method: 'DELETE' });
      onCategoriesChange?.();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-user">
        <span className="sidebar-user-email">{user?.email}</span>
        <button type="button" className="sidebar-logout" onClick={logout}>
          Sign out
        </button>
      </div>
      <nav className="sidebar-nav">
        <Link
          to="/app"
          className={`sidebar-link ${currentView === 'board' ? 'active' : ''}`}
        >
          Planning Board
        </Link>
        <Link
          to="/app/completed"
          className={`sidebar-link ${currentView === 'completed' ? 'active' : ''}`}
        >
          Completed Tasks
        </Link>
      </nav>
      <div className="sidebar-categories">
        <div className="sidebar-categories-header">Categories</div>
        {categories.filter((c) => c.id != null).map((cat) => (
          <div key={cat.id} className="sidebar-cat-row">
            {editingId === cat.id ? (
              <input
                className="sidebar-list-edit"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRenameCategory(cat.id, editName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameCategory(cat.id, editName);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
              />
            ) : (
              <>
                <Link
                  to={`/app/category/${cat.id}`}
                  className={`sidebar-link sidebar-cat-name ${String(currentCategoryId) === String(cat.id) ? 'active' : ''}`}
                >
                  {cat.name}
                </Link>
                <div className="sidebar-list-actions">
                  <button
                    type="button"
                    className="sidebar-list-btn"
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="sidebar-list-btn"
                    onClick={() => handleDeleteCategory(cat.id)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {addingCategory ? (
          <form
            className="sidebar-add-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateCategory();
            }}
          >
            <input
              placeholder="Category name (e.g. Client A)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAddingCategory(false);
              }}
              autoFocus
            />
            <button type="submit">Add</button>
            <button type="button" onClick={() => setAddingCategory(false)}>Cancel</button>
          </form>
        ) : (
          <button type="button" className="sidebar-new-list" onClick={() => setAddingCategory(true)}>
            + New category
          </button>
        )}
      </div>
      <div className="sidebar-footer">
        <span className="sidebar-theme-label">Theme</span>
        <div className="sidebar-theme-toggle" role="group" aria-label="Theme">
          <button type="button" className={`sidebar-theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>
            Light
          </button>
          <button type="button" className={`sidebar-theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>
            Dark
          </button>
        </div>
      </div>
    </aside>
  );
}
