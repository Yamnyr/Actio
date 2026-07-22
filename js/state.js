/* ==========================================================================
   Actio State Management Module
   ========================================================================== */

// --- Default Categories Seed Data ---
const DEFAULT_CATEGORIES = [
  { id: 'cat-work', name: 'Travail', color: '#2563eb' },       // Cobalt Blue
  { id: 'cat-personal', name: 'Personnel', color: '#ff6b6b' },  // Coral
  { id: 'cat-health', name: 'Santé & Sport', color: '#10b981' },// Emerald
  { id: 'cat-learning', name: 'Apprentissage', color: '#06b6d4' }, // Cyan
  { id: 'cat-finance', name: 'Finances', color: '#f59e0b' }     // Amber
];

// --- Default Todos Seed Data ---
const DEFAULT_TODOS = [
  {
    id: 'todo-seed-1',
    title: 'Préparer la réunion de cadrage hebdomadaire',
    description: 'Revoir le planning de l\'équipe, lister les points de blocage et préparer le compte-rendu précédent.',
    type: 'quick',
    status: 'pending',
    category: 'cat-work',
    dueDate: 'today',
    priority: 'high',
    subtasks: [
      { id: 'sub-1-1', title: 'Lister les objectifs de la semaine', completed: true },
      { id: 'sub-1-2', title: 'Envoyer les invitations calendrier', completed: false },
      { id: 'sub-1-3', title: 'Structurer le support de présentation', completed: false }
    ],
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'todo-seed-2',
    title: 'Acheter un cadeau pour l\'anniversaire de Sarah',
    description: 'Trouver un livre ou un coffret cadeau sympa. Demander à Marc pour des idées.',
    type: 'quick',
    status: 'pending',
    category: 'cat-personal',
    dueDate: 'week',
    priority: 'medium',
    subtasks: [],
    createdAt: Date.now() - 3600000 * 24
  },
  {
    id: 'todo-seed-3',
    title: 'Séance de HIIT Cardio - 45 min',
    description: 'Suivre la routine de cardio haute intensité de l\'application d\'entraînement.',
    type: 'quick',
    status: 'completed',
    category: 'cat-health',
    dueDate: 'today',
    priority: 'low',
    subtasks: [],
    createdAt: Date.now() - 3600000 * 4
  },
  {
    id: 'todo-seed-4',
    title: 'Lancer un projet de reconversion ou compétence IA',
    description: 'Projet de vie : acquérir des compétences en Deep Learning et développement d\'agents autonomes.',
    type: 'project',
    status: 'pending',
    category: 'cat-learning',
    dueDate: 'later',
    priority: 'high',
    subtasks: [
      { id: 'sub-4-1', title: 'Suivre le cours d\'introduction aux LLMs', completed: true },
      { id: 'sub-4-2', title: 'Créer un premier projet d\'assistant local', completed: false },
      { id: 'sub-4-3', title: 'Étudier les architectures RAG et Fine-tuning', completed: false },
      { id: 'sub-4-4', title: 'Participer à un hackathon IA ou publier un dépôt GitHub', completed: false }
    ],
    createdAt: Date.now() - 3600000 * 48
  }
];

// --- Initializing State ---
class AppState {
  constructor() {
    this.todos = [];
    this.categories = [];
    this.geminiApiKey = '';
    this.layoutMode = 'card';
    this.syncToken = '';
    this.syncGistId = '';
    this.theme = 'aurora';
    this.hideCompleted = false;
    
    this.loadFromStorage();
  }

