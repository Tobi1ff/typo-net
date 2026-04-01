# Typo - Developer Social Community

Typo is a social platform for developers to share code, showcase projects, and connect.

## Hosting on Vercel

To host this project on Vercel, follow these steps:

1. **Download the project** as a ZIP or export it to GitHub.
2. **Create a new project on Vercel** and connect your repository.
3. **Configure Environment Variables**:
   In the Vercel dashboard, add the following environment variables. You can find these values in your `firebase-applet-config.json` file:

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_DATABASE_ID` (This is the `firestoreDatabaseId` field)

4. **Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Deploy**: Click deploy and your app will be live!

## Features

- **Real-time Feed**: Share thoughts and code snippets.
- **Project Showcase**: Highlight your builds with thumbnails and links.
- **Developer Search**: Find others by name or tech stack.
- **Notifications**: Stay updated on likes, comments, and follows.
- **Markdown Support**: Write posts using Markdown.
- **Syntax Highlighting**: Beautiful code blocks for multiple languages.
