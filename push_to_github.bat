@echo off
REM 设置控制台编码为UTF-8
chcp 65001 >nul 2>&1

echo 开始推送代码到GitHub...
echo.

echo 1. 检查Git状态...
git status
echo.

echo 2. 添加所有修改的文件...
git add .
echo.

echo 3. 检查暂存区状态...
git diff --cached --name-only
echo.

echo 4. 提交更改...
git commit -m "优化页面加载速度：实现懒加载和修复视频播放问题"
echo.

echo 5. 推送到GitHub...
git push origin main
echo.

if %ERRORLEVEL% EQU 0 (
    echo 推送成功！
) else (
    echo 推送失败，错误代码: %ERRORLEVEL%
    echo 请检查网络连接和GitHub认证
)

echo.
echo 按任意键退出...
pause >nul
