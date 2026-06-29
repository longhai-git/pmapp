let timerInterval = null;
let pomodoroSeconds = 25 * 60;
let pomodoroRunning = false;
let pomodoroMode = 25;

let stopwatchSeconds = 0;
let stopwatchRunning = false;

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

function updateDate() {
    const now = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    document.getElementById('date-display').textContent = `今天：${weekdays[now.getDay()]} ${month}月${day}日`;
}

function initTimerPanel() {
    const timerContent = document.getElementById('timer-content');
    if (!timerContent) return;
    
    document.querySelectorAll('.timer-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.timer-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.pomodoro-timer, .stopwatch-timer').forEach(t => t.classList.remove('active'));
            
            tab.classList.add('active');
            if (tab.dataset.timer === 'pomodoro') {
                document.getElementById('pomodoro-timer').classList.add('active');
            } else {
                document.getElementById('stopwatch-timer').classList.add('active');
            }
        });
    });
    
    initPomodoro();
    initStopwatch();
}

function initPomodoro() {
    document.querySelectorAll('.pomodoro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pomodoro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            pomodoroMode = parseInt(btn.dataset.time);
            resetPomodoro();
        });
    });
    
    document.getElementById('pomodoro-start').addEventListener('click', startPomodoro);
    document.getElementById('pomodoro-pause').addEventListener('click', pausePomodoro);
    document.getElementById('pomodoro-reset').addEventListener('click', resetPomodoro);
}

function startPomodoro() {
    if (pomodoroRunning) return;
    
    pomodoroRunning = true;
    timerInterval = setInterval(() => {
        pomodoroSeconds--;
        updatePomodoroDisplay();
        
        if (pomodoroSeconds <= 0) {
            pausePomodoro();
            playNotificationSound();
            alert('计时结束！休息一下吧！');
        }
    }, 1000);
}

function pausePomodoro() {
    pomodoroRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetPomodoro() {
    pausePomodoro();
    pomodoroSeconds = pomodoroMode * 60;
    updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
    const minutes = String(Math.floor(pomodoroSeconds / 60)).padStart(2, '0');
    const seconds = String(pomodoroSeconds % 60).padStart(2, '0');
    document.getElementById('pomodoro-clock').textContent = `${minutes}:${seconds}`;
}

function initStopwatch() {
    document.getElementById('stopwatch-start').addEventListener('click', startStopwatch);
    document.getElementById('stopwatch-pause').addEventListener('click', pauseStopwatch);
    document.getElementById('stopwatch-reset').addEventListener('click', resetStopwatch);
}

function startStopwatch() {
    if (stopwatchRunning) return;
    
    stopwatchRunning = true;
    timerInterval = setInterval(() => {
        stopwatchSeconds++;
        updateStopwatchDisplay();
    }, 1000);
}

function pauseStopwatch() {
    stopwatchRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetStopwatch() {
    pauseStopwatch();
    stopwatchSeconds = 0;
    updateStopwatchDisplay();
}

function updateStopwatchDisplay() {
    const hours = String(Math.floor(stopwatchSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((stopwatchSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(stopwatchSeconds % 60).padStart(2, '0');
    document.getElementById('stopwatch-clock').textContent = `${hours}:${minutes}:${seconds}`;
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error('播放提示音失败:', e);
    }
}