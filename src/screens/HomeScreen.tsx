import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import koinosService from '../services/koinos';
import walletService from '../services/wallet';
import { showAlert, copyToClipboard } from '../utils/platform';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [mana, setMana] = useState<{ current: string; max: string }>({ current: '0', max: '0' });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const walletInfo = await walletService.loadWallet();

      if (!walletInfo.hasWallet) {
        navigation.replace('Welcome');
        return;
      }

      setAddress(walletInfo.address);

      const [bal, rc] = await Promise.all([
        koinosService.getBalance(walletInfo.address),
        koinosService.getMana(walletInfo.address),
      ]);

      setBalance(bal);
      setMana(rc);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const copyAddress = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      showAlert('Copied', 'Address copied to clipboard');
    } else {
      showAlert('Error', 'Failed to copy address');
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;
  };

  const handleViewSeedPhrase = async () => {
    showAlert(
      'Security Warning',
      'Your seed phrase gives full access to your wallet. Never share it with anyone!\n\nMake sure no one is watching your screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show Seed Phrase',
          onPress: async () => {
            const phrase = await walletService.getSeedPhrase();
            if (phrase) {
              setSeedPhrase(phrase);
              setShowSeedPhrase(true);
            } else {
              showAlert(
                'Not Available',
                'Seed phrase is not available. This wallet was imported using a private key (WIF).'
              );
            }
          },
        },
      ]
    );
  };

  const handleCopySeedPhrase = async () => {
    if (seedPhrase) {
      const success = await copyToClipboard(seedPhrase);
      if (success) {
        showAlert('Copied', 'Seed phrase copied to clipboard. Make sure to clear your clipboard after use!');
      }
    }
  };

  const handleDeleteWallet = () => {
    showAlert(
      'Delete Wallet?',
      'Are you sure? Make sure you have backed up your seed phrase! This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await walletService.deleteWallet();
            navigation.replace('Welcome');
          },
        },
      ]
    );
  };

  const handleSettings = () => {
    showAlert(
      'Wallet Settings',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Seed Phrase',
          onPress: handleViewSeedPhrase,
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Image
            source={require('../../assets/koinos-logo-white.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Koinos Wallet</Text>
        </View>
        <TouchableOpacity onPress={copyAddress} style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Your Address</Text>
          <Text style={styles.address}>{formatAddress(address)}</Text>
          <Text style={styles.tapToCopy}>Tap to copy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>KOIN Balance</Text>
        <Text style={styles.balanceValue}>{parseFloat(balance).toFixed(8)}</Text>
        <Text style={styles.balanceSymbol}>KOIN</Text>
      </View>

      <View style={styles.manaCard}>
        <Text style={styles.manaLabel}>Mana (Resource Credits)</Text>
        <View style={styles.manaBar}>
          <View
            style={[
              styles.manaFill,
              {
                width: `${
                  parseFloat(mana.max) > 0
                    ? Math.min((parseFloat(mana.current) / parseFloat(mana.max)) * 100, 100)
                    : 0
                }%`,
              },
            ]}
          />
        </View>
        <Text style={styles.manaText}>
          {parseFloat(mana.current).toFixed(4)} / {parseFloat(mana.max).toFixed(4)}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => navigation.navigate('Send')}
        >
          <Text style={styles.buttonText}>Send KOIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.receiveButton}
          onPress={copyAddress}
        >
          <Text style={styles.buttonTextSecondary}>Receive</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingsOption}
          onPress={handleViewSeedPhrase}
        >
          <Text style={styles.settingsOptionText}>View Seed Phrase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsOption}
          onPress={handleDeleteWallet}
        >
          <Text style={styles.settingsOptionTextDanger}>Delete Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Seed Phrase Modal */}
      <Modal
        visible={showSeedPhrase}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSeedPhrase(null);
          setShowSeedPhrase(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Seed Phrase</Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Never share this phrase with anyone! Anyone with these words can access your funds.
              </Text>
            </View>

            <View style={styles.seedPhraseContainer}>
              {seedPhrase?.split(' ').map((word, index) => (
                <View key={index} style={styles.wordContainer}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.word}>{word}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopySeedPhrase}
            >
              <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSeedPhrase(null);
                setShowSeedPhrase(false);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addressContainer: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  addressLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  address: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  tapToCopy: {
    color: '#4a9eff',
    fontSize: 11,
    marginTop: 5,
  },
  balanceCard: {
    backgroundColor: '#0f3460',
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  balanceSymbol: {
    color: '#4a9eff',
    fontSize: 16,
    marginTop: 5,
  },
  manaCard: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  manaLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },
  manaBar: {
    height: 8,
    backgroundColor: '#0a0a1a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  manaFill: {
    height: '100%',
    backgroundColor: '#4a9eff',
    borderRadius: 4,
  },
  manaText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#4a9eff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  receiveButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4a9eff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#4a9eff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSection: {
    marginTop: 10,
    gap: 10,
  },
  settingsOption: {
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsOptionText: {
    color: '#4a9eff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsOptionTextDanger: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  warningBox: {
    backgroundColor: '#3d1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningText: {
    color: '#ff9999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  seedPhraseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  wordContainer: {
    backgroundColor: '#16213e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 90,
  },
  wordNumber: {
    color: '#4a9eff',
    fontSize: 11,
    marginRight: 6,
    fontWeight: '600',
  },
  word: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  copyButton: {
    backgroundColor: '#4a9eff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  closeButtonText: {
    color: '#888',
    fontSize: 16,
  },
});
