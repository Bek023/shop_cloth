# Nasiyachi — qarz daftari (iOS + Android)

Do'kon egalari uchun mijozlar va ta'minotchilar bilan hisob-kitob ilovasi. Portfolio loyihasi.
"Nasiyachi" — ishchi nom; yakuniy nom va brend keyinroq tanlanadi.

## Nima ishlaydi

- Telefon raqam bilan kirish (demo rejim: SMS kod **1234**)
- Do'kon profili, ixtiyoriy PIN qulf (unutilsa, SMS orqali tiklash)
- Mijozlar va ta'minotchilar: qo'shish, tahrirlash, qidirish, saralash
- **Berdim / Oldim** yozuvlari, har yozuvdan keyingi qoldiq, tahrirlash va o'chirish
- Qaytarish muddati, "Muddatlar" tabi (muddati o'tgan, bugun, shu hafta)
- Hisobot: olishim / berishim kerak, kun / oy / yil bo'yicha, eng katta qarzdorlar
- Eslatma: tayyor matn, telefonning SMS ilovasi yoki Telegram orqali yuborish
- Internetsiz ishlaydi: avval telefonga yoziladi, internet bo'lganda bulutga sinxronlanadi
- Telegram bot: mijozga avtomatik eslatma, `/qarzim` bilan qarzini ko'rish, egasiga kunlik hisobot

## Ikki rejim

- **Demo** (kalitlarsiz): hamma narsa telefonda, SMS kod `1234`.
- **Server** (`.env.local` da Supabase kalitlari bilan): haqiqiy SMS kirish, bulutga zaxira, Telegram.
  Sozlash yo'riqnomasi: `../replica/backend.md`.

## Ishga tushirish

```bash
cd mobile
npm install
npx expo start        # QR kodni Expo Go ilovasi bilan skanerlang
```

## Tekshiruvlar

```bash
npm test              # hisob-kitob mantig'i (node:test)
npm run typecheck     # TypeScript
npm run e2e           # brauzer versiyasini yig'ib, asosiy oqimni Playwright bilan bosib chiqadi
npm run test:db       # migratsiyalar va RLS: vaqtinchalik lokal Postgres'da
npm run check:functions  # Edge Functions'ni Deno bilan tip tekshiruvi
```

## Tuzilishi

```
src/app/        ekranlar (Expo Router: har fayl — bitta ekran)
src/lib/        ledger.ts (balans, muddat), store.ts (zustand + AsyncStorage), sync.ts, auth.ts, backend.ts
src/ui/         komponentlar va ranglar (theme.ts)
e2e/            Playwright smoke test
supabase/       migrations/ (sxema, RLS, RPC), functions/ (telegram-bot, daily-reminders), tests/
```

Summalar doim butun son (so'm) sifatida saqlanadi, kasr son ishlatilmaydi.
