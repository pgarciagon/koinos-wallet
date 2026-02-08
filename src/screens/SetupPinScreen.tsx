import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';

interface SetupPinScreenProps {
  onComplete: (pin: string) => void;
  onCancel: () => void;
  /** If true, ask for current PIN first (for change PIN flow) */
  requireCurrent?: boolean;
  currentPinVerify?: (pin: string) => Promise<boolean>;
}

const PIN_LENGTH = 6;

type Phase = 'current' | 'enter' | 'confirm';

export default function SetupPinScreen({
  onComplete,
  onCancel,
  requireCurrent,
  currentPinVerify,
}: SetupPinScreenProps) {
  const [phase, setPhase] = useState<Phase>(requireCurrent ? 'current' : 'enter');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shakeAnim] = useState(new Animated.Value(0));

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

  const getTitle = () => {
    switch (phase) {
      case 'current': return 'Enter Current PIN';
      case 'enter': return 'Create a PIN';
      case 'confirm': return 'Confirm your PIN';
    }
  };

  const getSubtitle = () => {
    switch (phase) {
      case 'current': return 'Enter your current PIN to continue';
      case 'enter': return 'Choose a 6-digit PIN';
      case 'confirm': return 'Re-enter your PIN to confirm';
    }
  };

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    setError(null);

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      if (phase === 'current') {
        // Verify current PIN
        const valid = currentPinVerify ? await currentPinVerify(newPin) : false;
        if (valid) {
          setPin('');
          setPhase('enter');
        } else {
          shakeError();
          setError('Wrong PIN');
          setTimeout(() => setPin(''), 300);
        }
      } else if (phase === 'enter') {
        setFirstPin(newPin);
        setPin('');
        setPhase('confirm');
      } else {
        // Confirm phase
        if (newPin === firstPin) {
          onComplete(newPin);
        } else {
          shakeError();
          setError('PINs don\'t match. Try again.');
          setTimeout(() => {
            setPin('');
            setFirstPin('');
            setPhase('enter');
          }, 600);
        }
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
      ['', '0', 'del'],
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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pinSection}>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>
        <Animated.View
          style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}
        >
          {renderDots()}
        </Animated.View>
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Progress indicator */}
        <View style={styles.stepsContainer}>
          <View style={[styles.stepDot, (phase === 'enter' || phase === 'confirm') && styles.stepActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, phase === 'confirm' && styles.stepActive]} />
        </View>
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
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'flex-left' as any,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#4a9eff',
    fontSize: 18,
  },
  pinSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 28,
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
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  stepActive: {
    backgroundColor: '#4a9eff',
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: '#333',
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
});
