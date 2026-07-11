/* ==========================================================================
   Actio UI Rendering and Interaction Module
   ========================================================================== */

import { state } from './state.js';
import { generateSubtasks } from './ai.js';

// --- DOM Cache ---
let activeTab = 'quick';
let selectedCategoryFilter = 'all';
let currentDraggedTodoId = null;

// Color Palette for Categories
const PALETTE_COLORS = [
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#64748b'  // Slate
];

class UIManager {
  constructor() {
    this.initElements();
  }

  initElements() {
    // Nav & Sidebar
    this.navButtons = document.querySelectorAll('.nav-btn');
    this.tabViews = document.querySelectorAll('.tab-view');
    this.globalProgressPercent = document.getElementById('global-progress-percent');
    this.globalProgressBar = document.getElementById('global-progress-bar');
    this.counterDone = document.getElementById('counter-done');
    this.counterActive = document.getElementById('counter-active');
    
    // Header
    this.viewTitle = document.getElementById('view-title');
    this.viewSubtitle = document.getElementById('view-subtitle');
    this.searchInput = document.getElementById('search-input');
    this.clearSearchBtn = document.getElementById('clear-search-btn');
    this.headerProgressRing = document.getElementById('header-progress-ring');
    this.headerProgressText = document.getElementById('header-progress-text');
    this.btnToggleLayout = document.getElementById('btn-toggle-layout');
    
    // Category Filter
    this.filtersContainer = document.getElementById('category-filters-container');
    
    // Quick Add
    this.quickAddForm = document.getElementById('quick-add-form');
    this.quickAddInput = document.getElementById('quick-add-input');
    this.quickAddCategory = document.getElementById('quick-add-category');
    this.quickAddPriority = document.getElementById('quick-add-priority');
    
    // Lists
    this.listToday = document.getElementById('list-today');
    this.listWeek = document.getElementById('list-week');
    this.listLater = document.getElementById('list-later');
    this.dropzones = document.querySelectorAll('.task-list-dropzone');
    
    // Projects View
    this.projectsGrid = document.getElementById('projects-grid-container');
    this.btnOpenNewProjectModal = document.getElementById('btn-open-new-project-modal');
    
    // Categories View
    this.categoryCreateForm = document.getElementById('category-create-form');
    this.newCatNameInput = document.getElementById('new-cat-name');
    this.colorPalette = document.getElementById('color-palette');
    this.categoriesListContainer = document.getElementById('categories-list-container');
    this.selectedNewCategoryColor = PALETTE_COLORS[0];
    
    // Settings View
    this.geminiKeyInput = document.getElementById('gemini-key-input');
    this.toggleKeyVisibilityBtn = document.getElementById('toggle-key-visibility');
    this.saveSettingsBtn = document.getElementById('save-settings-btn');
    this.geminiStatusSuccess = document.getElementById('gemini-status-success');
    this.geminiStatusLocal = document.getElementById('gemini-status-local');
    this.btnExportData = document.getElementById('btn-export-data');
    this.btnImportData = document.getElementById('btn-import-data');
    this.importDataFile = document.getElementById('import-data-file');
    this.btnResetApp = document.getElementById('btn-reset-app');
    
    // Todo Details Modal
    this.todoModal = document.getElementById('todo-details-modal');
    this.todoForm = document.getElementById('todo-details-form');
    this.modalTodoId = document.getElementById('modal-todo-id');
    this.modalTodoTitleDisplay = document.getElementById('modal-todo-title-display');
    this.modalTodoTitle = document.getElementById('modal-todo-title');
    this.modalTodoCategory = document.getElementById('modal-todo-category');
    this.modalTodoPriority = document.getElementById('modal-todo-priority');
    this.modalTodoStatus = document.getElementById('modal-todo-status');
    this.modalTodoType = document.getElementById('modal-todo-type');
    this.modalTodoDueContainer = document.getElementById('modal-todo-due-container');
    this.modalTodoDue = document.getElementById('modal-todo-due');
    this.modalTodoDesc = document.getElementById('modal-todo-desc');
    this.subtasksCompletionLabel = document.getElementById('subtasks-completion-label');
    this.modalSubtasksProgress = document.getElementById('modal-subtasks-progress');
    this.modalSubtaskList = document.getElementById('modal-subtask-list-container');
    this.newSubtaskTitleInput = document.getElementById('new-subtask-title-input');
    this.btnAddSubtaskManually = document.getElementById('btn-add-subtask-manually');
    this.btnDeleteTodo = document.getElementById('btn-delete-todo');
    this.btnTriggerAiGen = document.getElementById('btn-trigger-ai-gen');
    
    // AI Waiting Modal
    this.aiModal = document.getElementById('ai-modal');
    this.btnCancelAi = document.getElementById('btn-cancel-ai');
  }

