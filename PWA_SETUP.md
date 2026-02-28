# PWA Setup Instructions

## Icon Generation

The PWA requires icons in multiple sizes. You can generate these from your existing logo using one of these methods:

### Option 1: Using Online Tool
1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload your `/public/logo-si-lamin.png` file
3. Download the generated icons
4. Place them in the `/public/` folder

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick if not already installed
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Linux

# Generate icons
convert public/logo-si-lamin.png -resize 192x192 public/icon-192x192.png
convert public/logo-si-lamin.png -resize 512x512 public/icon-512x512.png
convert public/logo-si-lamin.png -resize 180x180 public/apple-touch-icon.png
```

### Option 3: Manual Design
Create PNG files with these dimensions:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `apple-touch-icon.png` (180x180 pixels)

## Testing Your PWA

1. Build and run the production version:
   ```bash
   bun run build
   bun run start
   ```

2. Open Chrome/Edge and go to: `http://localhost:3000`

3. Check PWA status:
   - Open DevTools (F12)
   - Go to "Application" tab
   - Check "Manifest" and "Service Workers" sections

4. Install the PWA:
   - Look for the install icon in the browser's address bar
   - Or use browser menu: "Install SI-LAMIN..."

## Features Enabled

✅ **Installable**: Users can install the app to their home screen
✅ **Offline Support**: Basic offline functionality with cached assets
✅ **App-like Experience**: Runs in standalone mode without browser UI
✅ **Push Notifications**: Ready for future implementation
✅ **Responsive**: Optimized for mobile and desktop

## Browser Support

- Chrome/Edge: Full support
- Safari (iOS/macOS): Full support with Add to Home Screen
- Firefox: Partial support
- Samsung Internet: Full support

## Next Steps (Optional Enhancements)

1. **Better Offline Page**: Customize `/public/offline.html`
2. **Background Sync**: Add background sync for form submissions
3. **Push Notifications**: Implement server-side push notification system
4. **App Shortcuts**: Add shortcuts in manifest.json for quick actions
5. **Update Notifications**: Notify users when a new version is available
