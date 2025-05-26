# 🚀 Web Page Scorer - Electron 桌面应用

一个基于 Electron 开发的网页评分桌面应用，专为从 Excel 文件中批量评估网页而设计。

## ✨ 主要功能

- **📊 Excel 集成**: 动态选择和处理 Excel 文件，自动识别列结构
- **🌐 内嵌浏览器**: 使用 Electron BrowserView 直接查看网页内容
- **⚡ 快速评分**: 支持 Pass/Fail 快速评分，键盘快捷键操作
- **📸 截图功能**: 一键截图并自动保存，避免 Excel 字符限制
- **📝 实时备注**: 问题输入框支持实时编辑和自动保存
- **💾 智能保存**: 多时机自动保存，确保数据安全
- **🎯 用户友好**: 紧凑布局，一屏操作，响应式设计

## 🔧 技术栈

- **Electron**: 跨平台桌面应用框架
- **Node.js**: 后端逻辑处理
- **XLSX**: Excel 文件读写
- **HTML/CSS/JavaScript**: 前端界面
- **Electron Builder**: 应用打包工具

## 📦 安装包下载

### 🍎 Mac 版本

#### Intel Mac (x64):
- **DMG 安装包**: `Web Page Scorer-1.0.0.dmg` (100MB)
- **ZIP 压缩包**: `Web Page Scorer-1.0.0-mac.zip` (97MB)

#### Apple Silicon Mac (M1/M2/M3):
- **DMG 安装包**: `Web Page Scorer-1.0.0-arm64.dmg` (94MB)
- **ZIP 压缩包**: `Web Page Scorer-1.0.0-arm64-mac.zip` (91MB)

### 🪟 Windows 版本

- **安装程序**: `Web Page Scorer Setup 1.0.0.exe` (139MB)
- **便携版**: `Web Page Scorer 1.0.0.exe` (139MB)

> 📋 详细安装说明请查看 [RELEASE.md](RELEASE.md)

## 🛠️ 开发环境设置

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd query-benchmark
```

2. **安装依赖**
```bash
npm install
```

3. **开发模式运行**
```bash
npm start
```

4. **构建应用**
```bash
# 构建所有平台
npm run build:all

# 仅构建 Mac 版本
npm run build:mac

# 仅构建 Windows 版本
npm run build:win

# 使用构建脚本（推荐）
./build.sh          # Mac/Linux
build.bat           # Windows
```

## 📂 项目结构

```
query-benchmark/
├── main.js              # Electron 主进程
├── index.html           # 应用界面
├── package.json         # 项目配置
├── build.sh            # Mac/Linux 构建脚本
├── build.bat           # Windows 构建脚本
├── RELEASE.md          # 发布说明
├── README.md           # 项目说明
├── dist/               # 构建输出目录
├── screenshots/        # 截图存储目录
└── node_modules/       # 依赖包
```

## 🎯 使用方法

1. **启动应用**：运行安装包或可执行文件
2. **选择文件**：选择包含网页数据的 Excel 文件
3. **开始评分**：
   - 查看内嵌浏览器中的网页内容
   - 使用快捷键或按钮进行评分
   - 添加问题备注和截图
4. **自动保存**：应用会自动保存所有更改到 Excel 文件

## ⌨️ 快捷键

- `←/→` - 切换上一页/下一页
- `1` - 标记为通过 (Pass)
- `0` - 标记为失败 (Fail)
- `Ctrl+S` - 手动保存

## 📊 Excel 文件格式

应用自动识别以下列：
- **description/query**: 描述或查询内容
- **link**: 网页链接
- **thumbnail_link**: 缩略图链接  
- **result**: 评分结果 (0=失败, 1=通过)
- **issue**: 问题备注
- **screenshot**: 截图文件路径

## 🚀 特性亮点

### 🔄 自动保存机制
- 切换页面时自动保存
- 评分后立即保存
- 截图后自动保存
- 输入备注1秒后自动保存
- 离开输入框时立即保存

### 📱 响应式设计
- 紧凑的顶部控制栏
- 固定高度布局 `calc(100vh - 120px)`
- 移动端适配
- 一屏操作设计

### 🖼️ 智能截图
- 保存为文件而非 base64，避免 Excel 字符限制
- 自动创建 screenshots 目录
- 支持截图预览和全屏查看

### 🌐 网页加载优化
- BrowserView 精确定位
- 滚动优化，滚动时隐藏浏览器视图
- 防抖处理，提升性能

## 🧪 测试

项目已通过以下测试：
- ✅ Mac (Intel/Apple Silicon) 打包测试
- ✅ Windows (x64/x86) 打包测试
- ✅ Excel 文件读写测试
- ✅ 自动保存功能测试
- ✅ 截图功能测试
- ✅ 响应式布局测试

## 🛠️ 构建配置

使用 `electron-builder` 进行跨平台打包：

- **Mac**: 生成 DMG 和 ZIP 格式，支持 Intel 和 Apple Silicon
- **Windows**: 生成 NSIS 安装程序和便携版
- **代码签名**: 支持 Mac 代码签名（需配置证书）
- **自动更新**: 预留更新机制接口

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**版本**: 1.0.0  
**最后更新**: 2024年5月26日 