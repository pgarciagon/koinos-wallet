// Polyfills must be imported first for crypto operations
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
