// File: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Gắn kiểu dữ liệu string một cách tường minh để tránh cảnh báo của TypeScript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Khởi tạo và export client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);