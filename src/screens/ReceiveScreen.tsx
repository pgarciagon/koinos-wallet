import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { copyToClipboard, showAlert } from '../utils/platform';

export default function ReceiveScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { address, token = 'KOIN' } = route.params;

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      showAlert('Copied', 'Address copied to clipboard');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Deposit {token}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Scan this QR code or copy the address below to deposit {token}
        </Text>

        <View style={styles.qrContainer}>
          <View style={styles.qrBackground}>
            <QRCode
              value={address}
              size={200}
              backgroundColor="#ffffff"
              color="#1a1a2e"
            />
          </View>
        </View>

        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Your Address</Text>
          <Text style={styles.address} selectable>{address}</Text>
        </View>

        <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
          <Text style={styles.copyButtonText}>Copy Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#4a9eff',
    fontSize: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  instructions: {
    color: '#888',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  qrContainer: {
    marginBottom: 40,
  },
  qrBackground: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
  },
  addressContainer: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 30,
  },
  addressLabel: {
    color: '#888',
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  address: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 28,
  },
  copyButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
});
