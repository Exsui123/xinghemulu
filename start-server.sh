#!/bin/bash

echo "======================================"
echo "星河教辅目录结构管理系统 - 启动本地服务器"
echo "======================================"
echo ""

# 检查http-server是否已安装
if ! command -v http-server &> /dev/null; then
  echo "未检测到http-server，正在安装..."
  npm install -g http-server
  if [ $? -ne 0 ]; then
    echo "http-server安装失败，请确保已安装Node.js并重试"
    exit 1
  fi
  echo "http-server安装成功！"
else
  echo "已检测到http-server，继续启动..."
fi

echo ""
echo "正在启动HTTP服务器，按Ctrl+C可以停止服务器..."
echo "服务器启动后，请在浏览器中访问：http://localhost:8080"
echo ""

# 添加执行权限
chmod +x *.sh

http-server -p 8080 -o

exit 0 