import 'react-native';

declare module 'react-native' {
  interface ViewStyle {
    boxShadow?: string;
  }

  interface TextStyle {
    textShadow?: string;
  }
}
