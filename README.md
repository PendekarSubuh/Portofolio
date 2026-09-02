# Deja Futuristic Portfolio — Full-Stack

A futuristic, responsive portfolio website for Muhamad Deja Alwi Dzulhian.

## Included
- Node.js + Express backend
- SQLite database with seeded profile, experience, projects, skills, stats and contact messages
- No login / no admin page — public portfolio only
- Real uploaded portfolio PDF and CV included in `public/assets/`
- Working in-page PDF viewer (`Open Portfolio PDF`) with full-PDF fallback
- Email click opens a modal with `dezadzulhian@gmail.com`, copy email and mail app actions
- Contact form saves messages to SQLite through `/api/contact`
- Project filter + detail modals
- Responsive mobile navigation
- Animated background, marquee, scanline, scroll reveal, skill bars and futuristic UI

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Replace your PDF later
Replace `public/assets/portfolio.pdf` with your own PDF while keeping the same filename. The UI and backend routes will continue to work.

## Replace your CV later
Replace `public/assets/CV_Muhamad_Deja_Alwi.pdf` with a new file using the same name, or update the path in the database seed before first startup.

## Database
SQLite file: `data/portfolio.db`.
The site seeds the database on first run. The public API only reads portfolio content; there is no public admin interface.
