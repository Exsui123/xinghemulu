@echo off
echo ======================================
echo 星河教辅目录结构管理系统 - 部署脚本
echo ======================================
echo.

REM 检查wrangler是否已安装
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo 未检测到wrangler，正在安装...
  call npm install -g wrangler
  if %ERRORLEVEL% NEQ 0 (
    echo wrangler安装失败，请确保已安装Node.js并重试
    goto :error
  )
  echo wrangler安装成功！
) else (
  echo 已检测到wrangler，继续部署流程...
)

echo.
echo 正在登录Cloudflare账户...
call wrangler login
if %ERRORLEVEL% NEQ 0 (
  echo Cloudflare登录失败，请重试
  goto :error
)

echo.
echo 检查是否已创建D1数据库...
set DB_EXISTS=0
call wrangler d1 list | findstr "xinghemulu" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  set DB_EXISTS=1
  echo 已找到xinghemulu数据库
) else (
  echo 未找到xinghemulu数据库，正在创建...
  call wrangler d1 create xinghemulu
  if %ERRORLEVEL% NEQ 0 (
    echo 数据库创建失败
    goto :error
  )
  echo 数据库创建成功！
)

echo.
echo 请检查并更新wrangler.toml中的数据库ID...
echo 按任意键继续...
pause >nul

echo.
echo 正在初始化数据库...
call wrangler d1 execute xinghemulu --file=./db_init.sql
if %ERRORLEVEL% NEQ 0 (
  echo 数据库初始化失败
  goto :error
)
echo 数据库初始化成功！

echo.
echo 正在部署到Cloudflare...
call wrangler deploy
if %ERRORLEVEL% NEQ 0 (
  echo 部署失败
  goto :error
)

echo.
echo ======================================
echo 部署成功！
echo 请查看上方输出的网站URL访问您的应用
echo ======================================
goto :end

:error
echo.
echo 部署过程中出现错误，请检查上方日志并重试。
exit /b 1

:end
exit /b 0 