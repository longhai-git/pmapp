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
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('show');
    
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
    
    let touchStartX = 0;
    let touchStartY = 0;
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        mainContent.addEventListener('touchmove', (e) => {
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            if (Math.abs(diffX) > Math.abs(diffY) && diffX > 80 && touchStartX < 50) {
                if (sidebar) sidebar.classList.remove('show');
            }
        }, { passive: true });
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

let currentAvatar = '👤';

function showAuthModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (modalTitle) modalTitle.textContent = '登录/注册';
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="auth-modal">
                <div class="auth-tabs">
                    <button class="auth-tab active" onclick="switchAuthTab('login')">登录</button>
                    <button class="auth-tab" onclick="switchAuthTab('register')">注册</button>
                </div>
                <div class="auth-form-content" id="auth-form-content">
                    <input type="tel" id="auth-phone" placeholder="手机号" class="form-input" maxlength="11">
                    <input type="password" id="auth-password" placeholder="密码" class="form-input">
                </div>
                <button class="btn-primary" onclick="handleAuthSubmit()" id="auth-submit-btn">登录</button>
            </div>
        `;
    }
    
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    if (overlay) overlay.classList.add('show');
    if (modal) modal.classList.add('show');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const submitBtn = document.getElementById('auth-submit-btn');
    if (submitBtn) submitBtn.textContent = tab === 'login' ? '登录' : '注册';
}

async function handleAuthSubmit() {
    const phone = document.getElementById('auth-phone').value;
    const password = document.getElementById('auth-password').value;
    const submitBtn = document.getElementById('auth-submit-btn');
    
    if (!phone || !password) {
        alert('请输入手机号和密码');
        return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        alert('请输入有效的手机号');
        return;
    }
    
    if (password.length < 6) {
        alert('密码长度至少为6位');
        return;
    }
    
    const email = `${phone}@pmapp.local`;
    
    try {
        if (submitBtn.textContent === '登录') {
            await signIn(email, password);
            alert('登录成功！');
        } else {
            await signUp(email, password);
            alert('注册成功！请登录');
            return;
        }
        
        closeModal();
        await checkAuthStatus();
        await Storage.syncAll();
        refreshAllViews();
    } catch (error) {
        alert('操作失败：' + error.message);
    }
}

async function checkAuthStatus() {
    const user = await getCurrentUser();
    const userNameEl = document.getElementById('user-name');
    const avatarBtn = document.getElementById('user-avatar-btn');
    const settingsAuthStatus = document.getElementById('settings-auth-status');
    const settingsAuthBtn = document.getElementById('settings-auth-btn');
    const profileSettings = document.getElementById('profile-settings');
    const settingsSyncBtn = document.getElementById('settings-sync-btn');
    const profileNameInput = document.getElementById('profile-name');
    
    if (user) {
        const profile = getStoredProfile();
        if (userNameEl) userNameEl.textContent = profile.name || user.email.split('@')[0];
        if (avatarBtn) avatarBtn.textContent = profile.avatar || '👤';
        currentAvatar = profile.avatar || '👤';
        if (settingsAuthStatus) settingsAuthStatus.textContent = '已登录';
        if (settingsAuthBtn) settingsAuthBtn.style.display = 'none';
        if (profileSettings) profileSettings.style.display = 'block';
        if (settingsSyncBtn) settingsSyncBtn.style.display = 'block';
        if (profileNameInput) profileNameInput.value = profile.name || '';
    } else {
        if (userNameEl) userNameEl.textContent = '';
        if (avatarBtn) avatarBtn.textContent = '👤';
        currentAvatar = '👤';
        if (settingsAuthStatus) settingsAuthStatus.textContent = '未登录';
        if (settingsAuthBtn) settingsAuthBtn.style.display = 'block';
        if (profileSettings) profileSettings.style.display = 'none';
        if (settingsSyncBtn) settingsSyncBtn.style.display = 'none';
    }
    
    return !!user;
}

function getStoredProfile() {
    const profile = localStorage.getItem('pmapp_profile');
    return profile ? JSON.parse(profile) : { name: '', avatar: '👤' };
}

function selectAvatar(avatar) {
    currentAvatar = avatar;
    document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.style.border = opt.textContent === avatar ? '2px solid var(--primary-color)' : '2px solid transparent';
    });
}

async function saveProfile() {
    const name = document.getElementById('profile-name').value;
    
    const profile = {
        name: name,
        avatar: currentAvatar
    };
    
    localStorage.setItem('pmapp_profile', JSON.stringify(profile));
    
    await checkAuthStatus();
    alert('个人信息保存成功！');
}

async function handleSignOut() {
    try {
        await signOut();
        localStorage.removeItem('pmapp_profile');
        alert('已退出登录');
        await checkAuthStatus();
    } catch (error) {
        alert('退出失败：' + error.message);
    }
}

async function handleSync() {
    try {
        await Storage.syncAll();
        alert('同步完成！');
        refreshAllViews();
    } catch (error) {
        alert('同步失败：' + error.message);
    }
}