  // Load state from localStorage
  loadFromStorage() {
    try {
      const storedTodos = localStorage.getItem('doit_todos') || localStorage.getItem('actio_todos') || localStorage.getItem('zentodo_todos');
      const storedCategories = localStorage.getItem('doit_categories') || localStorage.getItem('actio_categories') || localStorage.getItem('zentodo_categories');
      const storedKey = localStorage.getItem('doit_gemini_key') || localStorage.getItem('actio_gemini_key') || localStorage.getItem('zentodo_gemini_key');
      const storedLayout = localStorage.getItem('doit_layout') || localStorage.getItem('actio_layout') || localStorage.getItem('zentodo_layout');
      const storedSyncToken = localStorage.getItem('doit_sync_token') || localStorage.getItem('actio_sync_token');
      const storedSyncGistId = localStorage.getItem('doit_sync_gist_id') || localStorage.getItem('actio_sync_gist_id');
      const storedHideCompleted = localStorage.getItem('doit_hide_completed') === 'true';

      this.theme = 'aurora';
      this.hideCompleted = storedHideCompleted;

      if (storedLayout) {
        this.layoutMode = storedLayout;
      } else {
        this.layoutMode = 'card';
      }

      if (storedSyncToken) this.syncToken = storedSyncToken;
      if (storedSyncGistId) this.syncGistId = storedSyncGistId;

      if (storedTodos) {
        this.todos = JSON.parse(storedTodos);
      } else {
        this.todos = [...DEFAULT_TODOS];
        this.saveTodos();
      }

      if (storedCategories) {
        this.categories = JSON.parse(storedCategories);
      } else {
        this.categories = [...DEFAULT_CATEGORIES];
        this.saveCategories();
      }

      if (storedKey) {
        this.geminiApiKey = storedKey;
      }
    } catch (e) {
      console.error('Erreur lors du chargement des données depuis localStorage:', e);
      // Fallback
      this.todos = [...DEFAULT_TODOS];
      this.categories = [...DEFAULT_CATEGORIES];
    }
  }

  // Save changes to localStorage
  saveTodos() {
    localStorage.setItem('doit_todos', JSON.stringify(this.todos));
  }

  saveCategories() {
    localStorage.setItem('doit_categories', JSON.stringify(this.categories));
  }

  saveGeminiKey(key) {
    this.geminiApiKey = key;
    localStorage.setItem('doit_gemini_key', key);
  }

  getGeminiKey() {
    return this.geminiApiKey;
  }

  // --- CRUD Todos ---
  getTodos() {
    return this.todos.filter(t => !t.deleted);
  }

  getTodo(id) {
    return this.todos.find(t => t.id === id);
  }

  addTodo(todoData) {
    const newTodo = {
      id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title: todoData.title || 'Nouvelle tâche',
      description: todoData.description || '',
      type: todoData.type || 'quick',
      status: todoData.status || 'pending',
      category: todoData.category || 'cat-personal',
      dueDate: todoData.dueDate || 'week',
      priority: todoData.priority || 'medium',
      subtasks: todoData.subtasks || [],
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
    
    this.todos.push(newTodo);
    this.saveTodos();
    return newTodo;
  }

  updateTodo(id, updatedFields) {
    const todoIndex = this.todos.findIndex(t => t.id === id);
    if (todoIndex === -1) return null;

    this.todos[todoIndex] = {
      ...this.todos[todoIndex],
      ...updatedFields,
      lastUpdated: Date.now()
    };
    
    this.saveTodos();
    return this.todos[todoIndex];
  }

  deleteTodo(id) {
    const todo = this.getTodo(id);
    if (!todo) return false;
    
    todo.deleted = true;
    todo.lastUpdated = Date.now();
    this.saveTodos();
    return true;
  }

  // --- Subtasks Logic ---
  addSubtask(todoId, title) {
    const todo = this.getTodo(todoId);
    if (!todo) return null;

    const newSubtask = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: title,
      completed: false
    };

    todo.subtasks.push(newSubtask);
    todo.lastUpdated = Date.now();
    this.saveTodos();
    return newSubtask;
  }

  toggleSubtask(todoId, subtaskId) {
    const todo = this.getTodo(todoId);
    if (!todo) return false;

    const subtask = todo.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return false;

    subtask.completed = !subtask.completed;
    
    todo.lastUpdated = Date.now();
    this.saveTodos();
    return true;
  }

  deleteSubtask(todoId, subtaskId) {
    const todo = this.getTodo(todoId);
    if (!todo) return false;

    const initialLength = todo.subtasks.length;
    todo.subtasks = todo.subtasks.filter(s => s.id !== subtaskId);
    todo.lastUpdated = Date.now();
    this.saveTodos();
    return todo.subtasks.length < initialLength;
  }

  updateSubtasks(todoId, newSubtasks) {
    const todo = this.getTodo(todoId);
    if (!todo) return false;
    
    todo.subtasks = newSubtasks;
    todo.lastUpdated = Date.now();
    this.saveTodos();
    return true;
  }

  // --- CRUD Categories ---
  getCategories() {
    return this.categories;
  }

