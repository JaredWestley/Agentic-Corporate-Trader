import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, FlatList, ScrollView } from 'react-native';
import { auth } from './config/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import axios from 'axios';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from './config/firebaseConfig';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

interface Review {
  Name: string;
  id: string;
  UserID: string;
  Review: string;
  Timestamp: any; // Use `Date` or `FirebaseFirestore.Timestamp` if you know the exact type
}

const Profile = () => {
  const [currentEmail, setCurrentEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState(500);
  const [userID, setUserID] = useState('');
  const [userName, setUserName] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [currentCredit, setCurrentCredit] = useState(0); // State for current credit balance
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewInput, setReviewInput] = useState(''); // State for inputting a new review
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Load current user details on component mount
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentEmail(user.email || '');
      setResetEmail(user.email || '');
      setUserID(user.uid);
      fetchUserDetails(user.uid);
      fetchUserReviews(user.uid);
    }
  }, []);

  const fetchUserDetails = async (uid: string) => {
    try {
      const usersCollection = collection(db, 'Users');
      const q = query(usersCollection, where('UserID', '==', uid)); // Filter by UserID field
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; // Get the first (and ideally only) document from the query result
        const userData = userDoc.data();

        setIsPremium(userData.Premium || false); // Update local state based on premium status
        setCurrentCredit(userData.Credit || 0); // Set the current credit balance
        setUserName(userData.Name);
      } else {
        console.log("No matching user found with UserID: " + uid);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchUserReviews = (uid: string) => {
    const reviewsCollection = collection(db, 'Reviews');
    const q = query(reviewsCollection, where('UserID', '==', uid));
  
    // Fetch reviews in real-time using Firestore's onSnapshot
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData: Review[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Review, 'id'>), // Ensure the rest of the fields match Review type
      }));
      setReviews(reviewsData); // No more type mismatch
    });
  
    return unsubscribe; // Return unsubscribe function to clean up the listener
  };

  const handleAddReview = async () => {
    if (!reviewInput.trim()) {
      Alert.alert('Error', 'Please enter a review.');
      return;
    }

    try {
      const reviewsCollection = collection(db, 'Reviews');
      await addDoc(reviewsCollection, {
        Name: userName,
        UserID: userID,
        Review: reviewInput.trim(),
        Timestamp: new Date(),
      });

      setReviewInput(''); // Clear the input field
      Alert.alert('Success', 'Your review has been added.');
    } catch (error) {
      console.error('Error adding review:', error);
      Alert.alert('Error', 'Unable to add review. Please try again.');
    }
  };

  // Handle password reset via email
  const handlePasswordResetEmail = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      Alert.alert('Success', 'Password reset email sent successfully. Please check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Handle adding credit to account
  const handleAddCredit = async (amount: number) => {
    try {
      // if (isNaN(amount) || amount <= 0) {
      //   Alert.alert('Error', 'Invalid amount. Please enter a valid number.');
      //   return;
      // }
  
      // Query Firestore for the user document using the UserID
      const userRef = collection(db, 'Users');
      const q = query(userRef, where('UserID', '==', userID)); // Find user by UserID
  
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; // Assuming we get only one document
        const userDocRef = doc(db, 'Users', userDoc.id); // Get reference to that specific document
        const currentCredit = parseFloat(userDoc.data().Credit) || 0; // Parse credit as a number, fallback to 0 if undefined
        const creditAmount = 500;
  
        // Calculate new credit balance
        const newCredit = currentCredit + creditAmount;
  
        console.log('New Credit:', newCredit); // Debugging log
  
        // Update Firestore with the new credit balance
        await updateDoc(userDocRef, { Credit: newCredit });
  
        // Update the state with the new balance
        setCurrentCredit(newCredit);
        if (Platform.OS === 'web') {
          window.alert(`Top-Up successful! You added $${newCredit.toFixed(2)} to your account.`);
        } else {
          Alert.alert('Top-Up successful!', `You added $${newCredit.toFixed(2)} to your account.`);
        }
        setCreditAmount(0); // Clear the input field
      } else {
        Alert.alert('Error', 'User not found or invalid UserID.');
      }
    } catch (error) {
      console.error('Error adding credit:', error);
      Alert.alert('Error', 'Unable to add credit. Please try again.');
    }
  };
  
  
  

  const handleUpgradeToPremium = async () => {
    const premiumCost = 10; // Cost of premium upgrade

    if (currentCredit >= premiumCost) {
      try {
        const usersCollection = collection(db, 'Users');
        const q = query(usersCollection, where('UserID', '==', userID)); // Search for UserID in the collection
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]; // Assume the first document matches
          const userRef = doc(db, 'Users', userDoc.id); // Get the document reference from the query snapshot

          // Deduct premium cost from credit and update Premium status
          const newCredit = currentCredit - premiumCost;
          await updateDoc(userRef, { Premium: true, Credit: newCredit });
          setIsPremium(true); // Update local state
          setCurrentCredit(newCredit); // Update local credit balance
          Alert.alert('Success', 'Your account has been upgraded to Premium!');
        } else {
          console.log('No user found with the given UserID');
          Alert.alert('Error', 'Unable to find user document.');
        }
      } catch (error) {
        console.error('Error upgrading to premium:', error);
        Alert.alert('Error', 'Unable to upgrade to premium. Please try again.');
      }
    } else {
      Alert.alert('Insufficient Credit', 'You do not have enough credit to upgrade to Premium.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Display Current Email */}
          <Text style={styles.emailText}>Logged in as: {currentEmail}</Text>

          {/* Reset Password Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reset Password via Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.button} onPress={handlePasswordResetEmail}>
              <Text style={styles.buttonText}>Send Password Reset Email</Text>
            </TouchableOpacity>
          </View>

          {/* Upgrade Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upgrade Account</Text>
            <Text style={styles.statusText}>
              {isPremium ? 'Your account is already Premium.' : 'Upgrade to Premium for $10.00'}
            </Text>
            {!isPremium && (
              <TouchableOpacity style={styles.button} onPress={handleUpgradeToPremium}>
                <Text style={styles.buttonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Add Credit Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Credit</Text>
            <Text style={styles.statusText}>
              Current Credit: $
              {typeof currentCredit === 'number' ? currentCredit.toFixed(2) : '0.00'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount to add"
              value={creditAmount}
              onChangeText={(text) => setCreditAmount(text)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Name on Card"
              value={cardName}
              onChangeText={setCardName}
            />
            <TextInput
              style={styles.input}
              placeholder="Card Number"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="CVV"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Expiry Date (MM/YY)"
              value={expiryDate}
              onChangeText={setExpiryDate}
            />
            <TouchableOpacity style={styles.button} onPress={handleAddCredit}>
              <Text style={styles.buttonText}>Add Credit</Text>
            </TouchableOpacity>
          </View>

          {/* User Reviews Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Reviews</Text>
            <TextInput
              style={styles.input}
              placeholder="Write your review here"
              value={reviewInput}
              onChangeText={setReviewInput}
            />
            <TouchableOpacity style={styles.button} onPress={handleAddReview}>
              <Text style={styles.buttonText}>Submit Review</Text>
            </TouchableOpacity>
            <FlatList
              data={reviews}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewText}>{item.Review}</Text>
                  <Text style={styles.timestamp}>- {item.Name}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(item.Timestamp.toDate()).toLocaleString()}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  section: {
    marginVertical: 20,
    width: '100%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#007bff',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: '#000',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statusText: {
    color: '#000',
    fontSize: 16,
    marginBottom: 10,
  },
  reviewItem: {
    marginVertical: 8,
    width: '95%',
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  reviewText: {
    color: '#000',
    fontSize: 16,
  },
  timestamp: {
    color: '#888888',
    fontSize: 12,
    marginTop: 5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
});

export default Profile;
