# 开源日程清单 / 待办事项项目 UI 设计参考

> 以下项目均来自 GitHub，涵盖不同技术栈和 UI 风格，可作为日程清单小程序的 UI 设计参考。

---

## 1. Super Productivity

| 属性 | 信息 |
|------|------|
| **GitHub** | [super-productivity/super-productivity](https://github.com/super-productivity/super-productivity) |
| **Stars** | ⭐ 17.1k+ |
| **技术栈** | Angular + Electron + Capacitor |
| **平台** | Web / Desktop / Android / iOS |

### UI 特色

- **多面板布局**：左侧为项目导航栏，中间为主任务列表，右侧为任务详情面板，三栏式布局信息密度高
- **Timeboxing 时间盒**：内置时间追踪可视化，任务卡片上直接显示时间进度条
- **颜色编码系统**：项目、标签均支持自定义颜色，任务通过颜色快速区分优先级和归属
- **键盘优先设计**：大量快捷键支持（Shift+A 添加任务、D 标记完成），适合高效用户
- **集成面板**：将 Jira/GitHub/GitLab 等外部任务以卡片形式嵌入主界面，统一视觉风格

### 参考价值
适合需要**功能丰富 + 高信息密度**的日程清单设计，其时间追踪可视化和颜色编码系统值得借鉴。

---

## 2. Vikunja

| 属性 | 信息 |
|------|------|
| **GitHub** | [go-vikunja/vikunja](https://github.com/go-vikunja/vikunja) |
| **Stars** | ⭐ 5k+ |
| **技术栈** | Go + Vue.js |
| **平台** | Web / Desktop / Mobile |

### UI 特色

- **多视图切换**：支持列表视图、看板视图（Kanban）、甘特图视图，同一数据多种展示方式
- **项目层级管理**：命名空间 → 项目 → 列表 → 任务，层级清晰，导航面包屑式设计
- **Unsplash 背景图**：项目封面支持 Unsplash 高清图片，视觉上更具吸引力
- **标签与分组**：任务支持多标签、颜色标签，支持按属性筛选和分组显示
- **响应式设计**：从桌面到移动端均有良好适配，侧边栏可折叠

### 参考价值
适合需要**多视图 + 层级管理**的设计参考，看板与列表的切换交互是其亮点。

---

## 3. AppFlowy

| 属性 | 信息 |
|------|------|
| **GitHub** | [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) |
| **Stars** | ⭐ 66.1k+ |
| **技术栈** | Flutter + Rust |
| **平台** | macOS / Windows / Linux / iOS / Android |

### UI 特色

- **Block 式编辑器**：类似 Notion 的块编辑器设计，任务、标题、列表、图片等均为独立 Block，可自由拖拽排列
- **侧边栏 + 主内容区**：左侧为页面树形导航，右侧为内容编辑区，简洁的双栏布局
- **数据库视图**：将任务以表格、看板、日历、画廊等多种视图呈现，切换流畅
- **原生体验**：基于 Flutter 构建，各平台 UI 均为原生风格，动画流畅自然
- **AI 集成 UI**：AI 助手以浮动面板形式出现，不干扰主界面布局

### 参考价值
适合**高度自定义 + Block 编辑器**风格的设计参考，其多视图数据库和原生跨平台体验是业界标杆。

---

## 4. Focalboard (Mattermost Boards)

| 属性 | 信息 |
|------|------|
| **GitHub** | [mattermost/focalboard](https://github.com/mattermost/focalboard) |
| **Stars** | ⭐ 21.2k+ |
| **技术栈** | TypeScript + Go (React 前端) |
| **平台** | Web / Desktop (macOS/Windows/Linux) |

### UI 特色

- **看板为核心**：以 Kanban 看板为主要交互形式，卡片支持拖拽、分组、筛选
- **卡片属性系统**：每张卡片可配置多个自定义属性（日期、人员、状态、文本等），属性以标签形式显示在卡片上
- **多视图支持**：看板、表格、日历、画廊四种视图，适应不同使用场景
- **左侧导航栏**：简洁的图标 + 文字导航，支持收藏和最近访问
- **模板系统**：内置多种模板（项目管理、OKR、个人任务等），开箱即用

### 参考价值
适合**看板式任务管理**的 UI 设计参考，其卡片属性系统和多视图切换是核心亮点。

---

## 5. Flutter Todos (One Day List)

| 属性 | 信息 |
|------|------|
| **GitHub** | [asjqkkkk/flutter-todos](https://github.com/asjqkkkk/flutter-todos) |
| **Stars** | ⭐ 2.1k+ |
| **技术栈** | Flutter (Dart) |
| **平台** | Android / iOS |

### UI 特色

- **多彩主题系统**：内置 6 套精心搭配的主题色，支持自定义主题色，一键切换
- **圆形任务图标**：每个任务配有 Material Design 风格的圆形图标，支持自定义颜色
- **卡片式任务列表**：任务以圆角卡片形式展示，带有阴影和边框，视觉层次分明
- **侧滑导航栏**：首页顶部侧滑栏可自定义显示内容（日期、名言等）
- **已完成列表**：完成的任务自动归档到独立页面，带有完成时间等附加信息
- **列表动画**：使用 Staggered Animations 实现列表项的交错入场动画

### 参考价值
非常适合**移动端日程清单小程序**的 UI 参考，其主题系统和卡片式设计简洁美观。

---

## 6. Calcure

| 属性 | 信息 |
|------|------|
| **GitHub** | [anufrievroman/calcure](https://github.com/anufrievroman/calcure) |
| **Stars** | ⭐ 2.1k+ |
| **技术栈** | Python (TUI 终端界面) |
| **平台** | Linux / macOS / Windows Terminal |

### UI 特色

- **终端美学**：纯 TUI 界面，使用 Unicode 字符和颜色编码打造精致的终端 UI
- **极简布局**：上方为月历视图，下方为任务列表，信息密度恰到好处
- **Vim 键绑定**：面向键盘用户，所有操作均可通过快捷键完成
- **自动图标匹配**：根据任务名称自动匹配 emoji 图标（如 ✈ ⛷ ⛱），增加视觉趣味
- **高度可定制**：颜色、图标、布局均可通过 config.ini 配置文件自定义

### 参考价值
适合**极简主义 + 键盘操作**的设计思路参考，其信息密度控制和自动图标匹配是独特亮点。

---

## 7. TodoMVC (多种框架实现)

| 属性 | 信息 |
|------|------|
| **GitHub** | [tastejs/todomvc](https://github.com/tastejs/todomvc) |
| **Stars** | ⭐ 80k+ |
| **技术栈** | 多种（React/Vue/Angular/jQuery 等） |
| **平台** | Web |

### UI 特色

- **统一设计规范**：所有框架实现共享同一套 UI 设计，确保公平对比
- **经典三段式布局**：输入框 → 任务列表（含编辑/删除）→ 底部统计栏
- **双击编辑**：任务项双击进入编辑模式，行内编辑体验流畅
- **筛选标签**：All / Active / Completed 三个筛选标签，底部显示剩余任务数
- **清除已完成**：一键清除所有已完成任务，交互简洁

### 参考价值
作为**经典 Todo UI 的标准范式**，适合作为小程序基础 UI 的起点设计参考。

---

## UI 设计趋势总结

| 趋势 | 说明 | 代表项目 |
|------|------|----------|
| **多视图切换** | 同一任务数据支持列表/看板/日历/表格等多种视图 | Vikunja, AppFlowy, Focalboard |
| **卡片式设计** | 任务以圆角卡片展示，支持拖拽和属性标签 | Flutter Todos, Focalboard |
| **颜色编码** | 通过颜色区分项目/优先级/标签，信息一目了然 | Super Productivity, Vikunja |
| **主题定制** | 支持亮/暗模式和自定义主题色 | Flutter Todos, Calcure |
| **Block 编辑器** | 任务、笔记等内容以 Block 形式自由组合 | AppFlowy |
| **时间可视化** | 内置时间追踪，任务上显示时间进度 | Super Productivity |
| **极简布局** | 信息密度适中，操作路径短 | Calcure, TodoMVC |

---

> 💡 **建议**：如果你要做的是移动端小程序，优先参考 **Flutter Todos**（卡片式 + 主题系统）和 **TodoMVC**（经典布局）；如果需要更丰富的功能，可参考 **Vikunja**（多视图）和 **Focalboard**（看板式）的交互设计。
