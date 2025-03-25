import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    const { names, parent_id } = req.body;
    
    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ success: false, message: '未提供目录名称数组' });
    }
    
    // 获取父目录信息
    let parentPath = '';
    let level = 1;
    
    if (parent_id) {
      const { data: parent } = await supabase
        .from('directories')
        .select('path, level')
        .eq('id', parent_id)
        .single();
      
      if (parent) {
        parentPath = parent.path;
        level = parent.level + 1;
      }
    }
    
    // 准备要插入的数据
    const directoriesToInsert = names.map(name => ({
      name,
      parent_id,
      path: parent_id ? `${parentPath}/${name}` : `/${name}`,
      level
    }));
    
    // 批量插入目录
    const { data, error } = await supabase
      .from('directories')
      .insert(directoriesToInsert)
      .select();
    
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    
    return res.status(201).json({ success: true, data });
  }
  
  return res.status(405).end(); // Method Not Allowed
} 