# MazExpress Admin - Phase 1: Authentication

Modern shipping management platform with Apple-inspired "Liquid Glass" UI, built with React + TypeScript + Firebase.

## 🚀 Features

- ✨ **Liquid Glass UI** - Frosted glass effects, soft glows, micro-animations
- 🔐 **Firebase Authentication** - Email/password login with persistence
- 🌍 **i18n Ready** - Full English/Arabic support with RTL
- 🎨 **Token-based Design** - Consistent, maintainable styling
- ⚡ **Redux Toolkit** - State management ready for Phase 2
- ♿ **Fully Accessible** - ARIA labels, keyboard navigation

## 📦 Tech Stack

- React 18 + TypeScript + Vite
- Firebase Authentication
- Redux Toolkit + RTK Query
- Tailwind CSS + shadcn/ui
- Framer Motion + React Hook Form + Zod
- i18next + dayjs

## 🛠️ Setup

1. **Clone and install:**
```bash
pnpm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Add your Firebase credentials to .env
```

⚠️ **SECURITY NOTE**: Never commit `.env` to version control. It contains sensitive credentials.

3. **Start development server:**
```bash
pnpm dev
```

4. **Test login with your Firebase users**

## 🔑 Firebase Configuration

Your Firebase credentials are set in `.env`. To update:
- Go to Firebase Console
- Project Settings > General
- Copy config values to `.env`

## 🌐 Localization

Toggle between English/Arabic using the language button (top-right). RTL automatically applies for Arabic.

## 📁 Project Structure

```
src/
├── app/              # Providers & store
├── components/       # UI components & layouts
├── hooks/            # Custom hooks (useAuth, useLocale)
├── screens/          # Page components (Login, Dashboard)
├── utilities/        # Firebase, i18n, Redux, schemas
└── App.tsx          # Route configuration
```

## 🎯 Phase 1 Complete

- ✅ Login page with glass design
- ✅ Firebase email/password auth
- ✅ EN/AR localization + RTL
- ✅ Redux store configured
- ✅ Protected routes
- ✅ Sign-out functionality

## 📝 Next Steps (Phase 2)

- Dashboard screens
- User management
- Shipment tracking
- Wallet features
- Warehouse management

---

Built with ❤️ by MazExpress Team
