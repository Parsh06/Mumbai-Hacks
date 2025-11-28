# FinSightAi Project Structure

## Directory Structure

```
frontend/
├── public/                    # Static assets
│   ├── finsightai-logo.svg   # Main logo (favicon)
│   ├── finsightai-logo-og.svg # Social media preview image
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── CompanySearch.tsx
│   │   ├── InsightsPanel.tsx
│   │   ├── Layout.tsx       # Main layout with navbar & footer
│   │   ├── LoadingState.tsx # Loading component
│   │   ├── Logo.tsx         # FinSightAi logo component
│   │   ├── MetricCard.tsx
│   │   ├── NavLink.tsx
│   │   └── Preloader.tsx    # App boot preloader
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/                 # Utility functions
│   │   └── utils.ts
│   │
│   ├── pages/               # Route pages
│   │   ├── Auth.tsx         # Login/Signup page
│   │   ├── Companies.tsx    # Company listing
│   │   ├── CompanyOverview.tsx # Individual company details
│   │   ├── CompareCompanies.tsx # Company comparison
│   │   ├── Dashboard.tsx    # User dashboard
│   │   ├── Documentation.tsx
│   │   ├── Index.tsx        # Homepage
│   │   ├── Industries.tsx
│   │   └── NotFound.tsx
│   │
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
│
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
└── tailwind.config.ts      # Tailwind CSS config
```

## Path Aliases

All imports use the `@/` alias which maps to `src/`:
- `@/components/*` → `src/components/*`
- `@/pages/*` → `src/pages/*`
- `@/lib/*` → `src/lib/*`
- `@/hooks/*` → `src/hooks/*`

## Asset References

- **Favicon**: `/finsightai-logo.svg` (referenced in `index.html`)
- **Social Preview**: `/finsightai-logo-og.svg` (OG meta tags)
- **Images**: All background images use Unsplash URLs (no local image files)

## Key Configuration Files

- **vite.config.ts**: Configures path aliases and dev server (port 8080)
- **tsconfig.json**: TypeScript path mapping for `@/*` alias
- **index.html**: Entry HTML with meta tags and favicon links

## Build & Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Notes

- All Supabase dependencies have been removed
- Authentication uses localStorage (demo mode)
- Company data uses mock data (no API calls)
- All imports use path aliases for consistency
- Build verified and working ✅




