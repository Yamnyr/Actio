/* ==========================================================================
   Actio App Entrypoint & Event Handlers (Controller)
   ========================================================================== */

import { state } from './state.js';
import { ui } from './ui.js';

// Global variable to track the item being dragged
let draggedTodoId = null;

// --- Application Init ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial UI Render
  ui.renderAll();
  
  // 2. Bind Event Listeners
  bindNavigationEvents();
  bindSearchAndFilters();
  bindFormSubmissions();
  bindEventDelegation();
  bindDragAndDrop();
  bindKeyboardShortcuts();
});

// --- 1. Navigation Panel ---
function bindNavigationEvents() {
  // Sidebar tab buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      ui.changeTab(tabId);
    });
  });

  // Open modal button for new project
  const btnOpenProjectModal = document.getElementById('btn-open-new-project-modal');
  if (btnOpenProjectModal) {
    btnOpenProjectModal.addEventListener('click', () => {
      ui.openTodoModal();
    });
  }

  // Close modals
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.closeTodoModal();
    });
  });

  // Close modal when clicking outside the card
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        ui.closeTodoModal();
      }
    });
  });
}

// --- 2. Search & Categories Filter ---
function bindSearchAndFilters() {
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  // Search input change
  searchInput.addEventListener('input', () => {
    const val = searchInput.value;
    if (val.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    ui.renderActiveView();
  });

  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    ui.renderActiveView();
  });

  // Category filter chips (using delegation)
  document.getElementById('category-filters-container').addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    
    const catId = chip.getAttribute('data-category-id');
    ui.changeCategoryFilter(catId);
  });

  // Layout toggle button click
  const btnToggleLayout = document.getElementById('btn-toggle-layout');
  if (btnToggleLayout) {
    btnToggleLayout.addEventListener('click', () => {
      const currentLayout = state.getLayoutMode();
      const nextLayout = currentLayout === 'list' ? 'card' : 'list';
      state.saveLayoutMode(nextLayout);
      ui.renderAll();
    });
  }
}

// --- 3. Forms ---
function bindFormSubmissions() {
  // Quick Add Form (Quick view)
  const quickAddForm = document.getElementById('quick-add-form');
  quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const titleInput = document.getElementById('quick-add-input');
    const categorySelect = document.getElementById('quick-add-category');
    const prioritySelect = document.getElementById('quick-add-priority');
    
    const title = titleInput.value.trim();
    if (!title) return;

    state.addTodo({
      title: title,
      category: categorySelect.value,
      priority: prioritySelect.value,
      type: 'quick',
      dueDate: 'week' // Defaults to "Cette semaine"
    });

    titleInput.value = '';
    ui.renderAll();
    titleInput.focus();
  });

  // Category Creation Form
  const categoryForm = document.getElementById('category-create-form');
  categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const catNameInput = document.getElementById('new-cat-name');
    const name = catNameInput.value.trim();
    if (!name) return;

    state.addCategory(name, ui.selectedNewCategoryColor);
    
    catNameInput.value = '';
    ui.renderAll();
  });

  // Todo details / edit form modal
  const todoDetailsForm = document.getElementById('todo-details-form');
  todoDetailsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('modal-todo-id').value;
    const title = document.getElementById('modal-todo-title').value.trim();
    const category = document.getElementById('modal-todo-category').value;
    const priority = document.getElementById('modal-todo-priority').value;
    const type = document.getElementById('modal-todo-type').value;
    const dueDate = document.getElementById('modal-todo-due').value;
    const status = document.getElementById('modal-todo-status').value;
    const description = document.getElementById('modal-todo-desc').value;

    if (!title) return;

    const data = {
      title,
      category,
      priority,
      status,
      type,
      dueDate,
      description
    };

    if (id) {
      // Update
      state.updateTodo(id, data);
    } else {
      // Create
      const newTodo = state.addTodo(data);
      if (ui.temporarySubtasks && ui.temporarySubtasks.length > 0) {
        state.updateSubtasks(newTodo.id, ui.temporarySubtasks);
        ui.temporarySubtasks = [];
      }
    }

    ui.closeTodoModal();
    ui.renderAll();
  });
}

