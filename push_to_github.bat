@echo off
chcp 65001
echo 开始推送代码到GitHub...
echo.

echo 1. 检查Git状态...
git status
echo.

echo 2. 添加所有修改的文件...
git add .
echo.

echo 3. 检查暂存区状态...
git status --cached
echo.

echo 4. 提交更改...
git commit -m "优化页面加载速度：实现懒加载和修复视频播放问题"
echo.

echo 5. 推送到GitHub...
git push origin main
echo.

echo 推送完成！
pause
