import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ListsScreen from '../screens/ListsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size, focused }) => {
          let icon = 'list';
          if (route.name === 'Lists') icon = focused ? 'list' : 'list-outline';
          if (route.name === 'Subscriptions') icon = focused ? 'notifications' : 'notifications-outline';
          if (route.name === 'Settings') icon = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Lists"
        component={ListsScreen}
        options={{ title: 'Listy', headerShown: false }}
      />
      <Tab.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ title: 'Subskrypcje' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ustawienia' }} />
    </Tab.Navigator>
  );
}
