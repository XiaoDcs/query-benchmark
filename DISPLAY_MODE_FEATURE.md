# 显示模式切换功能

## 功能概述

新增了显示模式切换功能，允许用户在**网页展示模式**和**Response展示模式**之间进行切换，实现二选一的显示方式。

## 功能特点

### 1. 二选一显示模式
- **Web View模式**：显示网页内容（BrowserView）
- **Response View模式**：显示Excel中response列的JSON数据内容
- 两种模式互斥，同时只能显示一种

### 2. 模式切换按钮
- 位置：控制面板中的文件选择按钮旁边
- 按钮：🌐 Web View 和 📄 Response View
- 当前激活的模式会高亮显示

### 3. Response View模式特性
- 完整的JSON数据解析和展示
- 支持多种数据类型：Content、URLs、Images、Related Questions
- 美观的卡片式布局
- 图片支持点击全屏查看
- URL支持点击跳转
- 错误处理和数据验证
- 进度条同步显示

## 使用方法

1. **加载Excel文件**：首先选择包含response列的Excel文件
2. **选择显示模式**：
   - 点击 🌐 Web View 查看网页内容
   - 点击 📄 Response View 查看response数据
3. **浏览数据**：使用Previous/Next按钮在不同页面间切换
4. **评分功能**：在任一模式下都可以进行Pass/Fail评分

## 技术实现

### 前端实现
- 新增显示模式变量：`displayMode`
- 模式切换函数：`switchDisplayMode()`
- Response视图更新：`updateResponseViewMode()`
- BrowserView显示/隐藏控制

### 后端实现
- IPC处理器：`show-browser-view` 和 `hide-browser-view`
- BrowserView位置管理和重新定位
- 安全的BrowserView显示/隐藏机制

### 数据结构支持
支持的response JSON格式：
```json
{
  "Content": "主要内容（支持Markdown）",
  "Title": "标题",
  "Urls": [{"Title": "链接标题", "Url": "链接地址"}],
  "Images": [{"Title": "图片标题", "ThumbnailUrl": "图片地址"}],
  "RelatedQuestions": ["相关问题1", "相关问题2"],
  "Completed": true,
  "ErrorMessage": "错误信息",
  "ModelResponseMessage": "模型响应"
}
```

## 界面布局

### Web View模式
```
[控制面板]
[🌐 Web View] [📄 Response View]  <- 模式切换按钮
[进度条]
[网页内容区域]                    [侧边栏]
```

### Response View模式
```
[控制面板]
[🌐 Web View] [📄 Response View]  <- 模式切换按钮
[进度条]
[Response内容展示区域]            [侧边栏]
```

## 兼容性

- 向后兼容：没有response列的Excel文件仍可正常使用Web View模式
- 数据安全：切换模式不会影响已有的评分和issue数据
- 性能优化：BrowserView在隐藏时移到屏幕外，避免资源浪费

## 注意事项

1. Response View模式需要Excel文件包含response列
2. JSON数据格式错误时会显示错误信息和原始数据
3. 图片加载失败时会自动隐藏对应的图片项
4. 模式切换是即时的，不需要重新加载数据 