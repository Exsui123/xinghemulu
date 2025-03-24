# 星河教辅目录结构管理系统

一个简单易用的教辅目录结构管理系统，可用于组织和管理各科目的教学资料。

## 功能特点

- 支持多级目录结构管理
- 简洁直观的用户界面
- 响应式设计，适配各种设备
- 管理员权限控制
- 批量添加目录功能
- 导出目录结构为JSON文件
- 支持本地存储和Cloudflare Workers后端
- 支持编辑目录名称功能
- 支持删除目录功能

## 技术架构

### 前端

- 纯HTML5、CSS3和JavaScript实现
- 无需任何外部框架依赖
- FontAwesome图标库
- 响应式布局

### 后端

- Cloudflare Workers提供无服务器运行环境
- Cloudflare D1 SQLite数据库存储目录结构和用户信息
- 提供RESTful API接口

## 目录结构

```
/
├── index.html          # 主页面HTML
├── styles.css          # CSS样式文件
├── app.js              # 前端逻辑
├── worker.js           # Cloudflare Worker后端
├── wrangler.toml       # Cloudflare配置文件
├── db_init.sql         # 数据库初始化脚本
├── deploy.bat          # Windows部署脚本
├── deploy.sh           # Linux/macOS部署脚本
├── start-server.bat    # Windows本地服务器启动脚本
├── start-server.sh     # Linux/macOS本地服务器启动脚本
└── .gitignore          # Git忽略文件
```

## 安装与使用

### 本地开发

1. 克隆项目到本地
2. 使用任意HTTP服务器启动项目：
   ```
   npx http-server
   ```
   或运行项目提供的脚本：
   - Windows: `start-server.bat`
   - Linux/macOS: `./start-server.sh`
3. 浏览器访问 `http://localhost:8080`

### 部署到Cloudflare

1. 安装Wrangler CLI工具
   ```
   npm install -g wrangler
   ```

2. 登录到Cloudflare账户
   ```
   wrangler login
   ```

3. 创建D1数据库
   ```
   wrangler d1 create xinghemulu
   ```
   注意：创建后需要更新wrangler.toml中的数据库ID

4. 应用数据库初始化脚本
   ```
   wrangler d1 execute xinghemulu --file=./db_init.sql
   ```

5. 部署到Cloudflare
   ```
   wrangler deploy
   ```
   
   或运行项目提供的脚本：
   - Windows: `deploy.bat`
   - Linux/macOS: `./deploy.sh`

## 使用指南

### 普通用户

- 浏览目录：点击文件夹进入下一级
- 导航：使用面包屑导航回到上一级目录

### 管理员

- 登录：按Alt+L打开登录面板，默认用户名/密码：Exsui/Exsui0910
- 批量添加目录：登录后点击"批量添加"按钮
- 编辑目录：登录后鼠标悬停在文件夹上，点击左上角的编辑图标
- 删除目录：登录后鼠标悬停在文件夹上，点击右上角的删除图标（将级联删除所有子目录）
- 导出目录结构：点击"导出目录"按钮，下载JSON文件

## API接口文档

### 认证

**登录**
- URL: `/api/auth/login`
- 方法: `POST`
- 请求体: `{ "username": "用户名", "password": "密码" }`
- 响应: `{ "success": true, "message": "登录成功" }`

### 目录管理

**获取目录列表**
- URL: `/api/directories?parent_id=父目录ID`
- 方法: `GET`
- 响应: `{ "success": true, "data": [...目录列表] }`

**创建目录**
- URL: `/api/directories`
- 方法: `POST`
- 请求体: `{ "name": "目录名", "parent_id": "父目录ID" }`
- 响应: `{ "success": true, "data": { ...目录信息 } }`

**更新目录**
- URL: `/api/directories/:id`
- 方法: `PUT`
- 请求体: `{ "name": "新目录名" }`
- 响应: `{ "success": true, "data": { ...更新后的目录信息 } }`

**批量创建目录**
- URL: `/api/directories/batch`
- 方法: `POST`
- 请求体: `{ "names": ["目录名1", "目录名2"], "parent_id": "父目录ID" }`
- 响应: `{ "success": true, "data": [...目录信息] }`

**删除目录**
- URL: `/api/directories/:id`
- 方法: `DELETE`
- 响应: `{ "success": true, "message": "删除成功" }`

**导出目录结构**
- URL: `/api/directories/export`
- 方法: `GET`
- 响应: `{ "success": true, "data": [...完整目录结构] }`

## 开发模式配置

app.js 文件顶部的 CONFIG 对象可以控制系统运行模式：

```javascript
const CONFIG = {
  // 设置为 true 使用本地存储数据，false 使用后端 API
  useLocalStorage: true,
  // API 基础 URL
  apiBaseUrl: '/api'
};
```

- `useLocalStorage`: 设置为 true 使用浏览器本地存储，false 使用后端API
- `apiBaseUrl`: 设置API的基础URL

## 数据库结构

### directories 表

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | TEXT | 主键 |
| name | TEXT | 目录名称 |
| parent_id | TEXT | 父目录ID，根目录为NULL |
| path | TEXT | 完整路径 |
| level | INTEGER | 目录层级，从1开始 |
| created_at | TEXT | 创建时间 |
| created_by | TEXT | 创建者 |

### users 表

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | TEXT | 主键 |
| username | TEXT | 用户名 |
| password | TEXT | 密码 |
| is_admin | INTEGER | 是否管理员 |
| created_at | TEXT | 创建时间 |

## 后续优化方向

1. 添加用户注册和权限管理
2. 支持上传和管理文件
3. 添加搜索功能
4. 优化移动端体验
5. 增加目录排序功能
6. 添加日志记录
7. 增强数据安全性
8. 添加退出登录按钮
9. 实现目录拖拽功能

## 作者

星河教辅团队 