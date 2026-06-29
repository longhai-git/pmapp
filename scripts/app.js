document.addEventListener('DOMContentLoaded', () => {
    closeModal();
    Storage.initSampleData();
    
    updateClock();
    updateDate();
    
    setInterval(updateClock, 1000);
    setInterval(updateDate, 60000);
    setInterval(checkOverdueTasks, 60000);
    
    initNavigation();
    initTaskForm();
    initEventListeners();
    initTimerPanel();
    initHomeViewSelector();
    
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
    renderInspirations();
    renderArchive();
    checkOverdueTasks();
    
    switchView('home');
});

function initHomeViewSelector() {
    const selectorBtn = document.getElementById('view-selector-btn');
    const selectorMenu = document.getElementById('view-selector-menu');
    
    selectorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectorMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', () => {
        selectorMenu.classList.remove('show');
    });
}