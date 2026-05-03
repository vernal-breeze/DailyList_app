# Git 提交指南 - 私有仓库

本文档将指导你如何将项目提交到Git私有仓库。

## 📋 前置条件

- 已安装Git
- 拥有GitHub/GitLab/Gitee等Git托管平台的账号
- 本项目已准备好

---

## 🚀 快速开始（推荐GitHub）

### 第一步：初始化本地Git仓库

在项目根目录执行以下命令：

```bash
cd /Users/fanqie/Desktop/list_finished

# 初始化Git仓库
git init

# 配置用户信息（如果还没配置过）
git config user.name "你的用户名"
git config user.email "你的邮箱"

# 查看Git状态
git status
```

### 第二步：创建.gitignore文件

项目已经有了[.gitignore](file:///Users/fanqie/Desktop/list_finished/.gitignore)文件，让我们检查一下内容是否合适：

```bash
cat .gitignore
```

确保以下内容在.gitignore中：
- `node_modules/` - 依赖包
- `dist/` - 构建产物
- `.DS_Store` - macOS系统文件
- `coverage/` - 测试覆盖率报告
- `android/.gradle/` - Android构建缓存
- `android/app/build/` - Android构建产物
- `.env` - 环境变量文件

### 第三步：添加文件到暂存区

```bash
# 添加所有文件
git add .

# 或者选择性添加
# git add src/ package.json
```

### 第四步：提交文件

```bash
# 创建第一次提交
git commit -m "初始化项目 - 日程清单应用"
```

### 第五步：在GitHub上创建私有仓库

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `list-finished` （或你喜欢的名称）
   - **Description**: `日程清单应用 - React Native + Capacitor`
   - **Visibility**: 选择 "Private" （私有仓库）
   - **Initialize this repository with**: 不要勾选任何选项（README, .gitignore, License）
4. 点击 "Create repository"

### 第六步：关联远程仓库

创建好仓库后，GitHub会显示一些命令，按照以下方式操作：

```bash
# 关联远程仓库（替换为你的GitHub用户名和仓库名）
git remote add origin https://github.com/你的用户名/list-finished.git

# 或者使用SSH（如果配置了SSH密钥）
# git remote add origin git@github.com:你的用户名/list-finished.git

# 查看远程仓库
git remote -v
```

### 第七步：推送到远程仓库

```bash
# 推送到远程仓库（第一次推送）
git push -u origin main

# 或者如果默认分支是master
# git push -u origin master
```

---

## 📝 详细操作步骤

### 方式一：使用HTTPS（简单，适合初学者）

```bash
# 1. 初始化
git init

# 2. 添加文件
git add .

# 3. 提交
git commit -m "初始化项目"

# 4. 创建远程仓库（在GitHub网页操作）

# 5. 关联远程仓库
git remote add origin https://github.com/你的用户名/仓库名.git

# 6. 推送
git branch -M main
git push -u origin main
```

### 方式二：使用SSH（推荐，更安全）

#### 生成SSH密钥

```bash
# 检查是否已有SSH密钥
ls -la ~/.ssh

# 如果没有，生成新的SSH密钥
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 按回车使用默认位置，可设置密码（可选）

# 复制公钥到剪贴板
cat ~/.ssh/id_ed25519.pub | pbcopy
```

#### 添加SSH密钥到GitHub

1. 访问 GitHub -> Settings -> SSH and GPG keys
2. 点击 "New SSH key"
3. 标题可以是 "MacBook" 或你的设备名称
4. 粘贴刚才复制的公钥
5. 点击 "Add SSH key"

#### 使用SSH推送

```bash
# 关联远程仓库（使用SSH地址）
git remote add origin git@github.com:你的用户名/仓库名.git

# 推送到远程仓库
git branch -M main
git push -u origin main
```

---

## 🔄 日常开发流程

### 1. 查看状态
```bash
git status
```

### 2. 查看修改
```bash
git diff
```

### 3. 添加修改
```bash
# 添加所有修改
git add .

# 添加特定文件
git add src/components/TaskForm/index.tsx
```

### 4. 提交修改
```bash
git commit -m "描述你的修改"
```

### 5. 推送到远程
```bash
git push
```

### 6. 拉取更新
```bash
git pull
```

---

## 🌿 分支管理（可选）

### 创建新分支
```bash
# 创建并切换到新分支
git checkout -b feature/你的功能名称

# 或者使用新语法
git switch -c feature/你的功能名称
```

### 切换分支
```bash
git checkout main
# 或者
git switch main
```

### 合并分支
```bash
# 先切换到main分支
git checkout main

# 合并功能分支
git merge feature/你的功能名称
```

### 删除分支
```bash
# 删除本地分支
git branch -d feature/你的功能名称

# 删除远程分支
git push origin --delete feature/你的功能名称
```

---

## 📌 常用Git命令速查

| 命令 | 说明 |
|------|------|
| `git init` | 初始化仓库 |
| `git clone <地址>` | 克隆远程仓库 |
| `git status` | 查看状态 |
| `git add <文件>` | 添加文件到暂存区 |
| `git commit -m "信息"` | 提交更改 |
| `git push` | 推送到远程 |
| `git pull` | 拉取更新 |
| `git log` | 查看提交历史 |
| `git branch` | 查看分支 |
| `git checkout <分支>` | 切换分支 |
| `git merge <分支>` | 合并分支 |

---

## ⚠️ 常见问题解决

### 问题1：推送失败 - 权限被拒绝
**原因**：没有正确配置SSH或HTTPS认证
**解决**：
- 检查SSH密钥配置
- 或者使用个人访问令牌（PAT）进行HTTPS认证

### 问题2：远程仓库已存在内容
**解决**：
```bash
# 先拉取远程内容
git pull origin main --allow-unrelated-histories

# 然后再推送
git push origin main
```

### 问题3：想撤销最近的提交
```bash
# 撤销提交但保留更改
git reset --soft HEAD~1

# 撤销提交并丢弃更改（谨慎使用）
git reset --hard HEAD~1
```

### 问题4：修改了.gitignore但没生效
```bash
# 清除缓存
git rm -r --cached .

# 重新添加
git add .

# 提交
git commit -m "更新.gitignore"
```

---

## 📋 提交信息规范

建议使用清晰的提交信息格式：

```bash
# 格式
git commit -m "类型: 简短描述"

# 示例
git commit -m "feat: 添加通知提醒功能"
git commit -m "fix: 修复重复任务显示bug"
git commit -m "docs: 更新README文档"
git commit -m "refactor: 重构任务管理逻辑"
```

常见类型：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

---

## 🎯 下一步

完成第一次提交后，你可以：

1. 🔗 添加项目README
2. 🏷️ 创建标签进行版本管理
3. 🔄 设置GitHub Actions自动化构建
4. 📝 开启Issues管理项目问题
5. 👥 如果需要，可以添加协作者

祝你代码提交顺利！🎉
