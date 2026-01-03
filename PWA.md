# Progressive Web App (PWA) Guide

Philosophizer is now a fully-featured Progressive Web App that can be installed on mobile devices and desktops for an app-like experience!

## Features

✅ **Installable**: Add to home screen on iOS, Android, and desktop browsers  
✅ **Offline Support**: Service worker caches assets for offline access  
✅ **App-like Experience**: Runs in standalone mode without browser chrome  
✅ **Fast Loading**: Cached assets load instantly  
✅ **Mobile Optimized**: Responsive design with proper viewport settings  
✅ **Custom Icons**: Beautiful phi (φ) icon in all required sizes

## Installation Instructions

### iOS (iPhone/iPad)

1. Open Safari and navigate to your Philosophizer instance
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired (default: "Philosophizer")
5. Tap **"Add"** in the top right
6. The Philosophizer icon will appear on your home screen!

**Note**: PWA installation only works in Safari on iOS. Chrome/Firefox on iOS don't support PWA installation.

### Android

1. Open Chrome and navigate to your Philosophizer instance
2. Tap the **three-dot menu** in the top right
3. Tap **"Add to Home screen"** or **"Install app"**
4. Confirm the installation
5. The app will appear in your app drawer and home screen!

Alternatively, Chrome may show an automatic install banner at the bottom of the screen.

### Desktop (Chrome, Edge, Brave)

1. Navigate to your Philosophizer instance
2. Look for the **install icon** (⊕) in the address bar
3. Click it and confirm installation
4. The app will open in a standalone window
5. Find it in your applications/start menu!

### Desktop (Safari on macOS)

1. Open Safari and navigate to your Philosophizer instance
2. Go to **File → Add to Dock**
3. The app will be added to your Dock for quick access

## PWA Architecture

### Service Worker (`public/sw.js`)

The service worker provides:

- **Asset caching**: HTML, CSS, JS, and static assets cached on install
- **Network-first strategy**: API calls always fetch fresh data
- **Cache-first strategy**: Static assets served from cache for speed
- **Offline fallback**: Cached pages served when network is unavailable
- **Background sync**: Support for offline message queuing (optional)
- **Push notifications**: Ready for notification support (optional)

### Web App Manifest (`public/manifest.json`)

Defines the app's appearance and behavior:

- **Name and icons**: App identity and branding
- **Display mode**: Standalone (no browser UI)
- **Theme colors**: Matches your app's design
- **Orientation**: Portrait-primary for mobile
- **Categories**: Education, productivity, utilities

### Icons (`public/icons/`)

All required icon sizes are generated:

- 72x72, 96x96, 128x128 (small devices)
- 144x144, 152x152 (medium devices)
- 192x192 (standard PWA icon)
- 384x384, 512x512 (high-res displays, splash screens)

Currently using SVG icons for maximum quality and small file size.

## Development

### Generating Icons

If you have ImageMagick installed, you can generate PNG icons:

```bash
# Install ImageMagick (if needed)
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Linux

# Generate icons
cd src/frontend
./generate-icons.sh
```

Alternatively, use an online tool like [RealFaviconGenerator](https://realfavicongenerator.net/) to create PNG icons from the `phi.svg` file.

### Testing PWA Features

#### Chrome DevTools (Desktop)

1. Open DevTools (F12)
2. Go to **Application** tab
3. Check:
   - **Manifest**: View manifest.json parsed data
   - **Service Workers**: See registration status and cache
   - **Storage → Cache Storage**: Inspect cached assets
   - **Lighthouse**: Run PWA audit

#### Lighthouse Audit

Run a comprehensive PWA check:

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run audit
lighthouse http://your-server-url --view
```

#### Testing Offline Mode

1. Open DevTools
2. Go to **Network** tab
3. Check **"Offline"** in the throttling dropdown
4. Reload the page - cached version should load!

### Service Worker Updates

When you update the service worker:

1. Change the `CACHE_NAME` version in `sw.js`
2. Users will get the new version on next page load
3. Old caches are automatically cleaned up

### Production Checklist

- [ ] Test installation on iOS Safari
- [ ] Test installation on Android Chrome
- [ ] Test installation on desktop browsers
- [ ] Verify offline functionality
- [ ] Check icon appearance at all sizes
- [ ] Run Lighthouse PWA audit (aim for 100/100)
- [ ] Test on various network speeds
- [ ] Verify manifest.json is accessible
- [ ] Check service worker registration
- [ ] Test cache invalidation

## Troubleshooting

### PWA Not Installing

**Problem**: Install prompt doesn't appear

**Solutions**:

- Ensure you're using HTTPS (required for PWA)
- Check that `manifest.json` is accessible
- Verify service worker is registered (check DevTools)
- Try hard refresh (Cmd/Ctrl + Shift + R)
- Clear browser cache and reload

### Service Worker Not Updating

**Problem**: Changes don't appear after deployment

**Solutions**:

- Increment `CACHE_NAME` version in `sw.js`
- Clear Application → Storage in DevTools
- Use "Update on reload" in Service Workers panel
- Unregister old service worker manually

### Icons Not Loading

**Problem**: Default browser icon appears instead of custom icon

**Solutions**:

- Check `/icons/` path is accessible in browser
- Verify icon files exist in `public/icons/`
- Check server is configured to serve icon files
- Clear cache and reinstall the PWA

### Offline Mode Not Working

**Problem**: App doesn't work offline

**Solutions**:

- Check service worker is active (DevTools → Application)
- Verify assets are cached (Cache Storage)
- Ensure network-first strategy for HTML pages
- Check for errors in service worker console

## Advanced Configuration

### Customizing Theme Colors

Edit `manifest.json`:

```json
{
  "background_color": "#0f172a", // Dark blue background
  "theme_color": "#3b82f6" // Blue theme color
}
```

Also update HTML meta tags in `index.html`:

```html
<meta name="theme-color" content="#3b82f6" />
```

### Adding Push Notifications

Uncomment the push notification handler in `sw.js` and implement server-side push service.

### Custom Splash Screens (iOS)

iOS doesn't support standard splash screens. Consider adding custom launch images:

```html
<link
  rel="apple-touch-startup-image"
  href="/splash-iphone.png"
  media="(device-width: 390px)"
/>
```

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [Apple iOS PWA Support](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Generate all icon sizes

## Browser Support

| Browser           | Installation | Service Worker | Offline    |
| ----------------- | ------------ | -------------- | ---------- |
| Chrome (Android)  | ✅           | ✅             | ✅         |
| Chrome (Desktop)  | ✅           | ✅             | ✅         |
| Safari (iOS)      | ✅           | ⚠️ Limited     | ⚠️ Limited |
| Safari (macOS)    | ✅           | ✅             | ✅         |
| Firefox (Android) | ✅           | ✅             | ✅         |
| Firefox (Desktop) | ✅           | ✅             | ✅         |
| Edge              | ✅           | ✅             | ✅         |
| Samsung Internet  | ✅           | ✅             | ✅         |

⚠️ iOS Safari has limited service worker support but still provides a good installable experience.
