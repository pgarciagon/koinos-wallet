// Polyfills must be imported first for crypto operations
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Polyfill crypto.subtle for React Native
// react-native-get-random-values adds self.crypto.getRandomValues but NOT subtle.
// @noble/secp256k1 detects self.crypto and tries to use subtle.importKey/sign/digest
// which are undefined in React Native, causing "Cannot read property 'importKey' of undefined".
// This polyfill provides minimal subtle implementations using pure JS @noble/hashes.
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';

if (typeof self !== 'undefined' && self.crypto && !self.crypto.subtle) {
  (self.crypto as any).subtle = {
    async digest(
      algorithm: string | { name: string },
      data: ArrayBuffer,
    ): Promise<ArrayBuffer> {
      const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
      if (name === 'SHA-256') {
        return sha256(new Uint8Array(data)).buffer as ArrayBuffer;
      }
      throw new Error(`Unsupported digest algorithm: ${name}`);
    },
    async importKey(
      _format: string,
      keyData: ArrayBuffer,
      _algorithm: unknown,
      _extractable: boolean,
      _usages: string[],
    ): Promise<{ keyData: Uint8Array }> {
      return { keyData: new Uint8Array(keyData) };
    },
    async sign(
      _algorithm: string | { name: string },
      key: { keyData: Uint8Array },
      data: ArrayBuffer,
    ): Promise<ArrayBuffer> {
      return hmac(sha256, key.keyData, new Uint8Array(data)).buffer as ArrayBuffer;
    },
  };
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
