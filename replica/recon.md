# Recon xaritasi: PDAFTAR — qarz daftari (iOS + Android)

Doira (scope): do'kon egasi uchun mijozlar qarzini yozish, to'lovlarni qabul qilish, eslatma yuborish va hisobot. Asosiy sikl (core loop) — boshqa hamma narsa keyin.
Kim uchun: portfolio loyihasi (shaxsiy namuna sifatida ko'rsatish uchun).
Sana: 2026-11-06

> **Manbalar holati.** Do'kon sahifalari va pdaftar.uz bu sessiyadan ochilmadi (tarmoq ruxsati yo'q).
> Foydalanuvchi Play Market'dan 5 ta skrinshot va 3 ta sharhni yubordi — quyidagi "yes" belgilari shularga asoslangan.
> Qolgan qismlar qarz daftari ilovalari toifasidan taxmin ("guess").

## Manbalar

| # | manba | URL | izoh |
| --- | --- | --- | --- |
| 1 | App Store sahifasi | https://apps.apple.com/uz/app/pdaftar-qarz-daftari-nasiya/id6511237681 | sessiyadan ochilmadi |
| 2 | Google Play sahifasi | https://play.google.com/store/apps/details?id=uz.app.pdaftaruz | ochilmadi; foydalanuvchi skrinshot va sharhlarni yubordi |
| 3 | rasmiy sayt | https://pdaftar.uz/ | sessiyadan ochilmadi |
| 4 | Play skrinshotlari (5 ta) | `replica/screens/` | S05 mijozlar, S10 SMS tarixi, S12 hisobot, S16 kassa, S17 xodimlar. Faqat solishtirish uchun, klonga kirmaydi |
| 5 | Play sharhlari (3 ta, 2026 yil yanvar–fevral) | Google Play | Rossiya raqami va rubl so'ralgan; yangilanishdan keyin PIN ishlamay qolgan; "qulay va sodda" |

### Skrinshotlardan topilganlar

- **Qarz nazorati (S05):** sarlavhada do'kon nomi, 3 ta tab (Mijozlar, Ta'minotchilar, yana biri), qizil/yashil summalar, "Mijoz qo'shish" tugmasi.
- **Avtomatik eslatma (S10):** "SMS tarixi" ekrani, filtr chiplar, har SMS kartada matn ("Hurmatli ..., ... do'konidan ... qarzingiz ... UZS") va "Yuborildi" belgisi.
- **Hisobotlar (S12):** Mijoz / Ta'minotchi statistikasi, valyuta tanlovi (UZS), umumiy va kirim balansi, Qarzdorlar / Haqdorlar / Mijoz tarixi, kunlik / oylik / yillik.
- **Kassa (S16):** Xarajatlar / Kirimlar tablari, "Mijozdan kirim", "Pul tushumi" yozuvlari, umumiy balans.
- **Jamoa (S17):** "Sotuvchilar yuritadi — siz nazorat qilasiz": xodimlar ro'yxati, xodim qo'shish, rol (sotuvchi).

### Sharhlardan xulosa

- Faqat +998 raqam va so'm — boshqa davlatlar uchun yo'q (farqlash imkoniyati).
- PIN bilan bog'liq muammo → klonda PIN'ni SMS orqali tiklash bor.
- Ishlab chiquvchi korporativ tarif taklif qiladi → pullik reja mavjud.

## Asosiy sikl (core loop)

Do'kon egasi mijozni tanlaydi, "Qarz berdim" yoki "To'lov oldim" deb summani yozadi va mijozning qolgan qarzini darhol ko'radi.

## Ekranlar