  // --- Render Manger ---
  renderAll() {
    this.renderSidebarStats();
    this.renderCategoryFilters();
    this.renderActiveView();
    
    // Re-initialize Lucide Icons for dynamic content
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderSidebarStats() {
    const stats = state.getStats();
    
    this.globalProgressPercent.textContent = `${stats.percent}%`;
    this.globalProgressBar.style.width = `${stats.percent}%`;
    this.counterDone.textContent = stats.completed;
    this.counterActive.textContent = stats.active;

    // Header progress ring calculation
    this.headerProgressText.textContent = `${stats.percent}%`;
    
    const circleRadius = 16;
    const circumference = 2 * Math.PI * circleRadius;
    this.headerProgressRing.style.strokeDasharray = `${circumference} ${circumference}`;
    
    // Progress fill
    const offset = circumference - (stats.percent / 100) * circumference;
    this.headerProgressRing.style.strokeDashoffset = offset;
  }

  renderCategoryFilters() {
    const categories = state.getCategories();
    
    // Build filter chips
    let html = `
      <div class="filter-chip ${selectedCategoryFilter === 'all' ? 'active' : ''}" data-category-id="all">
        <span>Tous</span>
      </div>
    `;
    
    categories.forEach(cat => {
      html += `
        <div class="filter-chip ${selectedCategoryFilter === cat.id ? 'active' : ''}" data-category-id="${cat.id}">
          <span class="filter-color-dot" style="background-color: ${cat.color}"></span>
          <span>${cat.name}</span>
        </div>
      `;
    });
    
    this.filtersContainer.innerHTML = html;
  }

  renderActiveView() {
    const searchQuery = this.searchInput.value.toLowerCase().trim();
    const categories = state.getCategories();
    
    // Re-populate select boxes
    this.populateCategoryDropdowns(categories);

    // Show/hide and update layout toggle button
    if (this.btnToggleLayout) {
      if (activeTab === 'quick' || activeTab === 'projects') {
        this.btnToggleLayout.classList.remove('hidden');
        const layout = state.getLayoutMode();
        const icon = this.btnToggleLayout.querySelector('i');
        if (icon) {
          if (layout === 'list') {
            icon.setAttribute('data-lucide', 'layout-grid');
            this.btnToggleLayout.title = "Afficher en Grille / Cartes";
          } else {
            icon.setAttribute('data-lucide', 'list');
            this.btnToggleLayout.title = "Afficher en Liste Compacte";
          }
        }
      } else {
        this.btnToggleLayout.classList.add('hidden');
      }
    }

    if (activeTab === 'quick') {
      this.viewTitle.textContent = 'Tâches Rapides';
      this.viewSubtitle.textContent = 'Restez concentré sur vos objectifs de la semaine';
      this.filtersContainer.classList.remove('hidden');
      this.renderQuickTasks(searchQuery);
    } else if (activeTab === 'projects') {
      this.viewTitle.textContent = 'Projets de Vie';
      this.viewSubtitle.textContent = 'Vos ambitions à long terme découpées en étapes simples';
      this.filtersContainer.classList.remove('hidden');
      this.renderProjects(searchQuery);
    } else if (activeTab === 'categories') {
      this.viewTitle.textContent = 'Gestion des Catégories';
      this.viewSubtitle.textContent = 'Créez et organisez vos codes couleurs personnalisés';
      this.filtersContainer.classList.add('hidden');
      this.renderCategoriesList();
    } else if (activeTab === 'settings') {
      this.viewTitle.textContent = 'Paramètres';
      this.viewSubtitle.textContent = 'Gérez l\'intégration de l\'IA et vos données locales';
      this.filtersContainer.classList.add('hidden');
      this.renderSettings();
    }
  }

  populateCategoryDropdowns(categories) {
    let optionsHtml = '';
    categories.forEach(cat => {
      optionsHtml += `<option value="${cat.id}">${cat.name}</option>`;
    });
    
    this.quickAddCategory.innerHTML = optionsHtml;
    this.modalTodoCategory.innerHTML = optionsHtml;
  }

  // --- Render Quick Tasks View ---
  renderQuickTasks(searchQuery = '') {
    const todos = state.getTodos().filter(todo => todo.type === 'quick');
    const categories = state.getCategories();

    // Apply layout mode class
    const layout = state.getLayoutMode();
    const container = document.querySelector('.tasks-groups-container');
    if (container) {
      if (layout === 'list') {
        container.classList.add('layout-list');
      } else {
        container.classList.remove('layout-list');
      }
    }

    // Filter by category selection
    let filteredTodos = todos;
    if (selectedCategoryFilter !== 'all') {
      filteredTodos = filteredTodos.filter(todo => todo.category === selectedCategoryFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filteredTodos = filteredTodos.filter(todo => 
        todo.title.toLowerCase().includes(searchQuery) || 
        todo.description.toLowerCase().includes(searchQuery)
      );
    }

    // Distribute into lists
    const todayTodos = filteredTodos.filter(todo => todo.dueDate === 'today');
    const weekTodos = filteredTodos.filter(todo => todo.dueDate === 'week');
    const laterTodos = filteredTodos.filter(todo => todo.dueDate === 'later');

    this.renderTodoColumn(this.listToday, todayTodos, categories);
    this.renderTodoColumn(this.listWeek, weekTodos, categories);
    this.renderTodoColumn(this.listLater, laterTodos, categories);

    // Update counts
    document.getElementById('count-today').textContent = todayTodos.length;
    document.getElementById('count-week').textContent = weekTodos.length;
    document.getElementById('count-later').textContent = laterTodos.length;
  }

  renderTodoColumn(container, todos, categories) {
    if (todos.length === 0) {
      container.innerHTML = `
        <div class="empty-list-hint text-center py-4" style="color: var(--text-muted); font-size: 0.85rem; padding: 20px 0;">
          <i data-lucide="check" style="width: 16px; height: 16px; margin-bottom: 4px; display: inline-block;"></i>
          <p>Aucune tâche</p>
        </div>
      `;
      return;
    }

    container.innerHTML = todos.map(todo => {
      const category = categories.find(c => c.id === todo.category) || categories[0];
      const isCompleted = todo.status === 'completed';
      
      // Calculate subtasks progression
      const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
      let progressIndicatorHtml = '';
      if (hasSubtasks) {
        const totalSub = todo.subtasks.length;
        const completedSub = todo.subtasks.filter(s => s.completed).length;
        progressIndicatorHtml = `
          <div class="todo-progress-indicator" title="Sous-tâches terminées">
            <i data-lucide="list-checks"></i>
            <span>${completedSub}/${totalSub}</span>
          </div>
        `;
      }

      return `
        <div class="todo-card ${isCompleted ? 'completed' : ''}" 
             draggable="true" 
             data-todo-id="${todo.id}"
             id="card-${todo.id}">
          
          <div class="todo-card-header">
            <div class="custom-checkbox btn-toggle-status" data-todo-id="${todo.id}">
              <i data-lucide="check"></i>
            </div>
            
            <div class="todo-card-title-area btn-edit-todo" data-todo-id="${todo.id}">
              <span class="todo-title">${this.escapeHTML(todo.title)}</span>
              ${todo.description ? `<p class="todo-desc-preview">${this.escapeHTML(todo.description)}</p>` : ''}
            </div>
          </div>

          <div class="todo-meta-row">
            <span class="badge badge-priority-${todo.priority}">
              ${todo.priority === 'high' ? 'Haute' : todo.priority === 'medium' ? 'Moyenne' : 'Basse'}
            </span>
            <span class="badge badge-category" style="border-left: 3px solid ${category.color}">
              ${this.escapeHTML(category.name)}
            </span>
            ${progressIndicatorHtml}
          </div>

          <!-- Quick Actions Hover -->
          <div class="todo-actions-hover">
            <button class="btn-icon btn-edit-todo" data-todo-id="${todo.id}" title="Éditer / Voir les détails">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn-icon btn-delete-todo-quick" data-todo-id="${todo.id}" title="Supprimer la tâche">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Render Projects View ---
  renderProjects(searchQuery = '') {
    const projects = state.getTodos().filter(todo => todo.type === 'project');
    const categories = state.getCategories();

    // Apply layout mode class
    const layout = state.getLayoutMode();
    if (this.projectsGrid) {
      if (layout === 'list') {
        this.projectsGrid.classList.add('layout-list');
      } else {
        this.projectsGrid.classList.remove('layout-list');
      }
    }

    let filteredProjects = projects;
    if (selectedCategoryFilter !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.category === selectedCategoryFilter);
    }

    if (searchQuery) {
      filteredProjects = filteredProjects.filter(p => 
        p.title.toLowerCase().includes(searchQuery) || 
        p.description.toLowerCase().includes(searchQuery)
      );
    }

    if (filteredProjects.length === 0) {
      this.projectsGrid.innerHTML = `
        <div class="w-full text-center py-8 glass-card" style="grid-column: 1 / -1; padding: 40px; border-radius: var(--radius-lg); border: 1px solid var(--border-glass);">
          <i data-lucide="compass" style="width: 32px; height: 32px; color: var(--text-muted); margin-bottom: 8px;"></i>
          <p style="color: var(--text-secondary);">Aucun projet de vie correspondant.</p>
        </div>
      `;
      return;
    }

    this.projectsGrid.innerHTML = filteredProjects.map(proj => {
      const category = categories.find(c => c.id === proj.category) || categories[0];
      const isCompleted = proj.status === 'completed';
      
      const totalSub = proj.subtasks ? proj.subtasks.length : 0;
      const completedSub = totalSub > 0 ? proj.subtasks.filter(s => s.completed).length : 0;
      const percent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

      return `
        <div class="project-card btn-edit-todo ${isCompleted ? 'completed' : ''}" data-todo-id="${proj.id}">
          <div class="project-accent-strip" style="background: ${category.color}"></div>
          
          <div class="project-card-header">
            <h4 class="project-title">${this.escapeHTML(proj.title)}</h4>
            <div class="todo-meta-row" style="margin-top: 6px;">
              <span class="badge badge-category">
                ${this.escapeHTML(category.name)}
              </span>
              ${isCompleted ? '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid var(--color-success);">Terminé</span>' : ''}
            </div>
          </div>

          <p class="project-desc">${this.escapeHTML(proj.description || 'Aucune description rédigée pour ce projet.')}</p>

          <div class="project-progress-container">
            <div class="project-progress-header">
              <span style="color: var(--text-secondary); font-size: 0.8rem;">Progression</span>
              <span style="color: white; font-weight: 600; font-size: 0.8rem;">${percent}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${percent}%; background: linear-gradient(90deg, ${category.color}, #ffffff);"></div>
            </div>
          </div>

          <div class="project-stats-row">
            <span>${totalSub} étapes au total</span>
            <span>${completedSub} validées</span>
          </div>

          <div class="project-actions">
            <button class="btn-secondary btn-edit-todo-action" data-todo-id="${proj.id}" style="font-size: 0.8rem; padding: 6px 12px;">
              <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
              <span>Gérer les étapes</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Render Categories List ---
  renderCategoriesList() {
    const categories = state.getCategories();
    const todos = state.getTodos();

    // Render palette selection
    let paletteHtml = '';
    PALETTE_COLORS.forEach(color => {
      const isSelected = this.selectedNewCategoryColor === color;
      paletteHtml += `
        <div class="color-option ${isSelected ? 'selected' : ''}" 
             style="background-color: ${color}" 
             data-color="${color}">
          ${isSelected ? '<i data-lucide="check"></i>' : ''}
        </div>
      `;
    });
    this.colorPalette.innerHTML = paletteHtml;

    // Render list
    this.categoriesListContainer.innerHTML = categories.map(cat => {
      const taskCount = todos.filter(t => t.category === cat.id).length;
      const isDeleteAllowed = categories.length > 1;

      return `
        <div class="category-row-card">
          <div class="category-row-info">
            <span class="filter-color-dot" style="background-color: ${cat.color}; width: 14px; height: 14px;"></span>
            <span class="category-name">${this.escapeHTML(cat.name)}</span>
            <span style="color: var(--text-muted); font-size: 0.8rem;">(${taskCount} tâches)</span>
          </div>
          ${isDeleteAllowed ? `
            <button class="btn-icon btn-delete-category" data-category-id="${cat.id}" title="Supprimer cette catégorie">
              <i data-lucide="trash-2" style="width: 16px; height: 16px; color: var(--color-danger)"></i>
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // --- Render Settings View ---
  renderSettings() {
    const apiKey = state.getGeminiKey();
    this.geminiKeyInput.value = apiKey || '';

    if (apiKey) {
      this.geminiStatusSuccess.classList.remove('hidden');
      this.geminiStatusLocal.classList.add('hidden');
    } else {
      this.geminiStatusSuccess.classList.add('hidden');
      this.geminiStatusLocal.classList.remove('hidden');
    }

    // Gist Sync fields
    const { token, gistId } = state.getSyncCredentials();
    document.getElementById('sync-token-input').value = token || '';
    document.getElementById('sync-gist-id-input').value = gistId || '';

    const syncStatusIdle = document.getElementById('sync-status-idle');
    const syncStatusActive = document.getElementById('sync-status-active');

    if (token) {
      syncStatusIdle.classList.add('hidden');
      syncStatusActive.classList.remove('hidden');
      // Show gistId in badge text if present
      if (gistId) {
        syncStatusActive.innerHTML = `<i data-lucide="check-circle-2"></i> Synchro prête. Gist : <code>${gistId.substring(0, 8)}...</code>`;
      } else {
        syncStatusActive.innerHTML = `<i data-lucide="refresh-cw"></i> Prêt à créer le Gist de synchro.`;
      }
    } else {
      syncStatusIdle.classList.remove('hidden');
      syncStatusActive.classList.add('hidden');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- Modal Forms Management ---
  openTodoModal(todoId = null) {
    const categories = state.getCategories();
    this.populateCategoryDropdowns(categories);

    if (todoId) {
      // MODE EDIT
      const todo = state.getTodo(todoId);
      if (!todo) return;

      this.modalTodoId.value = todo.id;
      this.modalTodoTitleDisplay.textContent = todo.type === 'project' ? 'Détails du Projet' : 'Détails de la Tâche';
      this.modalTodoTitle.value = todo.title;
      this.modalTodoCategory.value = todo.category;
      this.modalTodoPriority.value = todo.priority;
      this.modalTodoStatus.value = todo.status || 'pending';
      this.modalTodoType.value = todo.type;
      this.modalTodoDue.value = todo.dueDate || 'week';
      this.modalTodoDesc.value = todo.description || '';
      
      this.btnDeleteTodo.classList.remove('hidden');
      this.adjustModalFieldsByType(todo.type);
      this.renderModalSubtasks(todo);
    } else {
      // MODE ADD NEW
      this.modalTodoId.value = '';
      this.modalTodoTitleDisplay.textContent = 'Créer une Tâche';
      this.modalTodoTitle.value = '';
      this.modalTodoCategory.value = categories[0]?.id || '';
      this.modalTodoPriority.value = 'medium';
      this.modalTodoStatus.value = 'pending';
      
      // Select appropriate defaults depending on view
      const type = activeTab === 'projects' ? 'project' : 'quick';
      this.modalTodoType.value = type;
      this.modalTodoDue.value = 'week';
      this.modalTodoDesc.value = '';
      
      this.btnDeleteTodo.classList.add('hidden');
      this.adjustModalFieldsByType(type);
      
      // Empty subtasks
      this.subtasksCompletionLabel.textContent = '0/0';
      this.modalSubtasksProgress.style.width = '0%';
      this.modalSubtaskList.innerHTML = `
        <div class="text-center py-4" style="color: var(--text-muted); font-size: 0.85rem;">
          <p>Aucune sous-tâche pour le moment.</p>
        </div>
      `;
    }

    this.todoModal.classList.add('active');
  }

  closeTodoModal() {
    this.todoModal.classList.remove('active');
  }

  adjustModalFieldsByType(type) {
    if (type === 'project') {
      this.modalTodoDueContainer.classList.add('hidden');
      document.getElementById('modal-row-dates').style.gridTemplateColumns = '1fr';
    } else {
      this.modalTodoDueContainer.classList.remove('hidden');
      document.getElementById('modal-row-dates').style.gridTemplateColumns = '1fr 1fr';
    }
  }

  renderModalSubtasks(todo) {
    const subtasks = todo.subtasks || [];
    const total = subtasks.length;
    const completed = subtasks.filter(s => s.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    this.subtasksCompletionLabel.textContent = `${completed}/${total}`;
    this.modalSubtasksProgress.style.width = `${percent}%`;

    if (total === 0) {
      this.modalSubtaskList.innerHTML = `
        <div class="text-center py-4" style="color: var(--text-muted); font-size: 0.85rem;">
          <p>Aucune étape ou sous-tâche créée.</p>
        </div>
      `;
      return;
    }

    this.modalSubtaskList.innerHTML = subtasks.map(sub => {
      return `
        <div class="modal-subtask-item ${sub.completed ? 'completed' : ''}" data-subtask-id="${sub.id}">
          <div class="custom-checkbox btn-toggle-subtask" data-subtask-id="${sub.id}">
            <i data-lucide="check" style="width: 10px; height: 10px; opacity: ${sub.completed ? 1 : 0}; transform: scale(${sub.completed ? 1 : 0.5})"></i>
          </div>
          <span class="subtask-title-text">${this.escapeHTML(sub.title)}</span>
          <button type="button" class="btn-icon btn-delete-subtask" data-subtask-id="${sub.id}" title="Supprimer l'étape">
            <i data-lucide="x" style="width: 14px; height: 14px; color: var(--text-muted)"></i>
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- AI Generator Modal Trigger ---
  async triggerAiSubtaskGeneration() {
    const title = this.modalTodoTitle.value.trim();
    const desc = this.modalTodoDesc.value.trim();
    
    if (!title) {
      alert('Veuillez d\'abord saisir un titre de tâche ou projet.');
      return;
    }

    const hasKey = !!state.getGeminiKey();
    
    // Open loading screen
    const statusLabel = document.getElementById('ai-modal-status');
    const titleLabel = document.getElementById('ai-modal-title');
    
    if (hasKey) {
      titleLabel.textContent = 'Génération IA en cours...';
      statusLabel.textContent = 'Analyse de votre objectif par Gemini et création du plan d\'action...';
    } else {
      titleLabel.textContent = 'Planification locale...';
      statusLabel.textContent = 'Recherche dans les modèles locaux de Actio...';
    }

    this.aiModal.classList.add('active');

    try {
      const generatedList = await generateSubtasks(title, desc);
      
      // Map strings to subtask objects
      const newSubtasks = generatedList.map((str, idx) => ({
        id: 'sub-ai-' + Date.now() + '-' + idx,
        title: str,
        completed: false
      }));

      // If existing todo id is present, save immediately, otherwise we'll attach to the form saving
      const todoId = this.modalTodoId.value;
      if (todoId) {
        const todo = state.getTodo(todoId);
        // Concatenate new subtasks or replace? Usually replacing makes sense if they generated fresh,
        // but we'll replace to make it feel clean. Or ask/append. Let's merge/append so they don't lose work!
        const merged = [...(todo.subtasks || []), ...newSubtasks];
        state.updateSubtasks(todoId, merged);
        this.renderModalSubtasks(todo);
      } else {
        // Temp save on form elements so that saving the main form adds them
        this.temporarySubtasks = newSubtasks;
        this.renderTempSubtasks(newSubtasks);
      }

      this.aiModal.classList.remove('active');
    } catch (e) {
      this.aiModal.classList.remove('active');
      alert(`Erreur de génération : ${e.message}\nBascule automatique en mode local.`);
      
      // Fallback local logic directly if Gemini fails
      try {
        const localList = await generateSubtasks(title, ""); // empty key will force local
        const newSubtasks = localList.map((str, idx) => ({
          id: 'sub-local-' + Date.now() + '-' + idx,
          title: str,
          completed: false
        }));
        
        const todoId = this.modalTodoId.value;
        if (todoId) {
          const todo = state.getTodo(todoId);
          state.updateSubtasks(todoId, [...(todo.subtasks || []), ...newSubtasks]);
          this.renderModalSubtasks(todo);
        } else {
          this.temporarySubtasks = newSubtasks;
          this.renderTempSubtasks(newSubtasks);
        }
      } catch (err) {
        console.error('Erreur locale critique', err);
      }
    }
  }

  renderTempSubtasks(subtasks) {
    const total = subtasks.length;
    this.subtasksCompletionLabel.textContent = `0/${total}`;
    this.modalSubtasksProgress.style.width = `0%`;

    if (total === 0) {
      this.modalSubtaskList.innerHTML = '';
      return;
    }

    this.modalSubtaskList.innerHTML = subtasks.map(sub => {
      return `
        <div class="modal-subtask-item" data-subtask-id="${sub.id}">
          <div class="custom-checkbox" style="pointer-events: none;">
            <i data-lucide="check" style="width: 10px; height: 10px; opacity: 0;"></i>
          </div>
          <span class="subtask-title-text">${this.escapeHTML(sub.title)}</span>
          <button type="button" class="btn-icon btn-delete-temp-subtask" data-subtask-id="${sub.id}" title="Supprimer l'étape">
            <i data-lucide="x" style="width: 14px; height: 14px; color: var(--text-muted)"></i>
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- Navigation & State updates ---
  changeTab(tabId) {
    activeTab = tabId;
    
    // Update active nav button class
    this.navButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active container
    this.tabViews.forEach(view => {
      const viewId = view.getAttribute('id');
      if (viewId === `view-${tabId}-container`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    this.renderAll();
  }

  changeCategoryFilter(catId) {
    selectedCategoryFilter = catId;
    this.renderAll();
  }

  // --- Utilities ---
  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const ui = new UIManager();
export default ui;
