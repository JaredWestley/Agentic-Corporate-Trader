// Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Button, FlatList, Linking } from 'react-native';
import { auth, db } from './config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDocs, query, collection, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import axios from 'axios';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

type PortfolioItem = {
  AssetID: string;
  PortfolioID: string;
  PurchaseDate: any; // Firebase timestamp
  PurchasePrice: number;
  Quantity: number;
  Type: string;
  UserID: string;
  totalCost: number;
  chart: string;
  search_name: string;
  search_price: number;
  search_ticker: string;
  search_dayHigh: number;
  search_dayLow: number;
  search_dayRange: number;
  search_industry: string;
  search_percentage_change: number;
  search_chart: string;
};

export default function Dashboard() {
  const [userName, setUserName] = useState<string | null>(null);
  const [stocks, setStocks] = useState<any[]>([]); // To store the fetched stock data
  const [loading, setLoading] = useState<boolean>(true); // To track loading state
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]); // Store messages
  const [userID, setuserID] = useState('');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [currentPrices, setCurrentPrices] = useState<{ [key: string]: number }>({}); // Store current prices by AssetID
  const [currentPage, setCurrentPage] = useState(1);
  const [page, setPage] = useState<number>(0);

  const itemsPerPage = 6;

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
    setQuestion(''); // Clear question input when modal is closed.
  };

  const handleCallPress = () => {
    const phoneNumber = '+353871335404'; // Replace with the actual phone number
  
    // Validate phone number format (ensure it starts with 'tel:' and is valid)
    const isValidPhoneNumber = phoneNumber && phoneNumber.startsWith('+') && phoneNumber.length > 8;
    
    if (isValidPhoneNumber) {
      // Attempt to open the phone dialer
      Linking.openURL(`tel:${phoneNumber}`)
        .catch((err) => {
          console.error('Error occurred while trying to open the dialer:', err);
          Alert.alert('Error', 'Unable to open dialer');
        });
    } else {
      Alert.alert('Invalid phone number', 'Please check the phone number format.');
    }
  };

  const handleEmailPress = () => {
    const email = 'support@act-trading.com'; // Replace with the actual email address
    const subject = 'Subject Here'; // Optional: replace with your desired subject
    const body = 'Message body content here'; // Optional: replace with your email content
  
    // Construct the mailto URL
    const mailtoURL = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
    // Attempt to open the mail app
    Linking.openURL(mailtoURL)
      .catch((err) => {
        console.error('Error occurred while trying to open email client:', err);
        Alert.alert('Error', 'Unable to open email client');
      });
  };

  const handleAskQuestion = async () => {
    if (!question) {
      Alert.alert('Please enter a question');
      return;
    }

    // Add user's question to the conversation
    const newMessages = [...messages, { text: question, isUser: true }];
    setMessages(newMessages); // Update state with user's question
    setQuestion(''); // Clear the input field

    try {
      const response = await axios.post('http://45.13.119.55:5000/chatbot', {
        question: question,
      });

      if (response.data && response.data.answer) {
        // Add chatbot's answer to the conversation
        setMessages([...newMessages, { text: response.data.answer, isUser: false }]);
      } else {
        setMessages([...newMessages, { text: 'Sorry, I could not understand your question.', isUser: false }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([...newMessages, { text: 'Error occurred while fetching the answer.', isUser: false }]);
    }
  };

  const renderItem = ({ item }: { item: { text: string; isUser: boolean } }) => {
    return (
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userMessage : styles.chatbotMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, set the display name or fallback to email if displayName is not available
        fetchUserName(user.uid);
        setuserID(user.uid);
      } else {
        setUserName(null); // Clear username when logged out
      }
    });

    const fetchCurrentPrices = async (portfolioItems: PortfolioItem[]) => {
      const prices: { [key: string]: number } = {};
  
      for (const item of portfolioItems) {
        try {
          const response = await fetch(`http://45.13.119.55:5000/get-stock/${item.AssetID}`);
          const data = await response.json();
          prices[item.AssetID] = data.stocks.price || 0; // Assume API returns `currentPrice`
        } catch (error) {
          console.error(`Error fetching price for ${item.AssetID}:`, error);
          prices[item.AssetID] = 0; // Default to 0 if API fails
        }
      }
  
      setCurrentPrices(prices);
    };

    const fetchPortfolio = async () => {
          try {
            const user = auth.currentUser;
    
            if (user) {
              const portfolioRef = collection(db, 'Portfolios');
              const q = query(portfolioRef, where('UserID', '==', user.uid));
              setuserID(user.uid);
    
              const querySnapshot = await getDocs(q);
    
              console.log('Query snapshot:', querySnapshot);
    
              const portfolioItems: PortfolioItem[] = [];
              querySnapshot.forEach((doc) => {
                const item = doc.data() as PortfolioItem;
    
                if (item && item.AssetID && item.PortfolioID && item.PurchaseDate) {
                  portfolioItems.push(item);
                } else {
                  console.warn(`Skipping document ${doc.id} due to missing required properties.`);
                }
              });
    
              setPortfolio(portfolioItems);
              fetchCurrentPrices(portfolioItems);
            } else {
              console.error('No user is signed in.');
            }
          } catch (error) {
            console.error('Error fetching portfolio:', error);
          } finally {
            setLoading(false);
          }
        };

        fetchPortfolio();
    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  // Fetch stock data
  const fetchStockData = async () => {
    try {
      const response = await fetch('http://45.13.119.55:5000/stock-data');
      const data = await response.json();
      setStocks(data.stocks.slice(0, 6)); // Only take the first 6 stocks
      setLoading(false); // Set loading to false once data is fetched
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setLoading(false); // Set loading to false even if there is an error
    }
  };

  fetchStockData();

  const fetchUserName = async (uid: string) => {
    try {
      // Query Firestore Users collection for the document with a matching UID
      const q = query(collection(db, 'Users'), where('UserID', '==', uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // We found the matching document
        const userDoc = querySnapshot.docs[0]; // Get the first document that matches
        const userData = userDoc.data();
        setUserName(userData?.Name || userData?.email); // Fallback to email if name is not found
      } else {
        console.log('No user data found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const paginatedPortfolio = portfolio.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <ScrollView style={styles.container}>
      {/* Floating Help Button */}
      
      <TouchableOpacity style={styles.floatingButton} onPress={toggleModal}>
        <Text style={styles.floatingButtonText}>Help</Text>
      </TouchableOpacity>

      {/* Chatbot Modal */}
      <Modal
        visible={isModalVisible}
        onRequestClose={toggleModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <FlatList
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
              style={styles.chatList}
            />

            {/* User TextInput for asking questions */}
            <TextInput
              style={styles.input}
              placeholder="Enter your question"
              value={question}
              onChangeText={setQuestion}
            />

            <Button color={"blue"} title="Ask" onPress={handleAskQuestion} />

            <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.title}>
        {userName ? `Welcome, ${userName}` : 'Welcome to ACT (Agentic Corporate Trader)'}
      </Text>

      <Text style={styles.subtitle}>Portfolio</Text>
      <View style={styles.tilesContainer}>
        {/* Map through the first 6 stocks and display them */}
        {paginatedPortfolio.map((asset, index) => (
          <TouchableOpacity key={index} style={styles.tile}>
            <Text style={styles.tileTitle}>{asset.AssetID}</Text>
            <Text style={styles.tileValue}>${asset.PurchasePrice.toFixed(2)}</Text>
            <Text style={styles.tileTicker}>{asset.AssetID}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* <Text style={styles.featuresTitle}>Features</Text>
      <Text style={styles.features}>- Trade Stocks</Text>
      <Text style={styles.features}>- View Market Data</Text>
      <Text style={styles.features}>- Manage Portfolio</Text> */}

      

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.linkText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={handleCallPress}>
        <Text style={styles.linkText}>Request Help</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={handleEmailPress}>
        <Text style={styles.linkText}>Support</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('BuyStock')}>
        <Text style={styles.linkText}>Buy Stock</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('BuyCrypto')}>
        <Text style={styles.linkText}>Buy Crypto</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('ManagePortfolio')}>
        <Text style={styles.linkText}>Manage Portfolio</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2024 Agentic Corporate Trader</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', 
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tile: {
    backgroundColor: '#ffffff', // Dark grey tile color
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 5,
    flex: 1,
    minWidth: '45%',
    elevation: 3, // For Android shadow
    shadowColor: '#007bff', // Red shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tileValue: {
    fontSize: 16,
  },
  tileTicker: {
    fontSize: 14,
    color: '#888888', // Light grey text for the ticker
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff0000', // Red text color for features title
    marginTop: 20,
    marginBottom: 10,
  },
  features: {
    fontSize: 16,
    color: '#ffffff', // White text for features list
    marginBottom: 10,
  },
  footer: {
    fontSize: 14,
    color: '#888888', // Light grey footer text
    marginTop: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignSelf: 'center',
  },
  linkText: {
    color: '#ffffff', // White text for the links
    fontWeight: 'bold',
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContainer: {
    backgroundColor: '#e0e0e0',
    width: '100%',
    maxHeight: '50%', // Limit the height of the modal to half of the screen
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    paddingLeft: 10,
  },
  answerText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#ff0000',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#000',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: '#007bff',
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  chatbotMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  messageText: {
    color: '#000',
    fontSize: 16,
  },
  chatList: {
    flex: 1,
    marginBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 10,
    maxHeight: '80%',
  },
  askButton: {
    color: '007bff'
  }
});

