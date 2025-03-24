// 模拟数据库（本地开发模式）
let folders = [
  { id: '1', name: '语文', parent_id: null, path: '/语文', level: 1 },
  { id: '2', name: '数学', parent_id: null, path: '/数学', level: 1 },
  { id: '3', name: '英语', parent_id: null, path: '/英语', level: 1 },
];

// 配置
const CONFIG = {
  // 设置为 true 使用本地存储数据，false 使用后端 API
  useLocalStorage: false,
  // API 基础 URL
  apiBaseUrl: '/api'
};

// 当前状态
let currentState = {
  isAdmin: false,
  currentPath: [], // 当前路径
  currentFolders: [], // 当前显示的文件夹
  breadcrumbPaths: [], // 面包屑路径
  parentId: null, // 当前父文件夹ID
  isEditing: false, // 是否正在编辑
  editingFolderId: null, // 正在编辑的文件夹ID
};

// DOM 元素
const elements = {
  folderList: document.getElementById('folderList'),
  breadcrumb: document.querySelector('.breadcrumb'),
  adminToolbar: document.getElementById('adminToolbar'),
  loginContainer: document.getElementById('loginContainer'),
  loginForm: document.getElementById('loginForm'),
  loginError: document.getElementById('loginError'),
  batchAddBtn: document.getElementById('batchAddBtn'),
  exportBtn: document.getElementById('exportBtn'),
  batchAddModal: document.getElementById('batchAddModal'),
  batchAddForm: document.getElementById('batchAddForm'),
  closeModal: document.getElementById('closeModal'),
  cancelAddBtn: document.getElementById('cancelAddBtn'),
  usernameInput: document.getElementById('username'),
  passwordInput: document.getElementById('password'),
};

// API 请求函数
const api = {
  async login(username, password) {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      return await response.json();
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, message: '登录失败，请重试' };
    }
  },
  
  async getDirectories(parentId = null) {
    try {
      const url = new URL(`${CONFIG.apiBaseUrl}/directories`, window.location.origin);
      if (parentId) {
        url.searchParams.append('parent_id', parentId);
      }
      
      const response = await fetch(url.toString());
      const result = await response.json();
      
      return result.success ? result.data : [];
    } catch (error) {
      console.error('获取目录失败:', error);
      return [];
    }
  },
  
  async createDirectory(name, parentId = null) {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/directories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, parent_id: parentId })
      });
      
      return await response.json();
    } catch (error) {
      console.error('创建目录失败:', error);
      return { success: false, message: '创建目录失败' };
    }
  },
  
  async updateDirectory(id, name) {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/directories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      
      return await response.json();
    } catch (error) {
      console.error('更新目录失败:', error);
      return { success: false, message: '更新目录失败' };
    }
  },
  
  async batchCreateDirectories(names, parentId = null) {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/directories/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ names, parent_id: parentId })
      });
      
      return await response.json();
    } catch (error) {
      console.error('批量创建目录失败:', error);
      return { success: false, message: '批量创建目录失败' };
    }
  },
  
  async deleteDirectory(id) {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/directories/${id}`, {
        method: 'DELETE'
      });
      
      return await response.json();
    } catch (error) {
      console.error('删除目录失败:', error);
      return { success: false, message: '删除目录失败' };
    }
  },
  
  async exportDirectories() {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/directories/export`);
      const result = await response.json();
      
      return result.success ? result.data : [];
    } catch (error) {
      console.error('导出目录失败:', error);
      return [];
    }
  }
};

// 检查是否已登录
function checkLogin() {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  currentState.isAdmin = isAdmin;
  
  if (isAdmin) {
    elements.adminToolbar.style.display = 'flex';
  } else {
    elements.adminToolbar.style.display = 'none';
  }
}

// 初始化
function init() {
  // 检查登录状态
  checkLogin();
  
  // 从本地存储加载数据（本地开发模式）
  if (CONFIG.useLocalStorage) {
    const storedFolders = localStorage.getItem('folders');
    if (storedFolders) {
      folders = JSON.parse(storedFolders);
    } else {
      // 初始化并保存数据
      localStorage.setItem('folders', JSON.stringify(folders));
    }
  }
  
  // 加载根文件夹
  loadFolders(null);

  // 绑定事件
  bindEvents();
}

