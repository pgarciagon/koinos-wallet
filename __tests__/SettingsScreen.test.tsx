import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../src/screens/SettingsScreen';

const mockNavigation = {
  goBack: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

const mockGetRpcUrl = jest.fn();
const mockSetRpcUrl = jest.fn();

jest.mock('../src/services/koinos', () => ({
  __esModule: true,
  default: {
    getRpcUrl: (...args: any[]) => mockGetRpcUrl(...args),
    setRpcUrl: (...args: any[]) => mockSetRpcUrl(...args),
  },
}));

const mockGetSeedPhrase = jest.fn();
const mockDeleteWallet = jest.fn();

jest.mock('../src/services/wallet', () => ({
  __esModule: true,
  default: {
    getSeedPhrase: (...args: any[]) => mockGetSeedPhrase(...args),
    deleteWallet: (...args: any[]) => mockDeleteWallet(...args),
  },
}));

const mockShowAlert = jest.fn();

jest.mock('../src/utils/platform', () => ({
  showAlert: (...args: any[]) => mockShowAlert(...args),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays current RPC URL', async () => {
    mockGetRpcUrl.mockResolvedValue('https://api.koinos.io');

    const { getByDisplayValue } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByDisplayValue('https://api.koinos.io')).toBeTruthy();
    });
  });

  it('saves updated RPC URL', async () => {
    mockGetRpcUrl.mockResolvedValue('https://api.koinos.io');

    const { getByText, getByDisplayValue } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByDisplayValue('https://api.koinos.io')).toBeTruthy();
    });

    fireEvent.changeText(getByDisplayValue('https://api.koinos.io'), 'https://example.com');
    fireEvent.press(getByText('Save RPC URL'));

    await waitFor(() => {
      expect(mockSetRpcUrl).toHaveBeenCalledWith('https://example.com');
    });
  });
});
