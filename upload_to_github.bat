@echo off
chcp 65001
echo 开始上传代码到GitHub...
echo.

echo 1. 检查Git状态...
git status
echo.

echo 2. 添加所有修改的文件...
git add .
echo.

echo 3. 提交更改...
git commit -m "v3.0.0: 重大更新 - 新增模卡、古风造型、部分数据板块，优化短剧经历展示，调整布局和交互功能"
echo.

echo 4. 推送到GitHub...
git push origin main
echo.

echo 上传完成！
pause
