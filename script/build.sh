#!/bin/bash

echo "🚀 开始构建 Web Page Scorer..."
echo ""

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf dist/

# 安装依赖
echo "📦 检查依赖..."
npm install

# 构建所有平台
echo "🍎 构建 Mac 版本..."
npm run build:mac

echo ""
echo "🪟 构建 Windows 版本..."
npm run build:win

echo ""
echo "✅ 构建完成！"
echo ""
echo "📁 生成的文件位于 dist/ 目录："
echo ""
echo "Mac 版本："
echo "  - Web Page Scorer-1.0.3.dmg (Intel Mac)"
echo "  - Web Page Scorer-1.0.3-arm64.dmg (Apple Silicon Mac)"
echo "  - Web Page Scorer-1.0.3-mac.zip (Intel Mac)"
echo "  - Web Page Scorer-1.0.3-arm64-mac.zip (Apple Silicon Mac)"
echo ""
echo "Windows 版本："
echo "  - Web Page Scorer Setup 1.0.3.exe (安装程序)"
echo "  - Web Page Scorer 1.0.3.exe (便携版)"
echo ""
echo "🎉 打包完成！请查看 RELEASE.md 了解详细安装说明。" 