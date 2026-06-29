let currentViewDate = new Date();

function renderMonthView() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    
    document.getElementById('month-title').textContent = `${year}年${month + 1}月`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const today = new Date().toISOString().split('T')[0];
    const tasks = Storage.tasks.getAll();
    const taskDates = new Set(tasks.map(t => t.date));
    
    let html = '';
    
    for (let i = 0; i < startDay; i++) {
        html += `<div class="month-day other-month"></div>`;
    }
    
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === today;
        const hasTask = taskDates.has(dateStr);
        
        html += `
            <div class="month-day ${isToday ? 'today' : ''}" data-date="${dateStr}" onclick="goToDayView('${dateStr}')">
                ${day}
                ${hasTask ? '<span class="task-dot"></span>' : ''}
            </div>
        `;
    }
    
    document.getElementById('month-grid').innerHTML = html;
}

function renderWeekView() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const date = currentViewDate.getDate();
    
    const startOfWeek = new Date(year, month, date - currentViewDate.getDay());
    const days = [];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push(d);
    }
    
    const startDateStr = formatDate(days[0]);
    const endDateStr = formatDate(days[6]);
    document.getElementById('week-title').textContent = `${startDateStr} - ${endDateStr}`;
    
    const tasks = Storage.tasks.getAll();
    const today = new Date().toISOString().split('T')[0];
    
    let html = `
        <div class="week-view">
            <div class="week-time-column">
                ${generateTimeSlots(6, 23, 60)}
            </div>
    `;
    
    days.forEach(day => {
        const dateStr = formatDate(day);
        const isToday = dateStr === today;
        const dayName = ['日', '一', '二', '三', '四', '五', '六'][day.getDay()];
        
        html += `
            <div class="week-day-column">
                <div class="week-day-header ${isToday ? 'today' : ''}">
                    <span>${dayName}</span>
                    <span>${day.getDate()}</span>
                </div>
                ${generateWeekDaySlots(dateStr, tasks)}
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('week-view-container').innerHTML = html;
}

function generateTimeSlots(startHour, endHour, slotMinutes) {
    let html = '';
    for (let hour = startHour; hour <= endHour; hour++) {
        html += `<div class="week-time-slot">${String(hour).padStart(2, '0')}:00</div>`;
    }
    return html;
}

function generateWeekDaySlots(dateStr, tasks) {
    let html = '';
    const dayTasks = tasks.filter(t => t.date === dateStr);
    
    for (let hour = 6; hour <= 23; hour++) {
        const hourTasks = dayTasks.filter(t => {
            const taskHour = parseInt(t.startTime.split(':')[0]);
            return taskHour === hour;
        });
        
        html += `<div class="week-slot" data-date="${dateStr}" data-hour="${hour}">`;
        hourTasks.forEach(task => {
            html += `<div class="task-item ${task.status}" onclick="editTask('${task.id}')">${task.title}</div>`;
        });
        html += '</div>';
    }
    
    return html;
}

function renderDayView(dateStr = null) {
    const date = dateStr ? new Date(dateStr) : currentViewDate;
    const displayDate = formatDate(date);
    
    document.getElementById('day-title').textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    
    const tasks = Storage.tasks.getAll();
    const dayTasks = tasks.filter(t => t.date === displayDate);
    
    let html = `
        <div class="day-view">
            <div class="day-time-column">
                ${generateDayTimeSlots()}
            </div>
            <div class="day-task-column">
                ${generateDayTaskSlots(displayDate, dayTasks)}
            </div>
        </div>
    `;
    
    document.getElementById('day-view-container').innerHTML = html;
}

function generateDayTimeSlots() {
    let html = '';
    for (let hour = 6; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            html += `<div class="day-time-slot">${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}</div>`;
        }
    }
    return html;
}

function generateDayTaskSlots(dateStr, tasks) {
    let html = '';
    
    for (let hour = 6; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const slotTasks = tasks.filter(t => t.startTime === timeStr);
            
            html += `<div class="day-task-slot" data-date="${dateStr}" data-time="${timeStr}">`;
            slotTasks.forEach(task => {
                html += `
                    <div class="task-item ${task.status} ${task.urgent ? 'urgent' : ''}" onclick="editTask('${task.id}')">
                        ${task.title}
                    </div>
                `;
            });
            html += '</div>';
        }
    }
    
    return html;
}

function renderYearView() {
    const year = currentViewDate.getFullYear();
    document.getElementById('year-title').textContent = `${year}年`;
    
    const tasks = Storage.tasks.getAll();
    const taskCountByDate = {};
    
    tasks.forEach(task => {
        if (task.date.startsWith(year.toString())) {
            taskCountByDate[task.date] = (taskCountByDate[task.date] || 0) + 1;
        }
    });
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    let html = '';
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        const count = taskCountByDate[dateStr] || 0;
        let level = 0;
        
        if (count > 0) level = 1;
        if (count > 2) level = 2;
        if (count > 4) level = 3;
        if (count > 6) level = 4;
        
        html += `<div class="heatmap-cell heatmap-level-${level}" title="${dateStr}: ${count}个任务"></div>`;
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    document.getElementById('year-heatmap').innerHTML = html;
}

function renderScheduleList(tasks = null) {
    if (!tasks) {
        tasks = Storage.tasks.getAll();
    }
    
    tasks.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
    });
    
    let html = '';
    
    if (tasks.length === 0) {
        html = '<div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--text-secondary); font-size: 16px;">暂无日程任务</div>';
    } else {
        tasks.forEach(task => {
            const cardClass = `${task.status} ${task.urgent ? 'urgent' : ''} ${task.priority ? 'priority' : ''}`;
            const dateObj = new Date(task.date);
            const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
            const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dateObj.getDay()];
            
            html += `
                <div class="schedule-card ${cardClass}" onclick="editTask('${task.id}')">
                    <div class="schedule-time">
                        <div class="schedule-date">${dateStr} ${weekDay}</div>
                        <div class="schedule-duration">${task.startTime} - ${task.endTime}</div>
                    </div>
                    <div class="schedule-info">
                        <div class="schedule-title">${task.title}</div>
                        <div class="schedule-meta">
                            ${task.project ? `<span>项目: ${task.project}</span>` : ''}
                            ${task.type === 'sub' ? '<span>子任务</span>' : ''}
                            ${task.urgent ? '<span>紧急</span>' : ''}
                            ${task.priority ? '<span>优先</span>' : ''}
                        </div>
                    </div>
                    <div class="schedule-actions">
                        <button class="action-btn" onclick="event.stopPropagation(); editTask('${task.id}')">✏️</button>
                        <button class="action-btn" onclick="event.stopPropagation(); deleteTask('${task.id}')">🗑️</button>
                    </div>
                </div>
            `;
        });
    }
    
    document.getElementById('schedule-list').innerHTML = html;
}

function filterSchedule() {
    const searchText = document.getElementById('schedule-search').value.toLowerCase();
    const dateFrom = document.getElementById('schedule-date-from').value;
    const dateTo = document.getElementById('schedule-date-to').value;
    
    let tasks = Storage.tasks.getAll();
    
    if (searchText) {
        tasks = tasks.filter(task => {
            const titleMatch = task.title.toLowerCase().includes(searchText);
            const dateMatch = task.date.includes(searchText);
            const timeMatch = task.startTime.includes(searchText) || task.endTime.includes(searchText);
            return titleMatch || dateMatch || timeMatch;
        });
    }
    
    if (dateFrom) {
        tasks = tasks.filter(task => task.date >= dateFrom);
    }
    
    if (dateTo) {
        tasks = tasks.filter(task => task.date <= dateTo);
    }
    
    renderScheduleList(tasks);
}

function applyQuickFilter() {
    const filterType = document.getElementById('schedule-quick-filter').value;
    const dateRangeInput = document.getElementById('custom-date-range');
    const dateFromInput = document.getElementById('schedule-date-from');
    const dateToInput = document.getElementById('schedule-date-to');
    
    dateFromInput.value = '';
    dateToInput.value = '';
    
    if (filterType === 'custom') {
        dateRangeInput.style.display = 'flex';
        filterSchedule();
        return;
    }
    
    dateRangeInput.style.display = 'none';
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (filterType === 'today') {
        dateFromInput.value = todayStr;
        dateToInput.value = todayStr;
    } else if (filterType === 'week') {
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        dateFromInput.value = monday.toISOString().split('T')[0];
        dateToInput.value = sunday.toISOString().split('T')[0];
    } else if (filterType === 'month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        dateFromInput.value = firstDay.toISOString().split('T')[0];
        dateToInput.value = lastDay.toISOString().split('T')[0];
    }
    
    filterSchedule();
}

function renderProjectView() {
    const projects = Storage.projects.getAll();
    const tasks = Storage.tasks.getAll();
    
    let html = '';
    
    projects.forEach(project => {
        const projectTasks = tasks.filter(t => project.subtasks.includes(t.id));
        const completedCount = projectTasks.filter(t => t.status === 'completed').length;
        const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;
        
        html += `
            <div class="project-card">
                <div class="project-header">
                    <div class="project-title">${project.name}</div>
                    <button class="action-btn" onclick="deleteProject('${project.id}')">🗑️</button>
                </div>
                <div class="project-progress-container">
                    <div class="project-progress-bar">
                        <div class="project-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="project-progress-text">${completedCount}/${projectTasks.length} 完成</div>
                </div>
                <div class="project-subtasks">
        `;
        
        projectTasks.forEach(task => {
            html += `
                <div class="subtask-item ${task.status}" onclick="toggleTaskStatus('${task.id}')">
                    <div class="subtask-checkbox ${task.status === 'completed' ? 'checked' : ''}">
                        ${task.status === 'completed' ? '✓' : ''}
                    </div>
                    <div class="subtask-title">${task.title}</div>
                    <button class="action-btn" onclick="event.stopPropagation(); removeSubtask('${project.id}', '${task.id}')">✕</button>
                </div>
            `;
        });
        
        html += `
                </div>
                <button class="add-focus-btn" style="margin-top: 15px; width: 100%;" onclick="addSubtaskToProject('${project.id}')">+ 添加子任务</button>
            </div>
        `;
    });
    
    document.getElementById('project-container').innerHTML = html;
}

let selectedHomeDate = null;

function getTaskStatusClass(task) {
    if (task.status === 'completed') return 'completed';
    
    const now = new Date();
    const taskDate = new Date(task.date);
    const taskEndTime = task.endTime;
    
    const [endHour, endMinute] = taskEndTime.split(':').map(Number);
    const taskEndDate = new Date(taskDate);
    taskEndDate.setHours(endHour, endMinute, 0, 0);
    
    if (now > taskEndDate) {
        return 'overdue';
    }
    
    const [startHour, startMinute] = task.startTime.split(':').map(Number);
    const taskStartDate = new Date(taskDate);
    taskStartDate.setHours(startHour, startMinute, 0, 0);
    
    if (now >= taskStartDate && now <= taskEndDate) {
        return 'running';
    }
    
    return 'pending';
}

function renderTodayFocus(dateStr = null) {
    selectedHomeDate = dateStr;
    let tasks;
    let titleText;
    
    if (dateStr) {
        tasks = Storage.tasks.getAll().filter(t => t.date === dateStr);
        const dateObj = new Date(dateStr);
        titleText = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
    } else {
        tasks = Storage.tasks.getTodayTasks();
        titleText = '今日重点';
    }
    
    const maxTasks = 4;
    const displayTasks = tasks.slice(0, maxTasks);
    
    document.querySelector('.home-left .section-title').textContent = titleText;
    
    let html = '';
    
    displayTasks.forEach(task => {
        const statusClass = getTaskStatusClass(task);
        const tags = [];
        if (task.urgent) tags.push('<span class="focus-tag urgent">紧急</span>');
        if (task.priority) tags.push('<span class="focus-tag priority">优先</span>');
        if (task.status === 'completed') tags.push('<span class="focus-tag completed">完成</span>');
        
        const cardClass = `${statusClass} ${task.urgent ? 'urgent' : ''} ${task.priority ? 'priority' : ''}`;
        html += `
            <div class="focus-card ${cardClass}" onclick="editTask('${task.id}')">
                    <div class="focus-card-header">
                        <span>${titleText}</span>
                        <span class="focus-card-menu" onclick="event.stopPropagation(); showTaskActionMenu('${task.id}', this)">⋮⋮</span>
                    </div>
                    <div class="focus-time">${task.startTime}${tags.join('')}</div>
                    <div class="focus-title">${task.title}</div>
                    <div class="focus-progress">
                        <div class="focus-progress-bar" style="width: ${task.status === 'completed' ? '100%' : '60%'}"></div>
                    </div>
                </div>
        `;
    });
    
    if (displayTasks.length === 0) {
        const emptyText = dateStr ? `${titleText}暂无任务` : '今天暂无任务';
        html = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">${emptyText}</div>`;
    }
    
    document.getElementById('focus-cards').innerHTML = html;
    
    highlightSelectedDate(dateStr);
}

