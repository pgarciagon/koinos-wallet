import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';

const mockNavigation = {
  replace: jest.fn(),
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: (callback: any) => callback(),
}));

const mockLoadWallet = jest.fn();

jest.mock('../src/services/wallet', () => ({
  __esModule: true,
  default: {
    loadWallet: (...args: any[]) => mockLoadWallet(...args),
  },
}));

const mockGetBalance = jest.fn();
const mockGetMana = jest.fn();
const mockGetVhpBalance = jest.fn();

jest.mock('../src/services/koinos', () => ({
  __esModule: true,
  default: {
    getBalance: (...args: any[]) => mockGetBalance(...args),
    getMana: (...args: any[]) => mockGetMana(...args),
    getVhpBalance: (...args: any[]) => mockGetVhpBalance(...args),
  },
}));

const mockCopyToClipboard = jest.fn();
const mockShowAlert = jest.fn();

jest.mock('../src/utils/platform', () => ({
  copyToClipboard: (...args: any[]) => mockCopyToClipboard(...args),
  showAlert: (...args: any[]) => mockShowAlert(...args),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to Welcome when no wallet exists', async () => {
    mockLoadWallet.mockResolvedValue({ hasWallet: false, address: '' });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(mockNavigation.replace).toHaveBeenCalledWith('Welcome');
    });
  });

  it('loads and displays balance data', async () => {
    mockLoadWallet.mockResolvedValue({ hasWallet: true, address: '1ABC' });
    mockGetBalance.mockResolvedValue('1.23');
    mockGetMana.mockResolvedValue({ current: '1', max: '2' });
    mockGetVhpBalance.mockResolvedValue('0');

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('KOIN Balance')).toBeTruthy();
    });
  });

  it('copies address when address card is pressed', async () => {
    mockLoadWallet.mockResolvedValue({ hasWallet: true, address: '1ABC' });
    mockGetBalance.mockResolvedValue('0');
    mockGetMana.mockResolvedValue({ current: '0', max: '0' });
    mockGetVhpBalance.mockResolvedValue('0');
    mockCopyToClipboard.mockResolvedValue(true);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Tap to copy')).toBeTruthy();
    });

    fireEvent.press(getByText('Tap to copy'));

    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalled();
    });
  });
});
