/**
 * Integration Tests for Wallet Service
 * 
 * These tests verify real cryptographic operations:
 * - BIP-39 mnemonic generation/validation
 * - HD wallet derivation (Kondor-compatible)
 * - Address generation
 * 
 * No network calls, but uses real crypto libraries.
 * 
 * Run with: npm run test:integration
 */

import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { Signer } from 'koilib';

describe('Wallet Integration Tests', () => {
  describe('BIP-39 Mnemonic Generation', () => {
    it('generates valid 12-word mnemonic', () => {
      const mnemonic = bip39.generateMnemonic(128); // 128 bits = 12 words
      const words = mnemonic.split(' ');

      expect(words.length).toBe(12);
      expect(bip39.validateMnemonic(mnemonic)).toBe(true);
      console.log('Generated 12-word mnemonic (first 3 words):', words.slice(0, 3).join(' '), '...');
    });

    it('generates valid 24-word mnemonic', () => {
      const mnemonic = bip39.generateMnemonic(256); // 256 bits = 24 words
      const words = mnemonic.split(' ');

      expect(words.length).toBe(24);
      expect(bip39.validateMnemonic(mnemonic)).toBe(true);
    });

    it('validates known good mnemonic', () => {
      // Standard BIP-39 test vector
      const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(bip39.validateMnemonic(testMnemonic)).toBe(true);
    });

    it('rejects invalid mnemonic', () => {
      expect(bip39.validateMnemonic('invalid words here')).toBe(false);
      expect(bip39.validateMnemonic('abandon abandon abandon')).toBe(false); // Too short
    });
  });

  describe('HD Wallet Derivation (Kondor-compatible)', () => {
    // Known test mnemonic - DO NOT USE IN PRODUCTION
    const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('derives consistent address from mnemonic', () => {
      const derivationPath = "m/44'/659'/0'/0/0"; // Koinos coin type 659

      const hdNode = ethers.utils.HDNode.fromMnemonic(TEST_MNEMONIC);
      const derived = hdNode.derivePath(derivationPath);

      // Create Koinos signer from derived key
      const signer = new Signer({
        privateKey: derived.privateKey.slice(2), // Remove 0x prefix
        compressed: true,
      });

      const address = signer.getAddress();

      expect(address).toBeDefined();
      expect(address.length).toBeGreaterThan(25);
      expect(address.length).toBeLessThan(36);
      console.log('Derived Koinos address:', address);

      // Derive again - should be identical
      const hdNode2 = ethers.utils.HDNode.fromMnemonic(TEST_MNEMONIC);
      const derived2 = hdNode2.derivePath(derivationPath);
      const signer2 = new Signer({
        privateKey: derived2.privateKey.slice(2),
        compressed: true,
      });

      expect(signer2.getAddress()).toBe(address);
    });

    it('derives different addresses for different account indices', () => {
      const hdNode = ethers.utils.HDNode.fromMnemonic(TEST_MNEMONIC);

      const addresses: string[] = [];
      for (let i = 0; i < 3; i++) {
        const derived = hdNode.derivePath(`m/44'/659'/${i}'/0/0`);
        const signer = new Signer({
          privateKey: derived.privateKey.slice(2),
          compressed: true,
        });
        addresses.push(signer.getAddress());
      }

      // All addresses should be unique
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(3);
      console.log('Account 0:', addresses[0]);
      console.log('Account 1:', addresses[1]);
      console.log('Account 2:', addresses[2]);
    });
  });

  describe('Signer Operations', () => {
    it('creates signer from WIF private key', () => {
      // Generate a test WIF key
      const testMnemonic = bip39.generateMnemonic(128);
      const hdNode = ethers.utils.HDNode.fromMnemonic(testMnemonic);
      const derived = hdNode.derivePath("m/44'/659'/0'/0/0");

      const signer = new Signer({
        privateKey: derived.privateKey.slice(2),
        compressed: true,
      });

      // Get WIF from signer
      const wif = signer.getPrivateKey('wif');
      expect(wif).toBeDefined();
      expect(wif.startsWith('5') || wif.startsWith('K') || wif.startsWith('L')).toBe(true);

      // Import from WIF - should get same address
      const importedSigner = Signer.fromWif(wif);
      expect(importedSigner.getAddress()).toBe(signer.getAddress());

      console.log('WIF round-trip test passed');
    });

    it('generates valid signatures', async () => {
      const testMnemonic = bip39.generateMnemonic(128);
      const hdNode = ethers.utils.HDNode.fromMnemonic(testMnemonic);
      const derived = hdNode.derivePath("m/44'/659'/0'/0/0");

      const signer = new Signer({
        privateKey: derived.privateKey.slice(2),
        compressed: true,
      });

      // Sign a test message
      const message = 'Hello, Koinos!';
      const signature = await signer.signMessage(message);

      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);
      console.log('Message signature length:', signature.length);
    });
  });

  describe('Address Format Validation', () => {
    it('generates base58 encoded addresses', () => {
      const testMnemonic = bip39.generateMnemonic(128);
      const hdNode = ethers.utils.HDNode.fromMnemonic(testMnemonic);
      const derived = hdNode.derivePath("m/44'/659'/0'/0/0");

      const signer = new Signer({
        privateKey: derived.privateKey.slice(2),
        compressed: true,
      });

      const address = signer.getAddress();

      // Koinos addresses are base58 encoded
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      expect(base58Regex.test(address)).toBe(true);

      // Typically start with '1'
      expect(address.startsWith('1')).toBe(true);
    });
  });
});
