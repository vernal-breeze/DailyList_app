# 安卓APK创建指南

本指南将教您如何为这个任务管理应用创建安卓APK安装包，以便在手机上演示。

## 前提条件

在开始之前，请确保您已经安装了以下工具：

1. **Node.js** (v14.0 或更高版本)
2. **npm** 或 **yarn** 包管理器
3. **Java Development Kit (JDK)** 8 或更高版本
4. **Android Studio** (推荐) 或至少安装了 **Android SDK**

## 步骤1：检查项目结构

确保您的项目已经设置了Capacitor，并且有完整的安卓目录结构。本项目已经包含了安卓目录：

```
list_finished/
├── android/          # 安卓原生代码目录
├── src/              # 前端代码
├── capacitor.config.ts  # Capacitor配置文件
└── package.json      # 项目依赖配置
```

## 步骤2：安装依赖

在项目根目录运行以下命令来安装所有依赖：

```bash
npm install
```

## 步骤3：构建前端代码

在生成APK之前，您需要先构建前端代码：

```bash
npm run build
```

## 步骤4：同步前端代码到安卓项目

使用Capacitor命令将前端构建文件同步到安卓项目：

```bash
npx cap sync
```

## 步骤5：打开安卓项目

### 方法A：使用Android Studio打开

```bash
npx cap open android
```

### 方法B：手动打开

1. 打开Android Studio
2. 选择 "Open an existing project"
3. 导航到 `list_finished/android` 目录并选择它

## 步骤6：生成APK

### 在Android Studio中生成APK

1. 在Android Studio顶部菜单中，选择 "Build" > "Generate Signed Bundle / APK..."
2. 选择 "APK" 选项，然后点击 "Next"
3. 如果您没有密钥库文件：
   - 点击 "Create new..."
   - 填写密钥库信息（记住密码和别名）
   - 点击 "OK"
4. 如果您已有密钥库文件：
   - 点击 "Choose existing..."
   - 选择您的密钥库文件
   - 输入密钥库密码和密钥别名密码
5. 点击 "Next"
6. 选择 "Build Type" 为 "release"
7. 点击 "Finish"

### 使用命令行生成APK

在项目根目录运行：

```bash
# 构建发布版本的APK
cd android && ./gradlew assembleRelease
```

生成的APK文件将位于：`android/app/build/outputs/apk/release/app-release.apk`

## 步骤7：安装APK到手机

### 方法A：使用USB连接

1. 启用手机的开发者选项和USB调试模式
2. 使用USB线将手机连接到电脑
3. 运行以下命令：
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

### 方法B：通过文件传输

1. 将生成的APK文件复制到手机存储中
2. 在手机上使用文件管理器找到APK文件
3. 点击APK文件并按照提示安装

## 步骤8：在手机上运行应用

安装完成后，您可以在手机的应用列表中找到并打开应用，开始演示。

## 故障排除

### 常见问题

1. **构建失败**：确保您的Java和Android SDK版本正确，并且所有依赖已安装。

2. **签名错误**：确保您使用了正确的密钥库文件和密码。

3. **安装失败**：确保您的手机允许安装来自未知来源的应用。

4. **应用崩溃**：检查前端代码是否有错误，确保所有依赖都已正确安装。

### 调试技巧

- 使用 `npx cap run android` 命令在连接的设备上直接运行应用进行调试
- 在Android Studio中查看Logcat日志以了解崩溃原因
- 确保 `capacitor.config.ts` 中的配置正确

## 注意事项

- 发布版本的APK已经过优化和混淆，适合演示和分发
- 请妥善保管您的密钥库文件，它对于后续更新应用至关重要
- 如果您需要在Google Play商店发布应用，还需要完成额外的步骤

## 快捷命令

项目根目录提供了一个启动脚本，可以快速启动安卓开发环境：

```bash
./start-android.sh
```

---

现在您已经成功创建了安卓APK并安装到手机上，可以开始演示应用的功能了！