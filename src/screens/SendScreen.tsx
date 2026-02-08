import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import koinosService, { KoinosService } from '../services/koinos';
import walletService from '../services/wallet';
import { showAlert } from '../utils/platform';

type SendScreenRouteParams = {
  Send: {
    token?: 'KOIN' | 'VHP';
  };
};

export default function SendScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<SendScreenRouteParams, 'Send'>>();
  const token = route.params?.token || 'KOIN';
  
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletReady, setWalletReady] = useState(false);
  const [fromAddress, setFromAddress] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manaEstimate, setManaEstimate] = useState<{ koin: string; percent: string } | null>(null);
  const [availableBalance, setAvailableBalance] = useState<string>('0');
  const [useFreeMana, setUseFreeMana] = useState(false);
  const [freeManaAvailable, setFreeManaAvailable] = useState(false);
  const [freeManaStatus, setFreeManaStatus] = useState<string>('checking...');
  const [userMana, setUserMana] = useState<{ current: string; max: string }>({ current: '0', max: '0' });
  const [maxLevel, setMaxLevel] = useState<0 | 1 | 2>(0);
  const maxSendableAmount = useRef('');

  const [permission, requestPermission] = useCameraPermissions();
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  const manaPercent = parseFloat(userMana.max) > 0
    ? parseFloat(userMana.current) / parseFloat(userMana.max)
    : 0;

  useEffect(() => {
    if (manaPercent < 1) {
      pulseAnim.setValue(0);
      const pulse = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(0);
    }
  }, [manaPercent < 1]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.5, 0.8, 0.5, 0.8, 0.5],
  });

  // Ensure wallet is loaded when screen mounts
  React.useEffect(() => {
    const loadWallet = async () => {
      try {
        const info = await walletService.loadWallet();
        if (info.hasWallet) {
          setWalletReady(true);
          const signer = walletService.getSigner();
          if (signer) {
            const addr = signer.getAddress();
            setFromAddress(addr);

            // Fetch available balance
            try {
              const bal = token === 'VHP'
                ? await koinosService.getVhpBalance(addr)
                : await koinosService.getBalance(addr);
              setAvailableBalance(bal);
            } catch (e) {
              if (__DEV__) console.error('Error fetching balance:', e);
            }

            // Check free mana sharer availability
            try {
              const freeStatus = await koinosService.getFreeManaAvailable();
              setFreeManaAvailable(freeStatus.available);
              setFreeManaStatus(freeStatus.available 
                ? `available (${parseFloat(freeStatus.mana).toFixed(2)} mana)` 
                : `unavailable (${freeStatus.mana} mana)`);
            } catch (e: any) {
              if (__DEV__) console.error('Error checking free mana:', e);
              setFreeManaStatus(`error: ${e.message || 'unknown'}`);
            }

            // Estimate mana cost
            try {
              const [estimate, mana] = await Promise.all([
                koinosService.estimateTransferCost(),
                koinosService.getMana(addr),
              ]);
              setUserMana(mana);
              const currentMana = parseFloat(mana.current);
              const estimateKoin = parseFloat(estimate.koinEstimate);
              const percent = currentMana > 0
                ? (estimateKoin / currentMana * 100).toFixed(1)
                : '?';
              setManaEstimate({
                koin: estimateKoin.toFixed(4),
                percent,
              });
            } catch (e) {
              if (__DEV__) console.error('Error estimating mana:', e);
            }
          }
        } else {
          setError('No wallet found. Please create or import a wallet first.');
        }
      } catch (err: any) {
        setError('Failed to load wallet: ' + err.message);
      }
    };
    loadWallet();
  }, []);

  // Auto-detect if free mana is needed when amount changes
  // Free mana works for both KOIN and VHP transfers (payer = free mana sharer contract)
  React.useEffect(() => {
    if (!fromAddress || !manaEstimate) return;
    const normalizedAmount = amount.replace(',', '.');
    const sendAmt = parseFloat(normalizedAmount) || 0;
    const manaCost = parseFloat(manaEstimate.koin);
    const currentMana = parseFloat(userMana.current);

    if (token === 'KOIN') {
      // Self-pay RC cost = transferAmount + txFee. Enable free mana when that exceeds available mana.
      const needs = (sendAmt + manaCost * 1.5) > currentMana && sendAmt > 0;
      setUseFreeMana(needs && freeManaAvailable);
    } else {
      const needs = currentMana < manaCost * 3 && sendAmt > 0;
      setUseFreeMana(needs && freeManaAvailable);
    }
  }, [amount, manaEstimate, userMana, availableBalance, token, freeManaAvailable, fromAddress]);

  // Calculate how long until mana recharges to a target amount
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000; // 432,000,000 ms
  const getManaRechargeTime = (targetAmount: number): string | null => {
    const currentMana = parseFloat(userMana.current);
    const maxMana = parseFloat(userMana.max); // = KOIN balance
    if (targetAmount <= currentMana) return null; // already have enough
    if (targetAmount > maxMana) return null; // will never reach it
    // Mana regens linearly: 0 → maxMana over 5 days
    // Rate = maxMana / FIVE_DAYS_MS per ms
    const deficit = targetAmount - currentMana;
    const regenRate = maxMana / FIVE_DAYS_MS; // mana per ms
    if (regenRate <= 0) return null;
    const msNeeded = deficit / regenRate;
    const hours = Math.floor(msNeeded / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days > 0) {
      return `~${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      const mins = Math.floor((msNeeded % (1000 * 60 * 60)) / (1000 * 60));
      return `~${hours}h ${mins}m`;
    } else {
      const mins = Math.ceil(msNeeded / (1000 * 60));
      return `~${mins}m`;
    }
  };

  const validateInputs = (): boolean => {
    setError(null);

    if (!toAddress.trim()) {
      setError('Please enter a recipient address');
      return false;
    }

    if (!KoinosService.isValidAddress(toAddress.trim())) {
      setError('Invalid Koinos address format');
      return false;
    }

    const normalizedAmount = amount.replace(',', '.');
    const amountNum = parseFloat(normalizedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    // KOIN contract enforces: from.mana >= transfer_amount (regardless of payer).
    // The user can only send up to their current mana in KOIN.
    if (token === 'KOIN') {
      const currentMana = parseFloat(userMana.current);
      if (amountNum > currentMana) {
        const rechargeTime = getManaRechargeTime(amountNum);
        const timeMsg = rechargeTime ? ` You can send ${amountNum} KOIN in ${rechargeTime}.` : '';
        const maxBalance = parseFloat(userMana.max);
        const overBalance = amountNum > maxBalance ? ` (exceeds your balance of ${maxBalance.toFixed(4)} KOIN)` : '';
        setError(`Amount exceeds your available mana (${currentMana.toFixed(4)} KOIN).${overBalance}${timeMsg} Mana regenerates over 5 days up to your KOIN balance.`);
        return false;
      }
      // When paying own mana (no free mana), also reserve mana for the tx fee
      if (manaEstimate && !useFreeMana) {
        const remaining = currentMana - amountNum;
        const manaCost = parseFloat(manaEstimate.koin);
        if (remaining < manaCost) {
          setError(`Insufficient mana after transfer for tx fee. You need to keep ≈${manaCost.toFixed(4)} KOIN of mana. Max send: ${(currentMana - manaCost * 1.5).toFixed(4)} KOIN`);
          return false;
        }
      }
    }

    return true;
  };

  const executeSend = async () => {
    const signer = walletService.getSigner();
    if (!signer) {
      setError('Wallet not loaded. Please restart the app.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const normalizedAmount = amount.replace(',', '.');
      const result = token === 'VHP' 
        ? await koinosService.sendVhp(signer, toAddress.trim(), normalizedAmount, { useFreeMana })
        : await koinosService.sendKoin(signer, toAddress.trim(), normalizedAmount, { useFreeMana });

      showAlert(
        'Success',
        `Transaction sent!\n\nTx ID: ${result.transactionId.substring(0, 20)}...`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      showAlert('Transaction Failed', err.message || 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!validateInputs()) return;

    const signer = walletService.getSigner();
    if (!signer) {
      setError('Wallet not loaded. Please restart the app.');
      return;
    }

    const freeManaNote = useFreeMana ? '\n\n⚡ Using free mana' : '';
    showAlert(
      'Confirm Transaction',
      `Send ${amount.replace(',', '.')} ${token} to ${toAddress.substring(0, 16)}...?${freeManaNote}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: executeSend },
      ]
    );
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showAlert('Permission Required', 'Camera permission is required to scan QR codes');
        return;
      }
    }
    setScanned(false);
    setShowScanner(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    // Check if it's a valid Koinos address
    if (KoinosService.isValidAddress(data)) {
      setToAddress(data);
      setShowScanner(false);
    } else {
      showAlert('Invalid QR Code', 'The scanned QR code does not contain a valid Koinos address');
      setScanned(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Send {token}</Text>

        {fromAddress && (
          <>
            <Text style={styles.fromLabel}>From:</Text>
            <View style={styles.fromBox}>
              <Text style={styles.fromAddress}>{fromAddress}</Text>
            </View>
          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Koinos address"
            placeholderTextColor="#666"
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.amountLabelRow}>
            <Text style={[styles.label, { marginBottom: 0 }]}>Amount ({token})</Text>
            <View style={styles.availableRow}>
              <Text style={styles.availableText}>{parseFloat(availableBalance).toFixed(4)}</Text>
              <TouchableOpacity onPress={() => {
                if (token === 'KOIN') {
                  const bal = parseFloat(availableBalance);
                  const currentMana = parseFloat(userMana.current);
                  if (maxLevel === 0) {
                    // MAX always uses free mana when available — ensures the full mana-capped amount is sendable
                    const willUseFreeMana = freeManaAvailable;
                    let maxSend = Math.min(bal, currentMana);
                    if (!willUseFreeMana && manaEstimate) {
                      const reserve = parseFloat(manaEstimate.koin) * 1.5;
                      maxSend = Math.max(maxSend - reserve, 0);
                    }
                    const amt = maxSend.toFixed(8);
                    maxSendableAmount.current = amt;
                    setAmount(amt);
                    if (willUseFreeMana) {
                      setUseFreeMana(true);
                    }
                    if (bal > currentMana) {
                      setMaxLevel(1);
                    }
                  } else if (maxLevel === 1) {
                    setAmount(bal.toFixed(8));
                    setMaxLevel(2);
                    const rechargeTime = getManaRechargeTime(bal);
                    setError(`Cannot send yet. Your mana (${currentMana.toFixed(4)}) is below the transfer amount (${bal.toFixed(4)} KOIN).${rechargeTime ? ` Wait ${rechargeTime} for mana to regenerate.` : ''} Mana recharges linearly over 5 days.`);
                  } else if (maxLevel === 2) {
                    setAmount(maxSendableAmount.current);
                    setMaxLevel(1);
                    setError(null);
                  }
                } else {
                  setAmount(availableBalance);
                }
              }}>
                <Text style={[styles.maxButton, maxLevel === 2 && token === 'KOIN' && styles.maxButtonOverride]}>MAX</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0.00000000"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={(text) => { setAmount(text); setMaxLevel(0); setError(null); }}
            keyboardType="decimal-pad"
          />
        </View>

        {token === 'KOIN' && (
          <View style={styles.batterySection}>
            <Text style={styles.batteryLabel}>Mana</Text>
            <View style={styles.batteryContainer}>
              <View style={styles.manaBar}>
                {(() => {
                  const maxFill = 152;
                  const glowWidth = 4;
                  const gap = 2;
                  const fillPx = manaPercent >= 1
                    ? maxFill
                    : Math.round(manaPercent * (maxFill - gap - glowWidth));
                  const glowLeft = 2 + fillPx + gap;
                  const fillColor = manaPercent < 0.25
                    ? 'rgba(255, 60, 60, 0.45)'
                    : 'rgba(40, 167, 69, 0.45)';
                  const glowColor = manaPercent < 0.25
                    ? 'rgba(255, 60, 60, 0.45)'
                    : 'rgba(40, 167, 69, 0.45)';
                  return (
                    <>
                      <View
                        style={[
                          styles.manaFill,
                          { width: fillPx, backgroundColor: fillColor },
                        ]}
                      />
                      {manaPercent > 0 && manaPercent < 1 && (
                        <Animated.View
                          style={[
                            styles.manaGlow,
                            {
                              left: glowLeft,
                              width: glowWidth,
                              backgroundColor: glowColor,
                              opacity: glowOpacity,
                            },
                          ]}
                        />
                      )}
                    </>
                  );
                })()}
                <Text style={styles.manaBarText}>
                  {Math.round(manaPercent * 100)}%
                </Text>
              </View>
              <View style={styles.batteryCap} />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.sendButton, 
            token === 'VHP' && styles.sendButtonVhp,
            (sending || !walletReady) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={sending || !walletReady}
          testID="send-button"
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : !walletReady ? (
            <Text style={styles.sendButtonText}>Loading wallet...</Text>
          ) : (
            <Text style={styles.sendButtonText}>Send {token}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={sending}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerHeader}>
                <TouchableOpacity
                  style={styles.closeScannerButton}
                  onPress={() => setShowScanner(false)}
                >
                  <Text style={styles.closeScannerText}>✕ Close</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.scannerFrame}>
                <View style={styles.scannerCorner} />
              </View>
              <Text style={styles.scannerHint}>
                Position the QR code within the frame
              </Text>
            </View>
          </CameraView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  fromBox: {
    backgroundColor: '#16213e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  fromLabel: {
    color: '#888',
    fontSize: 20,
    marginBottom: 6,
  },
  fromAddress: {
    color: '#4a9eff',
    fontSize: 20,
    fontFamily: 'monospace',
  },
  errorBox: {
    backgroundColor: '#3d1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  amountLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availableText: {
    color: '#888',
    fontSize: 14,
  },
  maxButton: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '700',
  },
  maxButtonOverride: {
    color: '#ff6b6b',
  },
  label: {
    color: '#888',
    fontSize: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithButton: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    padding: 16,
    color: '#fff',
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
    borderRightWidth: 0,
  },
  scanButton: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 20,
  },
  batterySection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  batteryLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manaBar: {
    backgroundColor: '#16213e',
    borderRadius: 5,
    height: 26,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  batteryCap: {
    width: 5,
    height: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    marginLeft: 0,
  },
  manaFill: {
    position: 'absolute',
    left: 2,
    top: 2,
    bottom: 2,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  manaGlow: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  manaBarText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    zIndex: 1,
  },
  sendButton: {
    backgroundColor: '#4a9eff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonVhp: {
    backgroundColor: '#9b59b6',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 20,
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  scannerHeader: {
    paddingTop: 40,
    alignItems: 'flex-end',
  },
  closeScannerButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  closeScannerText: {
    color: '#fff',
    fontSize: 16,
  },
  scannerFrame: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4a9eff',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scannerCorner: {
    // Decorative corners could be added here
  },
  scannerHint: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    paddingBottom: 40,
  },
});
