import { KoinosService } from '../src/services/koinos';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock koilib Provider
const mockGetHeadInfo = jest.fn();
const mockGetAccountRc = jest.fn();
const mockGetNonce = jest.fn();

jest.mock('koilib', () => ({
  Provider: jest.fn().mockImplementation(() => ({
    getHeadInfo: () => mockGetHeadInfo(),
    getAccountRc: (addr: string) => mockGetAccountRc(addr),
    getNonce: (addr: string) => mockGetNonce(addr),
  })),
  Contract: jest.fn().mockImplementation(() => ({
    functions: {
      transfer: jest.fn().mockResolvedValue({
        transaction: { id: 'tx123', wait: jest.fn().mockResolvedValue({}) },
        receipt: { id: 'tx123' },
      }),
    },
  })),
  Signer: jest.fn(),
  utils: {
    formatUnits: jest.fn((value: string, decimals: number) => {
      const num = BigInt(value);
      const divisor = BigInt(10 ** decimals);
      return (Number(num) / Number(divisor)).toFixed(decimals);
    }),
    parseUnits: jest.fn((value: string, decimals: number) => {
      const num = parseFloat(value);
      return String(Math.floor(num * 10 ** decimals));
    }),
  },
}));

describe('KoinosService', () => {
  let service: KoinosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KoinosService();
  });

  describe('getRpcUrl', () => {
    it('returns default RPC URL when nothing is stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const url = await service.getRpcUrl();

      expect(url).toBe('https://api.koinos.io');
    });

    it('returns stored RPC URL', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('https://custom.rpc.io');

      const url = await service.getRpcUrl();

      expect(url).toBe('https://custom.rpc.io');
    });
  });

  describe('setRpcUrl', () => {
    it('stores RPC URL and updates provider', async () => {
      await service.setRpcUrl('https://new.rpc.io');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'koinos_rpc_url',
        'https://new.rpc.io'
      );
    });
  });

  describe('getBalance', () => {
    it('returns formatted balance', async () => {
      mockGetAccountRc.mockResolvedValue('100000000'); // 1 KOIN in satoshis

      const balance = await service.getBalance('1ABC');

      expect(mockGetAccountRc).toHaveBeenCalledWith('1ABC');
      expect(balance).toBe('1.00000000');
    });

    it('returns 0 on error', async () => {
      mockGetAccountRc.mockRejectedValue(new Error('Network error'));

      const balance = await service.getBalance('1ABC');

      expect(balance).toBe('0');
    });

    it('returns 0 when account has no RC', async () => {
      mockGetAccountRc.mockResolvedValue(null);

      const balance = await service.getBalance('1ABC');

      expect(balance).toBe('0');
    });
  });

  describe('getMana', () => {
    it('returns current and max mana', async () => {
      mockGetAccountRc.mockResolvedValue('500000000'); // 5 KOIN

      const mana = await service.getMana('1ABC');

      expect(mana.current).toBe('5.00000000');
      expect(mana.max).toBe('5.00000000');
    });

    it('returns zeros on error', async () => {
      mockGetAccountRc.mockRejectedValue(new Error('Network error'));

      const mana = await service.getMana('1ABC');

      expect(mana.current).toBe('0');
      expect(mana.max).toBe('0');
    });
  });

  describe('getNonce', () => {
    it('returns nonce as string', async () => {
      mockGetNonce.mockResolvedValue(42);

      const nonce = await service.getNonce('1ABC');

      expect(nonce).toBe('42');
    });

    it('returns 0 on error', async () => {
      mockGetNonce.mockRejectedValue(new Error('Network error'));

      const nonce = await service.getNonce('1ABC');

      expect(nonce).toBe('0');
    });
  });

  describe('isValidAddress', () => {
    it('returns true for valid base58 address', () => {
      expect(KoinosService.isValidAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(true);
    });

    it('returns false for empty address', () => {
      expect(KoinosService.isValidAddress('')).toBe(false);
    });

    it('returns false for address too short', () => {
      expect(KoinosService.isValidAddress('1ABC')).toBe(false);
    });

    it('returns false for address with invalid characters', () => {
      expect(KoinosService.isValidAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf0O')).toBe(false); // contains 0 and O
    });
  });

  describe('getChainInfo', () => {
    it('returns chain head info', async () => {
      const mockInfo = { head_block: 12345, head_block_time: '2025-01-01' };
      mockGetHeadInfo.mockResolvedValue(mockInfo);

      const info = await service.getChainInfo();

      expect(info).toEqual(mockInfo);
    });
  });
});
