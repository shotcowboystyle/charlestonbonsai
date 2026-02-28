# Charleston Bonsai Gallery

A premium gallery website for bonsai trees with an e-commerce aesthetic.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Netlify

1. Push code to GitHub
2. Import project in Netlify
3. Set build command: `npm run generate`
4. Set publish directory: `.output/public`
5. Add environment variables
6. Deploy

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes (for admin) |
| `ADMIN_EMAIL` | Admin user email | Yes |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of admin password | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `SITE_URL` | Production site URL | Yes |

## Database Setup

1. Go to Supabase SQL Editor
2. Run `supabase/schema.sql`
3. Run `supabase/seed.sql` (optional sample data)

## Project Structure

```
bonsai-gallery/
├── components/        # Vue components
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Navbar, Footer
│   ├── gallery/      # Gallery-specific
│   └── home/         # Landing page components
├── composables/      # Vue composables
├── layouts/          # Nuxt layouts
├── pages/            # File-based routes
├── plugins/          # Nuxt plugins
├── server/api/       # API endpoints
├── stores/           # Pinia stores
├── supabase/         # Database files
└── types/            # TypeScript definitions
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run generate` | Generate static site |
| `npm run preview` | Preview production build |

## Tech Stack

- **Framework:** Nuxt 3
- **Styling:** TailwindCSS
- **Animation:** GSAP
- **3D:** Three.js
- **Database:** Supabase
- **State:** Pinia

## License

MIT