// 绑定事件处理程序
function bindEvents() {
  // 登录表单提交
  elements.loginForm.addEventListener('submit', handleLogin);
  
  // 批量添加按钮
  elements.batchAddBtn.addEventListener('click', () => {
    showModal('batchAddModal');
  });
  
  // 关闭模态框
  elements.closeModal.addEventListener('click', () => {
    hideModal('batchAddModal');
  });
  
  elements.cancelAddBtn.addEventListener('click', () => {
    hideModal('batchAddModal');
  });
  
  // 批量添加表单提交
  elements.batchAddForm.addEventListener('submit', handleBatchAdd);
  
  // 导出按钮
  elements.exportBtn.addEventListener('click', handleExport);
  
  // 登录链接
  document.addEventListener('keydown', (e) => {
    // 按 Alt+L 显示登录表单
    if (e.altKey && e.key === 'l') {
      elements.loginContainer.style.display = 'flex';
    }
    
    // 按 Esc 关闭模态框和登录表单
    if (e.key === 'Escape') {
      hideModal('batchAddModal');
      elements.loginContainer.style.display = 'none';
    }
  });
  
  // 点击非编辑区域取消编辑
  document.addEventListener('click', (e) => {
    if (currentState.isEditing && !e.target.closest('.folder-edit-input') && 
        !e.target.classList.contains('edit-button')) {
      cancelEditing();
    }
  });

  // 点击模态框外部关闭
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('batchAddModal');
    if (event.target === modal) {
      hideModal('batchAddModal');
    }
  });
}

// 处理登录
async function handleLogin(e) {
  e.preventDefault();
  
  const username = elements.usernameInput.value;
  const password = elements.passwordInput.value;
  
  if (CONFIG.useLocalStorage) {
    // 本地存储模式
    if (username === 'Exsui' && password === 'Exsui0910') {
      localStorage.setItem('isAdmin', 'true');
      currentState.isAdmin = true;
      elements.adminToolbar.style.display = 'flex';
      elements.loginContainer.style.display = 'none';
      elements.loginError.textContent = '';
      // 重新加载文件夹以显示管理员功能
      loadFolders(currentState.parentId);
    } else {
      elements.loginError.textContent = '用户名或密码错误';
    }
  } else {
    // API 模式
    const result = await api.login(username, password);
    
    if (result.success) {
      localStorage.setItem('isAdmin', 'true');
      currentState.isAdmin = true;
      elements.adminToolbar.style.display = 'flex';
      elements.loginContainer.style.display = 'none';
      elements.loginError.textContent = '';
      // 重新加载文件夹以显示管理员功能
      loadFolders(currentState.parentId);
    } else {
      elements.loginError.textContent = result.message || '用户名或密码错误';
    }
  }
}

// 加载文件夹
async function loadFolders(parentId) {
  // 更新当前父文件夹ID
  currentState.parentId = parentId;
  
  let filteredFolders = [];
  
  if (CONFIG.useLocalStorage) {
    // 本地存储模式
    filteredFolders = folders.filter(folder => folder.parent_id === parentId);
  } else {
    // API 模式
    filteredFolders = await api.getDirectories(parentId);
  }
  
  currentState.currentFolders = filteredFolders;
  
  // 更新面包屑
  updateBreadcrumb(parentId);
  
  // 渲染文件夹列表
  renderFolders(filteredFolders);
}

// 更新面包屑导航
function updateBreadcrumb(parentId) {
  if (parentId === null) {
    // 根目录
    currentState.breadcrumbPaths = [];
    currentState.currentPath = [];
    renderBreadcrumb();
    return;
  }
  
  // 构建路径
  const pathParts = [];
  let currentParentId = parentId;
  
  // 递归向上查找父文件夹
  while (currentParentId) {
    const parent = folders.find(f => f.id === currentParentId);
    if (parent) {
      pathParts.unshift({ id: parent.id, name: parent.name });
      currentParentId = parent.parent_id;
    } else {
      break;
    }
  }
  
  currentState.breadcrumbPaths = pathParts;
  currentState.currentPath = pathParts.map(p => p.name);
  
  renderBreadcrumb();
}

