import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PIN_KEY = 'koinos_app_pin';
const LOCK_ENABLED_KEY = 'koinos_lock_enabled';
const BIOMETRICS_ENABLED_KEY = 'koinos_biometrics_enabled';

// Storage abstraction (same pattern as wallet.ts)
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export type BiometricType = 'faceid' | 'fingerprint' | 'iris' | 'none';

export class AuthService {
  /**
   * Check if the device supports biometric authentication (Face ID, Touch ID, etc.)
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return false;
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch {
      return false;
    }
  }

  /**
   * Get the type of biometric available on the device.
   */
  async getBiometricType(): Promise<BiometricType> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'faceid';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'fingerprint';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'iris';
      }
      return 'none';
    } catch {
      return 'none';
    }
  }

  /**
   * Get a user-friendly label for the biometric type.
   */
  async getBiometricLabel(): Promise<string> {
    const type = await this.getBiometricType();
    switch (type) {
      case 'faceid': return 'Face ID';
      case 'fingerprint': return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      case 'iris': return 'Iris';
      default: return 'Biometrics';
    }
  }

  // --- PIN Management ---

  /**
   * Check if a PIN has been set.
   */
  async hasPin(): Promise<boolean> {
    const pin = await storage.getItem(PIN_KEY);
    return !!pin;
  }

  /**
   * Set/update the app PIN.
   */
  async setPin(pin: string): Promise<void> {
    await storage.setItem(PIN_KEY, pin);
  }

  /**
   * Verify a PIN against the stored one.
   */
  async verifyPin(pin: string): Promise<boolean> {
    const stored = await storage.getItem(PIN_KEY);
    return stored === pin;
  }

  /**
   * Remove the PIN.
   */
  async removePin(): Promise<void> {
    await storage.deleteItem(PIN_KEY);
  }

  // --- Lock Settings ---

  /**
   * Check if app lock is enabled (PIN has been set).
   */
  async isLockEnabled(): Promise<boolean> {
    const enabled = await storage.getItem(LOCK_ENABLED_KEY);
    return enabled === 'true';
  }

  /**
   * Enable app lock.
   */
  async enableLock(): Promise<void> {
    await storage.setItem(LOCK_ENABLED_KEY, 'true');
  }

  /**
   * Disable app lock and remove PIN + biometric preference.
   */
  async disableLock(): Promise<void> {
    await storage.deleteItem(LOCK_ENABLED_KEY);
    await storage.deleteItem(PIN_KEY);
    await storage.deleteItem(BIOMETRICS_ENABLED_KEY);
  }

  /**
   * Check if biometric unlock is enabled (user preference).
   */
  async isBiometricsEnabled(): Promise<boolean> {
    const enabled = await storage.getItem(BIOMETRICS_ENABLED_KEY);
    return enabled === 'true';
  }

  /**
   * Enable biometric unlock.
   */
  async enableBiometrics(): Promise<void> {
    await storage.setItem(BIOMETRICS_ENABLED_KEY, 'true');
  }

  /**
   * Disable biometric unlock.
   */
  async disableBiometrics(): Promise<void> {
    await storage.deleteItem(BIOMETRICS_ENABLED_KEY);
  }

  // --- Authentication ---

  /**
   * Prompt biometric authentication (Face ID / Touch ID / Fingerprint).
   * Returns true if auth succeeded, false otherwise.
   */
  async authenticateWithBiometrics(promptMessage?: string): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Unlock Koinos Wallet',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true, // We handle PIN fallback ourselves
        fallbackLabel: 'Use PIN',
      });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Full unlock flow: try biometrics first (if enabled), then fall back to PIN.
   * Returns 'biometric' | 'pin' | 'failed'.
   */
  async shouldUseBiometrics(): Promise<boolean> {
    const bioEnabled = await this.isBiometricsEnabled();
    if (!bioEnabled) return false;
    const bioAvailable = await this.isBiometricAvailable();
    return bioAvailable;
  }
}

export default new AuthService();
