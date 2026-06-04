# Android 本地构建说明

当前项目需要完整 JDK 17 或更高版本来构建 Android。

## 已确认

- Android SDK 路径：`D:\Android\Sdk`
- 当前全局 Java：`D:\Java\jdk1.8.0_311`
- Android Studio JBR 路径：`D:\Program Files\Android Studio\jbr`
- JDK 8 不能构建当前 Android Gradle Plugin，Android Studio JBR 21 可以构建

## 推荐配置

可以使用 Android Studio 自带 JBR，或安装完整 JDK 17/21。目录中需要存在：

```text
bin\java.exe
bin\javac.exe
bin\jlink.exe
```

如果只想临时在当前 PowerShell 中切换：

```powershell
$env:JAVA_HOME="D:\Program Files\Android Studio\jbr"
$env:ANDROID_HOME="D:\Android\Sdk"
$env:ANDROID_SDK_ROOT="D:\Android\Sdk"
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
java -version
```

然后构建：

```powershell
corepack pnpm run build
.\node_modules\.bin\cap.CMD sync android
cd android
.\gradlew.bat assembleDebug
```

Debug APK 输出位置：

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

## Android Studio

如果 Android Studio 已安装，可以直接打开：

```powershell
.\node_modules\.bin\cap.CMD open android
```

在 Android Studio 中选择完整 JDK 17/21 后，再连接真机运行。