// 渲染面包屑导航
function renderBreadcrumb() {
  // 清空现有的面包屑（除了首页）
  elements.breadcrumb.innerHTML = `
    <button class="breadcrumb-item home" data-id="null">
      <i class="fas fa-home icon"></i>
      首页
    </button>
  `;
  
  // 添加面包屑项
  currentState.breadcrumbPaths.forEach((part, index) => {
    const separator = document.createElement('span');
    separator.className = 'breadcrumb-separator';
    separator.innerHTML = '<i class="fas fa-chevron-right"></i>';
    elements.breadcrumb.appendChild(separator);
    
    const button = document.createElement('button');
    button.className = 'breadcrumb-item';
    button.textContent = part.name;
    button.dataset.id = part.id;
    elements.breadcrumb.appendChild(button);
  });
  
  // 绑定面包屑点击事件
  const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
  breadcrumbItems.forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id === 'null' ? null : item.dataset.id;
      loadFolders(id);
    });
  });
}

// 渲染文件夹列表
function renderFolders(folderList) {
  elements.folderList.innerHTML = '';
  
  if (folderList.length === 0) {
    elements.folderList.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open fa-2x"></i><p>没有文件夹</p></div>';
    return;
  }
  
  folderList.forEach(folder => {
    const folderEl = document.createElement('div');
    folderEl.className = 'folder-item';
    folderEl.dataset.id = folder.id;
    
    // 文件夹图标
    folderEl.innerHTML = `
      <div class="folder-icon"><i class="fas fa-folder"></i></div>
      <div class="folder-name">${folder.name}</div>
    `;
    
    // 如果是管理员，添加编辑和删除按钮
    if (currentState.isAdmin) {
      // 添加编辑按钮
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-button';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startEditing(folder.id, folder.name);
      });
      folderEl.appendChild(editBtn);
      
      // 添加删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-button';
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFolder(folder.id);
      });
      folderEl.appendChild(deleteBtn);
    }
    
    // 点击文件夹进入下一级
    folderEl.addEventListener('click', () => {
      // 如果正在编辑，则不进入下一级
      if (!currentState.isEditing) {
        loadFolders(folder.id);
      }
    });
    
    elements.folderList.appendChild(folderEl);
  });
}

// 开始编辑文件夹名称
function startEditing(folderId, folderName) {
  // 如果已在编辑其他文件夹，先取消
  if (currentState.isEditing) {
    cancelEditing();
  }
  
  // 设置编辑状态
  currentState.isEditing = true;
  currentState.editingFolderId = folderId;
  
  // 查找对应的文件夹项
  const folderItem = document.querySelector(`.folder-item[data-id="${folderId}"]`);
  const folderNameEl = folderItem.querySelector('.folder-name');
  
  // 保存原始名称
  folderItem.dataset.originalName = folderName;
  
  // 替换为输入框
  folderNameEl.innerHTML = `
    <div class="folder-edit-container">
      <input type="text" class="folder-edit-input" value="${folderName}" />
      <div class="folder-edit-buttons">
        <button class="folder-edit-save"><i class="fas fa-check"></i></button>
        <button class="folder-edit-cancel"><i class="fas fa-times"></i></button>
      </div>
    </div>
  `;
  
  // 获取编辑控件
  const input = folderNameEl.querySelector('input');
  const saveBtn = folderNameEl.querySelector('.folder-edit-save');
  const cancelBtn = folderNameEl.querySelector('.folder-edit-cancel');
  
  // 聚焦输入框
  input.focus();
  input.select();
  
  // 绑定保存事件
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    saveEditing();
  });
  
  // 绑定取消事件
  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cancelEditing();
  });
  
  // 输入框回车保存
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  });
}

// 保存编辑
async function saveEditing() {
  if (!currentState.isEditing) return;
  
  const folderId = currentState.editingFolderId;
  const folderItem = document.querySelector(`.folder-item[data-id="${folderId}"]`);
  const input = folderItem.querySelector('.folder-edit-input');
  const newName = input.value.trim();
  
  // 名称不能为空
  if (!newName) {
    alert('文件夹名称不能为空');
    input.focus();
    return;
  }
  
  if (CONFIG.useLocalStorage) {
    // 本地存储模式
    // 查找文件夹
    const folderIndex = folders.findIndex(f => f.id === folderId);
    if (folderIndex !== -1) {
      const oldName = folders[folderIndex].name;
      const oldPath = folders[folderIndex].path;
      const newPath = oldPath.replace(new RegExp(`/${oldName}$`), `/${newName}`);
      
      // 更新文件夹名称和路径
      folders[folderIndex].name = newName;
      folders[folderIndex].path = newPath;
      
      // 更新子文件夹路径
      updateChildrenPaths(oldPath, newPath);
      
      // 保存到本地存储
      localStorage.setItem('folders', JSON.stringify(folders));
    }
  } else {
    // API 模式
    await api.updateDirectory(folderId, newName);
  }
  
  // 重置编辑状态
  currentState.isEditing = false;
  currentState.editingFolderId = null;
  
  // 重新加载文件夹列表
  loadFolders(currentState.parentId);
}

