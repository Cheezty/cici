@echo off
REM 简单检查脚本
chcp 65001 >nul 2>&1

echo ========================================
echo 检查文件修改状态
echo ========================================
echo.

echo 检查Git状态...
git status --porcelain
echo.

echo 检查最近提交...
git log --oneline -3
echo.

echo 检查工作目录文件...
dir /b *.html *.css *.js *.bat
echo.

echo ========================================
echo 检查完成
echo ========================================
pause
