# 项目运行逻辑文档

## 概述

一个待办/日程管理 Web 应用，支持任务的创建、编辑、删除、完成切换，以及每日/每周/每月重复任务。采用前后端分离架构：

- **前端**：React 18 + TypeScript + Zustand + Vite
- **后端**：FastAPI + SQLAlchemy + SQLite
- **通知**：Capacitor Local Notifications（Android 原生）

---

## 1. 启动方式

### 1.1 后端

```bash
cd backend
source venv/bin/activate  # 或 venv_new
./start.sh                # 启动在 http://localhost:8000
```

`start.sh` 内容：

```bash
cd "$(dirname "$0")"
mkdir -p data
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- `--reload`：开发模式，代码变更自动重启
- 数据文件：`backend/data/schedule.db`（SQLite，自动创建）
- **当前实际运行端口**：`8002`（与`start.sh`默认 8000 不同，启动时传了 `--port 8002`。前端 API base URL 已配置为 `http://localhost:8002/api`）

### 1.2 前端

```bash
npm run dev         # 启动在 http://localhost:5174
npm run build       # 生产构建，输出到 dist/
npm run test        # 运行测试
```

- `package.json` 的 `dev` 命令指定了 `--port 5174`
- 前端 API 基础地址：`src/api/client.ts` 中配置为 `http://localhost:8002/api`
- 后端 `8000` 端口也运行着旧版进程（已弃用），若出现连接问题优先检查前端 API 地址是否匹配实际后端端口

### 1.3 Docker 部署

```bash
cd backend
docker build -t schedule-api .
docker run -p 8000:8000 -v $(pwd)/data:/app/data schedule-api
```

---

## 2. 项目结构

```
list_finished/
├── src/                          # 前端源代码
│   ├── main.tsx                  # 入口：渲染 App 组件
│   ├── App.tsx                   # 路由 + 导航 + 初始化
│   ├── api/                      # HTTP 客户端层
│   │   ├── client.ts             #   封装 fetch，统一处理请求/响应/错误
│   │   ├── taskApi.ts            #   任务相关 API 调用
│   │   ├── settingsApi.ts        #   设置相关 API
│   │   ├── healthApi.ts          #   健康检查
│   │   └── config.ts             #   API base URL 配置
│   ├── store/                    # 状态管理（Zustand）
│   │   ├── taskStore.ts          #   核心：任务 CRUD + 同步队列
│   │   ├── settingsStore.ts      #   主题等设置
│   │   └── viewStore.ts          #   视图切换（日/周/月/日程）
│   ├── presentation/pages/       # 页面组件
│   │   ├── Home/index.tsx        #   首页：今日任务 + 统计
│   │   ├── Schedule/index.tsx    #   日程页：多视图任务管理
│   │   ├── Settings/index.tsx    #   设置页
│   │   └── TaskDetail/index.tsx  #   任务详情页
│   ├── components/               # 可复用 UI 组件
│   │   ├── TaskForm/             #   任务表单（增/改）
│   │   ├── TaskCard/             #   任务卡片
│   │   ├── WeekView/             #   周视图
│   │   ├── DayView/              #   日视图
│   │   ├── MonthView/            #   月视图
│   │   ├── ViewSwitcher/         #   视图切换器
│   │   ├── QuickAddTask/         #   快速添加（Ctrl+N）
│   │   ├── RecurrenceSettings/   #   重复任务设置
│   │   ├── DeleteConfirmationModal/  # 删除确认弹窗
│   │   └── OperationFeedback/    #   操作反馈
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useTaskActions.ts     #   共享任务操作逻辑
│   │   └── useUndo.ts            #   撤销/重做
│   ├── services/                 # 业务服务
│   │   ├── notificationService.ts # 系统通知
│   │   └── TaskService.ts        #   领域逻辑（部分未完全迁移）
│   ├── utils/                    # 工具函数
│   │   ├── recurrenceUtils.ts    #   重复任务实例生成引擎
│   │   ├── dateUtils/            #   日期工具（北京时间）
│   │   └── migration.ts          #   localStorage→后端迁移
│   ├── sync/                     # 同步层
│   │   ├── syncManager.ts        #   同步管理器
│   │   └── syncQueue.ts          #   同步队列
│   └── types/index.ts            # TypeScript 类型定义
├── backend/                      # 后端源代码
│   └── app/
│       ├── main.py               # FastAPI 应用入口
│       ├── database.py           # SQLAlchemy 连接配置
│       ├── config.py             # 配置
│       ├── models/               # 数据库模型
│       │   ├── task.py           #   任务表
│       │   ├── subtask.py        #   子任务表
│       │   ├── settings.py       #   设置表
│       │   └── sync_queue.py     #   同步队列表
│       ├── schemas/              # Pydantic 数据模型
│       ├── routes/               # API 路由
│       │   ├── tasks.py          #   任务 CRUD
│       │   ├── health.py         #   健康检查
│       │   ├── settings.py       #   设置管理
│       │   ├── sync.py           #   同步端点
│       │   └── migration.py      #   数据迁移
│       ├── services/             # 业务逻辑层
│       │   ├── task_service.py   #   任务 CRUD 逻辑
│       │   ├── recurrence_utils.py # 重复规则解析
│       │   ├── migration_service.py # 导入导出
│       │   └── sync_service.py   #   同步处理
│       └── middleware/
│           └── cors.py           # CORS 配置
├── docs/                         # 项目文档
└── MIGRATION_GUIDE.md            # 架构迁移指南
```

