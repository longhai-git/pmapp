const STORAGE_KEYS = {
    TASKS: 'pmapp_tasks',
    INSPIRATIONS: 'pmapp_inspirations',
    PROJECTS: 'pmapp_projects',
    SYNC_TIME: 'pmapp_sync_time'
};

const SUPABASE_CONFIG = {
    url: 'https://bnruqplbfjvsaarpiex.supabase.co',
    anonKey: 'sb_publishable_tIilB2NQHqAc5ObBwTkcKg_9iJfJZm5'
};

let supabase = null;

function initSupabase() {
    if (window.supabase && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        return true;
    }
    return false;
}

function isCloudEnabled() {
    return supabase !== null;
}

async function getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase 未配置');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
}

async function signUp(email, password) {
    if (!supabase) throw new Error('Supabase 未配置');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
}

async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getStoredData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('读取存储数据失败:', e);
        return [];
    }
}

function setStoredData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('存储数据失败:', e);
        return false;
    }
}

const Storage = {
    tasks: {
        getAll() {
            return getStoredData(STORAGE_KEYS.TASKS);
        },
        getById(id) {
            const tasks = this.getAll();
            return tasks.find(task => task.id === id);
        },
        add(task) {
            const tasks = this.getAll();
            const newTask = {
                id: generateId(),
                title: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '10:00',
                type: 'main',
                repeat: 'none',
                reminder: 'none',
                project: '',
                status: 'pending',
                urgent: false,
                priority: false,
                note: '',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...task
            };
            tasks.push(newTask);
            setStoredData(STORAGE_KEYS.TASKS, tasks);
            return newTask;
        },
        update(id, updates) {
            const tasks = this.getAll();
            const index = tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };
                setStoredData(STORAGE_KEYS.TASKS, tasks);
                return tasks[index];
            }
            return null;
        },
        delete(id) {
            const tasks = this.getAll();
            const filtered = tasks.filter(task => task.id !== id);
            setStoredData(STORAGE_KEYS.TASKS, filtered);
        },
        getTodayTasks() {
            const today = new Date().toISOString().split('T')[0];
            return this.getAll().filter(task => task.date === today && task.status === 'pending');
        },
        getWeekTasks() {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            
            return this.getAll().filter(task => {
                const taskDate = new Date(task.date);
                return taskDate >= startOfWeek && taskDate < endOfWeek;
            });
        },
        getCompletedTasks() {
            return this.getAll().filter(task => task.status === 'completed');
        },
        getUncompletedTasks() {
            return this.getAll().filter(task => task.status === 'pending');
        },
        getOverdueTasks() {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return this.getAll().filter(task => {
                if (task.status !== 'pending') return false;
                const taskDate = new Date(task.date);
                return taskDate < today;
            });
        },
        getTasksByDate(date) {
            return this.getAll().filter(task => task.date === date);
        },
        getTasksByProject(projectName) {
            return this.getAll().filter(task => task.project === projectName);
        },
        toggleStatus(id) {
            const task = this.getById(id);
            if (task) {
                return this.update(id, { status: task.status === 'pending' ? 'completed' : 'pending' });
            }
            return null;
        }
    },

    inspirations: {
        getAll() {
            return getStoredData(STORAGE_KEYS.INSPIRATIONS);
        },
        getById(id) {
            const inspirations = this.getAll();
            return inspirations.find(insp => insp.id === id);
        },
        add(inspiration) {
            const inspirations = this.getAll();
            const newInspiration = {
                id: generateId(),
                title: '',
                content: '',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...inspiration
            };
            inspirations.push(newInspiration);
            setStoredData(STORAGE_KEYS.INSPIRATIONS, inspirations);
            return newInspiration;
        },
        update(id, updates) {
            const inspirations = this.getAll();
            const index = inspirations.findIndex(insp => insp.id === id);
            if (index !== -1) {
                inspirations[index] = { ...inspirations[index], ...updates, updatedAt: Date.now() };
                setStoredData(STORAGE_KEYS.INSPIRATIONS, inspirations);
                return inspirations[index];
            }
            return null;
        },
        delete(id) {
            const inspirations = this.getAll();
            const filtered = inspirations.filter(insp => insp.id !== id);
            setStoredData(STORAGE_KEYS.INSPIRATIONS, filtered);
        }
    },

    projects: {
        getAll() {
            return getStoredData(STORAGE_KEYS.PROJECTS);
        },
        getById(id) {
            const projects = this.getAll();
            return projects.find(proj => proj.id === id);
        },
        add(project) {
            const projects = this.getAll();
            const newProject = {
                id: generateId(),
                name: '',
                subtasks: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...project
            };
            projects.push(newProject);
            setStoredData(STORAGE_KEYS.PROJECTS, projects);
            return newProject;
        },
        update(id, updates) {
            const projects = this.getAll();
            const index = projects.findIndex(proj => proj.id === id);
            if (index !== -1) {
                projects[index] = { ...projects[index], ...updates, updatedAt: Date.now() };
                setStoredData(STORAGE_KEYS.PROJECTS, projects);
                return projects[index];
            }
            return null;
        },
        delete(id) {
            const projects = this.getAll();
            const filtered = projects.filter(proj => proj.id !== id);
            setStoredData(STORAGE_KEYS.PROJECTS, filtered);
        },
        addSubtask(projectId, taskId) {
            const project = this.getById(projectId);
            if (project && !project.subtasks.includes(taskId)) {
                project.subtasks.push(taskId);
                this.update(projectId, { subtasks: project.subtasks });
            }
        },
        removeSubtask(projectId, taskId) {
            const project = this.getById(projectId);
            if (project) {
                project.subtasks = project.subtasks.filter(id => id !== taskId);
                this.update(projectId, { subtasks: project.subtasks });
            }
        },
        getProjectWithTasks(projectId) {
            const project = this.getById(projectId);
            if (!project) return null;
            const tasks = Storage.tasks.getAll();
            const projectTasks = tasks.filter(task => project.subtasks.includes(task.id));
            return { ...project, tasks: projectTasks };
        }
    },

    exportAll() {
        const data = {
            tasks: this.tasks.getAll(),
            inspirations: this.inspirations.getAll(),
            projects: this.projects.getAll(),
            exportedAt: Date.now()
        };
        return data;
    },

    importAll(data) {
        if (data.tasks) {
            setStoredData(STORAGE_KEYS.TASKS, data.tasks);
        }
        if (data.inspirations) {
            setStoredData(STORAGE_KEYS.INSPIRATIONS, data.inspirations);
        }
        if (data.projects) {
            setStoredData(STORAGE_KEYS.PROJECTS, data.projects);
        }
    },

    initSampleData() {
        const tasks = this.tasks.getAll();
        if (tasks.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            
            this.tasks.add({
                title: '完成项目报告',
                date: today,
                startTime: '09:00',
                endTime: '11:00',
                type: 'main',
                project: 'Q3计划',
                priority: true
            });
            
            this.tasks.add({
                title: '团队会议',
                date: today,
                startTime: '14:00',
                endTime: '15:30',
                type: 'main',
                urgent: true
            });
            
            this.tasks.add({
                title: '代码审查',
                date: tomorrow,
                startTime: '10:00',
                endTime: '12:00',
                type: 'main'
            });
            
            this.tasks.add({
                title: '准备演示文稿',
                date: tomorrow,
                startTime: '14:00',
                endTime: '16:00',
                type: 'sub',
                project: 'Q3计划'
            });
            
            this.inspirations.add({
                title: '新功能创意',
                content: '<p>考虑添加AI智能分析功能，可以自动总结每日工作内容。</p><p><strong>功能要点：</strong></p><ul><li>自动识别完成任务</li><li>生成日报摘要</li><li>统计时间分布</li></ul>'
            });
            
            this.inspirations.add({
                title: '用户体验优化',
                content: '<p>优化移动端的操作体验，增加手势支持。</p>'
            });
            
            this.projects.add({
                name: 'Q3计划',
                subtasks: []
            });
        }
    },

    async syncTasks() {
        if (!supabase) return;
        const user = await getCurrentUser();
        if (!user) return;

        try {
            const localTasks = this.tasks.getAll();
            const lastSync = localStorage.getItem(STORAGE_KEYS.SYNC_TIME) || 0;

            for (const task of localTasks) {
                if (task.updatedAt > lastSync) {
                    await supabase.from('tasks').upsert({
                        id: task.id,
                        user_id: user.id,
                        title: task.title,
                        date: task.date,
                        start_time: task.startTime,
                        end_time: task.endTime,
                        type: task.type,
                        repeat: task.repeat,
                        reminder: task.reminder,
                        project: task.project,
                        status: task.status,
                        urgent: task.urgent,
                        priority: task.priority,
                        note: task.note,
                        created_at: new Date(task.createdAt).toISOString(),
                        updated_at: new Date(task.updatedAt).toISOString()
                    });
                }
            }

            const { data: serverTasks, error } = await supabase
                .from('tasks')
                .select('*')
                .gt('updated_at', new Date(parseInt(lastSync)).toISOString());

            if (error) throw error;

            for (const serverTask of serverTasks) {
                const localTask = this.tasks.getById(serverTask.id);
                const serverTime = new Date(serverTask.updated_at).getTime();
                
                if (localTask) {
                    if (serverTime > localTask.updatedAt) {
                        this.tasks.update(serverTask.id, {
                            title: serverTask.title,
                            date: serverTask.date,
                            startTime: serverTask.start_time,
                            endTime: serverTask.end_time,
                            type: serverTask.type,
                            repeat: serverTask.repeat,
                            reminder: serverTask.reminder,
                            project: serverTask.project,
                            status: serverTask.status,
                            urgent: serverTask.urgent,
                            priority: serverTask.priority,
                            note: serverTask.note,
                            updatedAt: serverTime
                        });
                    }
                } else {
                    this.tasks.add({
                        id: serverTask.id,
                        title: serverTask.title,
                        date: serverTask.date,
                        startTime: serverTask.start_time,
                        endTime: serverTask.end_time,
                        type: serverTask.type,
                        repeat: serverTask.repeat,
                        reminder: serverTask.reminder,
                        project: serverTask.project,
                        status: serverTask.status,
                        urgent: serverTask.urgent,
                        priority: serverTask.priority,
                        note: serverTask.note,
                        createdAt: new Date(serverTask.created_at).getTime(),
                        updatedAt: serverTime
                    });
                }
            }

            localStorage.setItem(STORAGE_KEYS.SYNC_TIME, Date.now().toString());
            console.log('任务同步完成');
        } catch (error) {
            console.error('任务同步失败:', error);
        }
    },

    async syncInspirations() {
        if (!supabase) return;
        const user = await getCurrentUser();
        if (!user) return;

        try {
            const localInspirations = this.inspirations.getAll();
            const lastSync = localStorage.getItem(STORAGE_KEYS.SYNC_TIME) || 0;

            for (const insp of localInspirations) {
                if (insp.updatedAt > lastSync) {
                    await supabase.from('inspirations').upsert({
                        id: insp.id,
                        user_id: user.id,
                        title: insp.title,
                        content: insp.content,
                        created_at: new Date(insp.createdAt).toISOString(),
                        updated_at: new Date(insp.updatedAt).toISOString()
                    });
                }
            }

            const { data: serverInspirations, error } = await supabase
                .from('inspirations')
                .select('*')
                .gt('updated_at', new Date(parseInt(lastSync)).toISOString());

            if (error) throw error;

            for (const serverInsp of serverInspirations) {
                const localInsp = this.inspirations.getById(serverInsp.id);
                const serverTime = new Date(serverInsp.updated_at).getTime();
                
                if (localInsp) {
                    if (serverTime > localInsp.updatedAt) {
                        this.inspirations.update(serverInsp.id, {
                            title: serverInsp.title,
                            content: serverInsp.content,
                            updatedAt: serverTime
                        });
                    }
                } else {
                    this.inspirations.add({
                        id: serverInsp.id,
                        title: serverInsp.title,
                        content: serverInsp.content,
                        createdAt: new Date(serverInsp.created_at).getTime(),
                        updatedAt: serverTime
                    });
                }
            }

            console.log('灵感同步完成');
        } catch (error) {
            console.error('灵感同步失败:', error);
        }
    },

    async syncProjects() {
        if (!supabase) return;
        const user = await getCurrentUser();
        if (!user) return;

        try {
            const localProjects = this.projects.getAll();
            const lastSync = localStorage.getItem(STORAGE_KEYS.SYNC_TIME) || 0;

            for (const proj of localProjects) {
                if (proj.updatedAt > lastSync) {
                    await supabase.from('projects').upsert({
                        id: proj.id,
                        user_id: user.id,
                        name: proj.name,
                        subtasks: proj.subtasks,
                        created_at: new Date(proj.createdAt).toISOString(),
                        updated_at: new Date(proj.updatedAt).toISOString()
                    });
                }
            }

            const { data: serverProjects, error } = await supabase
                .from('projects')
                .select('*')
                .gt('updated_at', new Date(parseInt(lastSync)).toISOString());

            if (error) throw error;

            for (const serverProj of serverProjects) {
                const localProj = this.projects.getById(serverProj.id);
                const serverTime = new Date(serverProj.updated_at).getTime();
                
                if (localProj) {
                    if (serverTime > localProj.updatedAt) {
                        this.projects.update(serverProj.id, {
                            name: serverProj.name,
                            subtasks: serverProj.subtasks,
                            updatedAt: serverTime
                        });
                    }
                } else {
                    this.projects.add({
                        id: serverProj.id,
                        name: serverProj.name,
                        subtasks: serverProj.subtasks,
                        createdAt: new Date(serverProj.created_at).getTime(),
                        updatedAt: serverTime
                    });
                }
            }

            console.log('项目同步完成');
        } catch (error) {
            console.error('项目同步失败:', error);
        }
    },

    async syncAll() {
        await this.syncTasks();
        await this.syncInspirations();
        await this.syncProjects();
        localStorage.setItem(STORAGE_KEYS.SYNC_TIME, Date.now().toString());
    }
};

function exportData() {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pmapp_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            Storage.importAll(data);
            location.reload();
        } catch (err) {
            alert('导入失败：文件格式不正确');
        }
    };
    reader.readAsText(file);
    input.value = '';
}