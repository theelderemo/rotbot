// src/lib/supabaseClient.ts
console.log("SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPABASE_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
