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

    try {
      const { user, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }

      return res.status(200).json({ success: true, user });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).end(); // Method Not Allowed
}