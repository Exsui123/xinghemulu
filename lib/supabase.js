import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取 Supabase URL 和 API 密钥
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 