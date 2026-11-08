# Backend: Nasiyachi

Sana: 2026-11-08. Arxitektura: `architecture.md`. Kod: `mobile/supabase/`.

## Holat

| qism | holat | tekshiruv |
| --- | --- | --- |
| Baza sxemasi va RLS | tayyor | `npm run test:db` — haqiqiy Postgres 16 da, ikkinchi foydalanuvchi hech narsa ko'rmaydi |
| Telefon OTP orqali kirish | kod tayyor | Supabase'da SMS provayder yoki test raqam kerak (pastda) |
| Sinxronizatsiya (oflayn → bulut) | tayyor | birlashtirish mantig'i unit testlarda; serverga qarshi jonli sinov **qilinmagan** |
| Telegram bot (`/start`, `/qarzim`, `/stop`) | tayyor | unit testlar + `deno check`; jonli Telegram'da **sinalmagan** |
| Kunlik eslatma + egasiga hisobot | tayyor | unit testlar (bir kunda bir marta, xatolar yoziladi) |
| Akkauntni o'chirish | tayyor | SQL testida: foydalanuvchi va do'kon ma'lumotlari o'chadi, boshqalarniki qoladi |
| To'lovlar | yo'q | Stripe O'zbekistonda ishlamaydi; keyin Click / Payme rasmiy API |
| Email | kerak emas | kirish telefon orqali |

Kalitlar berilmasa, ilova **demo rejimda** ishlaydi (hamma narsa telefonda, SMS kod 1234).

## Sozlash (buni o'zingiz qilasiz)

Men akkaunt ochmayman va kalitlarni ko'rmayman. Kalitlarni chatga yozmang.

### 1. Supabase loyihasi
1. https://supabase.com da bepul loyiha oching (region: Frankfurt eng yaqin).
2. Kompyuteringizda, `mobile/` papkasida:
   ```bash
   npx supabase login
   npx supabase link --project-ref <loyiha-ref>
   npx supabase db push            # ikkala migratsiyani qo'llaydi
   ```
3. Dashboard > Project Settings > API dan `URL` va `anon` kalitni `mobile/.env.local` ga yozing
   (namuna: `mobile/.env.example`).

### 2. Telefon orqali kirish
Dashboard > Authentication > Providers > Phone ni yoqing. Ikki yo'l:
- **Portfolio / sinov uchun (bepul):** "Test phone numbers" ga raqam va kod qo'shing, masalan `998901234567=123456`.
  Shu raqam bilan SMS yuborilmasdan kirasiz.
- **Haqiqiy foydalanuvchilar uchun:** Supabase qo'llaydigan SMS provayderni ulang (Twilio, MessageBird, Vonage, Textlocal)
  yoki O'zbekiston provayderi uchun "Send SMS Hook" yozish kerak bo'ladi. SMS pullik.

### 3. Telegram bot
1. Telegram'da @BotFather > `/newbot` — nom va username tanlang. Token beriladi.
2. `mobile/supabase/functions/.env` yarating (namuna `.env.example`), tokenni va ikkita tasodifiy maxfiy satrni yozing:
   ```bash
   openssl rand -hex 32   # TELEGRAM_WEBHOOK_SECRET uchun
   openssl rand -hex 32   # CRON_SECRET uchun
   npx supabase secrets set --env-file supabase/functions/.env
   npx supabase functions deploy telegram-bot
   npx supabase functions deploy daily-reminders
   ```