  getCategory(id) {
    return this.categories.find(c => c.id === id);
  }

  addCategory(name, color) {
    const newCategory = {
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      name: name,
      color: color || '#6366f1'
    };

    this.categories.push(newCategory);
    this.saveCategories();
    return newCategory;
  }

  updateCategory(id, updates = {}) {
    const cat = this.getCategory(id);
    if (!cat) return false;
    if (updates.name !== undefined && updates.name.trim()) cat.name = updates.name.trim();
    if (updates.color !== undefined) cat.color = updates.color;
    this.saveCategories();
    return cat;
  }

  deleteCategory(id) {
    // Cannot delete default categories or if not found
    if (this.categories.length <= 1) return false;

    this.categories = this.categories.filter(c => c.id !== id);
    this.saveCategories();

    // Reassign all todos with deleted category to the first available category
    const fallbackId = this.categories[0].id;
    this.todos.forEach(todo => {
      if (todo.category === id) {
        todo.category = fallbackId;
      }
    });
    this.saveTodos();
    
    return true;
  }

  // --- Global Stats Helpers ---
  getStats() {
    const activeTodos = this.todos.filter(t => !t.deleted);
    const total = activeTodos.length;
    const completed = activeTodos.filter(t => t.status === 'completed').length;
    const active = total - completed;
    
    // Calculate global percentage based on all tasks, factoring in subtasks
    // A completed task counts as 1. An active task counts based on subtask ratio, or 0 if no subtasks.
    let totalPoints = 0;
    let completedPoints = 0;

    activeTodos.forEach(todo => {
      if (todo.status === 'completed') {
        totalPoints += 1;
        completedPoints += 1;
      } else {
        totalPoints += 1;
        if (todo.subtasks && todo.subtasks.length > 0) {
          const finishedSub = todo.subtasks.filter(s => s.completed).length;
          completedPoints += finishedSub / todo.subtasks.length;
        }
      }
    });

    const percent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    return {
      total,
      completed,
      active,
      percent
    };
  }

