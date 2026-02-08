export const APP_VERSION = '1.0.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2025-06-01',
    changes: [
      'Create and restore wallets with BIP-39 seed phrases',
      'Send and receive KOIN and VHP tokens',
      'Free mana support for gas-free transactions',
      'QR code generation for receiving tokens',
      'Real-time mana meter with regeneration tracking',
      'Configurable RPC endpoint',
      'Secure key storage with device Keychain',
    ],
  },
];
