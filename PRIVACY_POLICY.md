# Privacy Policy — Koinos Wallet

**Last updated: February 8, 2026**

## Overview

Koinos Wallet ("the App") is a self-custody cryptocurrency wallet for the Koinos blockchain. Your privacy is important to us. This policy explains what data the App collects, stores, and transmits.

## Data We Do NOT Collect

- We do **not** collect personal information (name, email, phone number)
- We do **not** track your location
- We do **not** use analytics or tracking services
- We do **not** share any data with third parties
- We do **not** have user accounts or servers

## Data Stored Locally on Your Device

The following data is stored **only on your device** using iOS Keychain (encrypted storage):

| Data | Purpose | Storage |
|------|---------|---------|
| Private key | Sign blockchain transactions | iOS Keychain (encrypted) |
| Wallet address | Display your account | iOS Keychain (encrypted) |
| PIN code (if enabled) | App lock protection | iOS Keychain (encrypted) |
| App lock preference | Remember lock setting | iOS Keychain (encrypted) |
| RPC endpoint URL | Connect to blockchain | AsyncStorage (local) |

**We never have access to your private keys or wallet data.** All sensitive data is stored exclusively on your device and never transmitted to any server.

## Network Communications

The App communicates with:

- **Koinos blockchain RPC nodes** — to fetch balances, submit transactions, and query blockchain state. Only your public wallet address is sent in these requests.
- **Free Mana Sharer contract** — a public smart contract on the Koinos blockchain that may pay transaction fees on your behalf.

No personal data is included in these network requests. Only public blockchain data (addresses, balances, transaction data) is transmitted.

## Biometric Data (Face ID / Touch ID)

If you enable biometric app lock:

- The App uses Apple's LocalAuthentication framework to verify your identity
- **Biometric data never leaves your device** and is handled entirely by iOS
- The App only receives a success/failure result — it never accesses biometric data directly

## Camera Access

The App requests camera access solely to **scan QR codes** containing Koinos wallet addresses. No images or video are stored or transmitted.

## Encryption

The App uses standard cryptographic libraries for:

- **Transaction signing** (ECDSA secp256k1) — to authorize blockchain transactions
- **Key derivation** (BIP-39/BIP-32) — to generate wallet keys from a recovery phrase
- **Secure storage** (iOS Keychain) — to protect private keys at rest

All encryption uses industry-standard algorithms and Apple's built-in security APIs. No proprietary encryption is used.

## Third-Party Services

The App does **not** integrate any third-party services, SDKs, or analytics platforms.

## Children's Privacy

The App is not directed at children under 13 and does not knowingly collect data from children.

## Data Deletion

Since all data is stored locally on your device, you can delete all App data by:

1. Deleting the wallet within the App (Settings → Delete Wallet)
2. Uninstalling the App (removes all Keychain and local data)

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted on this page with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository:

**GitHub**: [https://github.com/pgarciagon/koinos-wallet](https://github.com/pgarciagon/koinos-wallet)

---

© 2026 Koinos Wallet. Open-source software.
