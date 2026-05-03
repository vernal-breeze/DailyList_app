# 架构重构与代码洗牌实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: 使用子代理驱动开发或执行计划来逐个完成任务。步骤使用复选框 (`- [ ]`) 语法进行跟踪。

**目标:** 对任务管理应用进行彻底的架构重构，实现前后端分离，建立清晰的分层架构。

**架构:** 采用清晰的分层架构：
- **前端层:** React 组件、页面、状态管理
- **API 层:** RESTful API 接口定义与客户端
- **服务层:** 业务逻辑处理
- **领域层:** 领域模型与类型定义
- **基础设施层:** 存储、工具、第三方集成
- **后端服务:** Node.js + Express API 服务（可选，当前保持前端优先）

**技术栈:** React 18、TypeScript 5、Vite 6、Zustand 5、Tailwind CSS 3、React Router 7

---

## 第一部分：架构设计方案

### 1.1 新架构分层说明

**分层原则:** 单向依赖、职责单一、高内聚低耦合

| 层级 | 职责 | 说明 |
|------|------|------|
| **前端层 (Presentation)** | UI 组件、页面、状态管理 | React 组件、页面、路由、状态管理 (Zustand) |
| **API 层 (API)** | API 接口定义、HTTP 客户端 | API 类型、请求封装、响应处理 |
| **服务层 (Service)** | 业务逻辑编排 | 任务服务、通知服务、设置服务 |
| **领域层 (Domain)** | 领域模型、业务规则 | Task、SubTask 等领域实体 |
| **基础设施层 (Infrastructure)** | 存储、工具、第三方集成 | LocalStorage、日期工具、通知插件 |

### 1.2 新项目目录树

```
list_finished/
├── public/                          # 静态资源
│   ├── favicon.svg
│   ├── manifest.json
│   └── service-worker.js
├── src/
│   ├── index.css                    # 全局样式
│   ├── main.tsx                     # 应用入口
│   ├── vite-env.d.ts                # Vite 环境类型
│   ├── presentation/                # 前端层 - UI 层
│   │   ├── components/              # 可复用组件
│   │   │   ├── common/              # 通用组件
│   │   │   │   ├── DeleteConfirmationModal/
│   │   │   │   ├── OperationFeedback/
│   │   │   │   ├── SettingsPanel/
│   │   │   │   └── Empty.tsx
│   │   │   ├── layout/              # 布局组件
│   │   │   ├── tasks/               # 任务相关组件
│   │   │   ├── ui/                  # UI 基础组件
│   │   │   └── views/               # 视图组件 (Day/Week/Month)
│   │   ├── pages/                   # 页面组件
│   │   │   ├── Home/
│   │   │   ├── Schedule/
│   │   │   ├── Settings/
│   │   │   └── TaskDetail/
│   │   ├── state/                   # 状态管理 (Zustand)
│   │   │   ├── useTaskStore.ts
│   │   │   ├── useSettingsStore.ts
│   │   │   └── useViewStore.ts
│   │   ├── hooks/                   # 自定义 React Hooks
│   │   │   ├── useGestures.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useTheme.ts
│   │   │   └── useUndo.ts
│   │   └── App.tsx                  # 根组件
│   ├── api/                         # API 层
│   │   ├── client.ts                # HTTP 客户端
│   │   ├── endpoints.ts             # API 端点定义
│   │   └── types/                   # API 类型定义
│   │       ├── task.ts
│   │       ├── settings.ts
│   │       └── index.ts
│   ├── services/                    # 服务层 - 业务逻辑
│   │   ├── TaskService.ts
│   │   ├── NotificationService.ts
│   │   ├── SettingsService.ts
│   │   └── index.ts
│   ├── domain/                      # 领域层 - 领域模型
│   │   ├── entities/                # 实体定义
│   │   │   ├── Task.ts
│   │   │   ├── SubTask.ts
│   │   │   └── index.ts
│   │   ├── repositories/            # 仓储接口
│   │   │   ├── TaskRepository.ts
│   │   │   └── index.ts
│   │   └── types/                   # 领域类型
│   │       ├── task.ts
│   │       ├── recurrence.ts
│   │       └── index.ts
│   ├── infrastructure/              # 基础设施层
│   │   ├── storage/                 # 存储实现
│   │   │   ├── LocalStorageTaskRepository.ts
│   │   │   └── index.ts
│   │   ├── notifications/           # 通知实现
│   │   │   ├── CapacitorNotificationProvider.ts
│   │   │   └── index.ts
│   │   ├── utils/                   # 工具函数
│   │   │   ├── dateUtils.ts
│   │   │   ├── recurrenceUtils.ts
│   │   │   └── index.ts
│   │   └── config/                  # 配置
│   │       ├── app.config.ts
│   │       └── index.ts
│   └── lib/                         # 第三方库封装
│       └── utils.ts                 # cn 工具等
├── server/                          # 后端服务 (可选)
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── config/
│   ├── package.json
│   └── tsconfig.json
├── android/                         # Capacitor Android 项目
├── tests/                           # 测试文件
│   ├── unit/
│   │   ├── services/
│   │   ├── domain/
│   │   └── utils/
│   └── e2e/
├── docs/                            # 文档
│   └── superpowers/
│       └── plans/
├── .eslintignore
├── .gitignore
├── eslint.config.js
├── index.html
├── jest.config.cjs
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── capacitor.config.ts
```

