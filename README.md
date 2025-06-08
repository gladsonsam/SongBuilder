# 🎵 SongBuilder Web App

A powerful web-based song management application that converts Ultimate Guitar songs into FreeShow format. Built with React and integrated with Appwrite for cloud storage.

## ✨ Features

- 🎸 **Import songs** from Ultimate Guitar format
- 🔄 **Convert to FreeShow** format for presentations
- ☁️ **Cloud storage** with Appwrite database
- 📝 **Rich text editing** with chord notation
- 🏷️ **Tag management** and organization
- 🌙 **Dark mode** interface
- 📄 **Multi-format export** (PDF, TXT, FreeShow)
- 📱 **Responsive design** for mobile and desktop
- 🎵 **Chord transposition** with automatic key detection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- An Appwrite project (see [Setup](#appwrite-setup))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gladsonsam/SongBuilder.git
   cd SongBuilder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Appwrite configuration:
   ```env
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_ENDPOINT=https://your-endpoint.com/v1
   VITE_APPWRITE_DATABASE_ID=songbuilder-db
   VITE_APPWRITE_SONGS_COLLECTION_ID=songs
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🗄️ Appwrite Setup

### 1. Create Appwrite Project
- Go to [Appwrite Console](https://cloud.appwrite.io)
- Create a new project
- Copy your Project ID

### 2. Create Database Schema
In your Appwrite console:

**Database:** `songbuilder-db`

**Collection:** `songs` with these attributes:
| Attribute | Type | Required | Size/Details |
|-----------|------|----------|--------------|
| `id` | String | ✅ | Size: 255 |
| `title` | String | ✅ | Size: 500 |
| `artist` | String | ✅ | Size: 255 |
| `sections` | String | ✅ | Size: 10000 |
| `createdAt` | DateTime | ✅ | - |
| `updatedAt` | DateTime | ✅ | - |
| `tags` | String | ❌ | Size: 1000, Array: Yes |
| `notes` | String | ❌ | Size: 5000 |

### 3. Set Permissions
- **Read**: `any` 
- **Write**: `any`

*For production, consider implementing user authentication and restricting permissions accordingly.*

## 🏗️ Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🌐 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/gladsonsam/SongBuilder)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_APPWRITE_PROJECT_ID`
   - `VITE_APPWRITE_ENDPOINT`
   - `VITE_APPWRITE_DATABASE_ID`
   - `VITE_APPWRITE_SONGS_COLLECTION_ID`
3. Deploy!

### Netlify

1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in site settings

### Other Platforms

This app can be deployed to any static hosting service:
- **GitHub Pages**
- **AWS S3 + CloudFront**
- **Firebase Hosting**
- **Surge.sh**

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Mantine UI Components
- **Database**: Appwrite Cloud Database
- **Rich Text**: TipTap Editor
- **Routing**: React Router v6
- **Styling**: PostCSS, CSS Modules
- **Build**: Vite with TypeScript

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React context providers
├── pages/          # Route components
├── utils/          # Utilities and services
│   ├── appwrite.ts     # Appwrite client config
│   ├── appwriteDb.ts   # Database operations
│   └── ...
└── types/          # TypeScript type definitions
```

## 🔧 Development

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_APPWRITE_PROJECT_ID` | Your Appwrite project ID | ✅ |
| `VITE_APPWRITE_ENDPOINT` | Appwrite server endpoint | ✅ |
| `VITE_APPWRITE_DATABASE_ID` | Database ID (default: songbuilder-db) | ❌ |
| `VITE_APPWRITE_SONGS_COLLECTION_ID` | Collection ID (default: songs) | ❌ |

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔒 Security

- ✅ No API keys exposed in client code
- ✅ Environment variables for configuration
- ✅ Appwrite handles authentication and permissions
- ✅ HTTPS enforced in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Issues & Support

- Report bugs: [GitHub Issues](https://github.com/gladsonsam/SongBuilder/issues)
- Feature requests: [GitHub Discussions](https://github.com/gladsonsam/SongBuilder/discussions)

---

Built with ❤️ using React and Appwrite
