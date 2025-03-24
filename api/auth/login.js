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
    const { username, password } = req.body;
    
    // 目前我们使用简单的判断，稍后可以改为 Supabase 身份验证
    if (username === 'Exsui' && password === 'Exsui0910') {
      // 简单验证，稍后可以使用 Supabase Auth
      return res.status(200).json({ 
        success: true, 
        data: { user: { username: 'Exsui' } } 
      });
    }
    
    // 在实际项目中，可以替换为以下 Supabase Auth 代码:
    /*
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password
      });
      
      if (error) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }
      
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    */
    
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  
  return res.status(405).end(); // Method Not Allowed
} 