3. Webhookni ulang (bir marta, o'z terminalingizda):
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d url=https://<loyiha-ref>.supabase.co/functions/v1/telegram-bot \
     -d secret_token=<TELEGRAM_WEBHOOK_SECRET>
   ```
4. `mobile/.env.local` ga `EXPO_PUBLIC_TELEGRAM_BOT=<bot username>` qo'shing.

### 4. Kunlik eslatma jadvali
Dashboard > Project Settings > Vault ga `cron_secret` nomi bilan `CRON_SECRET` qiymatini saqlang,
keyin `mobile/supabase/cron.sql.example` ni SQL Editor'da ishga tushiring (`<project-ref>` ni almashtiring).
Har kuni 09:00 (Toshkent) da ishlaydi.

### 5. Zaxira
Supabase bepul tarifida kunlik zaxira yo'q. Pullik (Pro) tarifda kunlik zaxira avtomatik yoqiladi.
Bepul tarifda: `npx supabase db dump -f backup.sql` ni vaqti-vaqti bilan ishga tushiring.

## Qanday ishlaydi

- **Kirish:** `signInWithOtp` → SMS kod → `verifyOtp`. Sessiya telefonda AsyncStorage'da.
- **Birinchi kirish:** `bootstrap_shop` RPC do'kon yaratadi va foydalanuvchini egasi qiladi.
  Demo rejimda kiritilgan yozuvlar saqlanib, bulutga yuboriladi.
- **Sinxronizatsiya:** har yozuv UUID bilan telefonda yaratiladi va `dirty` ro'yxatiga tushadi.
  Ilova ochilganda, har o'zgarishdan 2 soniya keyin va har 5 daqiqada: avval yuborish (upsert), keyin tortib olish
  (`server_updated_at > kursor`). Ziddiyat: oxirgi yozgan yutadi (server triggeri eskisini rad etadi).
- **Telegram ulash:** do'kon egasi mijoz sahifasida "Telegram'ga ulash" ni bosadi → bir martalik token (7 kun) →
  `t.me/<bot>?start=<token>` havolasi SMS yoki boshqa ilova orqali mijozga yuboriladi → mijoz Start bosadi → bog'landi.
- **Eslatma jadvali:** muddatdan bir kun oldin, muddat kuni, 1 kun o'tganda va keyin har 7 kunda — qarz to'lanmaguncha.
  Do'kon egasiga har kuni ertalab muddati kelgan qarzlar ro'yxati.

## Xavfsizlik ro'yxati

- [x] maxfiy kalitlar faqat env'da; `.env*` `.gitignore` da; bot tokeni va service role kaliti ilovaga tushmaydi
- [x] serverda tekshiruv: jadval cheklovlari (summa > 0, telefon 9 raqam, matn uzunligi), bot tokeni formati regex bilan
- [x] har o'qish va yozishda ruxsat tekshiriladi (RLS); ikkinchi foydalanuvchi bilan testlangan (`rls.test.sql`)
- [x] boshqa do'kon ID'sini qayta ishlatib yozib bo'lmaydi (upsert hujumi testlangan)
- [x] rate limit: OTP — Supabase o'zi cheklaydi; Telegram havola — do'konga soatiga 50 ta
- [x] webhooklar maxfiy header bilan tekshiriladi (vaqt bo'yicha teng solishtirish); Telegram qayta yuborsa, `update_id` ikki marta ishlamaydi
- [ ] yuklashlar — hozir yo'q (chek rasmi qo'shilganda: hajm/tur cheklovi, alohida bucket)
- [x] URL va loglarda shaxsiy ma'lumot yo'q (bot logida faqat `update_id` va xato matni)
- [x] `npm audit`: faqat Expo CLI ichidagi dasturchi vositalarida 5 ta o'rtacha zaiflik (glob, minimatch); ilovaga tushmaydi
- [ ] maxfiylik siyosati: ishlatiladigan xizmatlar — Supabase (baza, kirish), Telegram (eslatmalar), SMS provayder. `/replica-launch` da yoziladi

## Hali qilinmagan

- Serverga qarshi jonli end-to-end sinov (Supabase loyihasi va kalitlar kerak).
- O'zbekiston SMS provayderi uchun Send SMS Hook.
- Sozlamalarda "avtomatik eslatma" yoqish/o'chirish tugmasi (bazada `shops.auto_reminders` bor).
- Xodimlar (rol `seller` bazada bor, taklif qilish oqimi yo'q), kassa, valyuta.
