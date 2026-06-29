# 日程管理应用 - 部署指南

## 技术方案

本应用采用 **GitHub Pages + Supabase** 的架构方案：

- **GitHub Pages**: 托管前端静态代码（免费）
- **Supabase**: 提供数据库、用户认证、实时同步（免费额度足够个人使用）

---

## 部署步骤

### 第一步：创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 并注册账号
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - Project name: `pmapp`
   - Database password: 设置一个安全密码
   - Region: 选择离你最近的区域
4. 等待项目创建完成（约1分钟）

### 第二步：配置 Supabase

#### 2.1 获取 API 密钥

创建完成后，进入项目设置页面：
- Project Settings → API
- 复制以下信息：
  - **Project URL**: `https://your-project-id.supabase.co`
  - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 2.2 创建数据库表

进入 SQL Editor，执行以下 SQL 脚本：

```sql
-- 创建任务表
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT,
    date DATE,
    start_time TEXT,
    end_time TEXT,
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

-- 创建灵感表
CREATE TABLE inspirations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建项目表
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT,
    subtasks TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY "Users can access their own tasks" ON tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own inspirations" ON inspirations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX idx_inspirations_user ON inspirations(user_id);
CREATE INDEX idx_projects_user ON projects(user_id);
```

#### 2.3 配置认证

进入 Authentication → Providers：
- 启用 Email/Password 认证
- 可选：启用 Google、GitHub 等社交登录

#### 2.4 配置 CORS

进入 Project Settings → API → CORS Settings：
- 添加允许的来源：`https://your-username.github.io`
- 添加本地开发地址：`http://localhost:8081`

---

### 第三步：配置前端代码

#### 3.1 修改配置文件

在 `scripts/storage.js` 中配置你的 Supabase 信息：

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-public-key'
};
```

#### 3.2 推送到 GitHub

```bash
# 创建 GitHub 仓库
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/your-username/pmapp.git
git branch -M main
git push -u origin main
```

---

### 第四步：配置 GitHub Pages

1. 进入 GitHub 仓库设置
2. 找到 Pages 选项
3. 配置：
   - Source: Deploy from a branch
   - Branch: `main` / `root`
4. 点击 Save
5. 等待部署完成（约1分钟）
6. 访问地址：`https://your-username.github.io/pmapp`

---

## 本地开发

```bash
# 方式1：Python HTTP Server
python -m http.server 8081

# 方式2：Node.js
npx serve -l 8081

# 方式3：Live Server（VS Code 插件）
# 安装 Live Server 插件，右键 index.html 选择 "Open with Live Server"
```

---

## 环境变量

应用支持以下环境变量（可选）：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| SUPABASE_URL | Supabase 项目 URL | - |
| SUPABASE_ANON_KEY | Supabase 匿名密钥 | - |

---

## 数据同步流程

```
用户操作 → 本地 localStorage 更新 → 自动同步到 Supabase → 其他设备拉取更新
```

### 同步策略

- **实时同步**: 使用 Supabase Realtime 监听数据变更
- **冲突解决**: 时间戳优先策略
- **离线支持**: 本地存储作为缓存，联网后自动同步

---

## 备份与恢复

### 导出数据

通过 Supabase SQL Editor 执行：

```sql
-- 导出任务数据
SELECT * FROM tasks WHERE user_id = auth.uid();
```

### 导入数据

使用 Supabase 的数据导入功能或执行 INSERT 语句。

---

## 故障排查

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 数据不同步 | CORS 配置错误 | 检查 CORS 设置 |
| 无法登录 | 认证配置错误 | 检查 Auth Providers |
| 权限错误 | RLS 策略未配置 | 重新执行安全策略 SQL |
| 部署失败 | 路径错误 | 确认 GitHub Pages 配置 |

### 日志查看

- Supabase: Dashboard → Logs
- GitHub Pages: Repository → Actions

---

## 升级与维护

### 更新代码

```bash
git add .
git commit -m "Update: new feature"
git push origin main
# GitHub Pages 自动重新部署
```

### 更新数据库

在 Supabase SQL Editor 中执行 ALTER TABLE 语句。

---

## 安全注意事项

1. 🔐 不要将服务端密钥（service_role）暴露在前端代码中
2. 🔒 使用行级安全（RLS）限制数据访问
3. 📡 确保使用 HTTPS 协议
4. 🗑️ 定期清理测试数据
5. 🔔 关注 Supabase 和 GitHub 的安全公告

---

## 联系方式

如有问题，请查看项目 README 或提交 Issue。