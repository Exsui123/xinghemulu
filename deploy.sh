#!/bin/bash

echo "======================================"
echo "星河教辅目录结构管理系统 - 部署脚本"
echo "======================================"
echo ""

# 检查wrangler是否已安装
if ! command -v wrangler &> /dev/null; then
  echo "未检测到wrangler，正在安装..."
  npm install -g wrangler
  if [ $? -ne 0 ]; then
    echo "wrangler安装失败，请确保已安装Node.js并重试"
    exit 1
  fi
  echo "wrangler安装成功！"
else
  echo "已检测到wrangler，继续部署流程..."
fi

echo ""
echo "正在登录Cloudflare账户..."
wrangler login
if [ $? -ne 0 ]; then
  echo "Cloudflare登录失败，请重试"
  exit 1
fi

echo ""
echo "检查是否已创建D1数据库..."
DB_EXISTS=0
if wrangler d1 list | grep -q "xinghemulu"; then
  DB_EXISTS=1
  echo "已找到xinghemulu数据库"
else
  echo "未找到xinghemulu数据库，正在创建..."
  wrangler d1 create xinghemulu
  if [ $? -ne 0 ]; then
    echo "数据库创建失败"
    exit 1
  fi
  echo "数据库创建成功！"
fi

echo ""
echo "请检查并更新wrangler.toml中的数据库ID..."
echo "按回车键继续..."
read

echo ""
echo "正在初始化数据库..."
wrangler d1 execute xinghemulu --file=./db_init.sql
if [ $? -ne 0 ]; then
  echo "数据库初始化失败"
  exit 1
fi
echo "数据库初始化成功！"

echo ""
echo "正在部署到Cloudflare..."
wrangler deploy
if [ $? -ne 0 ]; then
  echo "部署失败"
  exit 1
fi

echo ""
echo "======================================"
echo "部署成功！"
echo "请查看上方输出的网站URL访问您的应用"
echo "======================================"

exit 0 