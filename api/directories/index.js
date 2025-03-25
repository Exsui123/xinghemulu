import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { parent_id } = req.query;

    let query = supabase.from('directories').select('*');
    if (parent_id) {
      query = query.eq('parent_id', parent_id);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, data });
  }

  if (req.method === 'POST') {
    const { name, parent_id } = req.body;

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

    const path = parent_id ? `${parentPath}/${name}` : `/${name}`;

    const { data, error } = await supabase
      .from('directories')
      .insert([{ name, parent_id, path, level }])
      .select();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(201).json({ success: true, data: data[0] });
  }

  return res.status(405).end(); // Method Not Allowed
}