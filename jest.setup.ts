import '@testing-library/jest-native/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
	require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

try {
	require('react-native/Libraries/Animated/NativeAnimatedHelper');
	jest.doMock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch {
	// Module not present in this RN/Expo version.
}
