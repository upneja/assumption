/**
 * CLIENT-SIDE SUPABASE CLIENT
 *
 * This file creates the Supabase client used in browser-side React components.
 * It uses the anonymous (anon) key which has limited permissions governed by
 * Row Level Security (RLS) policies.
 *
 * Key Characteristics:
 * - Uses NEXT_PUBLIC_* env vars (bundled into client JavaScript)
 * - Respects RLS policies (can only perform authorized operations)
 * - Safe to use in client components and pages
 * - Primarily used for realtime subscriptions and read operations
 *
 * Security Model:
 * The anon key is intentionally public and safe to expose. Security is enforced
 * through Supabase RLS policies which are defined in the database:
 * - Read access: Public (anyone can read rooms, players, etc.)
 * - Write access: Blocked (all mutations must go through API routes)
 *
 * This prevents malicious clients from directly modifying game state. All state
 * changes must be validated by API routes using the service role client.
 *
 * Usage:
 * ```tsx
 * 'use client';
 * import { supabase } from '@/lib/supabaseClient';
 *
 * // ✅ Good: Reading data
 * const { data } = await supabase.from('rooms').select('*');
 *
 * // ✅ Good: Realtime subscriptions
 * const channel = supabase.channel(`room:${code}`);
 *
 * // ❌ Bad: Writing data (blocked by RLS)
 * await supabase.from('rooms').update({ state: 'WHEEL' });
 * ```
 *
 * @see supabaseServer.ts for the server-side admin client
 */

import { createClient } from '@supabase/supabase-js';

// Public environment variables (safe to expose to client)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client
 *
 * Singleton instance used throughout client components.
 * Configured with the anonymous key and respects RLS policies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
