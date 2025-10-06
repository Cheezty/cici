@echo off
REM 强制使用CMD而不是PowerShell
REM 设置控制台编码为UTF-8，并抑制输出
chcp 65001 >nul 2>&1

REM 设置Git配置，确保编码正确
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8

echo ========================================
echo 开始推送代码到GitHub (编码修复版)
echo ========================================
echo.

echo [1/7] 检查Git状态...
git status
echo.

echo [2/7] 添加所有修改的文件...
git add .
echo.

echo [3/7] 检查暂存区状态...
git diff --cached --name-only
echo.

REM 判断是否有需要提交的改动
git diff --cached --quiet
if %ERRORLEVEL% EQU 0 (
    echo 暂存区没有改动，跳过提交，进入同步流程...
) else (
    echo [4/7] 提交更改...
    git commit -m "移动端视频加载兼容（微信/X5）与返回键稳定拦截；更新README"
    echo.
)

REM 推送前先拉取最新代码，避免冲突
echo [5/7] 拉取远程main分支（rebase方式）...
git pull --rebase origin main
if %ERRORLEVEL% NEQ 0 (
    echo 拉取失败，请处理冲突后重试。
    goto END
)

echo [6/7] 检查远程仓库状态...
git remote -v
echo.

echo [7/7] 推送到GitHub...
git push origin main
echo.

REM 检查推送结果
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo ✅ 推送成功！
    echo ========================================
    echo.
    echo 您的代码已成功推送到GitHub
    echo 请访问您的GitHub仓库查看更新
) else (
    echo ========================================
    echo ❌ 推送失败！
    echo ========================================
    echo.
    echo 错误代码: %ERRORLEVEL%
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. GitHub认证问题
    echo 3. 远程仓库权限或rebase冲突
    echo.
    echo 建议解决方案：
    echo 1. 检查网络连接
    echo 2. 重新配置GitHub认证
    echo 3. 解决冲突後再执行: git pull --rebase origin main ^&^& git push origin main
)

:END
echo.
echo 按任意键退出...
pause >nul