---

## 3. 数据流

### 3.1 核心数据流（CRUD）

```
用户操作 → 页面组件 → Zustand Store → localStorage（即时持久化）
                                   ↓（异步 fire-and-forget）
                             后端 API → SQLite 数据库
```

**分层责任：**

| 层 | 职责 | 技术 |
|---|---|---|
| 页面组件 | 用户交互、UI 渲染 | React + Tailwind |
| Store | 状态管理、本地持久化 | Zustand + localStorage |
| API 层 | HTTP 通信 | fetch + 自定义 client |
| 后端 | 数据持久化、业务逻辑 | FastAPI + SQLAlchemy |
| 数据库 | 数据存储 | SQLite |

### 3.2 写入流程（以添加任务为例）

```
1. 用户填写 TaskForm → 点击提交
2. addTask() 同步执行：
   a. 生成 task（id, createdAt, subtasks 等默认字段）
   b. set() → 更新 Zustand state
   c. saveTasksToLocal() → 写入 localStorage
   d. 若 reminderEnabled → scheduleTaskNotification()
3. syncCreate(task) 异步执行：
   a. 调用 taskApi.create(task) → POST /api/tasks
   b. 成功 → 用后端返回的数据更新本地（版本对齐）
   c. 失败 → 入队到 sync_queue（localStorage），后续重试
```

### 3.3 读取流程（加载页面）

```
1. App.tsx 的 useEffect → loadTasks()
2. loadTasks() 执行：
   a. 调用 flushSyncQueue() → 尝试刷新离线队列
   b. 调用 taskApi.getAll() → GET /api/tasks
      - 成功：与 localStorage 数据按 id 合并（取 version 大的）
      - 失败：保持 localStorage 已有数据
   c. 重新调度所有未完成任务的通知
3. 各页面通过 useTaskStore 的 useSelector 获取数据
```

### 3.4 离线同步机制

同步队列（`sync_queue`）存储在 localStorage 中，是一个 `SyncOp[]` 数组：

```typescript
interface SyncOp {
  id: string;                     // 唯一标识
  kind: 'create' | 'update' | 'delete' | 'toggle'
      | 'addSubTask' | 'updateSubTask' | 'deleteSubTask';
  payload: any;                   // 请求参数
  createdAt: number;              // 创建时间戳
  retries: number;                // 已重试次数
  nextRetryAt: number;            // 下次重试时间
}
```

- **入队时机**：API 调用失败时（catch 分支）
- **重试策略**：`flushSyncQueue()` 每 10 秒检查 → 指数退避（2s, 4s, 8s, 16s, 32s）
- **最大重试**：5 次后丢弃（避免队列无限膨胀）
- **页面加载时**：自动触发 `flushSyncQueue()` 尝试恢复

---

## 4. 首页（Home）运行逻辑

### 4.1 页面初始化

```
App.tsx useEffect
  → loadTasks()     // 加载任务列表
  → loadSettings()  // 加载主题等设置
  → initNotifications() // 初始化通知
```

### 4.2 今日任务计算

```typescript
const todayTasks = useMemo(() => getTodayTasks(tasks), [tasks]);
```

