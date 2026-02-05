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
      
      // Block height should be a large number (mainnet has millions of blocks)
      const height = parseInt(info.head_topology.height);
      expect(height).toBeGreaterThan(30000000); // Mainnet is past 30M blocks
      
      // Block ID should be a valid hash
      expect(info.head_topology.id).toBeDefined();
      expect(info.head_topology.id.length).toBeGreaterThan(40);
    }, 15000); // 15 second timeout for network
  });

  describe('Balance Queries', () => {
    it('fetches balance for a known address with funds', async () => {
      const balance = await service.getBalance(GENESIS_ADDRESS);

      // Balance should be a valid decimal number string
      expect(balance).toBeDefined();
      expect(balance).toMatch(/^\d+\.\d+$/);
      
      // Genesis address should have some balance (known to have ~10 KOIN)
      const balanceNum = parseFloat(balance);
      expect(balanceNum).toBeGreaterThan(0);
      expect(balanceNum).toBeLessThan(1000000); // Sanity check - not absurdly high
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
      
      // Mana should be valid decimal numbers
      expect(mana.current).toMatch(/^\d+\.\d+$/);
      expect(mana.max).toMatch(/^\d+\.\d+$/);
      
      // Current mana should not exceed max
      expect(parseFloat(mana.current)).toBeLessThanOrEqual(parseFloat(mana.max));
    }, 15000);
  });

  describe('Nonce Queries', () => {
    it('fetches nonce for an active address', async () => {
      const nonce = await service.getNonce(GENESIS_ADDRESS);

      expect(nonce).toBeDefined();
      
      // Nonce should be a valid integer string
      const nonceNum = parseInt(nonce);
      expect(Number.isInteger(nonceNum)).toBe(true);
      expect(nonceNum).toBeGreaterThanOrEqual(0);
      
      // Active address should have made at least some transactions
      expect(nonceNum).toBeGreaterThan(0);
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
