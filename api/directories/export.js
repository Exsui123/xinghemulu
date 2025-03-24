import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    // 获取所有目录
    const { data, error } = await supabase
      .from('directories')
      .select('*')
      .order('level', { ascending: true });
    
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ success: true, data });
  }
  
  return res.status(405).end(); // Method Not Allowed
} 