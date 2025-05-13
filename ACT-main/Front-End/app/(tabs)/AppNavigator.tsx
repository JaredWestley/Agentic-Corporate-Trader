// AppNavigator.tsx
import React, {useState} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './index'; // Adjust the import path if necessary
import Dashboard from './dashboard'; // Ensure the path to Dashboard.tsx is correct
import ForgotPassword from './forgot_password';
import SignUp from './signup';
import Profile from './profile';
import BuyStock from './buyStock';
import BuyCrypto from './buyCrypto';
import ManagePortfolio from './ManagePortfolio';
import { Text, TouchableOpacity } from 'react-native';
import { Menu, PaperProvider, Provider } from 'react-native-paper'
import {useAuth, AuthProvider} from './AuthProvider';
import { auth } from './config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const {user, isLoading } = useAuth();
  const [initialRoute, setInitialRoute] = React.useState<string | null> (null);
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleLogout = async () => {
    closeMenu();
    await auth.signOut();
    window.location.reload()
  }

  React.useEffect(() => {
    const getInitialRoute = async () => {
      const lastScreen = await AsyncStorage.getItem('lastScreen');
      setInitialRoute(lastScreen || (user ? 'Dashboard' : 'Login'));
    };
    getInitialRoute();
  }, [user]);

  if (isLoading || initialRoute === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Login' }}
        />
        <Stack.Screen
          name="Dashboard"
          component={Dashboard}
          options={{
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            // headerTitleAlign: 'center',
            headerRight: () => (
              <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={
                  <TouchableOpacity onPress={openMenu} style={{ marginRight: 15 }}>
                    <Text style={{ color: '#000' }}>Profile</Text>
                  </TouchableOpacity>
                }
              >
                <Menu.Item
                  onPress={() => {
                    console.log('View Profile');
                    closeMenu();
                  }}
                  title="View Profile"
                />
                <Menu.Item
                  onPress={handleLogout}
                  title="Logout"
                />
              </Menu>
            ),
            headerLeft: () => null,
          }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPassword}
          options={{ title: 'Forgot Password' }}
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUp}
          options={{ title: 'Sign Up' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={Profile}
          options={{ title: 'Profile' }}
        />
        <Stack.Screen 
          name="BuyStock" 
          component={BuyStock}
          options={{ title: 'Buy Stock' }}
        />
        <Stack.Screen 
          name="BuyCrypto" 
          component={BuyCrypto}
          options={{ title: 'Buy Crypto' }}
        />
        <Stack.Screen 
          name="ManagePortfolio" 
          component={ManagePortfolio}
          options={{ title: 'Manage Portfolio' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => (
  <AuthProvider>
    <PaperProvider>
      <AppNavigator />
      </PaperProvider>
  </AuthProvider>
);

export default App;