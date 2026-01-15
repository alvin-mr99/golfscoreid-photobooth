# GolfScoreID Photo Booth

A React-based kiosk application for golf players to view their scores and take photos for printing.

## Features

- 🏌️ View golf scoring results by flight
- 📸 Take photos using connected camera
- 🖨️ Print scores and photos together
- 📱 Optimized for portrait kiosk displays
- 🔒 Kiosk mode with disabled navigation
- 🖥️ Fullscreen mode support
- ⚡ Fast and responsive UI
- 🎨 Modern, touch-friendly design

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Convex.dev
- **Camera**: MediaDevices API
- **State Management**: React Context API
- **Routing**: React Router v6
- **Testing**: Vitest + fast-check

## Prerequisites

- Node.js 18+ and npm
- A connected camera (for photo booth functionality)
- A connected printer (for printing functionality)
- Modern web browser (Chrome, Edge, Firefox, Safari)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd golf-score-photo-booth
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your Convex credentials:
```env
VITE_CONVEX_URL=your_convex_url
VITE_CONVEX_ADMIN_KEY=your_admin_key
```

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Development Features
- Hot Module Replacement (HMR)
- Fast refresh
- TypeScript type checking
- ESLint for code quality

## Building for Production

Build the application:
```bash
npm run build
```

This will:
- Compile TypeScript
- Bundle and minify assets
- Optimize for production
- Generate output in `dist/` directory

Preview the production build:
```bash
npm run preview
```

## Deployment

### Option 1: Static File Server

1. Build the application:
```bash
npm run build
```

2. Serve the `dist/` directory using any static file server:

**Using Node.js `serve`:**
```bash
npm install -g serve
serve -s dist -l 5173
```

**Using Python:**
```bash
cd dist
python -m http.server 5173
```

**Using Nginx:**
```nginx
server {
    listen 5173;
    server_name localhost;
    root /path/to/golf-score-photo-booth/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 2: Windows Mini PC Kiosk Setup

For production kiosk deployment on Windows Mini PC:

1. **Build the application:**
```bash
npm run build
```

2. **Install a local web server:**
```bash
npm install -g serve
```

3. **Create a startup script** (`start-kiosk.bat`):
```batch
@echo off
cd C:\path\to\golf-score-photo-booth
start /B serve -s dist -l 5173
timeout /t 3
start chrome.exe --kiosk --app=http://localhost:5173
```

4. **Configure Windows to run on startup:**
   - Press `Win + R`, type `shell:startup`, press Enter
   - Copy `start-kiosk.bat` to the Startup folder
   - Restart the computer to test

5. **Additional Windows Configuration:**
   - Disable Windows Update automatic restart
   - Disable screen saver and sleep mode
   - Set power options to "Never turn off display"
   - Disable Windows notifications
   - Configure auto-login (optional)

### Option 3: Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Build and run:
```bash
docker build -t golf-score-photo-booth .
docker run -p 5173:80 golf-score-photo-booth
```

## Project Structure

```
golf-score-photo-booth/
├── src/
│   ├── components/       # React components
│   │   ├── FlightSelector.tsx
│   │   ├── ScoreDisplay.tsx
│   │   ├── PhotoBooth.tsx
│   │   ├── PhotoGallery.tsx
│   │   ├── PrintButton.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── FullscreenButton.tsx
│   ├── pages/           # Page components
│   │   ├── WelcomePage.tsx
│   │   └── ScorePhotoPage.tsx
│   ├── services/        # Service modules
│   │   ├── ConvexService.ts
│   │   ├── CameraService.ts
│   │   └── PrintService.ts
│   ├── context/         # React Context
│   │   └── AppContext.tsx
│   ├── utils/           # Utility functions
│   │   └── kioskMode.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── dist/                # Production build output
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config
├── tailwind.config.js   # Tailwind config
└── README.md            # This file
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CONVEX_URL` | Convex backend URL | `http://103.75.101.39:3252` |
| `VITE_CONVEX_ADMIN_KEY` | Convex admin authentication key | `golf-pangjat-staging\|...` |

## Kiosk Mode Features

- **Fullscreen Mode**: Click the fullscreen button (bottom-right) to enter/exit fullscreen
- **Keyboard Shortcuts Disabled**: F11, Alt+F4, Ctrl+W, Ctrl+Q, etc.
- **Right-Click Disabled**: Context menu is disabled
- **Browser Navigation Prevented**: Back/forward buttons disabled
- **Auto-Reset**: Session resets after print completion (5 seconds)
- **Idle Timeout**: Welcome screen resets after 60 seconds of inactivity

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ⚠️ Limited (camera API) |

## Troubleshooting

### Camera Not Working
- Check browser permissions (allow camera access)
- Ensure camera is connected and not in use by another application
- Try a different browser (Chrome/Edge recommended)
- Check camera drivers on Windows

### Print Not Working
- Ensure printer is connected and turned on
- Check printer drivers are installed
- Test print from another application
- Check browser print settings

### Convex Connection Failed
- Verify `.env` file has correct credentials
- Check network connectivity
- Verify Convex backend is running
- Check firewall settings

### Fullscreen Not Working
- Some browsers require user interaction before fullscreen
- Try clicking the fullscreen button instead of F11
- Check browser permissions

## Performance Optimization

The application is optimized for:
- Fast initial load (code splitting)
- Smooth animations (GPU acceleration)
- Efficient re-renders (React.memo, useMemo)
- Small bundle size (tree shaking, minification)
- Cached API calls (30-second cache for flights)

## Security Considerations

- Environment variables are used for sensitive credentials
- Camera access requires user permission
- No data is stored permanently (session-based)
- Kiosk mode prevents unauthorized access
- HTTPS recommended for production

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Contact system administrator

## License

Private - All rights reserved

## Version

Current Version: 1.0.0
