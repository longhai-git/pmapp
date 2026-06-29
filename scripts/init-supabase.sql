-- ==============================================
-- 日程管理应用 - Supabase 数据库初始化脚本
-- ==============================================

-- ------------------------------
-- 1. 创建任务表
-- ------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT DEFAULT '09:00',
    end_time TEXT DEFAULT '10:00',
    type TEXT DEFAULT 'main',
    repeat TEXT DEFAULT 'none',
    reminder TEXT DEFAULT 'none',
    project TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    urgent BOOLEAN DEFAULT FALSE,
    priority BOOLEAN DEFAULT FALSE,
    note TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------
-- 2. 创建灵感表
-- ------------------------------
CREATE TABLE IF NOT EXISTS inspirations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    content TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------
-- 3. 创建项目表
-- ------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subtasks TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------
-- 4. 启用行级安全 (RLS)
-- ------------------------------
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ------------------------------
-- 5. 创建安全策略（先删除旧策略再创建）
-- ------------------------------

-- 任务表策略
DROP POLICY IF EXISTS "Users can access their own tasks" ON tasks;
CREATE POLICY "Users can access their own tasks" ON tasks
    FOR ALL USING (auth.uid() = user_id);

-- 灵感表策略
DROP POLICY IF EXISTS "Users can access their own inspirations" ON inspirations;
CREATE POLICY "Users can access their own inspirations" ON inspirations
    FOR ALL USING (auth.uid() = user_id);

-- 项目表策略
DROP POLICY IF EXISTS "Users can access their own projects" ON projects;
CREATE POLICY "Users can access their own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);

-- ------------------------------
-- 6. 创建索引（优化查询性能）
-- ------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inspirations_user ON inspirations(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- ------------------------------
-- 7. 创建触发器（自动更新 updated_at）
-- ------------------------------

-- 任务表触发器
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_tasks_updated_at();

-- 灵感表触发器
CREATE OR REPLACE FUNCTION update_inspirations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inspirations_updated_at ON inspirations;
CREATE TRIGGER trigger_inspirations_updated_at
BEFORE UPDATE ON inspirations
FOR EACH ROW EXECUTE FUNCTION update_inspirations_updated_at();

-- 项目表触发器
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON projects;
CREATE TRIGGER trigger_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_projects_updated_at();

-- ------------------------------
-- 8. 启用实时同步（可选）
-- ------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inspirations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE inspirations;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'projects') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE projects;
    END IF;
END $$;

-- ==============================================
-- 执行完成
-- ==============================================
-- 在 Supabase SQL Editor 中执行此脚本后，请：
-- 1. 进入 Authentication → Providers，启用 Email/Password
-- ==============================================