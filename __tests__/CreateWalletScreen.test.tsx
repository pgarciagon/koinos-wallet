import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateWalletScreen from '../src/screens/CreateWalletScreen';

// Navigation mock used by the screen to navigate/replace routes.
const mockNavigation = {
  replace: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
};

// Mock the navigation hook to return our fake navigation object.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock for the wallet service generateWallet call.
const mockGenerateWallet = jest.fn();

// Mock wallet service used by CreateWalletScreen.
jest.mock('../src/services/wallet', () => ({
  __esModule: true,
  default: {
    generateWallet: (...args: any[]) => mockGenerateWallet(...args),
  },
}));

// Mock alert helper to avoid real UI dialogs.
jest.mock('../src/utils/platform', () => ({
  showAlert: jest.fn(),
}));

describe('CreateWalletScreen', () => {
  beforeEach(() => {
    // Reset all mocks before each test for isolation.
    jest.clearAllMocks();
  });

  it('renders the generate wallet screen', () => {
    // Render the screen in the default "generate" step.
    const { getByText } = render(<CreateWalletScreen />);

    // Verify that the initial UI elements are visible.
    expect(getByText('Create New Wallet')).toBeTruthy();
    expect(getByText('Generate Wallet')).toBeTruthy();
  });

  it('generates a wallet and shows backup step', async () => {
    // Arrange: mock a successful wallet generation.
    mockGenerateWallet.mockResolvedValue({
      mnemonic: 'one two three four five six seven eight nine ten eleven twelve',
      address: '1ABCDEF1234567890',
    });

    // Render the screen.
    const { getByText, queryByText } = render(<CreateWalletScreen />);

    // Act: tap the Generate Wallet button.
    fireEvent.press(getByText('Generate Wallet'));

    // Assert: the backup step should appear after the async call resolves.
    await waitFor(() => {
      expect(queryByText('Backup Your Seed Phrase')).toBeTruthy();
    });

    // Assert: address and words are shown.
    expect(getByText('Your new address:')).toBeTruthy();
    expect(getByText('1ABCDEF1234567890')).toBeTruthy();
    expect(getByText('one')).toBeTruthy();
  });

  it('requires confirmation before continuing', async () => {
    // Arrange: mock a successful wallet generation.
    mockGenerateWallet.mockResolvedValue({
      mnemonic: 'one two three four five six seven eight nine ten eleven twelve',
      address: '1ABCDEF1234567890',
    });

    // Render the screen.
    const { getByText } = render(<CreateWalletScreen />);

    // Act: generate the wallet to reach the backup step.
    fireEvent.press(getByText('Generate Wallet'));

    // Wait until backup screen is visible.
    await waitFor(() => {
      expect(getByText('I have written down my seed phrase')).toBeTruthy();
    });

    // Attempt to continue without confirmation.
    fireEvent.press(getByText('Continue to Wallet'));
    expect(mockNavigation.replace).not.toHaveBeenCalled();

    // Confirm the checkbox and continue again.
    fireEvent.press(getByText('I have written down my seed phrase'));
    fireEvent.press(getByText('Continue to Wallet'));

    // Verify navigation to Home after confirmation.
    expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
  });
});