`getTodayTasks` → `recurrenceUtils.getTodayTasks` → 调用 `generateTaskInstances` 引擎，从任务数组中筛选出今天应展示的所有任务实例（包括一次性任务到期日=今天，以及重复任务的今天实例）。

### 4.3 统计卡片

| 指标 | 含义 | 计算逻辑 |
|---|---|---|
| 总任务 | 所有任务 | `tasks.length` |
| 已完成 | 标记为完成的 | `tasks.filter(t => t.completed).length` |
| 今日任务 | 今天应展示的 | `getTodayTasks(tasks).length` |
| 今日进度 | 今日完成百分比 | `todayCompleted / todayTotal * 100` |

### 4.4 用户操作

- **添加任务**：按钮唤起 TaskForm → `addTask()` → 同步到后端
- **完成切换**：点击圆形按钮 → `toggleTaskCompletion(id)` → 更新状态 + 副作用（通知取消/重调度）
- **删除任务**：点击删除图标 → DeleteConfirmationModal → `deleteTask(id)` + undo 注册
- **查看所有**：点击"查看全部" → 跳转到 `/schedule`
- **快捷键**：`Ctrl+N` 快速添加，`Ctrl+Z` 撤销

---

## 5. 日程页（Schedule）运行逻辑

### 5.1 四大视图

| 视图 | 组件 | 快捷键 |
|---|---|---|
| 日视图 | `DayView` | `Ctrl+1` |
| 周视图 | `WeekView` | `Ctrl+2` |
| 月视图 | `MonthView` | `Ctrl+3` |
| 日程列表 | Schedule 页面内置 | `Ctrl+4`（默认） |

### 5.2 日程列表分类逻辑

```typescript
function toDateStr(d: string | Date): string  // → "YYYY-MM-DD"
function todayStr(): string                     // → 今天的 "YYYY-MM-DD"
```

任务被分为四个区块：

| 区块 | 任务来源 | 筛选条件 |
|---|---|---|
| 🔄 每日任务 | `recurrence.type === 'recurring'` 且今天有实例 | `utilGetTodayTasks(tasks)` |
| 📋 今日待办 | `taskType === 'single'` 且 `toDateStr(dueDate) === today` | 同上 |
| 📅 未来日程 | `taskType === 'single'` 且 `toDateStr(dueDate) > today` | 按日期分组 |
| ⏰ 过期任务 | `taskType === 'single'` 且 `toDateStr(dueDate) < today` | 按日期分组 |

### 5.3 任务编辑

点击任意任务卡片 → 弹出编辑弹窗（`TaskForm` 编辑模式）：
- 修改标题、描述、时间、优先级、重复规则等
- 提交时调用 `updateTask(id, updates)`
- 只传有变化的字段，后端进行部分更新（PATCH 语义）

### 5.4 重复任务实例生成

核心引擎在 `recurrenceUtils.ts` 的 `generateTaskInstances`：

```
输入：task（模板）, viewStart, viewEnd
输出：该时间范围内的所有 task 实例

流程：
1. 从 task.startDate 开始逐天推演
2. 每天检查是否符合重复规则（daily/weekly/monthly）
3. 跳过例外日期（exceptions）
4. 检查截止条件（end.type = never/after/on）
5. 安全阀：最多 1000 次循环防死循环
6. 只收集 viewStart~viewEnd 范围内的实例
```

---

## 6. 后端 API

### 6.1 路由清单

所有 API 路径以 `/api` 为前缀。

| 方法 | 路径 | 说明 | 限流 |
|---|---|---|---|
| `GET` | `/api/tasks` | 获取所有任务（支持分页/筛选/排序） | 100/分钟 |
| `GET` | `/api/tasks/{id}` | 获取单个任务 | 100/分钟 |
| `POST` | `/api/tasks` | 创建任务（upsert） | 10/分钟 |
| `PUT` | `/api/tasks/{id}` | 更新任务（乐观锁） | 10/分钟 |
| `PATCH` | `/api/tasks/{id}/toggle` | 切换完成状态 | 10/分钟 |
| `DELETE` | `/api/tasks/{id}` | 删除任务 | 10/分钟 |
| `POST` | `/api/tasks/{id}/subtasks` | 添加子任务 | 10/分钟 |
| `PUT` | `/api/tasks/{id}/subtasks/{subId}` | 更新子任务 | 不限 |
| `DELETE` | `/api/tasks/{id}/subtasks/{subId}` | 删除子任务 | 不限 |
| `GET` | `/api/health` | 健康检查 | 不限 |
| `GET` | `/api/settings` | 获取设置 | 不限 |
| `PUT` | `/api/settings` | 更新设置 | 不限 |
| `GET` | `/api/sync/queue` | 获取同步队列 | 不限 |
| `POST` | `/api/sync/push` | 推送同步操作 | 不限 |
| `POST` | `/api/migration/import` | 从 localStorage 导入数据 | 不限 |

