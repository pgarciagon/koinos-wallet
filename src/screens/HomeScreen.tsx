import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import koinosService from '../services/koinos';
import walletService from '../services/wallet';
import { showAlert, copyToClipboard } from '../utils/platform';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [vhpBalance, setVhpBalance] = useState<string>('0');
  const [mana, setMana] = useState<{ current: string; max: string }>({ current: '0', max: '0' });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<'KOIN' | 'VHP'>('KOIN');

  const loadData = useCallback(async () => {
    try {
      const walletInfo = await walletService.loadWallet();

      if (!walletInfo.hasWallet) {
        navigation.replace('Welcome');
        return;
      }

      setAddress(walletInfo.address);

      const [bal, vhp, rc] = await Promise.all([
        koinosService.getBalance(walletInfo.address),
        koinosService.getVhpBalance(walletInfo.address),
        koinosService.getMana(walletInfo.address),
      ]);

      setBalance(bal);
      setVhpBalance(vhp);
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

      const interval = setInterval(() => {
        loadData();
      }, 5000);

      return () => clearInterval(interval);
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

  const handleSettings = () => {
    navigation.navigate('Settings');
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

      <TouchableOpacity
        style={[styles.balanceCard, selectedToken === 'KOIN' && styles.balanceCardSelected]}
        onPress={() => setSelectedToken('KOIN')}
      >
        <Text style={styles.balanceLabel}>KOIN Balance</Text>
        <View style={styles.balanceValueRow}>
          <Text style={styles.balanceValue}>{parseFloat(balance).toFixed(3)}</Text>
          <Text style={styles.balanceSymbol}> KOIN</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.vhpCard, selectedToken === 'VHP' && styles.vhpCardSelected]}
        onPress={() => setSelectedToken('VHP')}
      >
        <Text style={styles.vhpLabel}>VHP Balance</Text>
        <View style={styles.vhpValueRow}>
          <Text style={styles.vhpBalanceValue}>{parseFloat(vhpBalance).toFixed(3)}</Text>
          <Text style={styles.vhpSymbol}> VHP</Text>
        </View>
      </TouchableOpacity>

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
          style={[styles.sendButton, selectedToken === 'VHP' && styles.sendButtonVhp]}
          onPress={() => navigation.navigate('Send', { token: selectedToken })}
        >
          <Text style={styles.buttonText}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.depositButton, selectedToken === 'VHP' && styles.depositButtonVhp]}
          onPress={() => navigation.navigate('Receive', { address, token: selectedToken })}
        >
          <Text style={[styles.buttonTextSecondary, selectedToken === 'VHP' && styles.buttonTextSecondaryVhp]}>Deposit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettings}
        >
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
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
    flexGrow: 1,
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
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  balanceCardSelected: {
    borderWidth: 2,
    borderColor: '#4a9eff',
  },
  balanceLabel: {
    color: '#888',
    fontSize: 14,
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceSymbol: {
    color: '#4a9eff',
    fontSize: 14,
  },
  vhpCard: {
    backgroundColor: '#1a2d4d',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  vhpCardSelected: {
    borderWidth: 2,
    borderColor: '#9b59b6',
  },
  vhpLabel: {
    color: '#888',
    fontSize: 14,
  },
  vhpValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  vhpBalanceValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  vhpSymbol: {
    color: '#9b59b6',
    fontSize: 14,
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
  depositButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4a9eff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  depositButtonVhp: {
    borderColor: '#9b59b6',
  },
  sendButtonVhp: {
    backgroundColor: '#9b59b6',
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4a9eff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonVhp: {
    borderColor: '#9b59b6',
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
  buttonTextSecondaryVhp: {
    color: '#9b59b6',
  },
  settingsSection: {
    marginTop: 'auto',
    paddingTop: 20,
    gap: 12,
  },
  settingsButton: {
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#4a9eff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