// --- 4. Event Delegation ---
function bindEventDelegation() {
  document.addEventListener('click', (e) => {
    
    // a. Click check status on Card
    const btnStatus = e.target.closest('.btn-toggle-status');
    if (btnStatus) {
      e.stopPropagation();
      const id = btnStatus.getAttribute('data-todo-id');
      const todo = state.getTodo(id);
      if (todo) {
        const nextStatus = todo.status === 'completed' ? 'pending' : 'completed';
        state.updateTodo(id, { status: nextStatus });
        ui.renderAll();
      }
      return;
    }

    // b. Click Card to view details
    const btnEdit = e.target.closest('.btn-edit-todo');
    if (btnEdit) {
      // Don't trigger if click was on a toggle status or delete button
      if (e.target.closest('.btn-toggle-status') || e.target.closest('.btn-delete-todo-quick')) {
        return;
      }
      const id = btnEdit.getAttribute('data-todo-id');
      ui.openTodoModal(id);
      return;
    }

    const btnEditAction = e.target.closest('.btn-edit-todo-action');
    if (btnEditAction) {
      e.stopPropagation();
      const id = btnEditAction.getAttribute('data-todo-id');
      ui.openTodoModal(id);
      return;
    }

    // c. Click quick delete card
    const btnDeleteQuick = e.target.closest('.btn-delete-todo-quick');
    if (btnDeleteQuick) {
      e.stopPropagation();
      const id = btnDeleteQuick.getAttribute('data-todo-id');
      const todo = state.getTodo(id);
      if (todo && confirm(`Voulez-vous vraiment supprimer la tâche "${todo.title}" ?`)) {
        state.deleteTodo(id);
        ui.renderAll();
      }
      return;
    }

    // d. Toggle Subtask completion inside Modal
    const btnToggleSubtask = e.target.closest('.btn-toggle-subtask');
    if (btnToggleSubtask) {
      const subtaskId = btnToggleSubtask.getAttribute('data-subtask-id');
      const todoId = document.getElementById('modal-todo-id').value;
      
      if (todoId) {
        state.toggleSubtask(todoId, subtaskId);
        const todo = state.getTodo(todoId);
        ui.renderModalSubtasks(todo);
        ui.renderSidebarStats(); // Refresh stats in background
      } else {
        // Temp todo subtask
        const sub = ui.temporarySubtasks.find(s => s.id === subtaskId);
        if (sub) {
          sub.completed = !sub.completed;
          ui.renderTempSubtasks(ui.temporarySubtasks);
        }
      }
      return;
    }

    // e. Delete Subtask inside Modal
    const btnDeleteSubtask = e.target.closest('.btn-delete-subtask');
    if (btnDeleteSubtask) {
      const subtaskId = btnDeleteSubtask.getAttribute('data-subtask-id');
      const todoId = document.getElementById('modal-todo-id').value;
      
      if (todoId) {
        state.deleteSubtask(todoId, subtaskId);
        const todo = state.getTodo(todoId);
        ui.renderModalSubtasks(todo);
      }
      return;
    }

    // Temp subtask delete
    const btnDeleteTempSubtask = e.target.closest('.btn-delete-temp-subtask');
    if (btnDeleteTempSubtask) {
      const subtaskId = btnDeleteTempSubtask.getAttribute('data-subtask-id');
      ui.temporarySubtasks = ui.temporarySubtasks.filter(s => s.id !== subtaskId);
      ui.renderTempSubtasks(ui.temporarySubtasks);
      return;
    }

    // f. Color option picker (Category View)
    const colorOpt = e.target.closest('.color-option');
    if (colorOpt) {
      const color = colorOpt.getAttribute('data-color');
      ui.selectedNewCategoryColor = color;
      ui.renderCategoriesList();
      return;
    }

    // g. Delete category
    const btnDeleteCat = e.target.closest('.btn-delete-category');
    if (btnDeleteCat) {
      const catId = btnDeleteCat.getAttribute('data-category-id');
      const cat = state.getCategory(catId);
      if (cat && confirm(`Voulez-vous supprimer la catégorie "${cat.name}" ? Toutes les tâches associées seront déplacées vers une autre catégorie.`)) {
        state.deleteCategory(catId);
        ui.renderAll();
      }
      return;
    }
  });

  // Modal Todo delete button click
  const btnDeleteTodoModal = document.getElementById('btn-delete-todo');
  btnDeleteTodoModal.addEventListener('click', () => {
    const id = document.getElementById('modal-todo-id').value;
    if (id) {
      const todo = state.getTodo(id);
      if (todo && confirm(`Voulez-vous vraiment supprimer définitivement "${todo.title}" ?`)) {
        state.deleteTodo(id);
        ui.closeTodoModal();
        ui.renderAll();
      }
    }
  });

  // Modal Modal Type select change (changes date planning view)
  const modalTodoTypeSelect = document.getElementById('modal-todo-type');
  modalTodoTypeSelect.addEventListener('change', () => {
    ui.adjustModalFieldsByType(modalTodoTypeSelect.value);
  });

  // Add Subtask Manually logic
  const handleAddSubtask = () => {
    const titleInput = document.getElementById('new-subtask-title-input');
    const title = titleInput.value.trim();
    if (!title) return;

    const todoId = document.getElementById('modal-todo-id').value;
    if (todoId) {
      state.addSubtask(todoId, title);
      const todo = state.getTodo(todoId);
      ui.renderModalSubtasks(todo);
    } else {
      // If we are creating a new task, keep subtasks in a temp array
      if (!ui.temporarySubtasks) ui.temporarySubtasks = [];
      ui.temporarySubtasks.push({
        id: 'sub-temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        title: title,
        completed: false
      });
      ui.renderTempSubtasks(ui.temporarySubtasks);
    }

    titleInput.value = '';
    titleInput.focus();
  };

  document.getElementById('btn-add-subtask-manually').addEventListener('click', handleAddSubtask);
  document.getElementById('new-subtask-title-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  });

  // AI subtask generation button
  document.getElementById('btn-trigger-ai-gen').addEventListener('click', () => {
    ui.triggerAiSubtaskGeneration();
  });

  // Settings Actions
  const keyVisibilityBtn = document.getElementById('toggle-key-visibility');
  keyVisibilityBtn.addEventListener('click', () => {
    const keyInput = document.getElementById('gemini-key-input');
    const icon = keyVisibilityBtn.querySelector('i');
    
    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      icon.setAttribute('data-lucide', 'eye-off');
    } else {
      keyInput.type = 'password';
      icon.setAttribute('data-lucide', 'eye');
    }
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  document.getElementById('save-settings-btn').addEventListener('click', () => {
    const keyInput = document.getElementById('gemini-key-input');
    state.saveGeminiKey(keyInput.value.trim());
    ui.renderAll();
    alert('Clé API Gemini enregistrée !');
  });

  document.getElementById('btn-export-data').addEventListener('click', () => {
    state.exportData();
  });

  const btnImportData = document.getElementById('btn-import-data');
  const importFile = document.getElementById('import-data-file');
  btnImportData.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const success = state.importData(text);
      if (success) {
        alert('Données importées avec succès !');
        ui.renderAll();
      } else {
        alert('Erreur d\'importation. Fichier invalide.');
      }
      importFile.value = ''; // Reset input
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-reset-app').addEventListener('click', () => {
    if (confirm('ATTENTION : Voulez-vous vraiment réinitialiser Actio ? Cette action va supprimer toutes vos tâches et restaurer les données d\'usine.')) {
      state.resetAll();
      ui.renderAll();
    }
  });
}

