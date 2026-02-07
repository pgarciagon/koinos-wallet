import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Signer } from 'koilib';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';

const WALLET_KEY = 'koinos_wallet';
const WALLET_ADDRESS_KEY = 'koinos_address';

// Storage abstraction for web/native compatibility
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export interface WalletInfo {
  address: string;
  hasWallet: boolean;
}

export class WalletService {
  private signer: Signer | null = null;
  private address: string | null = null;

  // Generate new wallet with BIP-39 mnemonic
  async generateWallet(): Promise<{ mnemonic: string; address: string }> {
    // Generate 12-word mnemonic
    const mnemonic = bip39.generateMnemonic(128);
    const address = await this.importFromMnemonic(mnemonic);
    return { mnemonic, address };
  }

  // Import wallet from BIP-39 mnemonic (Kondor-compatible derivation)
  async importFromMnemonic(mnemonic: string, accountIndex: number = 0): Promise<string> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Kondor derivation path: m/44'/659'/{accountIndex}'/0/0
    // Coin type 659 is for Koinos
    const derivationPath = `m/44'/659'/${accountIndex}'/0/0`;

    // Use ethers HDNode (same as Kondor wallet)
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    const derived = hdNode.derivePath(derivationPath);

    // Create signer from the derived private key (remove '0x' prefix)
    // compressed: true is important for correct address derivation
    this.signer = new Signer({
      privateKey: derived.privateKey.slice(2),
      compressed: true,
    });

    this.address = this.signer.getAddress();

    // Store mnemonic
    await storage.setItem(WALLET_KEY, mnemonic);
    await storage.setItem(WALLET_ADDRESS_KEY, this.address);

    console.log('Wallet created:', {
      derivationPath,
      address: this.address,
    });

    return this.address;
  }

  // Import wallet from WIF private key
  async importFromWIF(wif: string): Promise<string> {
    try {
      this.signer = Signer.fromWif(wif);
      this.address = this.signer.getAddress();

      // Store the WIF (prefixed to distinguish from mnemonic)
      await storage.setItem(WALLET_KEY, `wif:${wif}`);
      await storage.setItem(WALLET_ADDRESS_KEY, this.address);

      return this.address;
    } catch (error) {
      throw new Error('Invalid WIF private key');
    }
  }

  // Load wallet from secure storage
  async loadWallet(): Promise<WalletInfo> {
    // Return cached wallet if already loaded
    if (this.signer && this.address) {
      return { address: this.address, hasWallet: true };
    }

    try {
      const stored = await storage.getItem(WALLET_KEY);
      const address = await storage.getItem(WALLET_ADDRESS_KEY);

      if (!stored || !address) {
        return { address: '', hasWallet: false };
      }

      // Check if it's a WIF or mnemonic
      if (stored.startsWith('wif:')) {
        const wif = stored.substring(4);
        this.signer = Signer.fromWif(wif);
      } else {
        // It's a mnemonic, derive the key using Kondor path
        const derivationPath = `m/44'/659'/0'/0/0`;
        const hdNode = ethers.utils.HDNode.fromMnemonic(stored);
        const derived = hdNode.derivePath(derivationPath);

        this.signer = new Signer({
          privateKey: derived.privateKey.slice(2),
          compressed: true,
        });
      }

      this.address = this.signer.getAddress();

      // Verify the address matches
      if (this.address !== address) {
        console.warn('Address mismatch, updating stored address');
        await storage.setItem(WALLET_ADDRESS_KEY, this.address);
      }

      console.log('Wallet loaded:', this.address);
      return { address: this.address, hasWallet: true };
    } catch (error) {
      console.error('Error loading wallet:', error);
      return { address: '', hasWallet: false };
    }
  }

  // Get the signer for transactions
  getSigner(): Signer | null {
    return this.signer;
  }

  // Get current address
  getAddress(): string | null {
    return this.address;
  }

  // Delete wallet
  async deleteWallet(): Promise<void> {
    await storage.deleteItem(WALLET_KEY);
    await storage.deleteItem(WALLET_ADDRESS_KEY);
    this.signer = null;
    this.address = null;
  }

  // Check if wallet exists
  async hasWallet(): Promise<boolean> {
    const stored = await storage.getItem(WALLET_KEY);
    return !!stored;
  }

  // Get the seed phrase (mnemonic) if available
  // Returns null if wallet was imported via WIF (no mnemonic available)
  async getSeedPhrase(): Promise<string | null> {
    const stored = await storage.getItem(WALLET_KEY);

    if (!stored) {
      return null;
    }

    // If it starts with 'wif:', it's a WIF import - no seed phrase available
    if (stored.startsWith('wif:')) {
      return null;
    }

    // It's a mnemonic
    return stored;
  }

  // Get the private key in WIF format
  getPrivateKey(): string | null {
    if (!this.signer) {
      return null;
    }
    return this.signer.getPrivateKey('wif');
  }

  // Check if the wallet has a seed phrase (vs WIF import)
  async hasSeedPhrase(): Promise<boolean> {
    const stored = await storage.getItem(WALLET_KEY);
    return !!stored && !stored.startsWith('wif:');
  }
}

export default new WalletService();