function highlightSelectedDate(dateStr) {
    document.querySelectorAll('.calendar-cell').forEach(cell => {
        cell.classList.remove('selected');
        if (dateStr && cell.getAttribute('data-date') === dateStr) {
            cell.classList.add('selected');
        }
    });
    document.querySelectorAll('.home-month-day').forEach(cell => {
        cell.classList.remove('selected');
        if (dateStr && cell.getAttribute('data-date') === dateStr) {
            cell.classList.add('selected');
        }
    });
}

function handleHomeCalendarClick(dateStr) {
    renderTodayFocus(dateStr);
}

function renderWeekPreview() {
    const today = new Date();
    const days = [];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    
    const tasks = Storage.tasks.getAll();
    const taskDates = new Set(tasks.map(t => t.date));
    
    let html = '';
    
    days.forEach(day => {
        const dateStr = formatDate(day);
        const isToday = dateStr === today.toISOString().split('T')[0];
        const hasTask = taskDates.has(dateStr);
        const dayName = ['日', '一', '二', '三', '四', '五', '六'][day.getDay()];
        
        html += `
            <div class="week-day ${isToday ? 'today' : ''} ${hasTask ? 'has-task' : ''}" onclick="goToDayView('${dateStr}')">
                <div class="week-day-name">${dayName}</div>
                <div class="week-day-number">${day.getDate()}</div>
            </div>
        `;
    });
    
    document.getElementById('week-grid').innerHTML = html;
}

function renderWeekCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay();
    
    const tasks = Storage.tasks.getAll();
    const taskCounts = {};
    tasks.forEach(t => {
        taskCounts[t.date] = (taskCounts[t.date] || 0) + 1;
    });
    
    const todayStr = today.toISOString().split('T')[0];
    
    let html = '<div class="calendar-header"><span></span>';
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    dayNames.forEach(name => {
        html += `<span>${name}</span>`;
    });
    html += '</div>';
    
    html += '<div class="calendar-body">';
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="calendar-cell other-month">${day}</div>`;
    }
    
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const taskCount = taskCounts[dateStr] || 0;
        const hasTask = taskCount > 0;
        const taskBadge = hasTask ? `<span class="task-badge">${taskCount > 9 ? '9+' : taskCount}</span>` : '';
        
        html += `<div class="calendar-cell ${isToday ? 'today' : ''} ${hasTask ? 'has-task' : ''}" data-date="${dateStr}" onclick="handleHomeCalendarClick('${dateStr}')">${day}${taskBadge}</div>`;
    }
    
    const remainingCells = 42 - (startDay + totalDays);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-cell other-month">${day}</div>`;
    }
    
    html += '</div>';
    
    const el = document.getElementById('home-week-calendar');
    if (el) el.innerHTML = html;
    
    highlightSelectedDate(selectedHomeDate);
}

function renderHomeMonthCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay();
    
    const tasks = Storage.tasks.getAll();
    const taskCounts = {};
    tasks.forEach(t => {
        taskCounts[t.date] = (taskCounts[t.date] || 0) + 1;
    });
    
    const todayStr = today.toISOString().split('T')[0];
    
    let html = '<div class="calendar-header">';
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    dayNames.forEach(name => {
        html += `<span>${name}</span>`;
    });
    html += '</div>';
    
    html += '<div class="home-month-grid">';
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="home-month-day other-month">${day}</div>`;
    }
    
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const taskCount = taskCounts[dateStr] || 0;
        const hasTask = taskCount > 0;
        const taskBadge = hasTask ? `<span class="task-badge">${taskCount > 9 ? '9+' : taskCount}</span>` : '';
        
        html += `<div class="home-month-day ${isToday ? 'today' : ''} ${hasTask ? 'has-task' : ''}" data-date="${dateStr}" onclick="handleHomeCalendarClick('${dateStr}')">${day}${taskBadge}</div>`;
    }
    
    const remainingCells = 42 - (startDay + totalDays);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="home-month-day other-month">${day}</div>`;
    }
    
    html += '</div>';
    
    const el = document.getElementById('home-month-calendar');
    if (el) el.innerHTML = html;
    
    highlightSelectedDate(selectedHomeDate);
}

function renderHomeYearCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const tasks = Storage.tasks.getAll();
    const monthTaskCounts = {};
    tasks.forEach(t => {
        const monthKey = t.date.substring(0, 7);
        monthTaskCounts[monthKey] = (monthTaskCounts[monthKey] || 0) + 1;
    });
    
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    let html = '<div class="home-year-grid">';
    
    for (let month = 0; month < 12; month++) {
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const taskCount = monthTaskCounts[monthKey] || 0;
        const hasTask = taskCount > 0;
        const isCurrentMonth = month === currentMonth;
        const taskBadge = hasTask ? `<span class="task-badge">${taskCount > 9 ? '9+' : taskCount}</span>` : '';
        
        html += `
            <div class="home-year-month ${isCurrentMonth ? 'active' : ''} ${hasTask ? 'has-task' : ''}" onclick="handleHomeYearClick(${year}, ${month})">
                ${monthNames[month]}
                ${taskBadge}
            </div>
        `;
    }
    
    html += '</div>';
    
    const el = document.getElementById('home-year-calendar');
    if (el) el.innerHTML = html;
}

function handleHomeYearClick(year, month) {
    switchHomeCalendar('month');
    const firstDay = new Date(year, month, 1);
    renderHomeMonthCalendar();
}

function switchHomeCalendar(viewType) {
    document.querySelectorAll('.view-option').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.view-option[data-view="${viewType}"]`).classList.add('active');
    
    const calendarContent = document.getElementById('calendar-content');
    calendarContent.className = `calendar-content ${viewType}`;
    
    const title = document.getElementById('calendar-title');
    const titles = { week: '周视图', month: '月视图', year: '年视图' };
    title.textContent = titles[viewType];
    
    document.getElementById('view-selector-menu').classList.remove('show');
}

function renderWeekProgress() {
    const weekTasks = Storage.tasks.getWeekTasks();
    const completedCount = weekTasks.filter(t => t.status === 'completed').length;
    const pendingCount = weekTasks.length - completedCount;
    const progress = weekTasks.length > 0 ? Math.round((completedCount / weekTasks.length) * 100) : 0;
    
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (progress / 100) * circumference;
    
    document.querySelector('.progress-ring-fill').style.strokeDashoffset = offset;
    document.getElementById('progress-text').textContent = `${progress}%`;
    document.getElementById('completed-count').textContent = `${completedCount}项`;
    document.getElementById('pending-count').textContent = `${pendingCount}项`;
}

function renderArchive() {
    const weekTasks = Storage.tasks.getWeekTasks();
    const completedTasks = Storage.tasks.getCompletedTasks();
    const uncompletedTasks = Storage.tasks.getUncompletedTasks();
    
    renderArchiveSection('archive-week', weekTasks);
    renderArchiveSection('archive-completed', completedTasks);
    renderArchiveSection('archive-uncompleted', uncompletedTasks);
}

function renderArchiveSection(containerId, tasks) {
    let html = '';
    
    if (tasks.length === 0) {
        html = '<div class="empty-state">暂无数据</div>';
    } else {
        tasks.forEach(task => {
            const hasNote = task.note && task.note.trim().length > 0;
            html += `
                <div class="archive-item ${task.status}">
                    <div class="archive-title">
                        ${hasNote ? '<span class="note-dot"></span>' : ''}
                        <span class="archive-title-text">${task.title}</span>
                    </div>
                    <div class="archive-time">${task.date} ${task.startTime}</div>
                    <button class="action-btn" onclick="openNoteEditor('${task.id}', this)">📝</button>
                    <button class="action-btn" onclick="deleteTask('${task.id}')">🗑️</button>
                </div>
            `;
        });
    }
    
    document.getElementById(containerId).innerHTML = html;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function openNoteEditor(taskId, btn) {
    const task = Storage.tasks.getById(taskId);
    const note = task.note || '';
    
    const editorHtml = `
        <div class="note-editor-overlay" onclick="closeNoteEditor()">
            <div class="note-editor" onclick="event.stopPropagation()">
                <div class="note-editor-header">
                    <h3>编辑备注</h3>
                    <button class="close-btn" onclick="closeNoteEditor()">✕</button>
                </div>
                <div class="editor-toolbar">
                    <button class="toolbar-btn" onclick="execNoteFormat('bold')" title="加粗">B</button>
                    <button class="toolbar-btn" onclick="execNoteFormat('italic')" title="斜体">I</button>
                    <button class="toolbar-btn" onclick="execNoteFormat('underline')" title="下划线">U</button>
                    <button class="toolbar-btn" onclick="execNoteFormat('strikeThrough')" title="删除线">S</button>
                    <div style="width: 1px; height: 24px; background: #ddd; margin: 0 5px;"></div>
                    <button class="toolbar-btn" onclick="execNoteFormat('insertUnorderedList')" title="无序列表">☰</button>
                    <button class="toolbar-btn" onclick="execNoteFormat('insertOrderedList')" title="有序列表">☷</button>
                    <button class="toolbar-btn" onclick="execNoteFormat('outdent')" title="减少缩进">⇦</button>
                    <button class="toolbar-btn" onclick="execNoteFormat('indent')" title="增加缩进">⇨</button>
                    <div style="width: 1px; height: 24px; background: #ddd; margin: 0 5px;"></div>
                    <button class="toolbar-btn" onclick="execNoteFormat('justifyLeft')" title="左对齐">↺</button>
                    <button class="toolbar-btn" onclick="execNoteFormat('justifyCenter')" title="居中">↻</button>
                    <button class="toolbar-btn" onclick="execNoteFormat('justifyRight')" title="右对齐">↻</button>
                    <div style="width: 1px; height: 24px; background: #ddd; margin: 0 5px;"></div>
                    <button class="toolbar-btn" onclick="insertNoteLink()" title="插入链接">🔗</button>
                    <button class="toolbar-btn" onclick="insertNoteImage()" title="插入图片">🖼️</button>
                </div>
                <div class="note-editor-content" id="note-editor-content" contenteditable="true">${note}</div>
                <div class="note-editor-footer">
                    <button class="btn-cancel" onclick="closeNoteEditor()">取消</button>
                    <button class="btn-primary" onclick="saveNote('${taskId}')">保存</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', editorHtml);
}

