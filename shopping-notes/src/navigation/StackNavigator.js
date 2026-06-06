import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddItemScreen from '../screens/AddItemScreen';
import ListDetailsScreen from '../screens/ListDetailsScreen';
import LoginScreen from '../screens/LoginScreen';
import ReceiptImportScreen from '../screens/ReceiptImportScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* AUTH */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />

        {/* MAIN */}
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />

        {/* DETAILS */}
        <Stack.Screen
          name="ListDetails"
          component={ListDetailsScreen}
          options={{ title: 'Lista' }}
        />

        <Stack.Screen
          name="AddItem"
          component={AddItemScreen}
          options={{ title: 'Produkt' }}
        />

        <Stack.Screen
          name="ReceiptImport"
          component={ReceiptImportScreen}
          options={{ title: 'Paragon AI' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