### 6.2 通用响应格式

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

分页响应特殊格式（`GET /api/tasks` 无过滤参数时）：

```json
{
  "success": true,
  "data": {
    "items": [ Task, ... ],
    "total": 42,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

### 6.3 数据库表结构

**tasks 表：**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | VARCHAR PK | UUID |
| title | VARCHAR(255) | 标题 |
| description | TEXT | 描述 |
| due_date | DATE | 到期日 |
| priority | VARCHAR(20) | low/medium/high |
| completed | BOOLEAN | 完成状态 |
| created_at | DATETIME | 创建时间 |
| category | VARCHAR(100) | 分类 |
| start_date | DATE | 开始日期 |
| task_type | VARCHAR(50) | single/recurring |
| recurrence_type | VARCHAR(20) | daily/weekly/monthly |
| recurrence_interval | INTEGER | 间隔 |
| recurrence_end_date | DATE | 结束日期 |
| recurrence_days | JSON | 每周的哪几天 |
| recurrence_exceptions | JSON | 例外日期 |
| reminder_enabled | BOOLEAN | 是否提醒 |
| completed_dates | JSON | 完成的日期列表 |
| updated_at | DATETIME | 更新时间 |
| version | INTEGER | 乐观锁版本号 |
| notification_id | INTEGER | 安卓通知 ID |

**subtasks 表：** 子任务树形结构（自引用 `parent_id`）

### 6.4 乐观锁

`PUT /api/tasks/{id}` 支持无感知乐观锁：
- 请求体传入 `version` 字段 → 后端比对，不一致返回 409
- 前端不主动传 `version` → 跳过比对，直接更新

### 6.5 Toggle 完成状态的特殊逻辑

`PATCH /api/tasks/{id}/toggle` 额外维护 `completed_dates`：
- 标记完成 → 当天日期加入 `completed_dates` JSON 数组
- 取消完成 → 从 `completed_dates` 移除当天
- 这样前端通过 `generateTaskInstances` 重新计算结果时能正确反应该日期是否已完成

---

## 7. 重复任务系统

### 7.1 任务类型字段

```
taskType: 'single' | 'recurring'
```

- `single` — 一次性任务，仅在 dueDate 当天展示
- `recurring` — 重复任务，按 recurrence 规则在多个日期展示

### 7.2 Recurrence 配置

```typescript
interface Recurrence {
  enabled: boolean;          // 是否启用重复
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;          // 间隔（如每 2 天）
  days: number[];            // 每周的几天（0=周日，1=周一...）
  end: {
    type: 'never' | 'after' | 'on';
    count?: number;          // after N 次后结束
    date?: string;           // 在具体日期结束
  };
  exceptions: string[];      // 例外日期["2026-05-04"]
}
```

### 7.3 例外日期

- `exceptions` 中的日期 → 跳过不生成实例
- 带 `-completed` 后缀 → 该实例标记为已完成

---

## 8. 状态管理与持久化

### 8.1 Zustand + 手动 localStorage

项目早期使用 `zustand/middleware` 的 persist 中间件，后改为手动管理：

```typescript
// 初始化时从 localStorage 恢复
const [initialTasks] = useState(() => loadTasksFromLocal());

// 每次 state 变更时同步写入 localStorage
function saveTasksToLocal(tasks: Task[]): void {
  localStorage.setItem('task-storage', JSON.stringify({
    state: { tasks },
    version: 0,
  }));
}
```

### 8.2 同步协作（前端 + 后端）

```
                    +------------------+
                    |   User Action    |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Zustand Store   |
                    | (instant UI)     |
                    +---+----------+---+
                        |          |
              +---------v---+  +---v----------+
              | localStorage|  |  syncXxx()   |
              | (persist)   |  | (async)      |
              +-------------+  +---+----------+
                                   |
                          +--------v--------+
                          |  Backend API    |
                          |  (SQLite)       |
                          +-----------------+