function execNoteFormat(command) {
    document.execCommand(command, false, null);
    document.getElementById('note-editor-content').focus();
}

function insertNoteLink() {
    const url = prompt('请输入链接地址：', 'https://');
    if (url) {
        document.execCommand('createLink', false, url);
    }
    document.getElementById('note-editor-content').focus();
}

function insertNoteImage() {
    const url = prompt('请输入图片地址：', 'https://');
    if (url) {
        document.execCommand('insertImage', false, url);
    }
    document.getElementById('note-editor-content').focus();
}

function closeNoteEditor() {
    const overlay = document.querySelector('.note-editor-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function saveNote(taskId) {
    const note = document.getElementById('note-editor-content').innerHTML;
    Storage.tasks.update(taskId, { note });
    closeNoteEditor();
    renderArchive();
}

function goToDayView(dateStr) {
    currentViewDate = new Date(dateStr);
    switchView('schedule');
    switchTab('day');
    renderDayView(dateStr);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    if (tabName === 'month') renderMonthView();
    if (tabName === 'week') renderWeekView();
    if (tabName === 'day') renderDayView();
    if (tabName === 'year') renderYearView();
    if (tabName === 'list') renderScheduleList();
}

function changeMonth(delta) {
    currentViewDate.setMonth(currentViewDate.getMonth() + delta);
    renderMonthView();
}

function changeWeek(delta) {
    currentViewDate.setDate(currentViewDate.getDate() + delta * 7);
    renderWeekView();
}

function changeDay(delta) {
    currentViewDate.setDate(currentViewDate.getDate() + delta);
    renderDayView();
}

function changeYear(delta) {
    currentViewDate.setFullYear(currentViewDate.getFullYear() + delta);
    renderYearView();
}

function showAddTaskModal() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    const tasks = Storage.tasks.getAll();
    const taskCount = tasks.length + 1;
    const autoTitle = `任务${taskCount}`;
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    modalTitle.textContent = '添加任务';
    modalBody.innerHTML = `
        <form id="add-task-form" onsubmit="handleAddTask(event)">
            <div class="form-group">
                <label>标题</label>
                <input type="text" name="title" required placeholder="输入任务标题" value="${autoTitle}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>日期</label>
                    <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>开始时间</label>
                    <input type="time" name="startTime" required value="${currentTime}">
                </div>
                <div class="form-group">
                    <label>结束时间</label>
                    <input type="time" name="endTime" required value="23:59">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>类型</label>
                    <select name="type">
                        <option value="main">主任务</option>
                        <option value="sub">子任务</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>重复</label>
                    <select name="repeat">
                        <option value="none">不重复</option>
                        <option value="daily">每天</option>
                        <option value="weekly">每周</option>
                        <option value="monthly">每月</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>提醒</label>
                    <select name="reminder">
                        <option value="none">不提醒</option>
                        <option value="5min">提前5分钟</option>
                        <option value="15min">提前15分钟</option>
                        <option value="30min">提前30分钟</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>归属项目</label>
                <input type="text" name="project" placeholder="输入项目名称">
            </div>
            <div class="form-row">
                <label class="checkbox-label">
                    <input type="checkbox" name="urgent">
                    <span>紧急</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="priority">
                    <span>优先</span>
                </label>
            </div>
            <div class="form-group">
                <label>备注</label>
                <textarea name="note" rows="3" placeholder="输入备注"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
                <button type="submit" class="btn-primary">保存</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-overlay').classList.add('show');
}

function handleAddTask(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const task = {
        title: formData.get('title'),
        date: formData.get('date'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        type: formData.get('type'),
        repeat: formData.get('repeat'),
        reminder: formData.get('reminder'),
        project: formData.get('project'),
        urgent: formData.get('urgent') === 'on',
        priority: formData.get('priority') === 'on',
        note: formData.get('note')
    };
    
    Storage.tasks.add(task);
    
    if (task.project) {
        let project = Storage.projects.getAll().find(p => p.name === task.project);
        if (!project) {
            project = Storage.projects.add({ name: task.project, subtasks: [] });
        }
        Storage.projects.addSubtask(project.id, task.id);
    }
    
    closeModal();
    refreshAllViews();
}

function editTask(taskId) {
    const task = Storage.tasks.getById(taskId);
    if (!task) return;
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '编辑任务';
    modalBody.innerHTML = `
        <form id="edit-task-form" onsubmit="handleEditTask(event, '${taskId}')">
            <div class="form-group">
                <label>标题</label>
                <input type="text" name="title" required value="${task.title}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>日期</label>
                    <input type="date" name="date" required value="${task.date}">
                </div>
                <div class="form-group">
                    <label>开始时间</label>
                    <input type="time" name="startTime" required value="${task.startTime}">
                </div>
                <div class="form-group">
                    <label>结束时间</label>
                    <input type="time" name="endTime" required value="${task.endTime}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>类型</label>
                    <select name="type">
                        <option value="main" ${task.type === 'main' ? 'selected' : ''}>主任务</option>
                        <option value="sub" ${task.type === 'sub' ? 'selected' : ''}>子任务</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>重复</label>
                    <select name="repeat">
                        <option value="none" ${task.repeat === 'none' ? 'selected' : ''}>不重复</option>
                        <option value="daily" ${task.repeat === 'daily' ? 'selected' : ''}>每天</option>
                        <option value="weekly" ${task.repeat === 'weekly' ? 'selected' : ''}>每周</option>
                        <option value="monthly" ${task.repeat === 'monthly' ? 'selected' : ''}>每月</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>提醒</label>
                    <select name="reminder">
                        <option value="none" ${task.reminder === 'none' ? 'selected' : ''}>不提醒</option>
                        <option value="5min" ${task.reminder === '5min' ? 'selected' : ''}>提前5分钟</option>
                        <option value="15min" ${task.reminder === '15min' ? 'selected' : ''}>提前15分钟</option>
                        <option value="30min" ${task.reminder === '30min' ? 'selected' : ''}>提前30分钟</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>归属项目</label>
                <input type="text" name="project" value="${task.project}">
            </div>
            <div class="form-row">
                <label class="checkbox-label">
                    <input type="checkbox" name="urgent" ${task.urgent ? 'checked' : ''}>
                    <span>紧急</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="priority" ${task.priority ? 'checked' : ''}>
                    <span>优先</span>
                </label>
            </div>
            <div class="form-group">
                <label>备注</label>
                <textarea name="note" rows="3">${task.note}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
                <button type="submit" class="btn-primary">保存</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-overlay').classList.add('show');
}

