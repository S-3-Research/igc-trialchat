import { createClient } from '@supabase/supabase-js';

// 这一步是为了防止构建时报错，给个空字符串默认值
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);