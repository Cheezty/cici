@echo off
REM 一键智能推送：HTTPS 重试 → 失败自动切换 SSH(443)
chcp 65001 >nul 2>&1

REM 统一编码与更稳的 HTTP 设置
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 1000
git config --global http.lowSpeedTime 60
git config --global core.useIPv6 false

echo ========================================
echo 智能推送开始（先HTTPS，失败切换SSH:443）
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

REM 3) 尝试HTTPS拉取并推送（最多重试2次）
set RET=1
for /L %%i in (1,1,2) do (
    echo --- HTTPS 尝试 %%i/2 ---
    git pull --rebase origin main && git push origin main && set RET=0 && goto DONE
    echo 网络不稳，等待重试...
    timeout /t 3 >nul
)

if %RET% NEQ 0 (
    echo HTTPS 推送失败，准备切换 SSH(443)...
    goto SSH_FALLBACK
)

:DONE
echo ✅ 推送成功
echo.
echo 完成，按任意键退出...
pause >nul
goto END

REM ============== SSH Fallback （自动切换到SSH:443） ==============
SSH_FALLBACK
REM 写入 ~/.ssh/config 走443端口
set "CFG_PATH=%USERPROFILE%\.ssh\config"
if not exist "%USERPROFILE%\.ssh" mkdir "%USERPROFILE%\.ssh" >nul 2>&1
echo Host github.com>"%CFG_PATH%"
echo   HostName ssh.github.com>>"%CFG_PATH%"
echo   Port 443>>"%CFG_PATH%"
echo   User git>>"%CFG_PATH%"
echo   IdentityFile ~/.ssh/id_ed25519>>"%CFG_PATH%"

REM 若无密钥则生成（无口令），并提示添加到GitHub
if not exist "%USERPROFILE%\.ssh\id_ed25519" (
    echo 生成SSH密钥...
    ssh-keygen -t ed25519 -C "auto@local" -f "%USERPROFILE%\.ssh\id_ed25519" -N "" >nul
    echo 请将下面公钥添加到 GitHub: Settings ^> SSH and GPG keys ^> New SSH key
    type "%USERPROFILE%\.ssh\id_ed25519.pub"
    echo 添加完成后按任意键继续...
    pause >nul
)

REM 切换远程为SSH并重试
git remote set-url origin git@github.com:Cheezty/cici.git
for /L %%i in (1,1,2) do (
    echo --- SSH 尝试 %%i/2 ---
    git pull --rebase origin main && git push origin main && echo ✅ 通过SSH推送成功 & goto END
    echo 网络不稳，等待重试...
    timeout /t 3 >nul
)

echo ❌ SSH 推送仍失败，请检查网络或稍后再试

:END
