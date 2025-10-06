@echo off
REM 强制使用CMD而不是PowerShell
REM 设置控制台编码为UTF-8，并抑制输出
chcp 65001 >nul 2>&1

REM 设置Git配置，确保编码正确
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8

REM 远程仓库地址（按你当前项目）
set "REPO_HTTPS=https://github.com/Cheezty/cici.git"
set "REPO_SSH=git@github.com:Cheezty/cici.git"

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
    echo 拉取失败，可能是网络不通或认证问题，尝试自动切换到SSH...
    goto SSH_FALLBACK
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
    echo 尝试自动切换到 SSH(443) 推送...
    goto SSH_FALLBACK
)

goto END

REM ============== SSH Fallback （自动切换到SSH:443） ==============
:
:
SSH_FALLBACK
echo.
echo ----------------------------------------
echo 正在进行 SSH(443) 自动配置与推送...
echo ----------------------------------------

REM 1) 检查并生成SSH密钥（无口令）
if not exist "%USERPROFILE%\.ssh" mkdir "%USERPROFILE%\.ssh" >nul 2>&1
if not exist "%USERPROFILE%\.ssh\id_ed25519" (
    echo 生成SSH密钥中（无需输入，几秒完成）...
    ssh-keygen -t ed25519 -C "3106637361@qq.com" -f "%USERPROFILE%\.ssh\id_ed25519" -N "" >nul
)

REM 2) 写入 ~/.ssh/config 以走443端口
set "CFG_PATH=%USERPROFILE%\.ssh\config"
echo Host github.com>"%CFG_PATH%"
echo   HostName ssh.github.com>>"%CFG_PATH%"
echo   Port 443>>"%CFG_PATH%"
echo   User git>>"%CFG_PATH%"
echo   IdentityFile ~/.ssh/id_ed25519>>"%CFG_PATH%"

REM 3) 显示公钥，提示用户添加到GitHub
echo.
echo 请将以下公钥添加到 GitHub: Settings ^> SSH and GPG keys ^> New SSH key
echo ----------------- 复制下面整行开始 -----------------
type "%USERPROFILE%\.ssh\id_ed25519.pub"
echo ----------------- 复制上面整行结束 -----------------
echo 添加完成后按任意键继续推送...
pause >nul

REM 4) 将 origin 切换为SSH地址
git remote set-url origin %REPO_SSH%
echo 当前远程地址:
git remote -v

REM 5) 再次尝试拉取与推送（SSH）
git pull --rebase origin main
git push origin main
if %ERRORLEVEL% EQU 0 (
    echo ✅ 通过SSH推送成功！
    goto END
) else (
    echo ❌ SSH推送仍失败。常见原因：未在GitHub添加SSH Key或网络被完全阻断。
    echo 请确认已添加公钥后重试，或把错误截图发我。
    goto END
)

:END
echo.
echo 按任意键退出...
pause >nul
