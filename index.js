// Import required modules
import { registerRootComponent } from 'expo';
import { AppRegistry, Platform } from 'react-native';
import App from './App';

// Make sure to register with 'main' name for standalone builds and Expo
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  AppRegistry.registerComponent('main', () => App);
  console.log('Registered app with name: main');
} 

// This ensures Expo Go also works properly
registerRootComponent(App);

// For debugging
console.log('App entry point loaded, platform:', Platform.OS);