  // --- Data Import / Export / Reset ---
  exportData() {
    const dataStr = JSON.stringify({
      todos: this.todos,
      categories: this.categories,
      geminiApiKey: this.geminiApiKey,
      version: '1.0'
    }, null, 2);
    
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'doit_export_' + new Date().toISOString().slice(0,10) + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (data.todos && Array.isArray(data.todos) && data.categories && Array.isArray(data.categories)) {
        this.todos = data.todos;
        this.categories = data.categories;
        if (data.geminiApiKey) {
          this.geminiApiKey = data.geminiApiKey;
          localStorage.setItem('doit_gemini_key', this.geminiApiKey);
        }
        this.saveTodos();
        this.saveCategories();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Erreur lors de l\'import des données:', e);
      return false;
    }
  }

  saveLayoutMode(mode) {
    this.layoutMode = mode;
    localStorage.setItem('doit_layout', mode);
  }

  getLayoutMode() {
    return this.layoutMode;
  }

  saveTheme(theme) {
    // Locked to aurora
    this.theme = 'aurora';
  }

  getTheme() {
    return 'aurora';
  }

  saveHideCompleted(hide) {
    this.hideCompleted = hide;
    localStorage.setItem('doit_hide_completed', hide);
  }

  getHideCompleted() {
    return this.hideCompleted;
  }

  saveSyncCredentials(token, gistId) {
    this.syncToken = token;
    this.syncGistId = gistId;
    localStorage.setItem('doit_sync_token', token);
    localStorage.setItem('doit_sync_gist_id', gistId);
  }

  getSyncCredentials() {
    return {
      token: this.syncToken,
      gistId: this.syncGistId
    };
  }

  // --- Cloud Gist Sync Logic ---
  async syncWithCloud() {
    if (!this.syncToken) {
      throw new Error('Jeton GitHub manquant.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `token ${this.syncToken}`,
      'Accept': 'application/vnd.github+json'
    };

    // 1. Create a new Gist if Gist ID is missing
    if (!this.syncGistId) {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description: 'DoIt Cloud Sync Data',
          public: false,
          files: {
            'doit_data.json': {
              content: JSON.stringify({
                todos: this.todos,
                categories: this.categories,
                lastSynced: Date.now()
              }, null, 2)
            }
          }
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Impossible de créer le Gist sur GitHub.');
      }

      const gist = await response.json();
      this.saveSyncCredentials(this.syncToken, gist.id);
      return { status: 'created', gistId: gist.id };
    }

    // 2. Fetch Gist if Gist ID exists
    const response = await fetch(`https://api.github.com/gists/${this.syncGistId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Gist was deleted on GitHub, reset local Gist ID and recreate
        this.saveSyncCredentials(this.syncToken, '');
        return this.syncWithCloud();
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Impossible de charger les données du Gist.');
    }

    const gist = await response.json();
    const file = gist.files?.['doit_data.json']?.content || gist.files?.['actio_data.json']?.content;

    if (!file) {
      throw new Error('doit_data.json ou actio_data.json introuvable dans le Gist.');
    }

    let cloudData;
    try {
      cloudData = JSON.parse(file);
    } catch (e) {
      throw new Error('Format de données du Gist GitHub corrompu.');
    }

    // 3. Bidirectional merge
    const mergedTodos = this.mergeTodos(this.todos, cloudData.todos || []);
    const mergedCategories = this.mergeCategories(this.categories, cloudData.categories || []);

    // Save locally
    this.todos = mergedTodos;
    this.categories = mergedCategories;
    this.saveTodos();
    this.saveCategories();

    // 4. Update the Gist with merged final data
    const updateResponse = await fetch(`https://api.github.com/gists/${this.syncGistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        files: {
          'doit_data.json': {
            content: JSON.stringify({
              todos: this.todos,
              categories: this.categories,
              lastSynced: Date.now()
            }, null, 2)
          },
          // Supprimer l'ancien fichier de synchronisation s'il existe
          'actio_data.json': gist.files?.['actio_data.json'] ? null : undefined
        }
      })
    });

    if (!updateResponse.ok) {
      const err = await updateResponse.json().catch(() => ({}));
      throw new Error(err.message || 'Impossible de mettre à jour le Gist.');
    }

    return { status: 'synced', gistId: this.syncGistId };
  }

  mergeTodos(local, cloud) {
    const todoMap = new Map();
    
    // Put cloud items
    cloud.forEach(todo => {
      todoMap.set(todo.id, todo);
    });

    // Merge local items
    local.forEach(localTodo => {
      const cloudTodo = todoMap.get(localTodo.id);
      if (!cloudTodo) {
        todoMap.set(localTodo.id, localTodo);
      } else {
        const localTime = localTodo.lastUpdated || localTodo.createdAt || 0;
        const cloudTime = cloudTodo.lastUpdated || cloudTodo.createdAt || 0;
        
        if (localTime > cloudTime) {
          todoMap.set(localTodo.id, localTodo);
        }
      }
    });

    return Array.from(todoMap.values());
  }

  mergeCategories(local, cloud) {
    const catMap = new Map();
    
    cloud.forEach(cat => {
      catMap.set(cat.id, cat);
    });
    
    local.forEach(cat => {
      catMap.set(cat.id, cat);
    });

    return Array.from(catMap.values());
  }

  resetAll() {
    localStorage.removeItem('doit_todos');
    localStorage.removeItem('doit_categories');
    localStorage.removeItem('doit_gemini_key');
    localStorage.removeItem('doit_layout');
    localStorage.removeItem('doit_sync_token');
    localStorage.removeItem('doit_sync_gist_id');
    localStorage.removeItem('doit_theme');
    localStorage.removeItem('doit_hide_completed');
    localStorage.removeItem('actio_todos');
    localStorage.removeItem('actio_categories');
    localStorage.removeItem('actio_gemini_key');
    localStorage.removeItem('actio_layout');
    localStorage.removeItem('actio_sync_token');
    localStorage.removeItem('actio_sync_gist_id');
    localStorage.removeItem('zentodo_todos');
    localStorage.removeItem('zentodo_categories');
    localStorage.removeItem('zentodo_gemini_key');
    localStorage.removeItem('zentodo_layout');
    
    this.todos = [...DEFAULT_TODOS];
    this.categories = [...DEFAULT_CATEGORIES];
    this.geminiApiKey = '';
    this.layoutMode = 'card';
    this.syncToken = '';
    this.syncGistId = '';
    this.theme = 'aurora';
    this.hideCompleted = false;
    
    this.saveTodos();
    this.saveCategories();
  }
}

// Single instance export
export const state = new AppState();
export default state;
