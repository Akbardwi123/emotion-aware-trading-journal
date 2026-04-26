import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_build_purposes_only'

// Client ini HANYA boleh dipakai di server-side (API Routes, Cron Jobs)
// JANGAN pernah import ini di komponen client ('use client')
// Service role key bypass RLS — hanya untuk operasi backend yang terpercaya
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
