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
      
      // Each word should be from BIP-39 wordlist (lowercase, alphabetic)
      words.forEach(word => {
        expect(word).toMatch(/^[a-z]+$/);
        expect(word.length).toBeGreaterThanOrEqual(3);
        expect(word.length).toBeLessThanOrEqual(8);
      });
      
      // Generated mnemonics should be unique (entropy test)
      const mnemonic2 = bip39.generateMnemonic(128);
      expect(mnemonic2).not.toBe(mnemonic);
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

      // Address should have valid format
      expect(address).toBeDefined();
      expect(address.length).toBeGreaterThan(25);
      expect(address.length).toBeLessThan(36);
      expect(address).toMatch(/^1[1-9A-HJ-NP-Za-km-z]+$/);
      
      // Known expected address for this test mnemonic (deterministic)
      // This validates that derivation path is Kondor-compatible
      expect(address).toBe('1DFF1akeStY8SfomzFsSYsZPesQcbnF1vR');

      // Derive again - should be identical (deterministic)
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
      
      // Known expected addresses for test mnemonic (deterministic)
      expect(addresses[0]).toBe('1DFF1akeStY8SfomzFsSYsZPesQcbnF1vR');
      expect(addresses[1]).toBe('15n9ZbL3xmLBCUFtVQUzXKox5WhFnyAba3');
      expect(addresses[2]).toBe('16ADbKNuSCcDaapTdgAjTVpD8SjoQFTeEU');
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
      
      // WIF should be 51-52 characters (base58 encoded)
      expect(wif.length).toBeGreaterThanOrEqual(51);
      expect(wif.length).toBeLessThanOrEqual(52);

      // Import from WIF - should get same address (round-trip)
      const importedSigner = Signer.fromWif(wif);
      expect(importedSigner.getAddress()).toBe(signer.getAddress());
      
      // Private key should also match
      expect(importedSigner.getPrivateKey('wif')).toBe(wif);
    });

    it('generates valid ECDSA signatures', async () => {
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
      
      // ECDSA signature should be exactly 65 bytes (r: 32, s: 32, v: 1)
      expect(signature.length).toBe(65);
      
      // Signature should be a Uint8Array
      expect(signature).toBeInstanceOf(Uint8Array);
      
      // Different messages should produce different signatures
      const signature2 = await signer.signMessage('Different message');
      expect(signature2).not.toEqual(signature);
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
