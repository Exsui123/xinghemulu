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

-- 初始目录数据
INSERT OR IGNORE INTO directories (name, parent_id, path, level, created_at, created_by) 
VALUES ('语文', NULL, '/语文', 1, datetime('now'), 'system');

INSERT OR IGNORE INTO directories (name, parent_id, path, level, created_at, created_by) 
VALUES ('数学', NULL, '/数学', 1, datetime('now'), 'system');

INSERT OR IGNORE INTO directories (name, parent_id, path, level, created_at, created_by) 
VALUES ('英语', NULL, '/英语', 1, datetime('now'), 'system'); 