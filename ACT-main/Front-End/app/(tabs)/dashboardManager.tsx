import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList, Modal, TouchableOpacity, Pressable, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { db } from './config/firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // For generating random ClientID
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

const DashboardManager = () => {
  const navigation = useNavigation();
  
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDetails, setClientDetails] = useState('');
  const [clientCredit, setClientCredit] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null); // Track client for editing
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // Track delete modal visibility
  const [clientToDelete, setClientToDelete] = useState(null); // Track client to delete
  const [addCreditModalVisible, setAddCreditModalVisible] = useState(false); // Track add credit modal visibility
  const [creditToAdd, setCreditToAdd] = useState(5000); // Track amount of credit to add

  const auth = getAuth();
  const managerId = auth.currentUser?.uid; // Manager's UID

  useEffect(() => {
    const fetchClients = async () => {
      if (!managerId) return;

      try {
        const clientsQuery = query(collection(db, 'Clients'), where('ManagerID', '==', managerId));
        const querySnapshot = await getDocs(clientsQuery);

        const clientList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setClients(clientList);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [managerId]);

  const refreshClients = async () => {
    if (!managerId) return;

    try {
      const clientsQuery = query(collection(db, 'Clients'), where('ManagerID', '==', managerId));
      const querySnapshot = await getDocs(clientsQuery);

      const clientList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClients(clientList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEditClient = async () => {
    // Generate a random ClientID if none is provided
    const generatedClientId = clientId || uuidv4().substring(0, 8); // Use only the first 8 characters for brevity
  
    const clientData = {
      ClientID: generatedClientId, // Use the generated ID
      ManagerID: managerId,
      ClientName: clientName,
      ClientDetails: clientDetails,
      Credit: parseFloat(clientCredit),
    };
  
    try {
      if (selectedClient) {
        // Update existing client
        const clientDoc = doc(db, 'Clients', selectedClient.id);
        await updateDoc(clientDoc, clientData);
        Alert.alert('Success', 'Client updated successfully!');
      } else {
        // Add new client
        await addDoc(collection(db, 'Clients'), clientData);
        Alert.alert('Success', 'Client added successfully!');
      }
  
      setClientId(''); // Clear fields
      setClientName('');
      setClientDetails('');
      setClientCredit('');
      setSelectedClient(null);
      refreshClients();
    } catch (error) {
      console.error('Error saving client:', error);
      Alert.alert('Error', 'There was an error while saving the client.');
    }
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setClientId(client.ClientID);
    setClientName(client.ClientName);
    setClientDetails(client.ClientDetails);
    setClientCredit(client.ClientCredit);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      const clientDoc = doc(db, 'Clients', clientToDelete.id);
      await deleteDoc(clientDoc);

      setClients(clients.filter((client) => client.id !== clientToDelete.id));
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Client deleted successfully!');
    } catch (error) {
      console.error('Error deleting client:', error);
      Alert.alert('Error', 'There was an error while deleting the client.');
    }
  };

  const handleAddCredit = async () => {
    if (!selectedClient || !creditToAdd) return;

    try {
      const clientDoc = doc(db, 'Clients', selectedClient.id);
      const currentCredit = parseFloat(selectedClient.Credit || 0);
      const newCredit = currentCredit + parseFloat(creditToAdd);

      await updateDoc(clientDoc, { Credit: newCredit });

      // Update the credit in the UI
      setClientCredit(newCredit.toString());
      setAddCreditModalVisible(false);
      Alert.alert('Success', 'Credit added successfully!');
      if (Platform.OS === 'web'){
        window.alert('Success! Credit added successfully!');
      }
      refreshClients();
    } catch (error) {
      console.error('Error adding credit:', error);
      Alert.alert('Error', 'There was an error while adding credit.');
      if (Platform.OS === 'web'){
        window.alert('Error: There was an error while adding credit.');
      }
    }
  };

  const renderClientItem = ({ item }) => (
    <View style={styles.clientItem}>
      <Text style={styles.clientName}>{item.ClientName}</Text>
      <Text>{item.ClientDetails}</Text>
      <Text>Credit: ${parseFloat(item.Credit || 0).toFixed(2)}</Text>
      <View style={styles.buttonContainer}>
        <View style={styles.leftButtonGroup}>
          <Button title="Edit" onPress={() => handleEditClient(item)} />
          <View style={styles.buttonSpacer} />
          <Button
            title="Buy Crypto"
            onPress={() => navigation.navigate('BuyCryptoManager', { clientID: item.ClientID })}
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Buy Stock"
            onPress={() => navigation.navigate('BuyStockManager', { clientID: item.ClientID })}
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Manage Portfolio"
            onPress={() => navigation.navigate('ManagePortfolioClient', { clientID: item.ClientID })}
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Add Credit"
            onPress={() => {
              setSelectedClient(item);
              setAddCreditModalVisible(true);
            }}
          />
        </View>
        <Button
          title="Delete"
          color="red"
          onPress={() => {
            setClientToDelete(item);
            setDeleteModalVisible(true);
          }}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>{selectedClient ? 'Edit Client' : 'Add New Client'}</Text>
      <Text>Client Name:</Text>
      <TextInput
        style={styles.input}
        value={clientName}
        onChangeText={setClientName}
        placeholder="Enter Client Name"
      />
      <Text>Client Details:</Text>
      <TextInput
        style={styles.input}
        value={clientDetails}
        onChangeText={setClientDetails}
        placeholder="Enter Client Details (Optional)"
      />
      <Button
        title={selectedClient ? 'Update Client' : 'Add Client'}
        onPress={handleAddOrEditClient}
      />

      <Text style={styles.header}>Existing Clients</Text>
      {loading ? (
        <Text>Loading clients...</Text>
      ) : (
        <FlatList
          data={clients}
          renderItem={renderClientItem}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Add Credit Modal */}
      <Modal transparent visible={addCreditModalVisible} animationType="fade">
        <Pressable style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Credit</Text>
              <TextInput
                style={styles.input}
                value={creditToAdd}
                onChangeText={(text) => setCreditToAdd(text)} // Update state on every change
                placeholder="Enter amount to add"
                keyboardType="numeric"
              />
              <PayPalScriptProvider options={{ clientId: 'ARBjhm4LTjPyHWE5k_-BcosNlZV-0s56jxBPChiP7bFtMmfv17M8O6A-ci-7eycUV5Etf0EGX06ZnWmh' }}>
                <PayPalButtons
                  style={{ layout: 'vertical' }}
                  createOrder={(data, actions) => {
                    const amount = parseInt(creditToAdd) || 0; // Ensure that the value is a valid number, default to 0 if not
                    console.log('Parsed Amount:', amount);  // Log for debugging
                    if (amount <= 0) {
                      Alert.alert('Error', 'Please enter a valid amount greater than zero.');
                      throw new Error('Invalid amount');
                    }
                  
                    return actions.order.create({
                      intent: 'CAPTURE',
                      purchase_units: [
                        {
                          amount: {
                            currency_code: 'USD',
                            value: amount.toFixed(2),  // Ensure it's formatted as a string with two decimal places
                          },
                        },
                      ],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    try {
                      const details = await actions.order.capture();
                      const amount = parseFloat(creditToAdd) || 0;  // Parse amount again in case user input changes
                      handleAddCredit(amount);  // Add credit to the account
                    } catch (error) {
                      console.error('Error capturing order:', error);
                      Alert.alert('Error', 'There was an issue completing the payment.');
                    }
                  }}
                  onError={(error) => {
                    console.error('PayPal error:', error);
                    Alert.alert('Error', 'There was an issue with the PayPal payment process.');
                  }}
                />
              </PayPalScriptProvider>
              <View style={styles.modalButtonContainer}>
                <Button title="Cancel" onPress={() => setAddCreditModalVisible(false)} />
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>


      {/* Delete Confirmation Modal */}
      <Modal transparent visible={deleteModalVisible} animationType="fade">
      <Pressable style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Are you sure you want to delete this client?
            </Text>
            <View style={styles.modalButtonContainer}>
              <Button
                title="Cancel"
                onPress={() => setDeleteModalVisible(false)}
              />
              <Button title="Delete" color="red" onPress={handleDeleteClient} />
            </View>
          </View>
        </View>
      </Pressable>
      </Modal>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e0e0e0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign : 'center',
    paddingTop: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  clientItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  clientName: {
    fontWeight: 'bold',
  },
  Buttonstyle: {
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  leftButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacer: {
    width: '5%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#007bff', // Red shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
});

export default DashboardManager;
