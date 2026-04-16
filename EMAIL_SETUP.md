# 📧 Real Email OTP Setup Guide — NSMP

## Kya badla hai?

Ab registration mein **real OTP** email pe aayega (hardcoded `1234` hata diya gaya hai).
Account create hone ke baad ek **welcome email** bhi aayega.

---

## Setup Steps (5 minute mein)

### Step 1 — .env file banao

`backend/` folder ke andar `.env` naam ki file banao:

```env
PORT=5000
JWT_SECRET=nsmp_super_secret_jwt_key_change_this
EMAIL_USER=tumhara_gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
```

### Step 2 — Gmail App Password banao

1. **Google Account** kholo → **Security** tab
2. **2-Step Verification** enable karo (agar nahi hai)
3. Wapas Security → **App Passwords** (neeche scroll karo)
4. "Select app" → **Mail**, "Select device" → **Other** (NSMP likho)
5. **Generate** karo → 16-character password milega (e.g. `abcd efgh ijkl mnop`)
6. Wahi password `.env` file mein `EMAIL_PASS` mein dalo

> ⚠️ Note: App Passwords tabhi milta hai jab 2-Step Verification ON ho

### Step 3 — Dependencies install karo

```bash
cd backend
npm install
```

### Step 4 — Server chalaao

```bash
npm run dev
```

---

## Registration Flow (naya)

```
User form bharta hai → "Continue" click
    ↓
Backend: 6-digit random OTP generate karta hai
    ↓
Gmail se real email jaati hai user ke inbox mein
    ↓
User OTP enter karta hai
    ↓
Backend verify karta hai → Account create hota hai
    ↓
Welcome email bhi jaata hai ✓
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Email service not configured" | .env file check karo, EMAIL_USER aur EMAIL_PASS dono hone chahiye |
| "Invalid login" error | App Password galat hai, dobara generate karo |
| OTP email nahi aaya | Spam/Junk folder check karo |
| Gmail blocked error | Google account mein 2FA enable karo phir App Password banao |

---

## New API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/send-otp` | OTP generate karo aur email bhejo |
| POST | `/api/auth/verify-otp` | OTP verify karo aur account banao |
