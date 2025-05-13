import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

// Make sure the app is registered with the name 'main'
AppRegistry.registerComponent('main', () => App);

// Also keep the registerRootComponent for compatibility
registerRootComponent(App);
