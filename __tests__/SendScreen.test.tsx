import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SendScreen from '../src/screens/SendScreen';

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  replace: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

const mockGetSigner = jest.fn();
const mockLoadWallet = jest.fn();

jest.mock('../src/services/wallet', () => ({
  __esModule: true,
  default: {
    loadWallet: (...args: any[]) => mockLoadWallet(...args),
    getSigner: (...args: any[]) => mockGetSigner(...args),
  },
}));

const mockSendKoin = jest.fn();
const mockIsValidAddress = jest.fn();

jest.mock('../src/services/koinos', () => {
  const actual = jest.requireActual('../src/services/koinos');
  return {
    __esModule: true,
    ...actual,
    KoinosService: {
      ...actual.KoinosService,
      isValidAddress: (...args: any[]) => mockIsValidAddress(...args),
    },
    default: {
      sendKoin: (...args: any[]) => mockSendKoin(...args),
    },
  };
});

const mockShowAlert = jest.fn();

jest.mock('../src/utils/platform', () => ({
  showAlert: (...args: any[]) => mockShowAlert(...args),
}));

describe('SendScreen', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected console output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('shows validation error when address is missing', async () => {
    mockLoadWallet.mockResolvedValue({ hasWallet: true, address: '1ABC' });
    mockGetSigner.mockReturnValue({ getAddress: () => '1ABC' });
    mockIsValidAddress.mockReturnValue(true);

    const { findByText, getByTestId } = render(<SendScreen />);

    await findByText('1ABC');

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    expect(await findByText('Please enter a recipient address')).toBeTruthy();
  });

  it('sends transaction after confirmation', async () => {
    mockLoadWallet.mockResolvedValue({ hasWallet: true, address: '1ABC' });
    mockGetSigner.mockReturnValue({ getAddress: () => '1ABC' });
    mockIsValidAddress.mockReturnValue(true);
    mockSendKoin.mockResolvedValue({ transactionId: 'txid', success: true });

    const { findByText, getByPlaceholderText, getByTestId } = render(<SendScreen />);

    await findByText('1ABC');

    fireEvent.changeText(getByPlaceholderText('Enter Koinos address'), '1DEST');
    fireEvent.changeText(getByPlaceholderText('0.00000000'), '1');

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalled();
    });

    const confirmCall = mockShowAlert.mock.calls.find(
      ([title]) => title === 'Confirm Transaction'
    );
    expect(confirmCall).toBeTruthy();

    const confirmButtons = confirmCall?.[2] as { text: string; onPress?: () => void }[];
    const sendButtonConfig = confirmButtons?.find((button) => button.text === 'Send');
    sendButtonConfig?.onPress?.();

    await waitFor(() => {
      expect(mockSendKoin).toHaveBeenCalled();
    });
  });
});
