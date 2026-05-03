# 日程清单 - Android 命令行构建指南

## 方法二：命令行构建 Android APK

### 步骤 1：安装 Java Development Kit (JDK)

#### 在 macOS 上安装 JDK：
1. 打开终端
2. 运行：`brew install openjdk@17`
3. 等待安装完成
4. 配置环境变量：
   ```bash
   echo 'export PATH="/usr/local/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
   echo 'export JAVA_HOME="/usr/local/opt/openjdk@17"' >> ~/.zshrc
   source ~/.zshrc
   ```
5. 验证安装：`java -version`

#### 在 Windows 上安装 JDK：
1. 下载 JDK 17：https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
2. 运行安装程序
3. 配置环境变量：
   - 右键点击「此电脑」→「属性」→「高级系统设置」→「环境变量」
   - 在系统变量中添加 `JAVA_HOME`，值为 JDK 安装目录
   - 在 Path 变量中添加 `%JAVA_HOME%\bin`
4. 验证安装：打开命令提示符，运行 `java -version`

### 步骤 2：安装 Android SDK

#### 方法 A：通过 Android Studio（推荐）
1. 下载并安装 Android Studio：https://developer.android.com/studio
2. 启动 Android Studio，它会自动下载并配置 SDK
3. 打开 SDK Manager（Tools → SDK Manager）
4. 确保安装了：
   - Android SDK Build-Tools (最新版本)
   - Android SDK Platform-Tools
   - Android SDK Tools
   - 至少一个 Android SDK Platform（推荐最新的 API 级别）

#### 方法 B：仅安装 SDK Command Line Tools
1. 下载 SDK Command Line Tools：https://developer.android.com/studio#command-tools
2. 解压到一个目录，例如 `/Users/yourname/Library/Android/sdk`
3. 配置环境变量：
   ```bash
   echo 'export ANDROID_HOME="/Users/yourname/Library/Android/sdk"' >> ~/.zshrc
   echo 'export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```
4. 安装 SDK 组件：
   ```bash
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```

### 步骤 3：构建 APK

1. 进入项目目录：
   ```bash
   cd /Users/fanqie/Desktop/list_finished
   ```

2. 构建 Web 应用：
   ```bash
   npm run build
   ```

3. 同步到 Android 项目：
   ```bash
   npx cap sync
   ```

4. 进入 Android 目录：
   ```bash
   cd android
   ```

5. 构建 Debug APK：
   ```bash
   ./gradlew assembleDebug
   ```

   或者构建 Release APK（需要签名配置）：
   ```bash
   ./gradlew assembleRelease
   ```

### 步骤 4：找到 APK 文件

构建完成后，APK 文件会生成在以下位置：
- **Debug 版本**：`android/app/build/outputs/apk/debug/app-debug.apk`
- **Release 版本**：`android/app/build/outputs/apk/release/app-release-unsigned.apk`

### 步骤 5：安装到手机

1. 将 APK 文件传输到手机
2. 在手机上找到并点击 APK 文件
3. 按照提示完成安装
4. 如需提示，允许安装未知来源的应用

### 常见问题解决

#### 1. Gradle 构建失败
- **问题**：`Could not find tools.jar`
  **解决方案**：确保 JDK 安装正确，JAVA_HOME 环境变量配置正确

- **问题**：`SDK location not found`
  **解决方案**：设置 ANDROID_HOME 环境变量，指向 SDK 安装目录

- **问题**：`License for package Android SDK Build-Tools not accepted`
  **解决方案**：运行 `sdkmanager --licenses` 并接受所有许可证

#### 2. 应用安装失败
- **问题**：`App not installed`
  **解决方案**：
  - 确保手机允许安装未知来源的应用
  - 卸载旧版本后重新安装
  - 检查 APK 文件是否损坏

- **问题**：`Parse error`
  **解决方案**：
  - 确保 APK 文件完整下载
  - 检查 Android 版本是否满足要求（Android 5.0+）

### 构建脚本

为了方便，我创建了一个构建脚本：

**start-android-build.sh**
```bash
#!/bin/bash

echo "🌸 日程清单 - Android 构建脚本 🌸"
echo ""

# 检查 Java
echo "🔍 检查 Java 环境..."
if ! command -v java &> /dev/null; then
    echo "❌ 错误: 未找到 Java，请按照指南安装 JDK 17"
    exit 1
fi

# 检查 Android SDK
echo "🔍 检查 Android SDK 环境..."
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  警告: 未设置 ANDROID_HOME 环境变量"
    echo "请按照指南安装并配置 Android SDK"
fi

# 构建 Web 应用
echo "📦 构建 Web 应用..."
cd /Users/fanqie/Desktop/list_finished
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web 构建失败"
    exit 1
fi

# 同步到 Android
echo "🔄 同步到 Android 项目..."
npx cap sync

if [ $? -ne 0 ]; then
    echo "❌ 同步失败"
    exit 1
fi

# 构建 APK
echo "🚀 构建 Android APK..."
cd android
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 构建成功！"
    echo "APK 文件位置: android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📱 现在可以将 APK 安装到手机上了！"
else
    echo ""
    echo "❌ 构建失败，请查看错误信息"
fi
```

### 故障排除

如果遇到构建问题，请检查：
1. Java 版本是否为 17 或更高
2. ANDROID_HOME 环境变量是否正确设置
3. Android SDK 组件是否完整安装
4. 网络连接是否正常（Gradle 需要下载依赖）
5. 磁盘空间是否足够

### 联系支持

如果按照上述步骤仍然无法构建，请参考：
- [Capacitor 官方文档](https://capacitorjs.com/docs/android)
- [Android 开发者文档](https://developer.android.com/studio/build)

或者尝试使用 Android Studio 构建方法（推荐给初学者）。