```

- 前端更新立即反映到 UI + localStorage
- 后端同步异步进行，失败入队重试
- 页面加载时 API 数据与本地数据按 version 合并

---

## 9. 通知系统

基于 Capacitor 的 `@capacitor/local-notifications`，仅在 Android 原生平台生效。

| 函数 | 触发时机 |
|---|---|
| `scheduleTaskNotification(task)` | 添加/恢复任务时（reminderEnabled 且未完成） |
| `cancelTaskNotification(task)` | 完成任务/更新提醒设置/删除任务时 |
| `registerNotificationListeners(callback)` | 应用启动时注册（点击通知跳转任务） |
| `cancelAllNotifications()` | 清空所有任务时 |

特殊逻辑：
- 已过期（dueDate ≤ now）不调度通知，避免立即触发
- 重复任务的提醒时间：下次实例时间 > now 时调度；≤ now 时推到明天同一时间

---

## 10. 主题系统

Zustand `settingsStore` 管理全局设置（包括 `theme: 'light' | 'dark'`）：

- **亮色模式**：渐变背景 `from-rose-50 via-pink-50 to-purple-50`
- **暗色模式**：纯灰背景 `bg-gray-900`，组件 `bg-gray-800/80` 半透明毛玻璃
- 无需显式切换逻辑：每个组件读取 `settings.theme` 条件渲染样式

---

## 11. 键盘快捷键

| 快捷键 | 动作 | 生效范围 |
|---|---|---|
| `Ctrl+N` | 打开快速添加弹窗 | Home, Schedule |
| `Ctrl+Z` | 撤销上一步操作 | Home, Schedule |
| `Ctrl+1` | 切换日视图 | Schedule |
| `Ctrl+2` | 切换周视图 | Schedule |
| `Ctrl+3` | 切换月视图 | Schedule |
| `Ctrl+4` | 切换日程列表 | Schedule |

撤销系统（`useUndo` hook）维护 undo/redo 两个栈，只支持删除撤销（删除后可通过 `Ctrl+Z` 恢复）。

---

## 12. 测试

- **测试框架**：Jest + React Testing Library
- **测试文件**：`src/store/taskStore.test.ts`（168 个测试，100% 行覆盖率）
- **覆盖率目标**：
  - 行覆盖率：100%
  - 语句覆盖率：99.28%
  - 函数覆盖率：99.35%
  - 分支覆盖率：80.82%

---

## 13. 常见问题排查

### 前端 404 / API 连接失败
1. 确认后端已启动：`curl http://localhost:8002/api/health`
2. 检查端口匹配：`src/api/client.ts` 中的 API_BASE_URL
3. 检查多后端进程：`lsof -i :8000` 和 `lsof -i :8002`

### Websocket 连接失败（HMR）
1. Vite 的 HMR 端口必须与打开的 URL 端口一致
2. 检查 `package.json` 的 `dev` 命令和实际启动参数

### 数据库冲突
`UNIQUE constraint failed: tasks.id` — 后端 `create_task` 已做了 upsert 处理，如果出现则检查前端 `syncCreate` 是否重复发送

### 时区问题
- 前端使用 `getBeijingTime()` 获取北京时间（GMT+8）
- 所有日期操作统一通过 `recurrenceUtils.getLocalDateStr()` 格式化为 `YYYY-MM-DD`
- 后端存储 DATETIME 使用 UTC，前端处理时再转为北京时间

---

## 14. 架构迁移状态

项目正处于从纯前端 + localStorage 向前后端分离架构的迁移过程中。当前状态：

- ✅ 后端 API 已完整实现（CRUD + 子任务 + 同步 + 设置）
- ✅ 前端 taskStore 已接入 API 调用（双写：localStorage + 后端）
- ✅ 离线同步队列已实现（localStorage 持久化 + 指数退权重试）
- ✅ 数据合并策略（按 version 择优）
- 🔄 通知系统尚未完全对接后端（reminder 依然纯前端）
- 🔄 `sync/syncQueue.ts` 旧版同步队列尚未弃用（与新版共存）
- 🔄 部分业务逻辑仍留在 store 中未完全抽离到 service 层

详见 `MIGRATION_GUIDE.md`。
