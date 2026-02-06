# Koinos Wallet (Expo)

A simple Koinos blockchain wallet built with Expo and React Native. It supports creating/importing wallets, viewing balance/mana, sending KOIN, and receiving via address copy (QR receive is planned).

## Main Screen Overview
The main screen presents a quick summary of your wallet status and key actions:

- **Header and branding**: Displays the Koinos Wallet title with the app logo.
- **Address card**: Shows your wallet address in a shortened format with a “Tap to copy” affordance.
- **Balance card**: Prominently displays your KOIN balance with token label.
- **Mana (Resource Credits)**: Visual progress bar and numeric display for current/max mana.
- **Primary actions**: Large buttons for **Send KOIN** and **Receive**.
- **Security actions**: Quick access to **View Seed Phrase** and **Delete Wallet**.

### Screenshot
<p align="center">
	<img src="assets/main_screen.png" alt="Koinos Wallet main screen" />
</p>

## Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ (or yarn/pnpm)
- Xcode (for iOS Simulator and device builds)
- Expo CLI (uses local `npx expo`)
- Apple Developer account (free or paid, for device testing)

## Setup
```bash
cd koinos-wallet
npm install
```

## Run (iOS Simulator)
```bash
# Quick start script
./start-ios.sh

# Or manually
npx expo start --ios
```

## Run (Expo Go on Device)
```bash
npx expo start
```
Then scan the QR code with the Expo Go app on your device.

## Install on Physical iPhone (Development Build)

To run the app directly on your iPhone without the App Store:

### Option 1: Using Expo Go (Easiest)
1. Install **Expo Go** from the App Store on your iPhone
2. Run `npx expo start` on your Mac
3. Scan the QR code with your iPhone camera
4. The app opens in Expo Go

### Option 2: Native Build on Physical iPhone (Recommended)

This compiles the app natively with Xcode and installs it directly on your iPhone — no Expo Go required. You get full native module support and a standalone app icon on your home screen.

#### Prerequisites
1. **Apple Developer Account** — a free account works for personal testing (apps expire after 7 days)
2. **Xcode** installed with Command Line Tools (`xcode-select --install`)
3. **CocoaPods** installed (`sudo gem install cocoapods` or `brew install cocoapods`)
4. **iPhone connected via USB** and trusted ("Trust This Computer?" prompt)

#### Step 1: Generate the native iOS project

This creates the `ios/` directory with the Xcode project and installs CocoaPods dependencies:

```bash
npx expo prebuild --platform ios --clean
```

> **Note:** Run with `--clean` to regenerate from scratch. This is safe — the `ios/` folder is derived from your Expo config and can always be regenerated.

#### Step 2: Build and install on your iPhone

```bash
npx expo run:ios --device
```

This will:
- Detect your connected iPhone
- Auto-sign the app with your Apple Developer certificate
- Compile all native code (Hermes engine, React Native, native modules)
- Install the `.app` bundle on your device via `devicectl`
- Launch the app

**First build takes 3–5 minutes.** Subsequent builds are incremental and much faster.

> **Tip:** If the device name contains special characters (apostrophes, parentheses), pass the device ID directly:
> ```bash
> # List connected devices
> xcrun devicectl list devices
> # Build with device ID
> npx expo run:ios --device <DEVICE_ID>
> ```

#### Step 3: Trust the developer profile (first time only)

With a free Apple Developer account, iOS requires you to manually trust the signing certificate:

1. On your iPhone, go to **Settings → General → VPN & Device Management**
2. Under "Developer App", find your Apple ID / team name
3. Tap **Trust**
4. Open the app from your home screen

#### Step 4: Connect to the Metro dev server

After the app launches, it needs to connect to Metro for the JavaScript bundle:

1. Start Metro on your Mac:
   ```bash
   npx expo start --dev-client
   ```
2. The app should auto-discover the server on your local network
3. If it shows "No development servers found", enter the URL manually:
   ```
   http://<YOUR_MAC_IP>:8081
   ```
   Find your Mac's IP with: `ipconfig getifaddr en0`

#### Troubleshooting Native Builds

| Problem | Solution |
|---------|----------|
| `Sandbox: bash deny file-write-create` | In `ios/KoinosWallet.xcodeproj/project.pbxproj`, set `ENABLE_USER_SCRIPT_SANDBOXING = NO` (2 occurrences), then clean DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/KoinosWallet-*` |
| `No space left on device` | Free disk space: `rm -rf ~/Library/Developer/Xcode/DerivedData/*` and `rm -rf ~/Library/Developer/CoreSimulator/Caches/*` |
| Code signing errors | Open `ios/KoinosWallet.xcworkspace` in Xcode → Select KoinosWallet target → Signing & Capabilities → Select your team |
| Device name regex error | Use the device ID instead of letting Expo auto-detect (see Step 2 tip above) |
| `profile has not been explicitly trusted` | Follow Step 3 to trust the developer profile on your iPhone |

#### Production Build (No Dev Server)

To create a self-contained build with the JS bundle embedded (no Metro needed):

```bash
npx expo run:ios --device --configuration Release
```

### Option 3: Ad-Hoc Distribution (Share with Testers)

1. **Register test devices** in Apple Developer portal (UDID required)
2. **Build with ad-hoc profile**:
```bash
eas build --profile preview --platform ios
```
3. Share the resulting `.ipa` file or install link with testers

### Debugging on Device
```bash
# View device logs
npx react-native log-ios

# Or use Xcode
# Open ios/*.xcworkspace, select your device, and run
```

## Testing

### Unit Tests (Mocked)
```bash
npm test
```

### Integration Tests (Real Blockchain)
```bash
npm run test:integration
```

## Troubleshooting
- If the simulator shows “No script URL provided”, ensure the Metro bundler is running in this folder and press `i` in the Expo terminal to open the iOS simulator, then `r` to reload.
- If you see Expo SDK compatibility warnings, align versions with:
```bash
npx expo install react-native-get-random-values@~1.11.0 react-native-screens@~4.16.0 react-native-svg@15.12.1
```
