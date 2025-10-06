@echo off
REM 极简一键推送：添加改动 → 可选提交 → 拉取(rebase) → 推送
chcp 65001 >nul 2>&1

REM 统一编码
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8

echo ========================================
echo 一键推送开始
echo ========================================

REM 1) 添加改动
git add .

REM 2) 如有暂存文件则提交
git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
    for /f "tokens=1-3 delims=/- " %%a in ("%date%") do set TODAY=%%a-%%b-%%c
    set NOW=%time: =0%
    git commit -m "chore: update %TODAY% %NOW%"
)

REM 3) 拉取并rebase（失败不退出，继续推送）
git pull --rebase origin main || echo 跳过拉取（网络/权限问题）

REM 4) 推送
git push origin main
if %ERRORLEVEL% EQU 0 (
    echo ✅ 推送成功
) else (
    echo ❌ 推送失败（请检查网络或认证）
)

echo.
echo 完成，按任意键退出...
pause >nul