function handleEditTask(e, taskId) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const updates = {
        title: formData.get('title'),
        date: formData.get('date'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        type: formData.get('type'),
        repeat: formData.get('repeat'),
        reminder: formData.get('reminder'),
        project: formData.get('project'),
        urgent: formData.get('urgent') === 'on',
        priority: formData.get('priority') === 'on',
        note: formData.get('note')
    };
    
    Storage.tasks.update(taskId, updates);
    closeModal();
    refreshAllViews();
}

function deleteTask(taskId) {
    if (!confirm('确定要删除这个任务吗？')) return;
    Storage.tasks.delete(taskId);
    refreshAllViews();
}

function toggleTaskStatus(taskId) {
    Storage.tasks.toggleStatus(taskId);
    refreshAllViews();
}

function showAddProjectModal() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '新建项目';
    modalBody.innerHTML = `
        <form id="add-project-form" onsubmit="handleAddProject(event)">
            <div class="form-group">
                <label>项目名称</label>
                <input type="text" name="name" required placeholder="输入项目名称">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
                <button type="submit" class="btn-primary">创建</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-overlay').classList.add('show');
}

function handleAddProject(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    
    Storage.projects.add({ name, subtasks: [] });
    closeModal();
    renderProjectView();
}

function deleteProject(projectId) {
    if (!confirm('确定要删除这个项目吗？')) return;
    Storage.projects.delete(projectId);
    renderProjectView();
}

function addSubtaskToProject(projectId) {
    const project = Storage.projects.getById(projectId);
    if (!project) return;
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = `添加子任务到 "${project.name}"`;
    modalBody.innerHTML = `
        <form id="add-subtask-form" onsubmit="handleAddSubtask(event, '${projectId}')">
            <div class="form-group">
                <label>任务标题</label>
                <input type="text" name="title" required placeholder="输入任务标题">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>日期</label>
                    <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>时间</label>
                    <input type="time" name="time" required value="09:00">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">取消</button>
                <button type="submit" class="btn-primary">添加</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-overlay').classList.add('show');
}

