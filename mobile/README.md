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
- Internetsiz ishlaydi: barcha ma'lumot telefonda saqlanadi

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
```

## Tuzilishi

```
src/app/        ekranlar (Expo Router: har fayl — bitta ekran)
src/lib/        ledger.ts (balans, muddat, hisobot mantig'i), money.ts, dates.ts, store.ts (zustand + AsyncStorage)
src/ui/         komponentlar va ranglar (theme.ts)
e2e/            Playwright smoke test
```

Summalar doim butun son (so'm) sifatida saqlanadi, kasr son ishlatilmaydi.
