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
- Xcode (for iOS Simulator)
- Expo CLI (uses local `npx expo`)

## Setup
```bash
cd koinos-wallet
npm install
```

## Run (iOS Simulator)
```bash
npx expo start --ios
```

## Run (Expo Go)
```bash
npx expo start
```
Then scan the QR code with the Expo Go app on your device.

## Troubleshooting
- If the simulator shows “No script URL provided”, ensure the Metro bundler is running in this folder and press `i` in the Expo terminal to open the iOS simulator, then `r` to reload.
- If you see Expo SDK compatibility warnings, align versions with:
```bash
npx expo install react-native-get-random-values@~1.11.0 react-native-screens@~4.16.0 react-native-svg@15.12.1
```
