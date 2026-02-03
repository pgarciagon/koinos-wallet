import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CreateWalletScreen from './src/screens/CreateWalletScreen';
import ImportWalletScreen from './src/screens/ImportWalletScreen';
import walletService from './src/services/wallet';

export type RootStackParamList = {
  Welcome: undefined;
  CreateWallet: undefined;
  ImportWallet: undefined;
  Home: undefined;
  Send: undefined;
  Receive: { address: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      const hasWallet = await walletService.hasWallet();
      setInitialRoute(hasWallet ? 'Home' : 'Welcome');
    };
    checkWallet();
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4a9eff" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a2e' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
        <Stack.Screen name="ImportWallet" component={ImportWalletScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Send" component={SendScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
