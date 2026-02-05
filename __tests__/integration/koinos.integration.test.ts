/**
 * Integration Tests for Koinos Services
 * 
 * These tests make REAL network calls to the Koinos blockchain.
 * They verify that the service correctly interacts with the actual RPC.
 * 
 * Requirements:
 * - Network access to api.koinos.io
 * - Tests are slower than unit tests
 * - Read-only operations only (no transactions)
 * 
 * Run with: npm run test:integration
 */

import { KoinosService } from '../../src/services/koinos';

// Known mainnet addresses for testing
const KOIN_CONTRACT = '15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL';  // KOIN token contract
const BURN_ADDRESS = '1BurnKoinAddressXXXXXXXXXXXXXZ1Yxr';   // Known burn address
const GENESIS_ADDRESS = '1NsQbH5AhQXgtSNg1ejpFqTi2hmCWz1eQS'; // Genesis/foundation

describe('KoinosService Integration Tests', () => {
  let service: KoinosService;

  beforeAll(() => {
    // Use real service with mainnet RPC
    service = new KoinosService('https://api.koinos.io');
  });

  describe('RPC Connection', () => {
    it('connects to mainnet RPC and gets chain info', async () => {
      const info = await service.getChainInfo();

      expect(info).toBeDefined();
      expect(info.head_topology).toBeDefined();
      expect(parseInt(info.head_topology.height)).toBeGreaterThan(0);
      console.log(`Connected to Koinos mainnet at block ${info.head_topology.height}`);
    }, 15000); // 15 second timeout for network
  });

  describe('Balance Queries', () => {
    it('fetches balance for a known address', async () => {
      const balance = await service.getBalance(GENESIS_ADDRESS);

      // Balance should be a valid number string
      expect(balance).toBeDefined();
      expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
      console.log(`Genesis address balance: ${balance} KOIN`);
    }, 15000);

    it('returns 0 for address with no balance', async () => {
      // Use a valid but likely empty address
      const emptyAddress = '1EmptyAddressXXXXXXXXXXXXXXXYd2fCP';
      const balance = await service.getBalance(emptyAddress);

      expect(balance).toBe('0');
    }, 15000);
  });

  describe('Mana Queries', () => {
    it('fetches mana for a known address', async () => {
      const mana = await service.getMana(GENESIS_ADDRESS);

      expect(mana).toBeDefined();
      expect(mana.current).toBeDefined();
      expect(mana.max).toBeDefined();
      console.log(`Genesis address mana: ${mana.current} / ${mana.max}`);
    }, 15000);
  });

  describe('Nonce Queries', () => {
    it('fetches nonce for an active address', async () => {
      const nonce = await service.getNonce(GENESIS_ADDRESS);

      expect(nonce).toBeDefined();
      // Nonce should be a number string
      expect(parseInt(nonce)).toBeGreaterThanOrEqual(0);
      console.log(`Genesis address nonce: ${nonce}`);
    }, 15000);
  });

  describe('Address Validation', () => {
    it('validates real Koinos addresses', () => {
      // Valid mainnet addresses
      expect(KoinosService.isValidAddress(KOIN_CONTRACT)).toBe(true);
      expect(KoinosService.isValidAddress(GENESIS_ADDRESS)).toBe(true);
      expect(KoinosService.isValidAddress('19GYjDBVXU7keLbYvMLazsGQn3GTWHjHkK')).toBe(true);
    });

    it('rejects invalid addresses', () => {
      expect(KoinosService.isValidAddress('')).toBe(false);
      expect(KoinosService.isValidAddress('not-an-address')).toBe(false);
      expect(KoinosService.isValidAddress('0x1234567890abcdef')).toBe(false); // ETH format
    });
  });

  describe('RPC URL Management', () => {
    it('can get and set RPC URL', async () => {
      // Get current URL
      const originalUrl = await service.getRpcUrl();
      expect(originalUrl).toBeDefined();
      expect(originalUrl).toBe('https://api.koinos.io');

      // Set a new URL
      await service.setRpcUrl('https://custom.rpc.io');
      const newUrl = await service.getRpcUrl();
      expect(newUrl).toBe('https://custom.rpc.io');

      // Restore mainnet
      await service.setRpcUrl('https://api.koinos.io');
    }, 10000);
  });
});
