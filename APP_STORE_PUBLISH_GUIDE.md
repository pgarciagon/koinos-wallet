# Publishing Koinos Wallet to the Apple App Store

## Current Project Status

| Item | Status |
|------|--------|
| Bundle ID | `com.koinos.wallet` |
| Version | `1.0.0` |
| EAS Project ID | `fb7c5687-a41e-4163-aa38-c6c6c88e4ef1` |
| App Icon (1024×1024) | ✅ `assets/icon.png` |
| Splash Screen | ✅ `assets/koinos-logo-white.png` |
| NSFaceIDUsageDescription | ✅ Configured |
| NSCameraUsageDescription | ✅ Configured |
| ITSAppUsesNonExemptEncryption | ✅ Set to `false` |
| Apple Developer Account | ✅ Team `W44ZWJHNYW` |
| EAS config | ✅ `eas.json` with production profile |

---

## Phase 1: Prepare the App

### 1.1 Review app.json Configuration

Your current `app.json`:

```json
{
  "expo": {
    "name": "Koinos Wallet",
    "slug": "koinos-wallet",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/koinos-logo-white.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.koinos.wallet",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a2e"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.koinos.wallet"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "fb7c5687-a41e-4163-aa38-c6c6c88e4ef1"
      }
    }
  }
}
```

**Changes needed before publishing** — add `buildNumber` and privacy descriptions to the `ios` section:

```diff
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.koinos.wallet",
+   "buildNumber": "1",
    "infoPlist": {
-     "ITSAppUsesNonExemptEncryption": false
+     "ITSAppUsesNonExemptEncryption": false,
+     "NSFaceIDUsageDescription": "Use Face ID to unlock the app",
+     "NSCameraUsageDescription": "Scan QR codes for wallet addresses"
    }
  },
```

> **Important**: `version` is what users see (e.g., "1.0.0"). `buildNumber` is internal and must be incremented for every upload to App Store Connect (e.g., "1", "2", "3"). After changing `app.json`, run `npx expo prebuild --platform ios --clean` to regenerate the native project.

### 1.2 Add Privacy Usage Descriptions

Apple rejects apps that don't explain why they use sensitive features. Verify these are in `app.json` → `ios.infoPlist`:

| Key | Required For | Example Value |
|-----|-------------|---------------|
| `NSFaceIDUsageDescription` | Face ID / biometrics | "Use Face ID to unlock the app" |
| `NSCameraUsageDescription` | QR code scanner | "Scan QR codes for wallet addresses" |

### 1.3 Verify App Icon

- Must be **1024×1024 PNG** with **no transparency** and **no alpha channel**
- Current icon: `assets/icon.png` (1024×1024 ✅)
- To remove alpha channel if needed:
  ```bash
  sips -s format png --setProperty formatOptions 100 assets/icon.png --out assets/icon-no-alpha.png
  ```

### 1.4 Clean Up Debug Code

- Remove any `console.log` statements (or use `__DEV__` guards)
- Remove any hardcoded test data
- Ensure no API keys or secrets are exposed in the JS bundle
- Remove any dev-only screens or buttons

---

## Phase 2: App Store Connect Setup

### 2.1 Register Bundle ID

