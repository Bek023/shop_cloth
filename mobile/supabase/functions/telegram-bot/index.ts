// Telegram webhook. Telegram sends the secret set with setWebhook in this header on every call.
import { handleUpdate } from '../_shared/bot.ts';
import { safeEqual } from '../_shared/logic.ts';
import { requireEnv, serviceClient, supabaseRepo, telegramSender } from '../_shared/supabase-repo.ts';

const secret = requireEnv('TELEGRAM_WEBHOOK_SECRET');
const send = telegramSender(requireEnv('TELEGRAM_BOT_TOKEN'));
const db = supabaseRepo(serviceClient());

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!safeEqual(req.headers.get('x-telegram-bot-api-secret-token'), secret)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const update = await req.json().catch(() => null);
  if (!update || typeof update.update_id !== 'number') return new Response('Bad request', { status: 400 });

  try {
    await handleUpdate(update, { db, send });
  } catch (e) {
    // Log without message text or chat ids. A 500 makes Telegram retry; the update id guard
    // stops a retry from being handled twice once it succeeds.
    console.error('telegram-bot failed', { update_id: update.update_id, error: e instanceof Error ? e.message : String(e) });
    return new Response('Error', { status: 500 });
  }
  return new Response('ok');
});
