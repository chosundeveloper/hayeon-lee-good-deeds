import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (hasSupabaseEnv) {
	console.log('Supabase 연결:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });
} else {
	console.warn('Supabase 환경변수가 설정되지 않았습니다. localStorage를 사용합니다.');
}

export const supabase = hasSupabaseEnv
	? createClient(supabaseUrl!, supabaseAnonKey!, { auth: { persistSession: false } })
	: undefined as unknown as ReturnType<typeof createClient>;
