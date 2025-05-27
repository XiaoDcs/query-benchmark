#!/bin/bash

# 准备 GitHub Release 的脚本

echo "🚀 准备 Web Page Scorer v1.0.0 发布..."
echo ""

# 检查是否存在构建文件
if [ ! -d "dist" ]; then
    echo "❌ dist 目录不存在，请先运行构建："
    echo "   npm run build:all"
    echo "   或者 ./build.sh"
    exit 1
fi

# 创建 release 目录
echo "📁 创建 release 目录..."
mkdir -p release

# 复制安装包到 release 目录
echo "📦 复制安装包文件..."

# Mac 版本
if [ -f "dist/Web Page Scorer-1.0.0.dmg" ]; then
    cp "dist/Web Page Scorer-1.0.0.dmg" "release/"
    echo "✅ 已复制 Web Page Scorer-1.0.0.dmg (Intel Mac)"
fi

if [ -f "dist/Web Page Scorer-1.0.0-arm64.dmg" ]; then
    cp "dist/Web Page Scorer-1.0.0-arm64.dmg" "release/"
    echo "✅ 已复制 Web Page Scorer-1.0.0-arm64.dmg (Apple Silicon Mac)"
fi

if [ -f "dist/Web Page Scorer-1.0.0-mac.zip" ]; then
    cp "dist/Web Page Scorer-1.0.0-mac.zip" "release/"
    echo "✅ 已复制 Web Page Scorer-1.0.0-mac.zip (Intel Mac)"
fi

if [ -f "dist/Web Page Scorer-1.0.0-arm64-mac.zip" ]; then
    cp "dist/Web Page Scorer-1.0.0-arm64-mac.zip" "release/"
    echo "✅ 已复制 Web Page Scorer-1.0.0-arm64-mac.zip (Apple Silicon Mac)"
fi

# Windows 版本
if [ -f "dist/Web Page Scorer Setup 1.0.0.exe" ]; then
    cp "dist/Web Page Scorer Setup 1.0.0.exe" "release/"
    echo "✅ 已复制 Web Page Scorer Setup 1.0.0.exe (Windows 安装程序)"
fi

if [ -f "dist/Web Page Scorer 1.0.0.exe" ]; then
    cp "dist/Web Page Scorer 1.0.0.exe" "release/"
    echo "✅ 已复制 Web Page Scorer 1.0.0.exe (Windows 便携版)"
fi

# 列出 release 文件
echo ""
echo "📋 Release 文件列表："
ls -lh release/

echo ""
echo "📊 文件大小统计："
du -sh release/*

echo ""
echo "✅ Release 准备完成！"
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 提交并推送更改："
echo "   git add ."
echo "   git commit -m \"Prepare release $NEW_VERSION\""
echo "   git push origin main"
echo ""
echo "2. 创建并推送标签："
echo "   git tag v$NEW_VERSION"
echo "   git push origin v$NEW_VERSION"
echo ""
echo "3. 访问GitHub创建Release："
echo "   https://github.com/XiaoDcs/web-page-scorer/releases/new" 