// --- 5. Drag & Drop ---
function bindDragAndDrop() {
  const container = document.querySelector('.tasks-groups-container');
  if (!container) return;

  // Listen to drag start on the document (delegation)
  document.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.todo-card');
    if (!card) return;

    draggedTodoId = card.getAttribute('data-todo-id');
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', draggedTodoId);
  });

  document.addEventListener('dragend', (e) => {
    const card = e.target.closest('.todo-card');
    if (!card) return;
    card.classList.remove('dragging');
    
    // Clear dropzone indicators
    document.querySelectorAll('.task-list-dropzone').forEach(drop => {
      drop.classList.remove('drag-over');
    });
  });

  // Dropzones event listeners
  document.querySelectorAll('.task-list-dropzone').forEach(dropzone => {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault(); // Required to allow dropping
    });

    dropzone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      
      const todoId = e.dataTransfer.getData('text/plain') || draggedTodoId;
      const targetColumn = dropzone.getAttribute('data-status'); // today, week, later

      if (todoId && targetColumn) {
        state.updateTodo(todoId, { dueDate: targetColumn });
        ui.renderAll();
      }
    });
  });
}

// --- 6. Keyboard Shortcuts ---
function bindKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Avoid triggering shortcuts if typing in input fields
    const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
    if (isTyping) {
      // Escape closes modal anyway (good ux)
      if (e.key === 'Escape') {
        ui.closeTodoModal();
      }
      return;
    }

    // N: New Todo
    if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      ui.openTodoModal();
      // Focus modal title
      setTimeout(() => {
        document.getElementById('modal-todo-title').focus();
      }, 100);
      return;
    }

    // /: Focus search bar
    if (e.key === '/') {
      e.preventDefault();
      const search = document.getElementById('search-input');
      search.focus();
      search.select();
      return;
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
      ui.closeTodoModal();
      return;
    }
  });
}
