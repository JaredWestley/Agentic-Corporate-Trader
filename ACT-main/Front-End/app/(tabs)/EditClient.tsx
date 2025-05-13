import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { db } from './config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';

type EditClientNavigationProp = StackNavigationProp<RootStackParamList, 'EditClient'>;

const EditClient = ({ route }) => {
  const { clientId } = route.params;
  const navigation = useNavigation<EditClientNavigationProp>();
  
  const [clientName, setClientName] = useState('');
  const [clientDetails, setClientDetails] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      const clientDoc = doc(db, 'Clients', clientId);
      const docSnapshot = await getDoc(clientDoc);

      if (docSnapshot.exists()) {
        setClientName(docSnapshot.data().clientName);
        setClientDetails(docSnapshot.data().clientDetails);
        setLoading(false);
      } else {
        Alert.alert('Error', 'Client data not found.');
        navigation.goBack();
      }
    };

    fetchClientData();
  }, [clientId, navigation]);

  const handleSave = async () => {
    if (!clientName || !clientDetails) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const clientDoc = doc(db, 'Clients', clientId);
      await updateDoc(clientDoc, {
        clientName: clientName,
        clientDetails: clientDetails,
      });
      navigation.goBack(); // Navigate back to the previous screen after saving
    } catch (error) {
      console.error('Error saving client data:', error);
      Alert.alert('Error', 'Could not save client data. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#ff0000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Client</Text>
      <Text>Name:</Text>
      <TextInput
        style={styles.input}
        value={clientName}
        onChangeText={setClientName}
      />
      <Text>Details:</Text>
      <TextInput
        style={styles.input}
        value={clientDetails}
        onChangeText={setClientDetails}
      />
      <Button title="Save" onPress={handleSave} />
      <Button title="Cancel" onPress={() => navigation.goBack()} color="gray" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000', // Black background for consistency
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff0000', // Red header color
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
    color: '#ffffff', // White text color for inputs
    backgroundColor: '#1a1a1a', // Dark background for inputs
    borderRadius: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});

export default EditClient;
