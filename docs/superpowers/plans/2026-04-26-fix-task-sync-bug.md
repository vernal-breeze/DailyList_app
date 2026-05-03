# 任务同步/显示 BUG 修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复新建任务后，日程清单模块和首页任务列表不更新显示的问题。

**Architecture:** 统一时区处理逻辑，确保任务添加后状态正确更新，组件能够及时重新渲染。

**Tech Stack:** React, TypeScript, Zustand, Vite

---

## 文件结构

需要修改的文件：
- `src/pages/Home/index.tsx` - 统一时区处理逻辑
- `src/store/taskStore.ts` - 优化状态更新机制
- `src/components/TaskForm/index.tsx` - 确保任务日期设置正确

## 任务分解

### Task 1: 统一 Home 组件的时区处理逻辑

**Files:**
- Modify: `src/pages/Home/index.tsx:70-83`

- [ ] **Step 1: 修改 Home 组件的 todayTasks 计算逻辑**

```typescript
const todayTasks = useMemo(() => {
  const beijingTime = getBeijingTime();
  const todayStr = beijingTime.toISOString().split('T')[0];
  
  return tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    const taskBeijingTime = toBeijingTime(taskDate);
    const taskDateStr = taskBeijingTime.toISOString().split('T')[0];
    return taskDateStr === todayStr;
  });
}, [tasks]);
```

- [ ] **Step 2: 导入必要的时区处理函数**

```typescript
import { getBeijingTime, toBeijingTime } from '../../utils/dateUtils';
```

- [ ] **Step 3: 运行项目验证修复**

Run: `npm run dev`
Expected: 项目正常启动，无编译错误

- [ ] **Step 4: 测试任务添加功能**

1. 打开首页
2. 点击添加任务
3. 填写任务信息并保存
4. 验证任务是否立即显示在首页的今日任务列表中

- [ ] **Step 5: 提交修改**

```bash
git add src/pages/Home/index.tsx
git commit -m "fix: 统一 Home 组件时区处理逻辑"
```

### Task 2: 优化 TaskStore 的状态更新机制

**Files:**
- Modify: `src/store/taskStore.ts:38-59`

- [ ] **Step 1: 优化 addTask 函数**

```typescript
addTask: (task) => set((state) => {
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: getBeijingTime().toISOString(),
    subtasks: [],
    recurrence: task.recurrence || {
      enabled: false,
      type: 'daily',
      interval: 1,
      days: [],
      end: {
        type: 'never'
      },
      exceptions: []
    }
  };
  
  // 确保返回新的数组引用
  const updatedTasks = [...state.tasks, newTask];
  return { tasks: updatedTasks };
}),
```

- [ ] **Step 2: 运行项目验证修复**

Run: `npm run dev`
Expected: 项目正常启动，无编译错误

- [ ] **Step 3: 测试任务添加功能**

1. 打开日程页面
2. 点击添加任务
3. 填写任务信息并保存
4. 验证任务是否立即显示在日程清单中
5. 切换到首页，验证任务是否也显示在首页

- [ ] **Step 4: 提交修改**

```bash
git add src/store/taskStore.ts
git commit -m "fix: 优化 TaskStore 状态更新机制"
```

### Task 3: 确保 TaskForm 组件的日期设置正确

**Files:**
- Modify: `src/components/TaskForm/index.tsx:49-58`

- [ ] **Step 1: 检查并优化 getDueDate 函数**

```typescript
const getDueDate = (): string => {
  const now = getBeijingTime();

  const [hours, minutes] = time.split(':').map(Number);
  
  const dueDate = new Date(now);
  dueDate.setHours(hours, minutes, 0, 0);
  
  return dueDate.toISOString();
};
```

- [ ] **Step 2: 运行项目验证修复**

Run: `npm run dev`
Expected: 项目正常启动，无编译错误

- [ ] **Step 3: 测试任务添加功能**

1. 打开首页
2. 点击添加任务
3. 选择不同的时间点添加任务
4. 验证任务是否正确显示在对应的日期和时间

- [ ] **Step 4: 提交修改**

```bash
git add src/components/TaskForm/index.tsx
git commit -m "fix: 确保 TaskForm 组件日期设置正确"
```

### Task 4: 验证完整功能

**Files:**
- 无

- [ ] **Step 1: 构建项目**

Run: `npm run build`
Expected: 构建成功，无错误

- [ ] **Step 2: 测试完整流程**

1. 启动开发服务器
2. 测试任务添加、编辑、删除功能
3. 验证任务在首页和日程页面的显示一致性
4. 测试不同时间段的任务添加
5. 测试重复任务的添加和显示

- [ ] **Step 3: 提交最终验证结果**

```bash
git commit -m "fix: 验证任务同步/显示功能修复完成"
```

## 验证标准

1. 新添加的任务应立即显示在首页的今日任务列表中
2. 新添加的任务应立即显示在日程页面的任务列表中
3. 任务的日期和时间显示应正确
4. 重复任务应按照预期显示
5. 项目应能够正常构建和运行

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-26-fix-task-sync-bug.md`.**

## 执行选项

**1. Subagent-Driven (recommended)** - 每个任务分配一个新的子代理，任务之间进行审核，快速迭代

**2. Inline Execution** - 在当前会话中使用 executing-plans 执行任务，批量执行并设置检查点

**Which approach?**