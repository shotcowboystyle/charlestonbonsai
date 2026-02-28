# Charleston Bonsai Gallery

A premium gallery website for bonsai trees with an e-commerce aesthetic.

## Tech Stack

- **Framework:** Nuxt 3
- **Styling:** TailwindCSS
- **Animation:** GSAP
- **3D Rendering:** Three.js
- **Database:** Supabase
- **State Management:** Pinia

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shotcowboystyle/charlestonbonsai.git
cd charlestonbonsai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your Supabase credentials.

5. Set up the database:
   - Go to your Supabase project SQL Editor
   - Run the contents of `supabase/schema.sql`
   - Run the contents of `supabase/seed.sql` (optional sample data)

6. Start the development server:
```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) |
| `ADMIN_EMAIL` | Admin user email |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of admin password |
| `JWT_SECRET` | Secret for JWT token signing |
| `SITE_URL` | Production site URL |

## Project Structure

```
bonsai-gallery/
├── assets/
│   └── css/           # Global styles
├── components/
│   ├── ui/            # Reusable UI components
│   ├── layout/        # Layout components (Navbar, Footer)
│   └── gallery/       # Gallery-specific components
├── composables/       # Vue composables
├── layouts/           # Nuxt layouts
├── pages/             # Page routes
├── plugins/           # Nuxt plugins
├── public/
│   └── images/        # Static images
├── server/
│   └── api/           # API endpoints
├── stores/            # Pinia stores
├── supabase/          # Database schema and seeds
└── types/             # TypeScript definitions
```

## Development Phases

- [x] Phase 1: Foundation & Setup
- [ ] Phase 2: Public Pages (Landing, Gallery, Detail)
- [ ] Phase 3: 3D Viewer & GSAP Animations
- [ ] Phase 4: Admin Dashboard
- [ ] Phase 5: Deployment

## License

MIT