| ID | ekran | qanday kiriladi | maqsad | asosiy komponentlar | holatlar |
| --- | --- | --- | --- | --- | --- |
| S01 | Xush kelibsiz / til tanlash | birinchi ochilish | til (uz lotin, uz kirill, ru) tanlash, qisqa tanishtiruv | slayder, til tugmalari, Primary button | default |
| S02 | Telefon raqam bilan kirish | S01 dan keyin | +998 raqam kiritish | telefon input, Primary button | default, noto'g'ri raqam, yuklanmoqda, tarmoq yo'q |
| S03 | SMS kodni tasdiqlash | S02 dan keyin | OTP kod | 4–6 xonali kod input, qayta yuborish taymeri | default, noto'g'ri kod, muddati o'tgan, yuklanmoqda |
| S04 | Do'kon profili | birinchi kirishda | do'kon nomi, egasi ismi, valyuta (UZS) | text input, select | default, validatsiya xatosi |
| S05 | Bosh sahifa — mijozlar ro'yxati | asosiy tab | jami "olishim kerak" / "berishim kerak", mijozlar balans bilan, qidiruv, saralash | balans karta, qidiruv, list item, FAB "+ Mijoz", tab bar | bo'sh (birinchi mijozni qo'shing), to'ldirilgan, qidiruvda natija yo'q, yuklanmoqda, oflayn banner |
| S06 | Mijoz qo'shish / tahrirlash | S05 FAB yoki S07 menyu | ism, telefon, izoh; telefon kontaktlaridan tanlash | text input, telefon input, "Kontaktlardan" tugmasi | default, validatsiya xatosi, kontaktga ruxsat berilmagan, dublikat raqam |
| S07 | Mijoz sahifasi | S05 dagi mijozga bosish | joriy balans, tranzaksiyalar tarixi (sana bo'yicha guruhlangan), "Berdim" / "Oldim" tugmalari, qo'ng'iroq, eslatma | balans header, tranzaksiya list, 2 ta katta tugma (qizil/yashil), menyu | bo'sh (hali yozuv yo'q), to'ldirilgan, qarz yo'q (0), oldindan to'lagan (manfiy balans) |
| S08 | Tranzaksiya qo'shish | S07 "Berdim" yoki "Oldim" | summa, izoh, sana, qaytarish muddati, chek rasmi | katta summa input (raqamli klaviatura), izoh, date picker, rasm qo'shish | default, summa 0 / bo'sh, saqlanmoqda, oflayn saqlandi |
| S09 | Tranzaksiya tafsiloti | S07 dagi yozuvga bosish | ko'rish, tahrirlash, o'chirish, ulashish | detail rows, rasm preview, Danger button, confirm modal | default, o'chirish tasdig'i, tahrirlangan belgisi |
| S10 | Eslatma yuborish | S07 "Eslatma" | qarz haqida xabar: SMS, Telegram, WhatsApp orqali ulashish | xabar matni preview, kanal tugmalari | default, telefon raqam yo'q, SMS yuborilmadi |
| S11 | Muddati o'tganlar | tab yoki S05 filtri | bugun / muddati o'tgan qarzdorlar ro'yxati | list item (muddat badge bilan), filtr chiplar | bo'sh (hammasi o'z vaqtida), to'ldirilgan |
| S12 | Hisobotlar | tab | davr bo'yicha jami berilgan / olingan, mijoz bo'yicha, PDF / Excel eksport | sana oralig'i tanlash, statistika kartalari, eksport tugmasi | bo'sh, to'ldirilgan, eksport tayyorlanmoqda, xato |
| S13 | Sozlamalar | tab | profil, til, PIN qulf, zaxira / sinxronizatsiya holati, chiqish | settings list, switch | default |
| S14 | PIN qulf ekrani | ilova ochilganda (yoqilgan bo'lsa) | maxfiylik | PIN pad, biometrik tugma | default, noto'g'ri PIN, ko'p urinish |
| S16 | Kassa (kirim / chiqim) | tab | do'kon xarajatlari va kirimlari, mijozdan kirim avtomatik tushadi | Xarajatlar / Kirimlar segment, list, FAB | bo'sh, to'ldirilgan |
| S17 | Xodimlar | sozlamalar yoki tab | sotuvchilarni qo'shish, rol berish | xodim list item, rol tanlash | bo'sh, to'ldirilgan |
| S15 | Mijoz uchun hisob-kitob sahifasi | eslatmadagi havola (veb) | mijoz o'z qarzi va tarixini ko'radi (faqat o'qish) | oddiy veb sahifa | default, havola muddati o'tgan |

## Oqimlar (flows)

```
F01 Yangi foydalanuvchi ro'yxatdan o'tadi
    S01 -> S02 -> S03 -> S04 -> S05 (bo'sh holat)
    happy path: ~5 bosish + raqam, kod, do'kon nomi kiritish
    edge: SMS kelmadi (qayta yuborish), noto'g'ri kod, raqam allaqachon ro'yxatda (eski ma'lumotlarni tiklash)

F02 Mavjud mijozga qarz yozish  ← ASOSIY SIKL
    S05 -> S07 -> S08 -> S07 (yangi balans)
    happy path: 3 bosish + summa  ← yengish kerak bo'lgan raqam
    edge: oflayn (keyin sinxronlanadi), juda katta summa, xato summa yozildi (tahrirlash F06)

F03 Mijozdan to'lov qabul qilish
    S05 -> S07 -> "Oldim" -> S08 -> S07
    happy path: 3 bosish + summa
    edge: qarzdan ko'p to'ladi (manfiy balans = oldindan to'lov), qisman to'lov

F04 Yangi mijoz + birinchi qarz
    S05 -> S06 -> S07 -> S08 -> S07
    happy path: 4 bosish + ism, telefon, summa
    edge: kontaktlarga ruxsat yo'q, shu raqamli mijoz bor

F05 Qarzdorga eslatma yuborish
    S11 (yoki S07) -> S10 -> SMS / Telegram / WhatsApp
    happy path: 3 bosish
    edge: mijozda telefon yo'q, SMS balansi tugagan, ilova o'rnatilmagan (Telegram yo'q)

F06 Noto'g'ri yozuvni tuzatish yoki o'chirish
    S07 -> S09 -> tahrirlash / o'chirish -> tasdiqlash -> S07
    edge: o'chirish tasdig'i, o'zgarish tarixi (audit)

F07 Oylik hisobotni yuklab olish
    S12 -> davr tanlash -> eksport -> ulashish
    edge: davrda yozuv yo'q, katta hajmdagi PDF

F08 Telefon almashtirildi — ma'lumotlarni tiklash
    S01 -> S02 -> S03 -> S05 (to'ldirilgan)
    edge: sinxronlanmagan oflayn yozuvlar eski telefonda qoldi
```

## Komponentlar

| komponent | variantlar | holatlar | qayerda |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger, "Berdim" (qizil), "Oldim" (yashil) | default, pressed, disabled, loading | hamma joyda |
| Text input | oddiy, telefon (+998 maska), summa (katta, ming ajratgich bilan) | default, focus, xato, disabled | S02, S04, S06, S08 |
| OTP input | 4 yoki 6 katak | default, xato | S03 |
| Balans karta | jami (bosh sahifa), mijoz header | musbat, nol, manfiy | S05, S07 |
| Mijoz list item | balans bilan, muddat badge bilan | default, pressed, muddati o'tgan | S05, S11 |
| Tranzaksiya list item | berdim, oldim | default, tahrirlangan, rasm bor | S07 |
| Date picker | bitta sana, oraliq | default | S08, S12 |
| Modal / bottom sheet | tasdiqlash, tanlash | ochiq, yopiq | S09, S10, S13 |
| Toast | muvaffaqiyat, xato, oflayn saqlandi | — | hamma joyda |
| Bo'sh holat | rasm + matn + tugma | — | S05, S07, S11, S12 |
| Tab bar | 4 tab: Mijozlar, Muddatlar, Hisobot, Sozlamalar | aktiv, noaktiv | asosiy ekranlar |
| Oflayn banner | — | ko'rinadi, sinxronlanmoqda | S05, S07 |
| FAB | "+ Mijoz" | default, pressed | S05 |

## Taxminiy ma'lumotlar modeli

```
User        id, phone (unique), name, language (uz_latn | uz_cyrl | ru), pin_hash?, created_at
            evidence: S02, S03, S13
            confidence: high

Shop        id, owner_id -> User, name, currency (default UZS), created_at
            evidence: S04
            confidence: medium (bitta foydalanuvchida bir nechta do'kon bo'lishi — guess)

Customer    id, shop_id -> Shop, name, phone?, note?, archived_at?, created_at, updated_at
            balance — saqlanmaydi, tranzaksiyalardan hisoblanadi (yoki kesh qilinadi)
            evidence: S05, S06, S07
            confidence: high

Transaction id, customer_id -> Customer, shop_id -> Shop,
            type (credit = qarz berdim | payment = to'lov oldim),
            amount (butun son, so'mda; float EMAS), note?, occurred_at, due_date?,
            attachment_url?, created_at, updated_at, deleted_at? (soft delete)
            evidence: S07, S08, S09
            confidence: high

Reminder    id, customer_id, channel (sms | telegram | whatsapp | share), sent_at, status
            evidence: S10
            confidence: medium

ShareLink   id, customer_id, token, expires_at
            evidence: S15
            confidence: guess
```

Bog'lanishlar: User 1-n Shop, Shop 1-n Customer, Customer 1-n Transaction, Customer 1-n Reminder, Customer 1-n ShareLink.

Balans = sum(credit) - sum(payment). Musbat = mijoz qarzdor, manfiy = oldindan to'lagan.

## Funksiyalar matritsasi

`features.csv` ga qarang. Must: 16, should: 11, could: 6, skip: 3.

## Doiradan tashqari (klon qilinmaydi yoki qilinmasligi kerak)

- PDAFTAR nomi, logotipi, ranglari, matnlari va rasmlari — klon o'z nomini oladi (`/replica-brand`).
- Asl ilovaning foydalanuvchilari va ularning ma'lumotlari.
- Asl ilovaning SMS provayder yoki bank bilan hamkorlik shartnomalari (o'zimiz rasmiy API orqali ulanamiz: masalan Eskiz.uz SMS, Click / Payme — faqat "could").
- Litsenziya talab qiladigan moliyaviy xizmatlar (kredit berish, to'lov qabul qilib saqlash) — ilova faqat **yozuv daftari**, pul o'tkazmaydi.

## Hajm

Ekranlar: 17, oqimlar: 8, entity: 6 (+ Kassa yozuvi, Xodim — backend bilan).

Qiyin qismlar:
1. **Oflayn ishlash + sinxronizatsiya** — do'konda internet yomon; yozuvlar telefonda saqlanib, keyin serverga yuborilishi va bir nechta qurilmada to'qnashuvsiz birlashishi kerak.
2. **SMS orqali kirish va eslatma** — O'zbekiston SMS provayderi (pullik, yuboruvchi nomi ro'yxatdan o'tkazilishi kerak). Portfolio uchun: Firebase Auth telefon kirish yoki test rejimi.
3. **Pul bilan aniq ishlash** — summa butun son sifatida, ming ajratgichlar, PDF hisobotda to'g'ri yig'indilar, o'chirilgan / tahrirlangan yozuvlar tarixi.

O'lcham: **M** (bir necha hafta) — iOS + Android uchun bitta kod bazasi (masalan React Native / Expo) bilan. Portfolio uchun avval F01–F04 ni ishlaydigan holatga keltirish (S, bir hafta oxiri) tavsiya etiladi.

## Qurilish holati (2026-11-07)

Klon: `mobile/` (Expo, iOS + Android, ishchi nom **Nasiyachi**).
Tayyor: S01–S09, S10 (qo'lda eslatma), S11, S12, S13, S14. Ma'lumot faqat telefonda.
Qolgan: haqiqiy SMS kirish, avtomatik SMS, bulut zaxira, kassa, xodimlar, valyuta, ru/kirill tili.
