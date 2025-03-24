/**
 * 星河教辅目录展示系统 - Cloudflare Worker
 * 
 * 这个 Worker 处理以下功能：
 * 1. 提供静态文件服务
 * 2. 身份验证 API
 * 3. 目录管理 API
 */

// 请求处理函数
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // API 路由
    if (path.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }
    
    // 静态文件服务
    try {
      // 如果是根路径，返回 index.html
      if (path === '/' || path === '') {
        return new Response(await fetch(new URL('/index.html', request.url)).then(res => res.text()), {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      // 尝试获取文件
      const response = await fetch(request);
      if (response.ok) {
        return response;
      }
      
      // 如果文件不存在，返回 index.html（用于客户端路由）
      return new Response(await fetch(new URL('/index.html', request.url)).then(res => res.text()), {
        headers: { 'Content-Type': 'text/html' }
      });
    } catch (error) {
      console.error('Static file error:', error);
      return new Response('Internal Error', { status: 500 });
    }
  }
};

// 处理 API 请求
async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 身份验证
  if (path === '/api/auth/login') {
    return handleLogin(request, env);
  }
  
  // 目录操作
  if (path.startsWith('/api/directories')) {
    // 获取目录列表
    if (path === '/api/directories' && request.method === 'GET') {
      const parentId = url.searchParams.get('parent_id');
      return getDirectories(parentId, env);
    }
    
    // 创建目录
    if (path === '/api/directories' && request.method === 'POST') {
      return createDirectory(request, env);
    }
    
    // 更新目录
    if (path.match(/^\/api\/directories\/[^\/]+$/) && request.method === 'PUT') {
      const id = path.split('/').pop();
      return updateDirectory(request, id, env);
    }
    
    // 批量创建目录
    if (path === '/api/directories/batch' && request.method === 'POST') {
      return batchCreateDirectories(request, env);
    }
    
    // 删除目录
    if (path.match(/^\/api\/directories\/[^\/]+$/) && request.method === 'DELETE') {
      const id = path.split('/').pop();
      return deleteDirectory(request, id, env);
    }
    
    // 导出目录结构
    if (path === '/api/directories/export' && request.method === 'GET') {
      return exportDirectories(env);
    }
  }
  
  // 404 - API 不存在
  return new Response('API not found', { status: 404 });
}

