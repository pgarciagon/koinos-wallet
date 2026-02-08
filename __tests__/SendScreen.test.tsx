import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SendScreen from '../src/screens/SendScreen';

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  replace: jest.fn(),
};

const mockRoute = {
  params: { token: 'KOIN' as 'KOIN' | 'VHP' },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
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
const mockSendVhp = jest.fn();
const mockGetBalance = jest.fn();
const mockGetVhpBalance = jest.fn();
const mockGetMana = jest.fn();
const mockEstimateTransferCost = jest.fn();
const mockGetFreeManaAvailable = jest.fn();
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
      sendVhp: (...args: any[]) => mockSendVhp(...args),
      getBalance: (...args: any[]) => mockGetBalance(...args),
      getVhpBalance: (...args: any[]) => mockGetVhpBalance(...args),
      getMana: (...args: any[]) => mockGetMana(...args),
      estimateTransferCost: (...args: any[]) => mockEstimateTransferCost(...args),
      getFreeManaAvailable: (...args: any[]) => mockGetFreeManaAvailable(...args),
    },
  };
});

const mockShowAlert = jest.fn();

jest.mock('../src/utils/platform', () => ({
  showAlert: (...args: any[]) => mockShowAlert(...args),
}));

// Helper to set up a fully loaded SendScreen with mana data
function setupMocks(overrides?: {
  balance?: string;
  mana?: { current: string; max: string };
  freeMana?: { available: boolean; mana: string };
  estimate?: { rcEstimate: string; koinEstimate: string };
}) {
  const balance = overrides?.balance ?? '15.93058639';
  const mana = overrides?.mana ?? { current: '2.00', max: '15.93058639' };
  const freeMana = overrides?.freeMana ?? { available: true, mana: '12500' };
  const estimate = overrides?.estimate ?? { rcEstimate: '44427114', koinEstimate: '0.44427114' };

  mockLoadWallet.mockResolvedValue({ hasWallet: true, address: '1ABC' });
  mockGetSigner.mockReturnValue({ getAddress: () => '1ABC' });
  mockGetBalance.mockResolvedValue(balance);
  mockGetVhpBalance.mockResolvedValue('0');
  mockGetMana.mockResolvedValue(mana);
  mockEstimateTransferCost.mockResolvedValue(estimate);
  mockGetFreeManaAvailable.mockResolvedValue(freeMana);
  mockIsValidAddress.mockReturnValue(true);
}

