# Voha Frontend

Static frontend for the FastAPI server at `https://44-212-221-136.sslip.io`.

Run locally:

```bash
cd /home/arch/frontendwebsite
npm run dev
```

Open `http://localhost:3000`.

The API server CORS configuration allows `http://localhost:3000` and `http://localhost:8080`.

## Koreys tili admin paneli

Tizimga kirgandan keyin yon menyudagi **Koreys tili** bo‘limini oching.
Serverdagi `PUSH_ADMIN_API_KEY` qiymatini admin kaliti sifatida kiriting.
Kalitni kodga yozmang; koreys tili paneli uni faqat joriy sahifa xotirasida saqlaydi.

16 boshlang‘ich dars TOPIK I’ning 1–2 darajalari uchun berilgan. Yangi dars
yaratish, darajasi va tartibini belgilash, lug‘at/grammatika/dialog/mashqlarni
va test javoblarini tahrirlash mumkin. **Android’da nashr qilish** belgisi
Discover’da ko‘rinishini boshqaradi. O‘chirishda tasdiqlash so‘raladi;
dars bilan birga shu dars natijalari ham o‘chadi.

Lug‘at, misol va dialog maydonlarida har qator `koreyscha | o‘zbekcha`
ko‘rinishida yoziladi. Testda 2–4 javob varianti, to‘g‘ri javob raqami (1 dan
boshlanadi) va izoh kerak. Tinglash savolida koreyscha ovozli matn ham kerak.
Android qurilmadagi koreyscha TextToSpeech ovozidan foydalanadi.

API: `/korean/admin/lessons` (GET/POST), `/korean/admin/lessons/{id}` (PUT/DELETE).
Har bir so‘rov `X-Admin-Key` bilan himoyalangan. Vercel’dagi mavjud `/api`
proxy yangi endpointlarni ham backendga uzatadi.
