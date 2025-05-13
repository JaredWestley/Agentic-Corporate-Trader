import React, { useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db, signInWithGooglePopup } from './config/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import AppNavigator from './AppNavigator';
import { registerRootComponent } from 'expo';
import { collection, doc, getDoc, getDocs, query, where, setDoc } from "firebase/firestore";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Dashboard from './dashboard';
import DashboardManager from './dashboardManager';
import SignUpScreen from './signup';
import Profile from './profile';
import BuyStock from './buyStock';
import BuyStockManager from './buyStockManager';
import BuyCrypto from './buyCrypto';
import BuyCryptoManager from './buyCryptoManager';
import EditClient from './EditClient';
import ManagePortfolio from './ManagePortfolio';
import ManagePortfolioClient from './ManagePortfolioClient';
import Reviews from './Reviews';
import ForgotPassword from './forgot_password';


// type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;



function LoginScreen({navigation}) {
  const [isRememberMeSelected, setIsRememberMeSelected] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const navigation = useNavigation<LoginScreenNavigationProp>();

  const toggleRememberMe = () => {
    setIsRememberMeSelected(!isRememberMeSelected);
  };

  const fetchUserRoleAndNavigate = async (uid: string) => {
    try {
      // Query Firestore Users collection for the document with a matching UID
      const q = query(collection(db, 'Users'), where('UserID', '==', uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // We found the matching document
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        const userRole = userData.UserType; // Assuming UserType is the role field

        // Navigate to the appropriate dashboard based on user role
        if (userRole === 'Manager' && Platform.OS === 'web') {
          navigation.navigate('DashboardManager', { managerID: uid });
          Alert.alert('Login successful', `Welcome ${userData.Name || userData.email}`);
        } else if (userRole === 'Admin' && Platform.OS === 'ios' || Platform.OS === 'android') {
          navigation.navigate('Dashboard');
          Alert.alert('Login successful', `Welcome ${userData.Name || userData.email}`);
        } else {
          Alert.alert(
            'Access Denied',
            'Please login on the appropriate platform for your role.'
          );
          if (Platform.OS === 'web') {
            window.alert('Access denied: Please login on the appropriate platform for your role!')
          }
          console.log('Access denied: User role or platform mismatch.');
        }

        // Alert.alert('Login successful', `Welcome ${userData.Name || userData.email}`);
      } else {
        console.log('No user data found');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      Alert.alert('Error', 'Failed to retrieve user data.');
      if (Platform.OS === 'web') {
        window.alert('Error: Failed to retrieve user data.');
      }
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore and navigate based on role
      await fetchUserRoleAndNavigate(user.uid);
    } catch (error) {
      console.error('Error logging in:', error);
      if (Platform.OS === 'web'){
        window.alert('Login Failed! Incorrect email or password');
      }
      Alert.alert('Login Failed', 'Incorrect email or password');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGooglePopup();
      const user = result.user;
      const userDoc = doc(db, 'Users', user.uid);
      const userSnapshot = await getDoc(userDoc);

      if (!userSnapshot.exists()) {
        // If user data does not exist, add it to Firestore
        await setDoc(userDoc, {
          UserID: user.uid,
          Name: user.displayName || 'Unknown', // Use display name if available
          Email: user.email,
          RegistrationDate: new Date(),
          UserType: "",
          Premium: false,
          Credit: 0,
        });

        console.log('User added to Firestore:', user.uid);
        Alert.alert('Welcome', `Welcome, ${user.displayName || 'User'}!`);
      } else {
        console.log('User already exists in Firestore');
      }

      navigation.navigate('Dashboard');
      window.alert(`Login successful, Welcome ${user.email}`);

    } catch (error) {
      console.error('Error with Google Sign-In:', error);
      window.alert(`Login Failed! Google Sign-In failed. Please try again.`);
      Alert.alert('Login Failed', 'Google Sign-In failed. Please try again.');
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.logoText}>ACT Login</Text>
        
        <View style={styles.flexColumn}>
          <Text style={styles.label}>Email</Text>
        </View>
        <View style={styles.inputForm}>
          <Svg width="20" height="20" viewBox="0 0 32 32">
            <G data-name="Layer 3">
              <Path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z"/>
            </G>
          </Svg>
          <TextInput
            placeholder="Enter your Email"
            style={styles.input}
            keyboardType="email-address"
            onChangeText={(val) => setEmail(val)}
          />
        </View>

        <View style={styles.flexColumn}>
          <Text style={styles.label}>Password</Text>
        </View>
        <View style={styles.inputForm}>
          <Svg width="20" height="20" viewBox="-64 0 512 512">
            <Path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0"/>
            <Path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0"/>
          </Svg>
          <TextInput
            placeholder="Enter your Password"
            style={styles.input}
            secureTextEntry={true}
            onChangeText={(val) => setPassword(val)}
          />
        </View>

        <View style={styles.flexRow}>
        <TouchableOpacity onPress={toggleRememberMe} style={styles.radioContainer}>
              <View
                style={[
                  styles.radio,
                  isRememberMeSelected && styles.radioSelected,
                ]}
              />
            </TouchableOpacity>
            <Text style={styles.rememberMe}>Remember me</Text>
          
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.buttonSubmit} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Google Sign-In Button */}
        <TouchableOpacity style={[styles.googleButton, ]} onPress={handleGoogleSignIn}>
          <Text style={styles.googleButtonText}>Sign In with Google</Text>
        </TouchableOpacity>

        {/* Review Button */}
        <TouchableOpacity style={[styles.reviewButton, ]} onPress={() => navigation.navigate('Reviews')}>
          <Text style={styles.reviewButtonText}>See Reviews</Text>
        </TouchableOpacity>
        
        <Text style={styles.signupText}>
          Don't have an account?{' '}
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e0e0', // Grey background
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 20,
    width: 450,
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
    }),
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#151717',
    marginBottom: 20,
    textAlign: 'left',
  },
  flexColumn: {
    flexDirection: 'column',
    marginBottom: 10,
  },
  label: {
    color: '#151717',
    fontWeight: '600',
  },
  inputForm: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#ecedec',
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    paddingLeft: 10,
    marginBottom: 10,
  },
  icon: {
    width: 20,
    height: 20,
  },
  input: {
    marginLeft: 10,
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderColor: 'transparent',
  },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2d79f3',
    backgroundColor: 'transparent',
  },
  radioSelected: {
    backgroundColor: '#2d79f3', // Fill color for selected state
  },
  rememberMe: {
    marginLeft: 0,
    fontSize: 14,
  },
  forgotPassword: {
    color: '#2d79f3',
    fontWeight: '500',
  },
  buttonSubmit: {
    backgroundColor: '#151717',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewButton: {
    backgroundColor: '#d9430d',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupText: {
    textAlign: 'center',
    fontSize: 14,
    marginVertical: 10,
  },
  linkText: {
    color: '#2d79f3',
    fontWeight: '500',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ededef',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    height: 50,
    width: '48%',
  },
  socialButtonText: {
    marginLeft: 10,
    fontWeight: '500',
  },
});

// // Root App Component
// const App = () => {
//   return <AppNavigator />; // Render AppNavigator
// };

// registerRootComponent(App); // Register the main component

const Stack = createStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="Profile" component={Profile} />


      <Stack.Screen name="BuyStock" component={BuyStock} />
      <Stack.Screen name="BuyCrypto" component={BuyCrypto} />
      <Stack.Screen name="ManagePortfolio" component={ManagePortfolio} />
      
      <Stack.Screen name="DashboardManager" component={DashboardManager} />
      <Stack.Screen name="EditClient" component={EditClient} />
      <Stack.Screen name="BuyStockManager" component={BuyStockManager} />
      <Stack.Screen name="BuyCryptoManager" component={BuyCryptoManager} />
      <Stack.Screen name="ManagePortfolioClient" component={ManagePortfolioClient} />

      <Stack.Screen name="Reviews" component={Reviews} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <MyStack/>
  );
}