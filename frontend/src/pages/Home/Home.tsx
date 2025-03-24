import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/Breadcrumb/Breadcrumb';
import { FolderItem } from '../../components/FolderItem/FolderItem';
import { BatchAddModal } from '../../components/BatchAddModal/BatchAddModal';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

export const Home = () => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  // 模拟获取文件夹数据
  useEffect(() => {
    // TODO: 实现实际的数据获取逻辑
    setFolders([
      { id: '1', name: '示例文件夹1', parent_id: null },
      { id: '2', name: '示例文件夹2', parent_id: null },
    ]);
  }, [currentPath]);

  const handleNavigate = (index: number) => {
    setCurrentPath(prev => prev.slice(0, index));
  };

  const handleFolderClick = (folder: Folder) => {
    setCurrentPath(prev => [...prev, folder.name]);
  };

  const handleDelete = async (folderId: string) => {
    // TODO: 实现删除逻辑
    setFolders(prev => prev.filter(f => f.id !== folderId));
  };

  const handleBatchAdd = async (folderNames: string[]) => {
    // TODO: 实现批量添加逻辑
    const newFolders = folderNames.map((name, index) => ({
      id: Date.now().toString() + index,
      name,
      parent_id: null,
    }));
    setFolders(prev => [...prev, ...newFolders]);
  };

  const handleExport = () => {
    const data = JSON.stringify(folders, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '目录结构.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700">
            星河教辅目录展示
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            请注意，该目录仅展示"资料类型"，没有展示教案、ppt、名师公开课、教辅资料等具体的资料
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-4">
            <Breadcrumb paths={currentPath} onNavigate={handleNavigate} />
            {isAdmin && (
              <div className="flex space-x-2">
                <button
                  className="btn btn-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  批量添加
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExport}
                >
                  导出目录
                </button>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-2">
              {folders.map(folder => (
                <FolderItem
                  key={folder.id}
                  name={folder.name}
                  isAdmin={isAdmin}
                  onDelete={() => handleDelete(folder.id)}
                  onClick={() => handleFolderClick(folder)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <BatchAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleBatchAdd}
      />
    </div>
  );
}; 