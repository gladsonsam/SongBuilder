# Songbuilder Web App

A web-based song management application that allows you to convert Ultimate Guitar songs into FreeShow format. This is a web version of the original Tauri desktop application.

## Features

- Import songs from Ultimate Guitar format
- Convert to FreeShow format
- Manage song database with IndexedDB (local storage)
- Export songs to various formats (PDF, TXT, FreeShow)
- Rich text editing with chord notation
- Tag management and organization
- Dark mode interface

## Getting Started

### Development

```bash
npm install
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Mantine UI
- IndexedDB for local storage
- TipTap for rich text editing
- React Router for navigation

## Deployment

This is a standard Vite React app and can be deployed to any static hosting service like:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

The app stores all data locally in the browser's IndexedDB, so no backend is required.
