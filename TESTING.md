# Testing Documentation

This document describes the unit test suite for the Koinos Wallet application.

## Overview

The test suite uses [Jest](https://jestjs.io/) with [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) to test the wallet's screen components. Tests focus on user interactions, navigation flows, and service integrations.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run a specific test file
npm test -- CreateWalletScreen.test.tsx

# Run with coverage report
npm test -- --coverage
```

## Test Files

### koinos.service.test.ts

Tests the KoinosService that handles blockchain interactions.

| Test | Description |
|------|-------------|
| `getRpcUrl - returns default RPC URL when nothing is stored` | Verifies default endpoint is used |
| `getRpcUrl - returns stored RPC URL` | Tests loading custom RPC from storage |
| `setRpcUrl - stores RPC URL and updates provider` | Tests saving RPC URL |
| `getBalance - returns formatted balance` | Tests balance fetching and formatting |
| `getBalance - returns 0 on error` | Handles network errors gracefully |
| `getBalance - returns 0 when account has no RC` | Handles null balance |
| `getMana - returns current and max mana` | Tests mana retrieval |
| `getMana - returns zeros on error` | Handles mana fetch errors |
| `getNonce - returns nonce as string` | Tests nonce retrieval |
| `getNonce - returns 0 on error` | Handles nonce fetch errors |
| `isValidAddress - valid/invalid cases` | Tests address validation logic |
| `getChainInfo - returns chain head info` | Tests chain info retrieval |

**Mocked Dependencies:**
- `koilib.Provider` - Mock blockchain provider
- `AsyncStorage` - Mock persistent storage

---

### wallet.service.test.ts

Tests the WalletService that manages wallet creation, import, and storage.

| Test | Description |
|------|-------------|
| `generateWallet - generates mnemonic and returns address` | Tests new wallet creation |
| `importFromMnemonic - imports wallet from valid mnemonic` | Tests mnemonic import |
| `importFromMnemonic - throws error for invalid mnemonic` | Validates mnemonic format |
| `importFromMnemonic - uses custom account index` | Tests custom derivation paths |
| `importFromWIF - imports wallet from valid WIF` | Tests WIF private key import |
| `importFromWIF - throws error for invalid WIF` | Validates WIF format |
| `loadWallet - returns hasWallet false when no wallet stored` | Tests empty state |
| `loadWallet - loads mnemonic wallet` | Tests loading mnemonic-based wallet |
| `loadWallet - loads WIF wallet` | Tests loading WIF-based wallet |
| `deleteWallet - deletes wallet from storage` | Tests wallet deletion |
| `hasWallet - returns true/false` | Tests wallet existence check |
| `getSeedPhrase - returns mnemonic/null` | Tests seed phrase retrieval |
| `hasSeedPhrase - returns true/false` | Tests seed phrase availability |
| `getSigner/getAddress - returns null before wallet is loaded` | Tests initial state |

**Mocked Dependencies:**
- `expo-secure-store` - Mock secure storage
- `bip39` - Mock mnemonic generation/validation
- `ethers.utils.HDNode` - Mock HD wallet derivation
- `koilib.Signer` - Mock transaction signer

---

### CreateWalletScreen.test.tsx

Tests the wallet creation flow where users generate a new mnemonic seed phrase.

| Test | Description |
|------|-------------|
| `renders the generate button initially` | Verifies the initial screen shows a "Generate Seed Phrase" button |
| `generates and displays mnemonic when button is pressed` | Simulates generating a mnemonic and confirms the 12-word phrase is displayed |
| `shows confirmation dialog after writing down phrase` | Tests that pressing "I've Written It Down" triggers an alert for confirmation |

**Mocked Services:**
- `walletService.generateMnemonic()` - Returns a mock 12-word phrase
- `walletService.createFromMnemonic()` - Returns a mock wallet address
- `showAlert()` - Captures alert calls for assertion

---

### ImportWalletScreen.test.tsx

Tests importing an existing wallet via seed phrase or WIF private key.

| Test | Description |
|------|-------------|
| `renders mnemonic import by default` | Confirms the screen defaults to seed phrase import mode |
| `shows error when mnemonic is invalid` | Validates that entering less than 12 words triggers an error |
| `imports using WIF when selected` | Tests switching to WIF mode and importing a private key |

**Mocked Services:**
- `walletService.importFromMnemonic()` - Simulates mnemonic import
- `walletService.importFromWIF()` - Simulates WIF private key import
- `showAlert()` - Captures success/error alerts

---

### HomeScreen.test.tsx

Tests the main wallet dashboard that displays balance and address.

| Test | Description |
|------|-------------|
| `redirects to Welcome when no wallet exists` | Verifies navigation to Welcome screen if no wallet is found |
| `loads and displays balance data` | Tests that balance and mana data are fetched and displayed |
| `copies address when address card is pressed` | Confirms tapping the address copies it to clipboard |

**Mocked Services:**
- `walletService.loadWallet()` - Returns wallet state (hasWallet, address)
- `koinosService.getBalance()` - Returns mock KOIN balance
- `koinosService.getMana()` - Returns mock mana values
- `copyToClipboard()` - Captures clipboard operations

---

### SendScreen.test.tsx

Tests the KOIN transfer functionality.

| Test | Description |
|------|-------------|
| `shows validation error when address is missing` | Verifies error appears when trying to send without recipient |
| `sends transaction after confirmation` | Tests the full send flow with confirmation dialog |

**Mocked Services:**
- `walletService.loadWallet()` - Returns loaded wallet state
- `walletService.getSigner()` - Returns mock signer with address
- `koinosService.sendKoin()` - Simulates transaction submission
- `KoinosService.isValidAddress()` - Validates address format
- `showAlert()` - Captures confirmation and success/error alerts

---

### SettingsScreen.test.tsx

Tests the settings screen for RPC configuration and wallet management.

| Test | Description |
|------|-------------|
| `loads and displays current RPC URL` | Verifies the saved RPC URL is loaded and shown |
| `saves RPC URL when Save button is pressed` | Tests that entering a new URL and saving persists it |

**Mocked Services:**
- `koinosService.getRpcUrl()` - Returns current RPC endpoint
- `koinosService.setRpcUrl()` - Saves new RPC endpoint
- `showAlert()` - Captures save confirmation

---

## Test Setup

### jest.setup.ts

The setup file configures global mocks required for React Native testing:

```typescript
// Extends Jest matchers for React Native elements
import '@testing-library/jest-native/extend-expect';

// Mocks AsyncStorage for persistent storage tests
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Handles NativeAnimatedHelper if present
try {
  require('react-native/Libraries/Animated/NativeAnimatedHelper');
  jest.doMock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch {
  // Module not present in this RN/Expo version
}
```

### Jest Configuration (package.json)

```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|koilib)"
    ]
  }
}
```

## Mocking Patterns

### Navigation Mock

All screens mock `@react-navigation/native` to capture navigation calls:

```typescript
const mockNavigation = {
  replace: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: (callback: any) => callback(),
}));
```

### Service Mocks

Services are mocked at the module level with jest.fn() wrappers:

```typescript
const mockLoadWallet = jest.fn();

jest.mock('../src/services/wallet', () => ({
  __esModule: true,
  default: {
    loadWallet: (...args: any[]) => mockLoadWallet(...args),
  },
}));
```

### Platform Utilities Mock

Alert and clipboard functions are mocked to capture calls:

```typescript
const mockShowAlert = jest.fn();
const mockCopyToClipboard = jest.fn();

jest.mock('../src/utils/platform', () => ({
  showAlert: (...args: any[]) => mockShowAlert(...args),
  copyToClipboard: (...args: any[]) => mockCopyToClipboard(...args),
}));
```

## Best Practices

1. **Clear mocks between tests** - Use `beforeEach(() => jest.clearAllMocks())` to reset state
2. **Wait for async operations** - Use `findByText()` or `waitFor()` for async state updates
3. **Use testID for complex elements** - Add `testID` props to elements that are hard to query
4. **Wrap state updates in act()** - Use `act()` when triggering async state changes
5. **Test user behavior, not implementation** - Focus on what users see and do

## Coverage Goals

- All screen components should have tests for primary user flows
- Error states and validation should be tested
- Navigation between screens should be verified
- Service integrations should be mocked and assertions made on calls
