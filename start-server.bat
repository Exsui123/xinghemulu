@echo off
cd /d "%~dp0"
python -m http.server 8080

REM 检查http-server是否已安装
where http-server >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo 未检测到http-server，正在安装...
  call npm install -g http-server
  if %ERRORLEVEL% NEQ 0 (
    echo http-server安装失败，请确保已安装Node.js并重试
    goto :error
  )
  echo http-server安装成功！
) else (
  echo 已检测到http-server，继续启动...
)

echo.
echo 正在启动HTTP服务器，按Ctrl+C可以停止服务器...
echo 服务器启动后，请在浏览器中访问：http://localhost:8080
echo.

http-server -p 8080 -o
goto :end

:error
echo.
echo 启动过程中出现错误，请检查上方日志并重试。
exit /b 1

:end
exit /b 0 