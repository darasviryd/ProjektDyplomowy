import { GestureHandlerRootView } from 'react-native-gesture-handler';

const StackNavigator = require('./src/navigation/StackNavigator').default;

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StackNavigator />
    </GestureHandlerRootView>
  );
}