1. Go to [Apple Developer Portal → Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click **+** to register a new identifier
3. Select **App IDs** → **App**
4. Enter:
   - Description: `Koinos Wallet`
   - Bundle ID: `com.koinos.wallet` (Explicit)
5. Enable capabilities:
   - ☑ Access WiFi Information (if needed)
   - ☑ Associated Domains (if using deep links)
6. Click **Register**

> If `com.koinos.wallet` is already taken, you'll need to change it in `app.json` and re-run `npx expo prebuild`.

### 2.2 Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Koinos Wallet
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.koinos.wallet (select from dropdown)
   - **SKU**: `koinos-wallet-ios` (unique internal reference)
   - **User Access**: Full Access
4. Click **Create**

### 2.3 Fill in App Information

In App Store Connect, navigate to your app and fill in:

#### General → App Information
- **Category**: Finance
- **Secondary Category**: Utilities (optional)
- **Content Rights**: "This app does not contain third-party content"
- **Age Rating**: Fill the questionnaire (likely 4+ for a wallet app)

#### Pricing and Availability
- **Price**: Free
- **Availability**: All territories (or select specific countries)

#### App Privacy
Apple requires a privacy nutrition label. For Koinos Wallet:

- **Data Linked to You**:
  - None (wallet data stays on device)
- **Data Not Linked to You**:
  - Usage Data (analytics, if any)
- **Data Used to Track You**:
  - None

Go to **App Privacy** → **Get Started** and answer the questions. Key points:
- We store wallet keys locally (SecureStore)
- We connect to blockchain RPC nodes (network usage)
- We don't collect analytics (unless you add it)
- We don't share data with third parties

---

## Phase 3: Prepare Store Listing

### 3.1 Screenshots

You need screenshots for these device sizes (at minimum):

| Device Size | Resolution | Required? |
|-------------|-----------|-----------|
| iPhone 6.7" (15 Pro Max) | 1290 × 2796 | ✅ Yes |
| iPhone 6.5" (11 Pro Max) | 1242 × 2688 | ✅ Yes |
| iPhone 5.5" (8 Plus) | 1242 × 2208 | ✅ Yes |
| iPad Pro 12.9" (6th gen) | 2048 × 2732 | Only if `supportsTablet: true` |

**How to capture screenshots:**

Option A — Simulator:
```bash
# Open simulator for each device size
npx expo run:ios --device "iPhone 16 Pro Max"
# Then: Cmd+S in simulator to save screenshot
```

Option B — Use the screenshot you already have:
- `assets/Simulator Screenshot - iPhone 17 Pro - 2026-02-03 at 22.17.06.png`

You need **at least 1** and up to **10 screenshots per size**. Recommended screens to capture:
1. Main wallet screen (balance + tokens)
2. Send transaction screen
3. QR code scanner
4. Settings / security features
5. Mana / battery widget

### 3.2 App Description

Write these in App Store Connect:

**Promotional Text** (170 chars, can be updated without review):
```
The secure, open-source wallet for the Koinos blockchain. Send, receive, and manage your KOIN and tokens with ease.
```

**Description** (4000 chars max):
```
Koinos Wallet is a secure, self-custody mobile wallet for the Koinos blockchain.

KEY FEATURES:
• Send and receive KOIN and KRC-20 tokens
• QR code scanning for easy address input
• Free transactions using Koinos' Mana system
• Real-time balance and token management
• Secure key storage with device encryption
• Face ID / Touch ID app lock
• Export private keys and seed phrases
• Multiple RPC endpoint support
• Clean, intuitive dark interface

SECURITY:
Your private keys never leave your device. All sensitive data is stored using iOS Keychain via SecureStore. Optional Face ID / PIN lock adds an extra layer of protection.

ABOUT KOINOS:
Koinos is a fee-less, infinitely upgradeable blockchain. Instead of paying gas fees, users spend "Mana" which regenerates over time — making transactions free for everyday users.

This app is open-source and community-driven.
```

**Keywords** (100 chars, comma-separated):
```
koinos,wallet,crypto,blockchain,koin,mana,defi,token,send,receive
```

**Support URL**: Your GitHub repo or website
**Marketing URL**: Optional

### 3.3 App Review Information

- **Contact Info**: Your name, phone, email
- **Notes for Review**: 
  ```
  This is a cryptocurrency wallet app. To test:
  1. Create a new wallet on first launch
  2. The app shows KOIN balance and tokens
  3. You can view receive address and QR code
  4. Settings allow configuring RPC endpoint and app lock
  
  No real funds are needed for review. The app connects to the 
  Koinos mainnet blockchain to display balances.
  ```

---

## Phase 4: Build & Upload

### Option A: Using EAS (Recommended — handles signing automatically)

#### 4A.1 Install EAS CLI
```bash
npm install -g eas-cli
```

#### 4A.2 Login to Expo
```bash
eas login
```

#### 4A.3 Build for Production
```bash
cd /Users/pgarcgo/code/speto/koinos-wallet
eas build --platform ios --profile production
```

EAS will:
- Ask to create/select distribution certificates and provisioning profiles
- Build the app in the cloud
- Produce a signed `.ipa` file
- Give you a download link

#### 4A.4 Submit to App Store
```bash
eas submit --platform ios --latest
```

This uploads the latest build directly to App Store Connect.

### Option B: Using Xcode (Manual)

#### 4B.1 Open in Xcode
```bash
open /Users/pgarcgo/code/speto/koinos-wallet/ios/KoinosWallet.xcworkspace
```

#### 4B.2 Configure Signing
1. Select the **KoinosWallet** target
2. Go to **Signing & Capabilities**
3. Check **Automatically manage signing**
4. Select your team: `W44ZWJHNYW`
5. Ensure bundle ID is `com.koinos.wallet`

#### 4B.3 Create Archive
1. Select **Any iOS Device (arm64)** as the build destination (NOT your specific device)
2. Menu: **Product → Archive**
3. Wait for the build to complete (5-10 minutes)

#### 4B.4 Upload to App Store Connect
1. When the archive finishes, the **Organizer** window opens
2. Select your archive
3. Click **Distribute App**
4. Select **App Store Connect** → **Upload**
5. Keep defaults (include symbols, manage signing automatically)
6. Click **Upload**
7. Wait for upload to complete

---

## Phase 5: Submit for Review

### 5.1 Select Build in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → Your App
2. Under **iOS App** section, click **+** next to Build
3. Select the build you just uploaded (it may take 15-30 minutes to process)
4. Save

### 5.2 Final Checklist

Before clicking "Submit for Review":

- [ ] App name and subtitle filled in
- [ ] Description, keywords, promotional text complete
- [ ] Screenshots uploaded for all required sizes
- [ ] App icon displaying correctly
- [ ] Category set (Finance)
- [ ] Price set (Free)
- [ ] Privacy policy URL provided
- [ ] App privacy questionnaire completed
- [ ] Support URL provided
- [ ] Contact information for review team
- [ ] Review notes with testing instructions
- [ ] Build selected and processed
- [ ] Age rating questionnaire completed
- [ ] Content rights declaration done

### 5.3 Submit

1. Click **Submit for Review**
2. Answer any final questions (export compliance, advertising identifier)
3. Confirm submission

### 5.4 Wait for Review

- **Typical review time**: 24-48 hours
- **Status flow**: Waiting for Review → In Review → Ready for Distribution (or Rejected)
- You'll receive an email when the status changes

---

## Common Rejection Reasons (and how to avoid them)

| Reason | Solution |
|--------|----------|
| **Crash on launch** | Test thoroughly on a real device in Release mode |
| **Missing privacy policy** | Add a URL to a privacy policy page |
| **Incomplete metadata** | Fill in ALL fields in App Store Connect |
| **Broken links** | Verify support URL and privacy policy URL work |
| **Guideline 3.1.1 — In-App Purchase** | If you sell tokens in-app, Apple requires IAP (30% cut). Koinos Wallet just manages existing tokens, so this shouldn't apply |
| **Guideline 5.2.1 — Legal** | Crypto apps must comply with local regulations. You may need to declare which countries you operate in |
| **Missing usage descriptions** | Already handled (Face ID + Camera descriptions set) |

---

## Quick Command Reference

```bash
# Prebuild iOS project (after changing app.json)
npx expo prebuild --platform ios --clean

# Build and install on device (development)
npx expo run:ios --device 00008150-001545E00C04401C

# Build and install on device (production/release)
npx expo run:ios --device 00008150-001545E00C04401C --configuration Release

# Build for App Store via EAS
eas build --platform ios --profile production

# Submit to App Store via EAS  
eas submit --platform ios --latest

# Open in Xcode for manual archive
open ios/KoinosWallet.xcworkspace
```

---

## Post-Launch

After approval:
1. **Monitor Crashes**: Use Xcode Organizer → Crashes, or add a crash reporting service
2. **Respond to Reviews**: In App Store Connect → Ratings and Reviews
3. **Update the App**: Increment `version` and `buildNumber` in `app.json`, then repeat Phase 4-5
4. **OTA Updates**: For JS-only changes, consider `eas update` to push updates without going through review

---

*Last updated: February 8, 2026*
