# GitHub'ga O'zgarishlarni Push Qilish

Bu hujjat `C:\frontend\paylog` loyihasidagi o'zgarishlarni GitHub'ga yuborish uchun kerakli qadamlarni tushuntiradi.

## 1. Papkani Ochish

PowerShell oching va loyiha papkasiga kiring:

```powershell
cd C:\frontend\paylog
```

## 2. Git Holatini Tekshirish

Agar loyiha allaqachon git repo bo'lsa:

```powershell
git status
```

Agar `not a git repository` chiqsa, repo yaratish kerak:

```powershell
git init
```

## 3. Fayllarni Stage Qilish

Barcha o'zgarishlarni qo'shish:

```powershell
git add .
```

Faqat bitta faylni qo'shish:

```powershell
git add src/main.js
git add GITHUB_PUSH.md
```

## 4. Commit Yaratish

Mazmunli commit yozing:

```powershell
git commit -m "Update privacy policy names and add GitHub push guide"
```

Agar `Please tell me who you are` xatosi chiqsa, bir marta identity sozlang:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Keyin `git commit` ni qayta ishga tushiring.

## 5. GitHub'da Bo'sh Repository Yaratish

GitHub'da yangi repository yarating.

Tavsiya:

- Repository name: `paylog`
- `README`, `.gitignore`, `license` ni avtomatik qo'shmaslik

## 6. Remote Ulash

GitHub repository linkini ulang:

```powershell
git remote add origin https://github.com/USERNAME/paylog.git
```

Agar `origin already exists` chiqsa:

```powershell
git remote set-url origin https://github.com/USERNAME/paylog.git
```

Remote tekshirish:

```powershell
git remote -v
```

## 7. Branch Nomini To'g'rilash

Asosiy branch nomini `main` qilish:

```powershell
git branch -M main
```

## 8. GitHub'ga Push Qilish

Birinchi push:

```powershell
git push -u origin main
```

Keyingi pushlar:

```powershell
git push
```

## 9. Foydali Tekshiruv Buyruqlari

Oxirgi holat:

```powershell
git status
```

Commitlar ro'yxati:

```powershell
git log --oneline
```

Remote manzillar:

```powershell
git remote -v
```

## 10. To'liq Minimal Ketma-ketlik

Agar noldan qilayotgan bo'lsangiz:

```powershell
cd C:\frontend\paylog
git init
git add .
git commit -m "Initial project commit"
git branch -M main
git remote add origin https://github.com/USERNAME/paylog.git
git push -u origin main
```

## 11. Agar Login So'ralsa

GitHub sizdan login so'rashi mumkin. Odatda quyidagilardan biri ishlatiladi:

- Browser orqali sign in
- Personal Access Token
- Git Credential Manager

HTTPS bilan ishlayotgan bo'lsangiz, oddiy GitHub paroli ko'pincha ishlamaydi; token kerak bo'lishi mumkin.

## 12. Hozirgi O'zgarishlar Uchun Misol

Sizdagi joriy o'zgarishlarni yuborish uchun:

```powershell
cd C:\frontend\paylog
git add src/main.js GITHUB_PUSH.md
git commit -m "Rename policy modules and add push documentation"
git push
```

## Eslatma

Hozirgi muhitda bu papka git repo sifatida ko'rinmadi. Shuning uchun birinchi bosqichda `git init` yoki mavjud repodan to'g'ri papkani ochganingizni tekshirish kerak.
