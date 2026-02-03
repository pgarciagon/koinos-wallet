import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/koinos-logo-white.png')}
            style={styles.logo}
          />
        </View>
        <Text style={styles.title}>Koinos Wallet</Text>
        <Text style={styles.subtitle}>
          A simple wallet for the Koinos blockchain
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('CreateWallet')}
        >
          <Text style={styles.primaryButtonText}>Create New Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('ImportWallet')}
        >
          <Text style={styles.secondaryButtonText}>Import Existing Wallet</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Powered by koilib
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 100,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#16213e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  actions: {
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#4a9eff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4a9eff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4a9eff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    color: '#444',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20,
  },
});