function handleAddSubtask(e, projectId) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const project = Storage.projects.getById(projectId);
    const task = Storage.tasks.add({
        title: formData.get('title'),
        date: formData.get('date'),
        startTime: formData.get('time'),
        endTime: formData.get('time'),
        type: 'sub',
        project: project.name
    });
    
    Storage.projects.addSubtask(projectId, task.id);
    closeModal();
    renderProjectView();
}

function removeSubtask(projectId, taskId) {
    if (!confirm('确定要从项目中移除这个子任务吗？')) return;
    Storage.projects.removeSubtask(projectId, taskId);
    renderProjectView();
}

function checkOverdueTasks() {
    const overdueTasks = Storage.tasks.getOverdueTasks();
    const banner = document.getElementById('reminder-banner');
    
    if (overdueTasks.length > 0) {
        banner.style.display = 'flex';
    } else {
        banner.style.display = 'none';
    }
}

function goToSchedule() {
    switchView('schedule');
    switchTab('list');
    document.getElementById('reminder-banner').style.display = 'none';
}

function refreshAllViews() {
    renderTodayFocus();
    renderWeekCalendar();
    renderHomeMonthCalendar();
    renderHomeYearCalendar();
    renderWeekProgress();
    renderMonthView();
    renderWeekView();
    renderDayView();
    renderYearView();
    renderScheduleList();
    renderProjectView();
    renderArchive();
    checkOverdueTasks();
}