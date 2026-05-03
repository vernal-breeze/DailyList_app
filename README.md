# List Finished

一个基于 React + TypeScript + FastAPI 的日程清单应用，支持 Web 端运行。

## 功能

- 首页
![head](img/head_page.jpg)

- 任务创建 / 编辑 / 删除 / 完成切换
![set_task](img/set_task.jpg)
- 每日 / 每周 / 每月重复任务
![MonthView](img/MonthView.jpg)

- 日视图 / 周视图 / 月视图 / 日程列表
![MonthView](img/DayView.jpg)
![TaskList](img/TaskList.jpg)
- 离线操作 + 异步同步到后端
- 撤销 / 重做（Ctrl+Z）
- 快速添加（Ctrl+N）

## 技术栈

| 前端 | 后端 |
|---|---|
| React 18 | FastAPI |
| TypeScript 5 | SQLAlchemy |
| Vite 6 | SQLite |
| Zustand 5 | Python 3.12 |
| Tailwind CSS 3 | Docker |
| Jest | — |

## 快速开始

### 后端

```bash
cd backend
pip install -r requirements.txt
./start.sh
```

默认启动在 `http://localhost:8000`，API 文档：`http://localhost:8000/docs`

### 前端

```bash
npm install
cp .env.example .env.development   # 修改 API 地址
npm run dev
```

默认启动在 `http://localhost:5174`

### 常用命令

```bash
npm run dev        # 开发服务器
npm run build      # 生产构建
npm test           # 运行测试
npm run lint       # 代码检查
```

## 文档

| 文件 | 说明 |
|---|---|
| [RUN_LOGIC.md](RUN_LOGIC.md) | 项目运行逻辑（推荐先读这个） |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 架构说明 |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | 架构迁移指南（适合继续重构时参考） |
