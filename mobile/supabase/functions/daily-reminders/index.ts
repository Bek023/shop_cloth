// Called once a day by pg_cron (see supabase/cron.sql.example) with the CRON_SECRET header.
import { runDailyReminders } from '../_shared/bot.ts';
import { safeEqual } from '../_shared/logic.ts';
import { requireEnv, serviceClient, supabaseRepo, telegramSender } from '../_shared/supabase-repo.ts';

const cronSecret = requireEnv('CRON_SECRET');
const send = telegramSender(requireEnv('TELEGRAM_BOT_TOKEN'));
const db = supabaseRepo(serviceClient());

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!safeEqual(req.headers.get('x-cron-secret'), cronSecret)) return new Response('Unauthorized', { status: 401 });

  try {
    const summary = await runDailyReminders({ db, send });
    console.log('daily-reminders', summary);
    return Response.json(summary);
  } catch (e) {
    console.error('daily-reminders failed', e instanceof Error ? e.message : String(e));
    return new Response('Error', { status: 500 });
  }
});