// 取消编辑
function cancelEditing() {
  if (!currentState.isEditing) return;
  
  // 重置编辑状态
  currentState.isEditing = false;
  currentState.editingFolderId = null;
  
  // 重新加载文件夹列表（还原UI）
  loadFolders(currentState.parentId);
}

// 更新子文件夹路径
function updateChildrenPaths(oldParentPath, newParentPath) {
  folders.forEach(folder => {
    if (folder.path.startsWith(oldParentPath + '/')) {
      folder.path = folder.path.replace(oldParentPath, newParentPath);
    }
  });
}

// 删除文件夹
async function deleteFolder(folderId) {
  if (CONFIG.useLocalStorage) {
    // 本地存储模式
    // 递归删除子文件夹
    const deleteRecursive = (id) => {
      // 找到所有子文件夹
      const children = folders.filter(f => f.parent_id === id);
      
      // 递归删除子文件夹
      children.forEach(child => {
        deleteRecursive(child.id);
      });
      
      // 删除当前文件夹
      folders = folders.filter(f => f.id !== id);
    };
    
    deleteRecursive(folderId);
    
    // 保存到本地存储
    localStorage.setItem('folders', JSON.stringify(folders));
  } else {
    // API 模式
    await api.deleteDirectory(folderId);
  }
  
  // 刷新当前文件夹列表
  loadFolders(currentState.parentId);
}

// 批量添加文件夹
async function handleBatchAdd(e) {
  e.preventDefault();
  
  const folderNamesText = document.getElementById('folderNames').value;
  const folderNames = folderNamesText.split('\n')
    .map(name => name.trim())
    .filter(name => name.length > 0);
  
  if (folderNames.length === 0) {
    return;
  }
  
  if (CONFIG.useLocalStorage) {
    // 本地存储模式
    // 添加新文件夹
    folderNames.forEach(name => {
      const newFolder = {
        id: Date.now() + Math.random().toString(36).substr(2, 9), // 生成唯一ID
        name,
        parent_id: currentState.parentId,
        level: currentState.parentId === null ? 1 : getFolderLevel(currentState.parentId) + 1,
        path: currentState.parentId === null ? `/${name}` : `${getFolderPath(currentState.parentId)}/${name}`,
      };
      
      folders.push(newFolder);
    });
    
    // 保存到本地存储
    localStorage.setItem('folders', JSON.stringify(folders));
  } else {
    // API 模式
    await api.batchCreateDirectories(folderNames, currentState.parentId);
  }
  
  // 关闭模态框
  hideModal('batchAddModal');
  document.getElementById('folderNames').value = '';
  
  // 刷新当前文件夹列表
  loadFolders(currentState.parentId);
}

// 获取文件夹层级
function getFolderLevel(folderId) {
  const folder = folders.find(f => f.id === folderId);
  return folder ? folder.level : 0;
}

// 获取文件夹路径
function getFolderPath(folderId) {
  const folder = folders.find(f => f.id === folderId);
  return folder ? folder.path : '';
}

// 导出目录结构
async function handleExport() {
  let data;
  
  if (CONFIG.useLocalStorage) {
    // 本地存储模式
    data = JSON.stringify(folders, null, 2);
  } else {
    // API 模式
    const exportedDirectories = await api.exportDirectories();
    data = JSON.stringify(exportedDirectories, null, 2);
  }
  
  // 创建下载链接
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '星河教辅目录结构.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 退出登录
function logout() {
  localStorage.removeItem('isAdmin');
  currentState.isAdmin = false;
  elements.adminToolbar.style.display = 'none';
  
  // 重新加载文件夹以移除管理功能
  loadFolders(currentState.parentId);
}

// 显示模态框的函数
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    // 防止背景滚动
    document.body.style.overflow = 'hidden';
  }
}

// 隐藏模态框的函数
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    // 恢复背景滚动
    document.body.style.overflow = '';
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init); 