# 更新日志 / Changelog

## [1.0.2] - 2025-05-27

### 🎯 Major Features Added

#### ⌨️ 完全自定义快捷键系统
- **11个功能的完全自定义快捷键**：导航、评分、操作、设置等所有功能
- **实时录制界面**：点击任意快捷键即可重新录制，支持复杂组合键
- **冲突检测**：自动检测并防止快捷键冲突
- **本地持久化**：所有自定义快捷键自动保存到本地
- **重置功能**：一键重置所有快捷键到默认设置
- **可视化管理**：清晰的快捷键配置面板，支持显示/隐藏

#### 🏷️ 高级标签管理系统
- **7个可编辑预设标签**：
  - 有争议性
  - 涉及敏感话题
  - 过于主观评价
  - 负面语言
  - 过于标题党
  - 挑战政策/制度
  - 图片无法加载
- **无限自定义标签**：用户可添加任意数量的自定义标签
- **标签快捷键**：Ctrl+1~9 快速应用标签，智能分配快捷键
- **双击编辑**：预设和自定义标签都支持双击编辑
- **右键删除**：自定义标签支持右键删除
- **本地持久化**：所有标签更改自动保存

#### 🎛️ 增强的用户控制
- **页面跳转功能**：Ctrl+G 快速跳转到指定页面
- **智能预加载配置**：可配置0-15页预加载数量
- **自动跳转开关**：Pass后自动跳转功能可开关
- **清除标签快捷键**：Ctrl+0 快速清空issue备注
- **外部浏览器打开**：Ctrl+O 在系统浏览器中打开当前页面

### 🔧 Technical Improvements

#### ⚡ 智能预加载优化
- **后台预加载**：在后台智能预加载页面，提升用户体验
- **内存管理**：优化内存使用，防止预加载造成性能问题
- **加载状态显示**：实时显示预加载进度和状态
- **错误处理**：优雅处理预加载失败的情况

#### 🎨 界面优化
- **精简布局**：移除标题栏，最大化内容显示空间
- **控制栏重组**：Pass/Fail/Screenshot按钮移至顶部，操作更便捷
- **颜色优化**：绿色Pass、红色Fail、橙色Screenshot，视觉直观
- **响应式设计**：更好的移动端和小屏幕适配

#### 💾 数据持久化
- **LocalStorage集成**：自定义快捷键、标签、设置全部本地保存
- **跨会话保持**：重启应用后所有用户配置自动恢复
- **数据验证**：输入验证和错误处理确保数据完整性

#### 🖱️ 交互体验提升
- **键盘导航优化**：在输入框中仍可使用部分快捷键
- **视觉反馈**：按键操作有明确的视觉反馈
- **状态提示**：操作结果有清晰的状态提示
- **帮助信息**：内置帮助文本指导用户使用

### 🐛 Bug Fixes
- 修复自定义快捷键在输入框中的冲突问题
- 优化BrowserView位置调整逻辑
- 改善内存管理，减少预加载内存泄漏
- 修复标签快捷键分配算法

### 📋 Complete Feature List

**Core Functionality:**
- Excel文件选择和处理
- 内嵌浏览器网页显示
- Pass/Fail评分系统
- 截图功能
- 实时issue备注
- 自动保存机制

**Advanced Features:**
- 完全自定义快捷键系统 (11个功能)
- 可编辑标签系统 (预设+自定义)
- 智能预加载 (0-15页可配置)
- 自动跳转功能
- 页面跳转功能
- 外部浏览器打开
- 本地设置持久化

**Keyboard Shortcuts (Default):**
- ← → : 页面导航
- ↑ ↓ : Pass/Fail评分
- Ctrl+S : 手动保存
- Ctrl+P : 截图
- F5 : 重新加载
- Ctrl+O : 外部浏览器打开
- Ctrl+0 : 清除标签
- Ctrl+A : 切换自动跳转
- Ctrl+G : 页面跳转
- Ctrl+1~9 : 快速标签

---

## [1.0.1] - 2024-05-26

### Added
- Enhanced keyboard shortcuts (↑↓ for Pass/Fail)
- Smart preloading system (up to 15 pages)
- Auto-advance feature
- Performance optimizations

### Fixed
- BrowserView positioning issues
- Memory management improvements

---

## [1.0.0] - 2024-05-26

### Initial Release
- Excel file integration
- Embedded browser view
- Basic scoring functionality
- Screenshot capability
- Auto-save mechanism
- Cross-platform support 