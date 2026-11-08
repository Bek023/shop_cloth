# Arxitektura: Nasiyachi

Sana: 2026-11-08. Recon xaritasi: `recon.md`. Funksiyalar: `features.csv`.

## Stek

| qism | tanlov | nega |
| --- | --- | --- |
| Mobil ilova | Expo (React Native) + Expo Router, TypeScript | bitta kod iOS + Android + veb demo |
| Lokal ma'lumot | zustand + AsyncStorage | oflayn birinchi: hamma narsa avval telefonga yoziladi |
| Server | Supabase (Postgres, Auth, Edge Functions, pg_cron) | boshqariladigan, bepul tarif, RLS bilan xavfsiz |
| Kirish | Supabase telefon OTP | SMS provayderni foydalanuvchi ulaydi; test raqamlari bilan bepul sinash mumkin |
| Eslatmalar | Telegram Bot API (rasmiy) | qarzdorga bepul xabar; SMS pullik |
| To'lovlar | hozircha yo'q | Stripe O'zbekistonda ishlamaydi; keyin Click / Payme rasmiy API |

## Ma'lumotlar modeli

```
shops            id, name, owner_name, auto_reminders, created_at, updated_at
shop_members     shop_id, user_id, role (owner | seller)
contacts         id (uuid, telefonda yaratiladi), shop_id, kind, name, phone, note,
                 created_at, updated_at, deleted_at, server_updated_at
transactions     id (uuid), shop_id, contact_id, type (gave | got), amount (bigint so'm),
                 note, occurred_at, due_date, created_by, created_at, updated_at,
                 deleted_at, server_updated_at
link_tokens      token, kind (contact | owner), shop_id, contact_id?, user_id?, expires_at, used_at
telegram_links   contact_id -> chat_id   (mijoz botga ulangan)
owner_chats      user_id, shop_id -> chat_id   (do'kon egasi kunlik hisobot oladi)
reminders        contact_id, kind, period_key, status, error   (unique: bir kunda bir marta)
telegram_updates update_id   (bot webhook takrorlansa, ikki marta ishlamaydi)
contact_balances view: contact_id, balance, next_due
```

Kirish qoidasi: har jadvalda RLS. Foydalanuvchi faqat o'zi a'zo bo'lgan do'kon qatorlarini ko'radi va yozadi
(`is_shop_member(shop_id)`). Bot va cron jadvallariga faqat `service_role` (server) kiradi.

## Sinxronizatsiya

- Yozuvlar telefonda UUID bilan yaratiladi, internet bo'lmasa ham.
- O'zgargan yozuvlar `dirty` ro'yxatiga tushadi; internet bo'lganda `upsert` bilan yuboriladi.
- Ziddiyat: oxirgi yozgan yutadi (`updated_at` bo'yicha). Server triggeri eskiroq yozuvni rad etadi.
- Tortib olish: `server_updated_at > kursor` bo'yicha; o'chirishlar `deleted_at` bilan keladi.

## Routelar (Edge Functions)

| funksiya | kim chaqiradi | nima qiladi |
| --- | --- | --- |
| `telegram-bot` | Telegram webhook (maxfiy header bilan) | `/start <token>` bog'lash, `/qarzim`, `/stop` |
| `daily-reminders` | pg_cron, har kuni 09:00 Toshkent | muddat yaqin / o'tgan qarzdorlarga xabar, egasiga hisobot |

RPC (Postgres funksiyalari): `bootstrap_shop`, `create_link_token`, `delete_my_account`.

## Qurish tartibi

1. Baza, RLS, testlar.
2. Ilovada kirish + sinxronizatsiya (kalit bo'lmasa demo rejim saqlanadi).
3. Telegram bot va kunlik eslatma.
4. Keyin: kassa, xodimlar (rol `seller` allaqachon bazada), valyuta.
