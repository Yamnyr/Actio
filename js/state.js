/* ==========================================================================
   Actio State Management Module
   ========================================================================== */

// --- Default Categories Seed Data ---
const DEFAULT_CATEGORIES = [
  { id: 'cat-work', name: 'Travail', color: '#6366f1' },       // Indigo
  { id: 'cat-personal', name: 'Personnel', color: '#a855f7' },  // Purple
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
    
    this.loadFromStorage();
  }

  // Load state from localStorage
  loadFromStorage() {
    try {
      const storedTodos = localStorage.getItem('actio_todos') || localStorage.getItem('zentodo_todos');
      const storedCategories = localStorage.getItem('actio_categories') || localStorage.getItem('zentodo_categories');
      const storedKey = localStorage.getItem('actio_gemini_key') || localStorage.getItem('zentodo_gemini_key');
      const storedLayout = localStorage.getItem('actio_layout') || localStorage.getItem('zentodo_layout');

      if (storedLayout) {
        this.layoutMode = storedLayout;
      } else {
        this.layoutMode = 'card';
      }

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
    localStorage.setItem('actio_todos', JSON.stringify(this.todos));
  }

  saveCategories() {
    localStorage.setItem('actio_categories', JSON.stringify(this.categories));
  }

  saveGeminiKey(key) {
    this.geminiApiKey = key;
    localStorage.setItem('actio_gemini_key', key);
  }

  getGeminiKey() {
    return this.geminiApiKey;
  }

  // --- CRUD Todos ---
  getTodos() {
    return this.todos;
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
      status: 'pending',
      category: todoData.category || 'cat-personal',
      dueDate: todoData.dueDate || 'week',
      priority: todoData.priority || 'medium',
      subtasks: todoData.subtasks || [],
      createdAt: Date.now()
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
      ...updatedFields
    };
    
    this.saveTodos();
    return this.todos[todoIndex];
  }

  deleteTodo(id) {
    const initialLength = this.todos.length;
    this.todos = this.todos.filter(t => t.id !== id);
    this.saveTodos();
    return this.todos.length < initialLength;
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
    this.saveTodos();
    return newSubtask;
  }

  toggleSubtask(todoId, subtaskId) {
    const todo = this.getTodo(todoId);
    if (!todo) return false;

    const subtask = todo.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return false;

    subtask.completed = !subtask.completed;
    
    // Automatically update todo status if it's a quick task and all subtasks are finished?
    // Usually better to let the user decide, but we must update the completion stats.
    this.saveTodos();
    return true;
  }

  deleteSubtask(todoId, subtaskId) {
    const todo = this.getTodo(todoId);
    if (!todo) return false;

    const initialLength = todo.subtasks.length;
    todo.subtasks = todo.subtasks.filter(s => s.id !== subtaskId);
    this.saveTodos();
    return todo.subtasks.length < initialLength;
  }

  updateSubtasks(todoId, newSubtasks) {
    const todo = this.getTodo(todoId);
    if (!todo) return false;
    
    todo.subtasks = newSubtasks;
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
    const total = this.todos.length;
    const completed = this.todos.filter(t => t.status === 'completed').length;
    const active = total - completed;
    
    // Calculate global percentage based on all tasks, factoring in subtasks
    // A completed task counts as 1. An active task counts based on subtask ratio, or 0 if no subtasks.
    let totalPoints = 0;
    let completedPoints = 0;

    this.todos.forEach(todo => {
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
    
    const exportFileDefaultName = 'actio_export_' + new Date().toISOString().slice(0,10) + '.json';
    
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
          localStorage.setItem('actio_gemini_key', this.geminiApiKey);
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
    localStorage.setItem('actio_layout', mode);
  }

  getLayoutMode() {
    return this.layoutMode;
  }

  resetAll() {
    localStorage.removeItem('actio_todos');
    localStorage.removeItem('actio_categories');
    localStorage.removeItem('actio_gemini_key');
    localStorage.removeItem('actio_layout');
    localStorage.removeItem('zentodo_todos');
    localStorage.removeItem('zentodo_categories');
    localStorage.removeItem('zentodo_gemini_key');
    localStorage.removeItem('zentodo_layout');
    
    this.todos = [...DEFAULT_TODOS];
    this.categories = [...DEFAULT_CATEGORIES];
    this.geminiApiKey = '';
    this.layoutMode = 'card';
    
    this.saveTodos();
    this.saveCategories();
  }
}

// Single instance export
export const state = new AppState();
export default state;
