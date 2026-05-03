# 日程清单 Android 应用构建指南

## 项目状态
✅ Capacitor 配置已完成
✅ Web 应用已成功构建
✅ Android 平台已添加并同步

## 构建和安装 Android 应用的步骤

### 方法一：使用 Android Studio（推荐）

#### 1. 安装 Android Studio
- 下载并安装 [Android Studio](https://developer.android.com/studio)
- 安装过程中会自动下载 Android SDK

#### 2. 打开项目
1. 启动 Android Studio
2. 选择 "Open an Existing Project"
3. 导航到 `/Users/fanqie/Desktop/list_finished/android` 文件夹
4. 点击 "Open"

#### 3. 等待 Gradle 同步
- Android Studio 会自动检测项目并开始同步 Gradle
- 等待同步完成（可能需要几分钟，取决于网络速度）
- 如果提示安装缺失的 SDK 组件，请点击安装

#### 4. 构建 APK
1. 在 Android Studio 顶部菜单中，选择 `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`
2. 等待构建完成
3. 构建完成后，会弹出一个通知，点击 "locate" 可以找到 APK 文件
4. APK 文件位置：`android/app/build/outputs/apk/debug/app-debug.apk`

#### 5. 安装到手机
**方法 A：通过 USB 安装**
1. 在手机上开启「开发者选项」和「USB 调试」
2. 用 USB 数据线连接手机和电脑
3. 在 Android Studio 中，点击顶部的运行按钮（绿色三角形）
4. 选择你的设备
5. 应用会自动安装并启动

**方法 B：直接传输 APK**
1. 将 `app-debug.apk` 文件传输到手机
2. 在手机上找到并点击安装
3. 如需提示，允许安装未知来源的应用

### 方法二：命令行构建（需要 Java 环境）

如果你安装了 Java 17+ 和 Android SDK，可以使用以下命令：

```bash
# 进入 android 目录
cd /Users/fanqie/Desktop/list_finished/android

# 构建 debug APK
./gradlew assembleDebug

# 构建 release APK（需要签名配置）
./gradlew assembleRelease
```

APK 文件会生成在：
- Debug: `app/build/outputs/apk/debug/app-debug.apk`
- Release: `app/build/outputs/apk/release/app-release-unsigned.apk`

## 应用信息
- **应用名称**: 日程清单
- **包名**: com.licheng.schedule
- **版本**: 1.0

## 功能特性
✅ 任务管理（添加、编辑、删除）
✅ 任务优先级设置
✅ 任务分类
✅ 重复提醒（每天、每周、自定义）
✅ 本地数据存储
✅ 精美的粉色渐变 UI
✅ 响应式设计，完美适配手机屏幕

## 常见问题

### Gradle 同步失败
- 检查网络连接
- 更新 Android SDK
- 点击 File -> Invalidate Caches / Restart

### 构建失败
- 确保使用的是 Java 17 或更高版本
- 检查是否有足够的磁盘空间
- 查看 Build 窗口中的详细错误信息

### 应用无法安装
- 确保手机允许安装未知来源的应用
- 卸载旧版本后重新安装
- 检查 Android 版本是否满足要求（Android 5.0+）

## 更新应用
当你修改了源代码后：
1. 在项目根目录运行：`npm run build`
2. 然后运行：`npx cap sync`
3. 在 Android Studio 中重新构建或运行

## 发布版本
如果你想要发布到应用商店，需要配置签名：
1. 在 `android/app/build.gradle` 中配置签名信息
2. 构建 release APK：`./gradlew assembleRelease`
3. 使用签名工具签名 APK