// 处理登录请求
async function handleLogin(request, env) {
  try {
    const { username, password } = await request.json();
    
    // 验证用户名和密码
    const db = env.DB;
    const user = await db.prepare('SELECT * FROM users WHERE username = ?')
      .bind(username)
      .first();
      
    if (!user || user.password !== password) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名或密码错误'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 登录成功
    return new Response(JSON.stringify({
      success: true,
      message: '登录成功',
      isAdmin: user.is_admin === 1
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '登录失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取目录列表
async function getDirectories(parentId, env) {
  try {
    const db = env.DB;
    let stmt;
    
    if (parentId) {
      // 获取指定父目录下的子目录
      stmt = db.prepare('SELECT * FROM directories WHERE parent_id = ? ORDER BY name ASC');
    } else {
      // 获取根目录
      stmt = db.prepare('SELECT * FROM directories WHERE parent_id IS NULL ORDER BY name ASC');
    }
    
    const params = parentId ? [parentId] : [];
    const directories = await stmt.bind(...params).all();
    
    return new Response(JSON.stringify({
      success: true,
      data: directories.results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '获取目录失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 创建目录
async function createDirectory(request, env) {
  try {
    const { name, parent_id } = await request.json();
    
    if (!name || name.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        message: '目录名称不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const db = env.DB;
    
    // 生成唯一ID
    const id = crypto.randomUUID();
    
    // 确定路径和级别
    let path = `/${name}`;
    let level = 1;
    
    if (parent_id) {
      // 获取父目录信息
      const parentQuery = `SELECT path, level FROM directories WHERE id = ?`;
      const parentResult = await db.prepare(parentQuery).bind(parent_id).first();
      
      if (!parentResult) {
        return new Response(JSON.stringify({
          success: false,
          message: '父目录不存在'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      path = `${parentResult.path}/${name}`;
      level = parentResult.level + 1;
    }
    
    // 插入目录记录
    await db.prepare('INSERT INTO directories (id, name, parent_id, path, level, created_at, created_by) VALUES (?, ?, ?, ?, ?, datetime("now"), "admin")')
      .bind(id, name, parent_id, path, level)
      .run();
      
    // 获取新创建的目录
    const directory = await db.prepare('SELECT * FROM directories WHERE id = ?')
      .bind(id)
      .first();
      
    return new Response(JSON.stringify({
      success: true,
      message: '目录创建成功',
      data: directory
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '创建目录失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 更新目录
async function updateDirectory(request, id, env) {
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        message: '目录名称不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const db = env.DB;
    
    // 检查目录是否存在
    const directory = await db.prepare('SELECT * FROM directories WHERE id = ?')
      .bind(id)
      .first();
      
    if (!directory) {
      return new Response(JSON.stringify({
        success: false,
        message: '目录不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 更新目录路径
    const oldName = directory.name;
    const oldPath = directory.path;
    const newPath = oldPath.replace(new RegExp(`/${oldName}$`), `/${name.trim()}`);
    
    // 更新目录
    await db.prepare('UPDATE directories SET name = ?, path = ? WHERE id = ?')
      .bind(name.trim(), newPath, id)
      .run();
    
    // 更新子目录路径
    await db.prepare(`
      UPDATE directories 
      SET path = replace(path, ?, ?) 
      WHERE path LIKE ?
    `)
      .bind(oldPath + '/%', newPath + '/%', oldPath + '/%')
      .run();
    
    // 获取更新后的目录
    const updatedDirectory = await db.prepare('SELECT * FROM directories WHERE id = ?')
      .bind(id)
      .first();
    
    return new Response(JSON.stringify({
      success: true,
      message: '目录更新成功',
      data: updatedDirectory
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '更新目录失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 批量创建目录
async function batchCreateDirectories(request, env) {
  try {
    const { names, parent_id } = await request.json();
    
    if (!Array.isArray(names) || names.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '目录名称列表不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const db = env.DB;
    
    // 确定路径和级别
    let basePath = '';
    let level = 1;
    
    if (parent_id) {
      // 获取父目录信息
      const parentQuery = `SELECT path, level FROM directories WHERE id = ?`;
      const parentResult = await db.prepare(parentQuery).bind(parent_id).first();
      
      if (!parentResult) {
        return new Response(JSON.stringify({
          success: false,
          message: '父目录不存在'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      basePath = parentResult.path;
      level = parentResult.level + 1;
    }
    
    // 批量插入目录
    const createdDirectories = [];
    
    for (const name of names) {
      if (name.trim() === '') continue;
      
      // 生成唯一ID
      const id = crypto.randomUUID();
      
      // 构建路径
      const path = basePath ? `${basePath}/${name.trim()}` : `/${name.trim()}`;
      
      // 插入目录记录
      await db.prepare('INSERT INTO directories (id, name, parent_id, path, level, created_at, created_by) VALUES (?, ?, ?, ?, ?, datetime("now"), "admin")')
        .bind(id, name.trim(), parent_id, path, level)
        .run();
        
      // 获取新创建的目录
      const directory = await db.prepare('SELECT * FROM directories WHERE id = ?')
        .bind(id)
        .first();
        
      createdDirectories.push(directory);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: '目录批量创建成功',
      data: createdDirectories
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '批量创建目录失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 删除目录
async function deleteDirectory(request, id, env) {
  try {
    const db = env.DB;
    
    // 检查目录是否存在
    const directory = await db.prepare('SELECT * FROM directories WHERE id = ?')
      .bind(id)
      .first();
      
    if (!directory) {
      return new Response(JSON.stringify({
        success: false,
        message: '目录不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 使用递归函数删除目录及其子目录
    async function deleteRecursive(directoryId) {
      // 获取所有子目录
      const children = await db.prepare('SELECT id FROM directories WHERE parent_id = ?')
        .bind(directoryId)
        .all();
      
      // 递归删除所有子目录
      for (const child of children.results) {
        await deleteRecursive(child.id);
      }
      
      // 删除当前目录
      await db.prepare('DELETE FROM directories WHERE id = ?')
        .bind(directoryId)
        .run();
    }
    
    // 开始递归删除
    await deleteRecursive(id);
    
    return new Response(JSON.stringify({
      success: true,
      message: '目录删除成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '删除目录失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 导出目录结构
async function exportDirectories(env) {
  try {
    const db = env.DB;
    
    // 获取所有目录
    const directories = await db.prepare('SELECT * FROM directories ORDER BY level ASC, name ASC').all();
    
    return new Response(JSON.stringify({
      success: true,
      data: directories.results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '导出目录失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取内容类型
function getContentType(path) {
  const extension = path.split('.').pop().toLowerCase();
  
  const contentTypes = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon'
  };
  
  return contentTypes[extension] || 'text/plain';
}

// 设置 D1 数据库初始化 SQL
export const dbInitSQL = `
-- 目录表
CREATE TABLE IF NOT EXISTS directories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  path TEXT NOT NULL,
  level INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (parent_id) REFERENCES directories(id)
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始管理员账号
INSERT OR IGNORE INTO users (username, password, is_admin)
VALUES ('Exsui', 'Exsui0910', TRUE);
`; 