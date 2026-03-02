# Nova Store 🌙

**Nova Store** is a premium, high-performance Arabic e-commerce platform built with Next.js 16, tailored for the fashion and apparel industry. It features a full real-time Admin Dashboard, advanced taxonomy, secure checkout, and a beautiful dark-mode (Noir) aesthetic out of the box with complete Right-to-Left (RTL) support.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://postgresql.org) via [Neon Serverless](https://neon.tech/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [Iron Session](https://github.com/vvo/iron-session) (Stateless, encrypted cookies)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (AWS S3 Compatible API)
- **Deployment**: [Cloudflare Pages & Workers](https://developers.cloudflare.com/pages/) via OpenNext
- **Real-time**: Node.js Server-Sent Events (SSE)

## ✨ Core Features

- 🛍️ **Storefront**: Dynamic product catalog with variations (sizes, colors), beautiful shopping cart, and seamless checkout experience.
- 🔐 **Secure Admin Dashboard**: Role-based access control, CSRF protection, and database-backed rate limiting.
- 📡 **Real-Time Notifications**: Live order updates pushed instantly to the admin dashboard using Server-Sent Events (SSE).
- 📂 **Advanced Taxonomy**: Multi-tier organization using Sections and Categories.
- 🖼️ **Media Management**: Direct S3-compatible image uploads to Cloudflare R2 (falls back to local dev storage).
- 🌍 **RTL & Localization**: Fully optimized for Arabic typography and native Right-to-Left layouts.

## 🛠️ Local Development

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL Database (e.g., Neon Serverless or local Docker)
- An S3-compatible storage bucket (optional for local dev, will fallback to local filesystem `/public/uploads`)

### 1. Clone & Install

```bash
git clone https://github.com/YourUsername/nova_store.git
cd nova_store
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory and populate it:

```bash
DATABASE_URL="postgres://user:password@host/db?sslmode=require"
SESSION_SECRET="your-32-character-long-secure-secret-here"
```

### 3. Database Setup

```bash
# Push the Prisma schema to your database
npx prisma db push

# Seed the database with the default admin account and initial taxonomy
npm run db:seed
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the storefront, and [http://localhost:3000/admin](http://localhost:3000/admin) for the dashboard.

**Default Admin Credentials:**

- Email: `admin@novastore.com`
- Password: `admin123`

## ☁️ Production Deployment (Cloudflare)

Nova Store is heavily optimized for zero-cold-start Edge deployment via Cloudflare Pages and Workers.

1. Install Wrangler globally: `npm install -g wrangler`
2. Set production secrets in Cloudflare:

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put SESSION_SECRET
npx wrangler secret put S3_ACCESS_KEY
npx wrangler secret put S3_SECRET_KEY
```

3. Build and Deploy:

```bash
npm run build
npx @opennextjs/cloudflare@latest
npx wrangler deploy
```

## 🔒 Security Posture

- **Rate Limiting**: Custom database-backed IP rate limiter on authentication and mutation endpoints.
- **CSRF Protection**: Native `X-Requested-With` XMLHttpRequest header strict verification.
- **Auth Guarding**: Zero layout-level data leaks; robust server-side middleware and route handlers strictly enforce `requireAdmin`.
- **Stateless Sessions**: Tamper-proof, cryptographically signed HTTP-only cookies via Iron Session.

## 📄 License

This project is licensed under the MIT License.
