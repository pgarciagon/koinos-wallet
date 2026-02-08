import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Vibration,
  Animated,
} from 'react-native';
import authService from '../services/auth';

interface LockScreenProps {
  onUnlock: () => void;
}

const PIN_LENGTH = 6;

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometricLabel, setBiometricLabel] = useState<string>('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0));

  // Check biometrics on mount and auto-prompt
  useEffect(() => {
    const init = async () => {
      const shouldBio = await authService.shouldUseBiometrics();
      setBiometricsAvailable(shouldBio);
      if (shouldBio) {
        const label = await authService.getBiometricLabel();
        setBiometricLabel(label);
        // Auto-prompt biometrics on mount
        promptBiometrics();
      }
    };
    init();
  }, []);

  const promptBiometrics = useCallback(async () => {
    const success = await authService.authenticateWithBiometrics();
    if (success) {
      onUnlock();
    }
  }, [onUnlock]);

  const shakeError = () => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    setError(null);

    const newPin = pin + digit;
    setPin(newPin);

    // Auto-verify when PIN is complete
    if (newPin.length === PIN_LENGTH) {
      const valid = await authService.verifyPin(newPin);
      if (valid) {
        onUnlock();
      } else {
        shakeError();
        setError('Wrong PIN');
        // Clear after a short delay
        setTimeout(() => setPin(''), 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            i < pin.length && styles.dotFilled,
            error && i < pin.length && styles.dotError,
          ]}
        />
      );
    }
    return dots;
  };

  const renderKeypad = () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      [biometricsAvailable ? 'bio' : '', '0', 'del'],
    ];

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.keypadRow}>
        {row.map((key, keyIndex) => {
          if (key === '') {
            return <View key={keyIndex} style={styles.keyEmpty} />;
          }
          if (key === 'del') {
            return (
              <TouchableOpacity
                key={keyIndex}
                style={styles.keyButton}
                onPress={handleDelete}
                onLongPress={() => setPin('')}
              >
                <Text style={styles.keySpecial}>⌫</Text>
              </TouchableOpacity>
            );
          }
          if (key === 'bio') {
            return (
              <TouchableOpacity
                key={keyIndex}
                style={styles.keyButton}
                onPress={promptBiometrics}
              >
                <Text style={styles.keyBio}>
                  {biometricLabel === 'Face ID' ? '👤' : '👆'}
                </Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={keyIndex}
              style={styles.keyButton}
              onPress={() => handleKeyPress(key)}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/konios-logomark-set/koinos-logomark-white@large.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Koinos Wallet</Text>
      </View>

      <View style={styles.pinSection}>
        <Text style={styles.subtitle}>Enter your PIN</Text>
        <Animated.View
          style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}
        >
          {renderDots()}
        </Animated.View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.keypad}>
        {renderKeypad()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
  },
  logo: {
    width: 70,
    height: 78,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  pinSection: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a9eff',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#4a9eff',
  },
  dotError: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 12,
  },
  keypad: {
    paddingHorizontal: 50,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
  },
  keySpecial: {
    fontSize: 24,
    color: '#888',
  },
  keyBio: {
    fontSize: 28,
  },
});
