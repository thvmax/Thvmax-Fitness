# THVMAX FITNESS — S+ Tier Program

Personal workout tracker & progress journal. Built with Next.js 14, Tailwind CSS, and Framer Motion.

## Features

- **5-Day Workout Plan** — Push/Pull/Legs/Upper/Legs+Core with RPE-governed progression
- **Exercise Tracking** — Check off exercises, log weight/reps/RPE per set
- **Progress Photos** — Weekly front/side/back photo uploads stored locally via IndexedDB
- **Body Measurements** — Track weight, body fat %, chest, waist, arms, thighs
- **Workout History** — Weekly grouped records with completion rates
- **Streak Tracking** — Current streak, longest streak, total sessions
- **Data Export/Import** — JSON backup for data portability
- **PWA Ready** — Installable on your phone for gym use
- **Offline First** — All data stored locally, no server needed

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- IndexedDB (photo storage)
- localStorage (workout records)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/thvmax-fitness.git
cd thvmax-fitness

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration (Recommended)
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Click **Deploy** — zero config needed

### Option 3: One-Click
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/thvmax-fitness)

## Project Structure

```
thvmax-fitness/
├── app/
│   ├── layout.tsx          # Root layout with nav
│   ├── page.tsx            # Dashboard / Home
│   ├── globals.css         # Global styles + Tailwind
│   ├── workout/
│   │   └── [day]/
│   │       └── page.tsx    # Workout session page
│   ├── progress/
│   │   └── page.tsx        # Photo upload & measurements
│   └── history/
│       └── page.tsx        # Workout log & stats
├── components/
│   └── Navigation.tsx      # Bottom nav bar
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── workout-data.ts     # Exercise definitions
│   └── storage.ts          # localStorage + IndexedDB utils
├── public/
│   ├── manifest.json       # PWA manifest
│   └── icon.svg            # App icon
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

## Data Storage

All data is stored **locally on your device**:
- **Workout records** → `localStorage`
- **Progress photos** → `IndexedDB` (supports large files)
- **Measurements** → `localStorage`

Use the **Export/Import** feature in History to backup your data.

---

*EVERY TOUCH IS ART · THVMAX 2026*
