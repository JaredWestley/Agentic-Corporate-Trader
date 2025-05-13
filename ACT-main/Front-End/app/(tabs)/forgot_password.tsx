import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './config/firebaseConfig';
import { Link } from 'expo-router'; // Import Link from expo-router
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigation = useNavigation<SignUpScreenNavigationProp>();

  const handleSubmit = () => {
    if (email === '') {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
        console.log('reset email sent');
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
        console.error('Password reset error:', error);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.logoText}>ACT Forgot Password</Text>
        <View style={styles.flexColumn}>
          <Text style={styles.label}>Email</Text>
        </View>
        <View style={styles.inputForm}>
          <TextInput
            placeholder="Enter your Email"
            style={styles.input}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <TouchableOpacity style={styles.buttonSubmit} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          An email will be sent to you. Follow the instructions to reset your password.
        </Text>

        <TouchableOpacity style={{marginLeft:'auto', marginRight:'auto', paddingTop:'3%'}} onPress={() => navigation.navigate('Login')}> 
            <Text style={styles.linkText }> Return to Sign In</Text>
        </TouchableOpacity>
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
  disclaimer: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12, 
    color: '#757575', 
  },
  signInLink: {
    color: '#2d79f3',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  linkText: {
    color: '#2d79f3',
    fontWeight: '500',
  },
});
