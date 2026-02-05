import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ImportWalletScreen from '../src/screens/ImportWalletScreen';

const mockNavigation = {
  replace: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

const mockImportFromMnemonic = jest.fn();
const mockImportFromWIF = jest.fn();

jest.mock('../src/services/wallet', () => ({
  __esModule: true,
  default: {
    importFromMnemonic: (...args: any[]) => mockImportFromMnemonic(...args),
    importFromWIF: (...args: any[]) => mockImportFromWIF(...args),
  },
}));

const mockShowAlert = jest.fn();

jest.mock('../src/utils/platform', () => ({
  showAlert: (...args: any[]) => mockShowAlert(...args),
}));

describe('ImportWalletScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mnemonic import by default', () => {
    const { getAllByText, getByText } = render(<ImportWalletScreen />);

    expect(getAllByText('Import Wallet')).toHaveLength(2);
    expect(getByText('Seed Phrase')).toBeTruthy();
  });

  it('shows error when mnemonic is invalid', async () => {
    const { getAllByText, getByPlaceholderText } = render(<ImportWalletScreen />);

    fireEvent.changeText(getByPlaceholderText('word1 word2 word3 ...'), 'word1 word2');
    fireEvent.press(getAllByText('Import Wallet')[1]);

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalled();
    });
  });

  it('imports using WIF when selected', async () => {
    mockImportFromWIF.mockResolvedValue('1ABCDEF1234567890');

    const { getAllByText, getByText, getByPlaceholderText } = render(<ImportWalletScreen />);

    fireEvent.press(getByText('Private Key (WIF)'));
    fireEvent.changeText(getByPlaceholderText('5...'), '5MockWif');
    fireEvent.press(getAllByText('Import Wallet')[1]);

    await waitFor(() => {
      expect(mockImportFromWIF).toHaveBeenCalledWith('5MockWif');
    });
  });
});
