import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  
  // 更新目录
  if (req.method === 'PUT') {
    const { name } = req.body;
    
    // 先获取当前目录信息
    const { data: directory } = await supabase
      .from('directories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!directory) {
      return res.status(404).json({ success: false, message: '目录不存在' });
    }
    
    // 更新目录名称
    const { data, error } = await supabase
      .from('directories')
      .update({ name })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    
    // 更新子目录的路径
    if (directory.path) {
      const oldPathPrefix = directory.path;
      const newPathPrefix = oldPathPrefix.substring(0, oldPathPrefix.lastIndexOf('/') + 1) + name;
      
      // 获取所有子目录
      const { data: children } = await supabase
        .from('directories')
        .select('*')
        .like('path', `${oldPathPrefix}/%`);
      
      // 更新每个子目录的路径
      if (children && children.length > 0) {
        for (const child of children) {
          const newPath = child.path.replace(oldPathPrefix, newPathPrefix);
          await supabase
            .from('directories')
            .update({ path: newPath })
            .eq('id', child.id);
        }
      }
    }
    
    return res.status(200).json({ success: true, data: data[0] });
  }
  
  // 删除目录
  if (req.method === 'DELETE') {
    // 先获取目录信息
    const { data: directory } = await supabase
      .from('directories')
      .select('path')
      .eq('id', id)
      .single();
    
    if (directory && directory.path) {
      // 删除所有子目录
      await supabase
        .from('directories')
        .delete()
        .like('path', `${directory.path}/%`);
    }
    
    // 删除当前目录
    const { error } = await supabase
      .from('directories')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ success: true });
  }
  
  return res.status(405).end(); // Method Not Allowed
} 