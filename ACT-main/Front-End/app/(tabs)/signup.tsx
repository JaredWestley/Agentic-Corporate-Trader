import { Link } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';  
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { auth, db } from './config/firebaseConfig'
type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('Admin');

  const navigation = useNavigation<SignUpScreenNavigationProp>();
  


  const handleSignUp = async () => {
    const db = getFirestore(); // Initialize Firestore

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      // Create a new user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (Platform.OS === 'web') {
        setUserType('Manager')
      }
      else {
        setUserType('Admin')
      }

      // Add user data to Firestore
      await addDoc(collection(db, 'Users'), {
        UserID: user.uid,
        Name: name,
        Email: email,
        RegistrationDate: new Date(),
        UserType: userType,
        Premium: false,
        Credit: 0,
      });

      // Send email verification after successful sign up
      await sendEmailVerification(user);

      // Alert the user about the successful signup
      if (Platform.OS === 'web') {
        window.alert(`Sign Up Successful: A verification email has been sent to ${user.email}. Please verify your email.`);
      }
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        Alert.alert('Sign Up Successful', `A verification email has been sent to ${user.email}. Please verify your email.`);
      }
      console.log('User signed up and data stored:', user);

    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred';
      if (Platform.OS === 'web') {
        window.alert(`Sign Up Failed: ${errorMessage}`);
      }
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        Alert.alert('Sign Up Failed', errorMessage);
      }
      console.error('Error signing up:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.logoText}>ACT Sign Up</Text>
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
            onChangeText={val => setEmail(val)}
          />
        </View>

        <View style={styles.flexColumn}>
          <Text style={styles.label}>Name</Text>
        </View>
        <View style={styles.inputForm}>
          <TextInput
            placeholder="Enter your Name"
            style={styles.input}
            onChangeText={val => setName(val)}
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
            onChangeText={val => setPassword(val)}
          />
        </View>

        <View style={styles.flexColumn}>
          <Text style={styles.label}>Re-Enter Password</Text>
        </View>
        <View style={styles.inputForm}>
          <Svg width="20" height="20" viewBox="-64 0 512 512">
            <Path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0"/>
            <Path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0"/>
          </Svg>
          <TextInput
            placeholder="Confirm your Password"
            style={styles.input}
            secureTextEntry={true}
            onChangeText={val => setConfirmPassword(val)}
          />
        </View>

        <TouchableOpacity style={styles.buttonSubmit} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        
        <Text style={styles.signupText}>
          Already have an account? 
          <TouchableOpacity onPress={() => navigation.navigate('Login')}> 
            <Text style={styles.linkText}> Sign In</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e0e0', 
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
  buttonSubmit: {
    backgroundColor: '#151717',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
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
});