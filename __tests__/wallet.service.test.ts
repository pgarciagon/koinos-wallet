import { WalletService } from '../src/services/wallet';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

// Mock bip39
const mockGenerateMnemonic = jest.fn();
const mockValidateMnemonic = jest.fn();

jest.mock('bip39', () => ({
  generateMnemonic: () => mockGenerateMnemonic(),
  validateMnemonic: (mnemonic: string) => mockValidateMnemonic(mnemonic),
}));

// Mock ethers HDNode
const mockDerivePath = jest.fn();

jest.mock('ethers', () => ({
  ethers: {
    utils: {
      HDNode: {
        fromMnemonic: jest.fn().mockReturnValue({
          derivePath: () => mockDerivePath(),
        }),
      },
    },
  },
}));

// Mock koilib Signer
const mockGetAddress = jest.fn();

jest.mock('koilib', () => ({
  Signer: jest.fn().mockImplementation(() => ({
    getAddress: () => mockGetAddress(),
  })),
}));

// Import Signer for fromWif mock
import { Signer } from 'koilib';

describe('WalletService', () => {
  let service: WalletService;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WalletService();
    // Suppress expected console.log output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Default mock implementations
    mockGetAddress.mockReturnValue('1MockAddress123456789012345');
    mockDerivePath.mockReturnValue({
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('generateWallet', () => {
    it('generates mnemonic and returns address', async () => {
      mockGenerateMnemonic.mockReturnValue('word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');
      mockValidateMnemonic.mockReturnValue(true);

      const result = await service.generateWallet();

      expect(result.mnemonic).toBe('word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');
      expect(result.address).toBe('1MockAddress123456789012345');
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe('importFromMnemonic', () => {
    it('imports wallet from valid mnemonic', async () => {
      mockValidateMnemonic.mockReturnValue(true);

      const address = await service.importFromMnemonic('valid mnemonic phrase here');

      expect(address).toBe('1MockAddress123456789012345');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'koinos_wallet',
        'valid mnemonic phrase here'
      );
    });

    it('throws error for invalid mnemonic', async () => {
      mockValidateMnemonic.mockReturnValue(false);

      await expect(service.importFromMnemonic('invalid')).rejects.toThrow(
        'Invalid mnemonic phrase'
      );
    });

    it('uses custom account index for derivation', async () => {
      mockValidateMnemonic.mockReturnValue(true);

      await service.importFromMnemonic('valid mnemonic', 5);

      // Verify derivePath was called (path would include account index 5)
      expect(mockDerivePath).toHaveBeenCalled();
    });
  });

  describe('importFromWIF', () => {
    it('imports wallet from valid WIF', async () => {
      (Signer.fromWif as jest.Mock) = jest.fn().mockReturnValue({
        getAddress: () => '1WIFAddress123456789012345',
      });

      const address = await service.importFromWIF('5ValidWIFKey');

      expect(address).toBe('1WIFAddress123456789012345');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'koinos_wallet',
        'wif:5ValidWIFKey'
      );
    });

    it('throws error for invalid WIF', async () => {
      (Signer.fromWif as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new Error('Invalid WIF');
      });

      await expect(service.importFromWIF('invalid')).rejects.toThrow(
        'Invalid WIF private key'
      );
    });
  });

  describe('loadWallet', () => {
    it('returns hasWallet false when no wallet stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const info = await service.loadWallet();

      expect(info.hasWallet).toBe(false);
      expect(info.address).toBe('');
    });

    it('loads mnemonic wallet', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12')
        .mockResolvedValueOnce('1MockAddress123456789012345');

      const info = await service.loadWallet();

      expect(info.hasWallet).toBe(true);
      expect(info.address).toBe('1MockAddress123456789012345');
    });

    it('loads WIF wallet', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('wif:5ValidWIFKey')
        .mockResolvedValueOnce('1WIFAddress123456789012345');

      (Signer.fromWif as jest.Mock) = jest.fn().mockReturnValue({
        getAddress: () => '1WIFAddress123456789012345',
      });

      const info = await service.loadWallet();

      expect(info.hasWallet).toBe(true);
      expect(Signer.fromWif).toHaveBeenCalledWith('5ValidWIFKey');
    });
  });

  describe('deleteWallet', () => {
    it('deletes wallet from storage', async () => {
      await service.deleteWallet();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('koinos_wallet');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('koinos_address');
      expect(service.getSigner()).toBeNull();
      expect(service.getAddress()).toBeNull();
    });
  });

  describe('hasWallet', () => {
    it('returns true when wallet exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-mnemonic');

      const result = await service.hasWallet();

      expect(result).toBe(true);
    });

    it('returns false when no wallet', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await service.hasWallet();

      expect(result).toBe(false);
    });
  });

  describe('getSeedPhrase', () => {
    it('returns mnemonic when available', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');

      const phrase = await service.getSeedPhrase();

      expect(phrase).toBe('word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');
    });

    it('returns null for WIF wallet', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('wif:5ValidWIFKey');

      const phrase = await service.getSeedPhrase();

      expect(phrase).toBeNull();
    });

    it('returns null when no wallet', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const phrase = await service.getSeedPhrase();

      expect(phrase).toBeNull();
    });
  });

  describe('hasSeedPhrase', () => {
    it('returns true for mnemonic wallet', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('mnemonic words here');

      const result = await service.hasSeedPhrase();

      expect(result).toBe(true);
    });

    it('returns false for WIF wallet', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('wif:5ValidWIFKey');

      const result = await service.hasSeedPhrase();

      expect(result).toBe(false);
    });
  });

  describe('getSigner', () => {
    it('returns null before wallet is loaded', () => {
      expect(service.getSigner()).toBeNull();
    });
  });

  describe('getAddress', () => {
    it('returns null before wallet is loaded', () => {
      expect(service.getAddress()).toBeNull();
    });
  });
});
