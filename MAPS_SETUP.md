# Maps API Keys Setup

## Android - Google Maps API Key

### For Development (Emulator/Testing):

1. Get your debug SHA-1 key:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

2. Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project: "Squad Goals"
   - Enable **Maps SDK for Android**
   - Create an API key (Android type)
   - Add the SHA-1 from step 1 to the restrictions
   - Copy the key

3. Add to `.env.local`:
   ```
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_ANDROID_KEY_HERE
   ```

### For Production (Build):
- Request Google Maps API key with production SHA-1 fingerprint
- Store securely in build secrets

---

## iOS - Apple Maps API Key

### For Development:
- iOS uses native Apple Maps, no API key needed for basic functionality
- Custom styling requires Apple Maps API key (if needed later)

### For Production:
- Request Apple Maps API key if using custom styling
- Configure in app.json

---

## Environment Variables

Create `.env.local` file in project root (NOT committed to git):

```env
# Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_key_here
EXPO_PUBLIC_APPLE_MAPS_API_KEY=your_apple_key_here

# Other keys
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_CLERK_FRONTEND_API_URL=...
```

---

## Testing Maps

### Android Emulator:
```bash
npm run android
# Maps should load with default Google Maps

# If blank, check:
- API key is correct
- SHA-1 fingerprint matches
- Emulator has Google APIs enabled (not just base image)
```

### iOS Simulator:
```bash
npm run ios
# Maps should load with Apple Maps automatically
# No special config needed
```

### Real Device:
```bash
# Build APK or IPA with:
npm run android
npm run ios

# GPS will work on real device, not on emulator
```

---

## Troubleshooting

### "Google Play Services not available"
- Use emulator with "Google APIs" not "base"
- Or test on real Android device

### Maps appears blank on Android
- Check API key in app.json and .env.local
- Verify SHA-1 in Google Cloud Console
- Restart emulator / clear cache

### Map not centering on user location
- Ensure location permissions granted
- On emulator, set location via Android Studio > Extended controls

---

Last updated: April 2026
