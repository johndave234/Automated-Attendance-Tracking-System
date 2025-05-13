import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App';

// Register with both methods to ensure coverage
AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);

export default App; 