---

## 第二部分：核心代码重构

### 任务 1: 创建新的目录结构并迁移基础配置

**文件:**
- 创建: `src/presentation/index.ts`
- 创建: `src/api/index.ts`
- 创建: `src/services/index.ts`
- 创建: `src/domain/index.ts`
- 创建: `src/infrastructure/index.ts`
- 修改: `tsconfig.json` (更新路径映射)

- [ ] **步骤 1: 创建新目录结构**

```bash
mkdir -p src/presentation/{components/{common,layout,tasks,ui,views},pages,state,hooks}
mkdir -p src/api/{types}
mkdir -p src/services
mkdir -p src/domain/{entities,repositories,types}
mkdir -p src/infrastructure/{storage,notifications,utils,config}
mkdir -p tests/{unit,e2e}
```

- [ ] **步骤 2: 更新 tsconfig.json 路径映射**

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"],
      "@presentation/*": ["./src/presentation/*"],
      "@api/*": ["./src/api/*"],
      "@services/*": ["./src/services/*"],
      "@domain/*": ["./src/domain/*"],
      "@infrastructure/*": ["./src/infrastructure/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

### 任务 2: 重构领域层 - 定义领域实体和类型

**文件:**
- 创建: `src/domain/types/task.ts`
- 创建: `src/domain/types/recurrence.ts`
- 创建: `src/domain/entities/Task.ts`
- 创建: `src/domain/entities/SubTask.ts`
- 创建: `src/domain/repositories/TaskRepository.ts`

- [ ] **步骤 1: 创建领域类型定义**

```typescript
// src/domain/types/task.ts
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskType = 'single' | 'recurring';

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: string;
  category?: string;
  subtasks: SubTaskDto[];
  startDate: string;
  taskType: TaskType;
  recurrence: RecurrenceDto;
  reminderEnabled: boolean;
  notificationId: number;
  completedDates: string[];
}

export interface SubTaskDto {
  id: string;
  title: string;
  completed: boolean;
  parentId: string;
  level: number;
  subtasks: SubTaskDto[];
}

export interface RecurrenceDto {
  enabled: boolean;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  days: number[];
  end: {
    type: 'never' | 'after' | 'on';
    count?: number;
    date?: string;
  };
  exceptions: string[];
}

export const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700'
};

export const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低'
};
```

- [ ] **步骤 2: 创建 Task 实体**

```typescript
// src/domain/entities/Task.ts
import { TaskDto, SubTaskDto } from '../types/task';

export class Task {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly dueDate: Date;
  readonly priority: TaskDto['priority'];
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly category?: string;
  readonly subtasks: SubTask[];
  readonly startDate: Date;
  readonly taskType: TaskDto['taskType'];
  readonly recurrence: TaskDto['recurrence'];
  readonly reminderEnabled: boolean;
  readonly notificationId: number;
  readonly completedDates: string[];

  private constructor(data: TaskDto) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.dueDate = new Date(data.dueDate);
    this.priority = data.priority;
    this.completed = data.completed;
    this.createdAt = new Date(data.createdAt);
    this.category = data.category;
    this.subtasks = data.subtasks.map(st => SubTask.fromDto(st));
    this.startDate = new Date(data.startDate);
    this.taskType = data.taskType;
    this.recurrence = data.recurrence;
    this.reminderEnabled = data.reminderEnabled;
    this.notificationId = data.notificationId;
    this.completedDates = data.completedDates;
  }

  static fromDto(dto: TaskDto): Task {
    return new Task(dto);
  }

  toDto(): TaskDto {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      dueDate: this.dueDate.toISOString(),
      priority: this.priority,
      completed: this.completed,
      createdAt: this.createdAt.toISOString(),
      category: this.category,
      subtasks: this.subtasks.map(st => st.toDto()),
      startDate: this.startDate.toISOString(),
      taskType: this.taskType,
      recurrence: this.recurrence,
      reminderEnabled: this.reminderEnabled,
      notificationId: this.notificationId,
      completedDates: this.completedDates
    };
  }

  isOverdue(): boolean {
    return !this.completed && this.dueDate < new Date();
  }

  isRecurring(): boolean {
    return this.recurrence.enabled;
  }

  toggleCompleted(): Task {
    return Task.fromDto({
      ...this.toDto(),
      completed: !this.completed
    });
  }

  update(updates: Partial<Omit<TaskDto, 'id' | 'createdAt'>>): Task {
    return Task.fromDto({
      ...this.toDto(),
      ...updates
    });
  }
}

export class SubTask {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
  readonly parentId: string;
  readonly level: number;
  readonly subtasks: SubTask[];

  private constructor(data: SubTaskDto) {
    this.id = data.id;
    this.title = data.title;
    this.completed = data.completed;
    this.parentId = data.parentId;
    this.level = data.level;
    this.subtasks = data.subtasks.map(st => SubTask.fromDto(st));
  }

  static fromDto(dto: SubTaskDto): SubTask {
    return new SubTask(dto);
  }

  toDto(): SubTaskDto {
    return {
      id: this.id,
      title: this.title,
      completed: this.completed,
      parentId: this.parentId,
      level: this.level,
      subtasks: this.subtasks.map(st => st.toDto())
    };
  }

  toggleCompleted(): SubTask {
    return SubTask.fromDto({
      ...this.toDto(),
      completed: !this.completed
    });
  }
}
```

- [ ] **步骤 3: 创建 TaskRepository 接口**

```typescript
// src/domain/repositories/TaskRepository.ts
import { Task } from '../entities/Task';
import { TaskDto } from '../types/task';

export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  save(task: Task): Promise<Task>;
  update(id: string, updates: Partial<TaskDto>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
  clearAll(): Promise<void>;
}
```

### 任务 3: 重构基础设施层 - 实现存储和工具

**文件:**
- 创建: `src/infrastructure/utils/dateUtils.ts`
- 创建: `src/infrastructure/storage/LocalStorageTaskRepository.ts`
- 创建: `src/infrastructure/config/app.config.ts`

- [ ] **步骤 1: 创建日期工具函数**

```typescript
// src/infrastructure/utils/dateUtils.ts
const BEIJING_OFFSET = 8;

export function getBeijingTime(): Date {
  const now = new Date();
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcNow + BEIJING_OFFSET * 3600000);
}

export function toBeijingTime(date: Date): Date {
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utcTime + BEIJING_OFFSET * 3600000);
}

export function getBeijingWeekRange(): { start: Date; end: Date } {
  const now = getBeijingTime();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}
```

- [ ] **步骤 2: 实现 LocalStorageTaskRepository**

```typescript
// src/infrastructure/storage/LocalStorageTaskRepository.ts
import { TaskRepository } from '@domain/repositories/TaskRepository';
import { Task } from '@domain/entities/Task';
import { TaskDto } from '@domain/types/task';

const TASKS_STORAGE_KEY = 'list_finished_tasks';

export class LocalStorageTaskRepository implements TaskRepository {
  private getStoredTasks(): TaskDto[] {
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
      return [];
    }
  }

  private saveTasks(tasks: TaskDto[]): void {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }

  async findAll(): Promise<Task[]> {
    const dtos = this.getStoredTasks();
    return dtos.map(dto => Task.fromDto(dto));
  }

  async findById(id: string): Promise<Task | null> {
    const dtos = this.getStoredTasks();
    const dto = dtos.find(t => t.id === id);
    return dto ? Task.fromDto(dto) : null;
  }

  async save(task: Task): Promise<Task> {
    const dtos = this.getStoredTasks();
    const index = dtos.findIndex(t => t.id === task.id);
    const taskDto = task.toDto();

    if (index >= 0) {
      dtos[index] = taskDto;
    } else {
      dtos.push(taskDto);
    }

    this.saveTasks(dtos);
    return task;
  }

  async update(id: string, updates: Partial<TaskDto>): Promise<Task | null> {
    const dtos = this.getStoredTasks();
    const index = dtos.findIndex(t => t.id === id);

    if (index < 0) {
      return null;
    }

    const updatedDto = { ...dtos[index], ...updates };
    dtos[index] = updatedDto;
    this.saveTasks(dtos);

    return Task.fromDto(updatedDto);
  }

  async delete(id: string): Promise<boolean> {
    const dtos = this.getStoredTasks();
    const index = dtos.findIndex(t => t.id === id);

    if (index < 0) {
      return false;
    }

    dtos.splice(index, 1);
    this.saveTasks(dtos);
    return true;
  }

  async clearAll(): Promise<void> {
    this.saveTasks([]);
  }
}
```

### 任务 4: 重构服务层 - 实现业务逻辑

**文件:**
- 创建: `src/services/TaskService.ts`
- 创建: `src/services/NotificationService.ts`
- 创建: `src/services/SettingsService.ts`

- [ ] **步骤 1: 创建 TaskService**

```typescript
// src/services/TaskService.ts
import { TaskRepository } from '@domain/repositories/TaskRepository';
import { Task, SubTask } from '@domain/entities/Task';
import { TaskDto, SubTaskDto } from '@domain/types/task';
import { getBeijingTime } from '@infrastructure/utils/dateUtils';

export class TaskService {
  constructor(private repository: TaskRepository) {}

  async getAllTasks(): Promise<Task[]> {
    return this.repository.findAll();
  }

  async createTask(data: Omit<TaskDto, 'id' | 'createdAt' | 'subtasks'>): Promise<Task> {
    const newTaskData: TaskDto = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: getBeijingTime().toISOString(),
      subtasks: [],
      startDate: data.startDate || getBeijingTime().toISOString(),
      taskType: data.taskType || 'single',
      reminderEnabled: data.reminderEnabled || false,
      notificationId: data.notificationId || Math.floor(Math.random() * 1000000),
      completedDates: [],
      recurrence: data.recurrence || {
        enabled: false,
        type: 'daily',
        interval: 1,
        days: [],
        end: { type: 'never' },
        exceptions: []
      }
    };

    const task = Task.fromDto(newTaskData);
    return this.repository.save(task);
  }

  async updateTask(id: string, updates: Partial<Omit<TaskDto, 'id' | 'createdAt'>>): Promise<Task | null> {
    return this.repository.update(id, updates);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async toggleTaskCompleted(id: string): Promise<Task | null> {
    const task = await this.repository.findById(id);
    if (!task) return null;

    const updatedTask = task.toggleCompleted();
    return this.repository.save(updatedTask);
  }

  async addSubTask(taskId: string, parentSubTaskId: string | null, title: string): Promise<Task | null> {
    const task = await this.repository.findById(taskId);
    if (!task) return null;

    const newSubTask: SubTaskDto = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      parentId: parentSubTaskId || taskId,
      level: parentSubTaskId ? this.getSubTaskLevel(task.subtasks, parentSubTaskId) + 1 : 0,
      subtasks: []
    };

    let updatedSubtasks: SubTask[];
    if (!parentSubTaskId) {
      updatedSubtasks = [...task.subtasks, SubTask.fromDto(newSubTask)];
    } else {
      updatedSubtasks = this.addSubTaskToParent(task.subtasks, parentSubTaskId, SubTask.fromDto(newSubTask));
    }

    return this.repository.update(taskId, {
      subtasks: updatedSubtasks.map(st => st.toDto())
    });
  }

  private getSubTaskLevel(subtasks: SubTask[], subTaskId: string): number {
    for (const subtask of subtasks) {
      if (subtask.id === subTaskId) {
        return subtask.level;
      }
      const level = this.getSubTaskLevel(subtask.subtasks, subTaskId);
      if (level !== -1) {
        return level;
      }
    }
    return -1;
  }

  private addSubTaskToParent(subtasks: SubTask[], parentId: string, newSubTask: SubTask): SubTask[] {
    return subtasks.map(subtask => {
      if (subtask.id === parentId) {
        return SubTask.fromDto({
          ...subtask.toDto(),
          subtasks: [...subtask.subtasks, newSubTask].map(st => st.toDto())
        });
      }
      return SubTask.fromDto({
        ...subtask.toDto(),
        subtasks: this.addSubTaskToParent(subtask.subtasks, parentId, newSubTask).map(st => st.toDto())
      });
    });
  }

  getTodayTasks(tasks: Task[]): Task[] {
    const beijingNow = getBeijingTime();
    const todayStart = new Date(beijingNow.toISOString().split('T')[0]);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const todayTasks: Task[] = [];

    tasks.forEach(task => {
      if (!task.isRecurring()) {
        const taskDate = toBeijingTime(task.dueDate);
        if (taskDate >= todayStart && taskDate <= todayEnd) {
          todayTasks.push(task);
        }
      } else {
        const todayStr = beijingNow.toISOString().split('T')[0];
        if (!task.recurrence.exceptions.includes(todayStr)) {
          todayTasks.push(task);
        }
      }
    });

    return todayTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
}
```

- [ ] **步骤 2: 创建 NotificationService**

```typescript
// src/services/NotificationService.ts
import { Task } from '@domain/entities/Task';

export class NotificationService {
  async initialize(): Promise<void> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      await LocalNotifications.createChannel({
        id: 'task-reminders',
        name: '任务提醒',
        description: '任务到期提醒通知',
        sound: 'default',
        importance: 5,
        visibility: 1
      });
    } catch (error) {
      console.warn('Notification channel initialization skipped:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const permission = await LocalNotifications.checkPermissions();
      
      if (permission.display === 'denied') {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      }
      
      return permission.display === 'granted';
    } catch (error) {
      console.warn('Notification permission request skipped:', error);
      return false;
    }
  }

  async scheduleNotification(task: Task): Promise<void> {
    if (!task.reminderEnabled) return;

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      await LocalNotifications.schedule({
        notifications: [{
          id: task.notificationId,
          title: '任务提醒',
          body: task.title,
          schedule: { at: task.dueDate, allowWhileIdle: true },
          channelId: 'task-reminders',
          smallIcon: 'ic_stat_notification',
          extra: { taskId: task.id }
        }]
      });
    } catch (error) {
      console.warn('Notification scheduling skipped:', error);
    }
  }

  async cancelNotification(task: Task): Promise<void> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id: task.notificationId }] });
    } catch (error) {
      console.warn('Notification cancellation skipped:', error);
    }
  }

  registerListener(callback: (taskId: string) => void): void {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const taskId = notification.notification.extra?.taskId;
        if (taskId) {
          callback(taskId);
        }
      });
    } catch (error) {
      console.warn('Notification listener registration skipped:', error);
    }
  }
}
```

### 任务 5: 重构状态管理层 - 使用 Zustand

**文件:**
- 创建: `src/presentation/state/useTaskStore.ts`
- 创建: `src/presentation/state/useSettingsStore.ts`

- [ ] **步骤 1: 创建 useTaskStore**

```typescript
// src/presentation/state/useTaskStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Task } from '@domain/entities/Task';
import { TaskService } from '@services/TaskService';
import { NotificationService } from '@services/NotificationService';
import { LocalStorageTaskRepository } from '@infrastructure/storage/LocalStorageTaskRepository';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTasks: () => Promise<void>;
  addTask: (data: any) => Promise<void>;
  updateTask: (id: string, updates: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompleted: (id: string) => Promise<void>;
  clearTasks: () => Promise<void>;
  
  // Subtask actions
  addSubTask: (taskId: string, parentSubTaskId: string | null, title: string) => Promise<void>;
}

const repository = new LocalStorageTaskRepository();
const taskService = new TaskService(repository);
const notificationService = new NotificationService();

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,

      loadTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          const tasks = await taskService.getAllTasks();
          
          for (const task of tasks) {
            if (task.reminderEnabled && !task.completed) {
              await notificationService.scheduleNotification(task);
            }
          }
          
          set({ tasks, isLoading: false });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      addTask: async (data) => {
        try {
          const newTask = await taskService.createTask(data);
          
          if (newTask.reminderEnabled) {
            await notificationService.scheduleNotification(newTask);
          }
          
          set((state) => ({ tasks: [...state.tasks, newTask] }));
        } catch (error) {
          console.error('Failed to add task:', error);
        }
      },

      updateTask: async (id, updates) => {
        try {
          const currentTask = get().tasks.find(t => t.id === id);
          
          if (currentTask && currentTask.notificationId) {
            await notificationService.cancelNotification(currentTask);
          }
          
          const updatedTask = await taskService.updateTask(id, updates);
          
          if (updatedTask) {
            if (updatedTask.reminderEnabled) {
              await notificationService.scheduleNotification(updatedTask);
            }
            
            set((state) => ({
              tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
            }));
          }
        } catch (error) {
          console.error('Failed to update task:', error);
        }
      },

      deleteTask: async (id) => {
        try {
          const task = get().tasks.find(t => t.id === id);
          
          if (task && task.notificationId) {
            await notificationService.cancelNotification(task);
          }
          
          const success = await taskService.deleteTask(id);
          
          if (success) {
            set((state) => ({
              tasks: state.tasks.filter(t => t.id !== id)
            }));
          }
        } catch (error) {
          console.error('Failed to delete task:', error);
        }
      },

      toggleTaskCompleted: async (id) => {
        try {
          const task = get().tasks.find(t => t.id === id);
          
          if (task) {
            if (task.completed && task.notificationId) {
              await notificationService.cancelNotification(task);
            }
            
            const updatedTask = await taskService.toggleTaskCompleted(id);
            
            if (updatedTask) {
              if (!updatedTask.completed && updatedTask.reminderEnabled) {
                await notificationService.scheduleNotification(updatedTask);
              }
              
              set((state) => ({
                tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
              }));
            }
          }
        } catch (error) {
          console.error('Failed to toggle task completion:', error);
        }
      },

      clearTasks: async () => {
        try {
          const tasks = get().tasks;
          
          for (const task of tasks) {
            if (task.notificationId) {
              await notificationService.cancelNotification(task);
            }
          }
          
          await repository.clearAll();
          set({ tasks: [] });
        } catch (error) {
          console.error('Failed to clear tasks:', error);
        }
      },

      addSubTask: async (taskId, parentSubTaskId, title) => {
        try {
          const updatedTask = await taskService.addSubTask(taskId, parentSubTaskId, title);
          
          if (updatedTask) {
            set((state) => ({
              tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
            }));
          }
        } catch (error) {
          console.error('Failed to add subtask:', error);
        }
      }
    }),
    {
      name: 'list_finished_task_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks.map(t => t.toDto())
      }),
      hydrate: (storageValue, set) => {
        if (storageValue.state?.tasks) {
          const tasks = storageValue.state.tasks.map((dto: any) => Task.fromDto(dto));
          set({ tasks });
        }
      }
    }
  )
);
```

### 任务 6: 迁移组件和页面到新结构

**文件:**
- 移动: `src/components/*` -> `src/presentation/components/`
- 移动: `src/pages/*` -> `src/presentation/pages/`
- 移动: `src/hooks/*` -> `src/presentation/hooks/`
- 更新: 所有组件中的导入路径

- [ ] **步骤 1: 移动组件文件**

```bash
# 移动任务组件
mv src/components/DraggableTaskCard/* src/presentation/components/tasks/DraggableTaskCard/
mv src/components/DraggableTaskList/* src/presentation/components/tasks/DraggableTaskList/
mv src/components/QuickAddTask/* src/presentation/components/tasks/QuickAddTask/
mv src/components/RecurrenceSettings/* src/presentation/components/tasks/RecurrenceSettings/
mv src/components/SubTaskItem/* src/presentation/components/tasks/SubTaskItem/
mv src/components/SwipeableTaskCard/* src/presentation/components/tasks/SwipeableTaskCard/
mv src/components/TaskCard/* src/presentation/components/tasks/TaskCard/
mv src/components/TaskForm/* src/presentation/components/tasks/TaskForm/
mv src/components/TaskList/* src/presentation/components/tasks/TaskList/

# 移动视图组件
mv src/components/DayView/* src/presentation/components/views/DayView/
mv src/components/WeekView/* src/presentation/components/views/WeekView/
mv src/components/MonthView/* src/presentation/components/views/MonthView/
mv src/components/ViewSwitcher/* src/presentation/components/views/ViewSwitcher/

# 移动通用组件
mv src/components/DeleteConfirmationModal/* src/presentation/components/common/DeleteConfirmationModal/
mv src/components/OperationFeedback/* src/presentation/components/common/OperationFeedback/
mv src/components/SettingsPanel/* src/presentation/components/common/SettingsPanel/
mv src/components/Empty.tsx src/presentation/components/common/

# 移动 UI 组件
mv src/components/ui/* src/presentation/components/ui/

# 移动页面
mv src/pages/Home/* src/presentation/pages/Home/
mv src/pages/Schedule/* src/presentation/pages/Schedule/
mv src/pages/Settings/* src/presentation/pages/Settings/
mv src/pages/TaskDetail/* src/presentation/pages/TaskDetail/

# 移动 hooks
mv src/hooks/* src/presentation/hooks/
```

- [ ] **步骤 2: 更新 App.tsx**

```typescript
// src/presentation/App.tsx
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, CalendarDays, Settings as SettingsIcon } from 'lucide-react';
import { useEffect } from 'react';

import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import TaskDetail from './pages/TaskDetail';
import { useSettingsStore } from './state/useSettingsStore';
import { useTaskStore } from './state/useTaskStore';
import { NotificationService } from '@services/NotificationService';

const notificationService = new NotificationService();

const BottomNav = () => {
  const location = useLocation();
  const { settings } = useSettingsStore();
  
  const navItems = [
    { path: '/', icon: HomeIcon, label: '首页' },
    { path: '/schedule', icon: CalendarDays, label: '日程' },
    { path: '/settings', icon: SettingsIcon, label: '设置' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-inset-bottom">
      <div className={`glass rounded-3xl px-2 py-3 mx-auto max-w-md ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}>
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? (settings.theme === 'dark' ? 'bg-gray-700/50 scale-105' : 'bg-white/40 scale-105')
                    : (settings.theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-white/20')
                }`}
              >
                <Icon
                  size={24}
                  className={`transition-all duration-300 ${
                    isActive
                      ? 'text-rose-400 drop-shadow-lg'
                      : (settings.theme === 'dark' ? 'text-gray-400 hover:text-rose-400' : 'text-gray-400 hover:text-rose-400')
                  }`}
                />
                <span className={`text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'text-rose-400'
                    : (settings.theme === 'dark' ? 'text-gray-400 hover:text-rose-400' : 'text-gray-400 hover:text-rose-400')
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { loadSettings, settings } = useSettingsStore();
  const { loadTasks } = useTaskStore();
  
  useEffect(() => {
    loadSettings();
    loadTasks();
    
    const initNotifications = async () => {
      try {
        await notificationService.initialize();
        await notificationService.requestPermission();
        notificationService.registerListener((taskId) => {
          console.log('通知点击:', taskId);
        });
      } catch (error) {
        console.error('初始化通知失败:', error);
      }
    };
    
    initNotifications();
  }, [loadSettings, loadTasks]);
  
  return (
    <Router>
      <div className={`min-h-screen pb-32 relative z-10 transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/task/:id" element={<TaskDetail />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}
```

### 任务 7: 更新入口文件和清理旧结构

**文件:**
- 更新: `src/main.tsx`
- 删除: 旧的重复目录

- [ ] **步骤 1: 更新 main.tsx**

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './presentation/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **步骤 2: 清理旧目录**

```bash
# 删除旧的重复目录
rm -rf src/components
rm -rf src/pages
rm -rf src/hooks
rm -rf src/data
rm -rf src/domain
rm -rf src/infrastructure
rm -rf src/store
rm -rf src/services
rm -rf src/utils
rm -rf src/app
```

---

## 第三部分：迁移指南

### 3.1 从旧项目迁移到新项目的关键步骤

1. **备份现有数据**
   - 从 LocalStorage 导出当前任务数据
   - 保存重要的配置

2. **安装依赖（如有新增）**
   ```bash
   npm install
   ```

3. **运行构建验证**
   ```bash
   npm run build
   npm run test
   ```

4. **数据迁移**
   - 新结构的数据存储格式与旧格式兼容，无需额外转换
   - `useTaskStore` 的 persist 中间件会自动处理数据加载

5. **测试功能完整性**
   - 测试任务创建、编辑、删除
   - 测试提醒功能
   - 测试主题切换
   - 测试多视图切换

### 3.2 注意事项

- **导入路径变化**: 所有导入路径需要更新为新的别名路径
- **类型导入**: 从 `@domain/types/` 导入类型，而不是直接的 DTO
- **服务使用**: 使用服务层而不是直接在组件中操作存储
- **状态管理**: 从 Zustand store 中获取状态和方法

### 3.3 开发规范

- **命名规范**: 组件使用 PascalCase，工具函数使用 camelCase
- **文件组织**: 相关文件放在同一目录，每个目录有 index.ts 导出
- **类型安全**: 优先使用 TypeScript 类型，避免 any 类型
- **错误处理**: 服务层处理错误，UI 层展示友好提示

---

## 执行选项

计划完成并保存到 `docs/superpowers/plans/2026-04-27-architecture-refactoring.md`。

**两个执行选项:**

1. **子代理驱动 (推荐)** - 我会为每个任务派生出新鲜的子代理，在任务之间进行审查，快速迭代
2. **内联执行** - 使用执行计划在本次会话中执行任务，批量执行并进行检查点审查

您想选择哪种方式？
