/**
 * SERVER-SIDE SUPABASE CLIENT
 *
 * This file creates the Supabase admin client used in API routes and server components.
 * It uses the service role key which bypasses all Row Level Security (RLS) policies.
 *
 * Key Characteristics:
 * - Uses non-public env vars (SUPABASE_SERVICE_ROLE_KEY)
 * - Bypasses ALL RLS policies (full database access)
 * - MUST only be used in API routes (never in client components)
 * - Auth session management disabled (not needed for API routes)
 *
 * Security Critical:
 * The service role key is a SUPERUSER key that can:
 * - Read/write any table
 * - Bypass all security policies
 * - Delete any data
 * - Modify database structure (if permissions allow)
 *
 * NEVER expose this client or the service role key to the browser.
 * If you accidentally bundle this into client code, attackers could
 * gain full access to your database.
 *
 * Safe Usage Pattern:
 * ```ts
 * // ✅ API Route (server-side)
 * // File: app/api/rooms/route.ts
 * import { supabaseAdmin } from '@/lib/supabaseServer';
 *
 * export async function POST(request: Request) {
 *   // Validate request on server
 *   const { sessionId } = await request.json();
 *
 *   // Use admin client to mutate data
 *   const { data } = await supabaseAdmin
 *     .from('rooms')
 *     .update({ state: 'WHEEL' })
 *     .eq('code', code);
 *
 *   return Response.json(data);
 * }
 * ```
 *
 * Unsafe Pattern (DO NOT DO):
 * ```tsx
 * // ❌ Client Component
 * 'use client';
 * import { supabaseAdmin } from '@/lib/supabaseServer'; // NEVER DO THIS
 * ```
 *
 * Configuration:
 * - autoRefreshToken: false - No need for token refresh in API routes
 * - persistSession: false - No need to persist session across requests
 *
 * @see supabaseClient.ts for the client-side anon client
 */

import { createClient } from '@supabase/supabase-js';

// Server-only environment variables (NEVER exposed to client)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase admin client
 *
 * This client has unrestricted access to the database.
 * Use only in API routes where you control the logic.
 * All client requests should be validated before using this client.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // Disable auth features not needed for API route usage
    autoRefreshToken: false,
    persistSession: false,
  },
});
