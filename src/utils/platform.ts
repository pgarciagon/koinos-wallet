import { Alert, Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

/**
 * Cross-platform alert helper
 * Uses window.alert/confirm on web, Alert.alert on native
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: Array<{
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }>
) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      // For confirmation dialogs on web, find the non-cancel button
      const confirmButton = buttons.find(b => b.style !== 'cancel');
      const confirmed = (window as any).confirm(`${title}${message ? '\n\n' + message : ''}`);
      if (confirmed && confirmButton?.onPress) {
        confirmButton.onPress();
      } else {
        const cancelButton = buttons.find(b => b.style === 'cancel');
        cancelButton?.onPress?.();
      }
    } else {
      (window as any).alert(`${title}${message ? '\n\n' + message : ''}`);
      // Call the single button's onPress if it exists
      if (buttons?.[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

/**
 * Cross-platform clipboard copy
 * Uses navigator.clipboard on web, Clipboard module on native
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      await (navigator as any).clipboard.writeText(text);
    } else {
      Clipboard.setString(text);
    }
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Cross-platform clipboard read
 * Uses navigator.clipboard on web, Clipboard module on native
 */
export const readFromClipboard = async (): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      return await (navigator as any).clipboard.readText();
    } else {
      return await Clipboard.getString();
    }
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    return '';
  }
};
