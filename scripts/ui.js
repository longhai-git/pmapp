function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    if (overlay) overlay.classList.remove('show');
    if (body) body.innerHTML = '';
}

function switchView(viewName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    
    const navBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
    const viewPanel = document.getElementById(`view-${viewName}`);
    if (navBtn) navBtn.classList.add('active');
    if (viewPanel) viewPanel.classList.add('active');
    
    const banner = document.getElementById('reminder-banner');
    if (banner) banner.style.display = 'none';
    
    if (viewName === 'home') {
        renderTodayFocus();
        renderWeekCalendar();
        renderHomeMonthCalendar();
        renderHomeYearCalendar();
        renderWeekProgress();
    } else if (viewName === 'schedule') {
        renderScheduleList();
    } else if (viewName === 'project') {
        renderProjectView();
    } else if (viewName === 'inspiration') {
        renderInspirations();
    } else if (viewName === 'archive') {
        renderArchive();
    }
}

function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.dataset.view;
            switchView(viewName);
        });
    });
    
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
    
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));
    
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => changeWeek(-1));
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => changeWeek(1));
    
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    if (prevDayBtn) prevDayBtn.addEventListener('click', () => changeDay(-1));
    if (nextDayBtn) nextDayBtn.addEventListener('click', () => changeDay(1));
    
    const prevYearBtn = document.getElementById('prev-year');
    const nextYearBtn = document.getElementById('next-year');
    if (prevYearBtn) prevYearBtn.addEventListener('click', () => changeYear(-1));
    if (nextYearBtn) nextYearBtn.addEventListener('click', () => changeYear(1));
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
}

function initTaskForm() {
    const form = document.getElementById('task-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const task = {
                title: document.getElementById('task-title').value,
                date: document.getElementById('task-date').value,
                startTime: document.getElementById('task-start-time').value,
                endTime: document.getElementById('task-end-time').value,
                type: document.getElementById('task-type').value,
                repeat: document.getElementById('task-repeat').value,
                reminder: document.getElementById('task-reminder').value,
                project: document.getElementById('task-project').value,
                urgent: document.getElementById('task-urgent').checked,
                priority: document.getElementById('task-priority').checked,
                note: document.getElementById('task-note').value
            };
            
            Storage.tasks.add(task);
            
            if (task.project) {
                let project = Storage.projects.getAll().find(p => p.name === task.project);
                if (!project) {
                    project = Storage.projects.add({ name: task.project, subtasks: [] });
                }
                Storage.projects.addSubtask(project.id, task.id);
            }
            
            form.reset();
            switchView('home');
            refreshAllViews();
        });
    }
}

function initEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function showTaskActionMenu(taskId, element) {
    const existingMenu = document.querySelector('.task-actions-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'task-actions-menu';
    menu.innerHTML = `
        <button class="task-action-item" onclick="editTask('${taskId}'); document.querySelector('.task-actions-menu').remove();">编辑</button>
        <button class="task-action-item" onclick="deleteTask('${taskId}'); document.querySelector('.task-actions-menu').remove();">删除</button>
        <button class="task-action-item" onclick="postponeTask('${taskId}', 30); document.querySelector('.task-actions-menu').remove();">延后30分钟</button>
        <button class="task-action-item" onclick="postponeTask('${taskId}', 60); document.querySelector('.task-actions-menu').remove();">延后1小时</button>
        <button class="task-action-item" onclick="toggleTaskUrgent('${taskId}'); document.querySelector('.task-actions-menu').remove();">标记紧急</button>
        <button class="task-action-item" onclick="toggleTaskPriority('${taskId}'); document.querySelector('.task-actions-menu').remove();">标记优先</button>
        <button class="task-action-item" onclick="toggleTaskStatus('${taskId}'); document.querySelector('.task-actions-menu').remove();">标记完成</button>
    `;
    
    const rect = element.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom}px`;
    
    document.body.appendChild(menu);
    
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

function postponeTask(taskId, minutes) {
    const task = Storage.tasks.getById(taskId);
    if (!task) return;
    
    const [hours, mins] = task.startTime.split(':').map(Number);
    let newTime = new Date();
    newTime.setHours(hours, mins + minutes);
    
    const newStartTime = `${String(newTime.getHours()).padStart(2, '0')}:${String(newTime.getMinutes()).padStart(2, '0')}`;
    
    Storage.tasks.update(taskId, { startTime: newStartTime });
    refreshAllViews();
}

function toggleTaskUrgent(taskId) {
    const task = Storage.tasks.getById(taskId);
    if (task) {
        Storage.tasks.update(taskId, { urgent: !task.urgent });
        refreshAllViews();
    }
}

function toggleTaskPriority(taskId) {
    const task = Storage.tasks.getById(taskId);
    if (task) {
        Storage.tasks.update(taskId, { priority: !task.priority });
        refreshAllViews();
    }
}