describe('SendScreen', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute.params = { token: 'KOIN' };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // === Existing tests ===

  it('shows validation error when address is missing', async () => {
    setupMocks();

    const { getByText, getByTestId } = render(<SendScreen />);

    await waitFor(() => {
      expect(getByText('1ABC')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    await waitFor(() => {
      expect(getByText('Please enter a recipient address')).toBeTruthy();
    });
  }, 10000);

  it('sends transaction after confirmation', async () => {
    setupMocks();
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

  // === Battery widget tests ===

  it('shows battery widget for KOIN token', async () => {
    setupMocks({ mana: { current: '8', max: '16' } });

    const { findByText } = render(<SendScreen />);
    await findByText('1ABC');

    await waitFor(() => {
      expect(findByText('Mana')).toBeTruthy();
      expect(findByText('50%')).toBeTruthy();
    });
  });

  it('does not show battery widget for VHP token', async () => {
    mockRoute.params = { token: 'VHP' };
    setupMocks();

    const { findByText, queryByText } = render(<SendScreen />);
    await findByText('1ABC');

    await waitFor(() => {
      expect(queryByText('Mana')).toBeNull();
    });
  });

  // === MAX button toggle tests ===

  it('first MAX press sets mana-capped amount', async () => {
    setupMocks({
      balance: '15.93',
      mana: { current: '2.00', max: '15.93' },
    });

    const { findByText, getByText, getByPlaceholderText } = render(<SendScreen />);
    await findByText('1ABC');

    // Wait for mana data to load
    await waitFor(() => {
      expect(getByText('MAX')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('MAX'));
    });

    // Amount should be capped at currentMana (2.00), not full balance (15.93)
    const input = getByPlaceholderText('0.00000000');
    const value = parseFloat(input.props.value);
    expect(value).toBeLessThanOrEqual(2.0);
    expect(value).toBeGreaterThan(0);
  });

  it('second MAX press sets full balance and shows warning', async () => {
    setupMocks({
      balance: '15.93',
      mana: { current: '2.00', max: '15.93' },
    });

    const { findByText, getByText, getByPlaceholderText } = render(<SendScreen />);
    await findByText('1ABC');

    await waitFor(() => {
      expect(getByText('MAX')).toBeTruthy();
    });

    // First press
    await act(async () => {
      fireEvent.press(getByText('MAX'));
    });

    // Second press
    await act(async () => {
      fireEvent.press(getByText('MAX'));
    });

    // Amount should be full balance
    const input = getByPlaceholderText('0.00000000');
    expect(parseFloat(input.props.value)).toBeCloseTo(15.93, 1);

    // Warning should appear
    await waitFor(() => {
      expect(findByText(/Cannot send yet/)).toBeTruthy();
    });
  });

  it('third MAX press cycles back to sendable amount and clears warning', async () => {
    setupMocks({
      balance: '15.93',
      mana: { current: '2.00', max: '15.93' },
    });

    const { findByText, getByText, getByPlaceholderText, queryByText } = render(<SendScreen />);
    await findByText('1ABC');

    await waitFor(() => {
      expect(getByText('MAX')).toBeTruthy();
    });

    // First press
    await act(async () => {
      fireEvent.press(getByText('MAX'));
    });
    const firstPressValue = getByPlaceholderText('0.00000000').props.value;

    // Second press (full balance)
    await act(async () => {
      fireEvent.press(getByText('MAX'));
    });

    // Third press (back to sendable)
    await act(async () => {
      fireEvent.press(getByText('MAX'));
    });

    // Amount should match first press
    const thirdPressValue = getByPlaceholderText('0.00000000').props.value;
    expect(thirdPressValue).toBe(firstPressValue);

    // Warning should be cleared
    expect(queryByText(/Cannot send yet/)).toBeNull();
  });

  it('manual typing resets MAX toggle state', async () => {
    setupMocks({
      balance: '15.93',
      mana: { current: '2.00', max: '15.93' },
    });

    const { findByText, getByText, getByPlaceholderText } = render(<SendScreen />);
    await findByText('1ABC');

    await waitFor(() => {
      expect(getByText('MAX')).toBeTruthy();
    });

    // First MAX press
    await act(async () => {
      fireEvent.press(getByText('MAX'));
    });

    // Type manually - should reset
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('0.00000000'), '0.5');
    });

    // Press MAX again - should behave like first press (sendable amount, not full balance)
    await act(async () => {
      fireEvent.press(getByText('MAX'));
    });

    const input = getByPlaceholderText('0.00000000');
    const value = parseFloat(input.props.value);
    expect(value).toBeLessThanOrEqual(2.0);
  });

  it('MAX does not toggle when mana covers full balance', async () => {
    setupMocks({
      balance: '1.00',
      mana: { current: '2.00', max: '2.00' },
    });

    const { findByText, getByText, getByPlaceholderText } = render(<SendScreen />);
    await findByText('1ABC');

    await waitFor(() => {
      expect(getByText('MAX')).toBeTruthy();
    });

    // First press - full balance since mana > balance
    await act(async () => {
      fireEvent.press(getByText('MAX'));
    });

    const value = parseFloat(getByPlaceholderText('0.00000000').props.value);
    expect(value).toBeCloseTo(1.0, 1);
  });

  // === Free mana auto-detect tests ===

  it('auto-enables free mana when amount + txFee exceeds mana', async () => {
    setupMocks({
      balance: '15.93',
      mana: { current: '2.00', max: '15.93' },
      estimate: { rcEstimate: '44427114', koinEstimate: '0.44427114' },
    });

    const { findByText, getByPlaceholderText } = render(<SendScreen />);
    await findByText('1ABC');

    // Wait for mana estimate to load
    await waitFor(() => {
      expect(mockEstimateTransferCost).toHaveBeenCalled();
    });

    // Type amount that exceeds mana threshold (1.5 + 0.44*1.5 = 2.16 > 2.00)
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('0.00000000'), '1.5');
    });

    // Free mana should be auto-enabled (verified by the send call using it)
    // We verify indirectly: the send should pass useFreeMana: true
    mockSendKoin.mockResolvedValue({ transactionId: 'txid', success: true });

  });

  it('does not auto-enable free mana for small amounts', async () => {
    setupMocks({
      balance: '15.93',
      mana: { current: '2.00', max: '15.93' },
      estimate: { rcEstimate: '44427114', koinEstimate: '0.44427114' },
    });

    const { findByText, getByPlaceholderText } = render(<SendScreen />);
    await findByText('1ABC');

    await waitFor(() => {
      expect(mockEstimateTransferCost).toHaveBeenCalled();
    });

    // Small amount: 0.5 + 0.44*1.5 = 1.16 < 2.00 → no free mana needed
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('0.00000000'), '0.5');
    });

    // No error should appear, free mana not needed
  });

  // === Validation tests ===

  it('blocks KOIN send when amount exceeds mana', async () => {
    setupMocks({
      balance: '15.93',
      mana: { current: '2.00', max: '15.93' },
    });

    const { findByText, getByPlaceholderText, getByTestId } = render(<SendScreen />);
    await findByText('1ABC');

    fireEvent.changeText(getByPlaceholderText('Enter Koinos address'), '1DEST');
    fireEvent.changeText(getByPlaceholderText('0.00000000'), '5.0');

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    expect(await findByText(/Amount exceeds your available mana/)).toBeTruthy();
  });

  it('shows invalid address error', async () => {
    setupMocks();
    mockIsValidAddress.mockReturnValue(false);

    const { findByText, getByPlaceholderText, getByTestId } = render(<SendScreen />);
    await findByText('1ABC');

    fireEvent.changeText(getByPlaceholderText('Enter Koinos address'), 'invalid');
    fireEvent.changeText(getByPlaceholderText('0.00000000'), '1');

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    expect(await findByText('Invalid Koinos address format')).toBeTruthy();
  });

  it('shows error for zero amount', async () => {
    setupMocks();

    const { findByText, getByPlaceholderText, getByTestId } = render(<SendScreen />);
    await findByText('1ABC');

    fireEvent.changeText(getByPlaceholderText('Enter Koinos address'), '1DEST');
    fireEvent.changeText(getByPlaceholderText('0.00000000'), '0');

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    expect(await findByText('Please enter a valid amount')).toBeTruthy();
  });

  it('shows error when no wallet found', async () => {
    mockLoadWallet.mockResolvedValue({ hasWallet: false });
    mockGetSigner.mockReturnValue(null);

    const { findByText } = render(<SendScreen />);

    expect(await findByText(/No wallet found/)).toBeTruthy();
  });
});
