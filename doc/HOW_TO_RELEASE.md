# Web Page Scorer 发布指南

## 📦 已准备的发布文件

### 🚀 GitHub Release 内容

已经为你准备好了完整的GitHub Release所需的文件：

#### 📁 release/ 目录包含的安装包：

1. **Mac 版本**：
   - `Web Page Scorer-1.0.0.dmg` (100MB) - Intel Mac DMG安装包
   - `Web Page Scorer-1.0.0-arm64.dmg` (94MB) - Apple Silicon Mac DMG安装包  
   - `Web Page Scorer-1.0.0-mac.zip` (97MB) - Intel Mac ZIP压缩包
   - `Web Page Scorer-1.0.0-arm64-mac.zip` (91MB) - Apple Silicon Mac ZIP压缩包

2. **Windows 版本**：
   - `Web Page Scorer Setup 1.0.0.exe` (139MB) - Windows安装程序
   - `Web Page Scorer 1.0.0.exe` (139MB) - Windows便携版

#### 📄 发布说明：
- `RELEASE_NOTES.md` - 完整的GitHub Release发布说明

#### 🤖 自动化：
- `.github/workflows/release.yml` - GitHub Actions自动构建和发布工作流
- `prepare-release.sh` - 手动准备发布文件的脚本

## 🎯 在GitHub上创建Release的步骤

### 方法1：手动创建Release（推荐）

1. **访问GitHub Release页面**
   
   打开浏览器访问:
   ```
   https://github.com/XiaoDcs/web-page-scorer/releases/new
   ```

2. **填写Release信息**：
   - **Tag version**: `v1.0.0` (已创建)
   - **Release title**: `Web Page Scorer v1.0.0`
   - **Description**: 复制 `RELEASE_NOTES.md` 的内容

3. **上传安装包**：
   - 将 `release/` 目录中的6个文件全部拖拽上传
   - 或者逐个点击"Attach binaries"上传

4. **发布**：
   - 确保"Set as the latest release"已勾选
   - 点击"Publish release"

### 方法2：自动构建（需要时间）

标签 `v1.0.0` 已经推送，GitHub Actions会自动：
1. 在macOS和Windows环境下构建应用
2. 创建Release
3. 上传构建的安装包

**注意**：自动构建需要15-30分钟，如果需要立即发布，建议使用方法1。

## 📋 Release 内容清单

### ✅ 已完成的项目：

- [x] 代码推送到GitHub仓库
- [x] 创建适当的.gitignore文件
- [x] 构建所有平台的安装包
- [x] 准备release目录和文件
- [x] 创建GitHub Release发布说明
- [x] 设置GitHub Actions自动化
- [x] 创建和推送Git标签v1.0.0
- [x] 项目文档完善（README.md, RELEASE.md）

### 📊 文件统计：

- **总文件数**: 6个安装包
- **总大小**: 约660MB
- **支持平台**: macOS (Intel + Apple Silicon), Windows (x64 + x86)
- **文件格式**: DMG, ZIP, EXE

## 🔗 相关链接

- **GitHub仓库**: https://github.com/XiaoDcs/web-page-scorer
- **创建Release**: https://github.com/XiaoDcs/web-page-scorer/releases/new
- **Actions状态**: https://github.com/XiaoDcs/web-page-scorer/actions
- **标签列表**: https://github.com/XiaoDcs/web-page-scorer/tags

## 🛠️ 如果需要更新Release

如果需要修改或更新Release：

1. **删除现有标签**（如果需要）：
   ```bash
   git tag -d v1.0.0
   git push origin :refs/tags/v1.0.0
   ```

2. **重新构建**：
   ```bash
   npm run build:all
   ./prepare-release.sh
   ```

3. **重新创建标签和Release**：
   ```bash
   git tag -a v1.0.0 -m "Updated release"
   git push origin v1.0.0
   ```

---

**当前状态**: ✅ 所有发布文件已准备完成，可以立即在GitHub上创建Release！ 