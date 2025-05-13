// BuyCrypto.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Pressable, TextInput, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { Image } from 'react-native';
import { doc, addDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from './config/firebaseConfig';
import { white } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

type BuyCryptoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BuyCrypto'>;

interface Crypto {
  name: string;
  price: number;
  symbol: string;
  day_high: number;
  day_low: number;
  day_range: number;
  percentage_change: number;
  chart: string;
}

interface RecommendationData {
  buy_hold_sell_recomendation: string;
  report: string;
  short_description: string;
}

export default function BuyCryptoManager({ route }: any) {
  const [recommendationModalVisible, setRecommendationModalVisible] = useState(false);
  const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [currentCredit, setCurrentCredit] = useState(0);
  const [userID, setUserID] = useState(route.params.clientID || '');
  const [page, setPage] = useState<number>(0);
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null);
  const [searchSymbol, setSearchSymbol] = useState<string>('');
  const [searchedCrypto, setSearchedCrypto] = useState<Crypto | null>(null);
  const navigation = useNavigation<BuyCryptoScreenNavigationProp>();
  const [quantity, setQuantity] = useState(1);
  const [unitamount, setUnitAmount] = useState("unit");

  const cryptosPerPage = 12;

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch('http://45.13.119.55:5000/crypto-data');
        const data = await response.json();
        const user = auth.currentUser;
        setCryptos(data.cryptos);
        setLoading(false);
        if (user) {
          // setUserID(user.uid);
          fetchUserDetails(userID);
        }
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, []);

  const fetchUserDetails = async (uid: string) => {
    try {
      const usersCollection = collection(db, 'Users');
      const q = query(usersCollection, where('UserID', '==', uid)); // Filter by UserID field
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; // Get the first (and ideally only) document from the query result
        const userData = userDoc.data();
      } else {
        console.log("No matching user found with UserID: " + uid);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchSymbol.trim()) {
      Alert.alert('Error', 'Please enter a valid ticker symbol');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://45.13.119.55:5000/get-stock/${searchSymbol}`);
      const data = await response.json();
      if (data.stocks) {
        setSearchedCrypto({
          name: data.stocks.name,
          price: data.stocks.price,
          symbol: searchSymbol.toUpperCase(),
          day_high: data.stocks.dayHigh,
          day_low: data.stocks.dayLow,
          day_range: data.stocks.dayRange,
          percentage_change: data.stocks.percentage_change,
          chart: data.stocks.chart


        });
        console.log('Searched Stock Chart Data:', data.stocks.chart);
      } else {
        Alert.alert('Not Found', 'No stock found with the given ticker');
      }
    } catch (error) {
      console.error('Error searching stock:', error);
      Alert.alert('Error', 'An error occurred while searching for the stock');
    } finally {
      setLoading(false);
    }
  };

  const displayedCryptos = cryptos.slice(page * cryptosPerPage, (page + 1) * cryptosPerPage);

  const makeRecommendation = async () => {
    try {
      setLoadingRecommendation(true); // Show loading spinner
      const ticker = selectedCrypto?.symbol;
      const formattedTicker = `<${ticker}>`;  // Wrap ticker in angle brackets
    const response = await fetch(`http://45.13.119.55:5000/make-recomendation${formattedTicker}`);
    const data = await response.json();
  
      if (response.ok) {
        setRecommendationData(data.stocks[0])
        setRecommendationModalVisible(true)
      } else {
        alert('Failed to make recommendation!');
      }
    } catch (error) {
      console.error('Error making recommendation:', error);
      alert('Error making recommendation!');
    } finally {
      setLoadingRecommendation(false); // Hide loading spinner
    }
  };

  const handleNextPage = () => {
    if ((page + 1) * cryptosPerPage < cryptos.length) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const openModal = async (crypto: Crypto) => {
    setSelectedCrypto(crypto);
    setQuantity(1);
    setLoading(true);
    try {
      // Fetch the chart for the selected stock
      const response = await fetch(`http://45.13.119.55:5000/get-stock/${crypto.symbol}`);
      const data = await response.json();
  
      if (data.stocks) {
        // Update the selected stock with the fetched chart
        const updatedCrypto = {
          ...crypto,
          chart: data.stocks.chart,
        };
        setSelectedCrypto(updatedCrypto);
      } else {
        Alert.alert('Error', 'Failed to load stock details.');
      }
    } catch (error) {
      console.error('Error fetching stock chart:', error);
      Alert.alert('Error', 'An error occurred while fetching stock details.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedCrypto(null);
    setQuantity(1);
  }

  const handleBuyNow = async (crypto: Crypto) => {
    try {
      // Fetch the clients collection
      const clientsRef = collection(db, 'Clients');
      const q = query(clientsRef, where('ClientID', '==', userID)); // Find client by ClientID
  
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0]; // Assuming we get only one document matching the ClientID
        const clientDocRef = doc(db, 'Clients', clientDoc.id); // Reference to the specific document
        const currentCredit = clientDoc.data().Credit || 0; // Fetch the client's current credit
        const totalCost = crypto.price * quantity;
  
        // Check if the client has enough credit to buy the crypto
        if (currentCredit >= totalCost) {
          // Calculate the new credit balance
          const newCredit = currentCredit - totalCost;
  
          // Update Firestore with the new credit balance
          await updateDoc(clientDocRef, { Credit: newCredit });
  
          // Optionally, update the local state with the new balance if needed
          setCurrentCredit(newCredit);
  
          // Add the purchased crypto to the Portfolios collection
          const portfolioRef = collection(db, 'Portfolios');
  
          // Generate a random PortfolioID
          const portfolioID = Math.random().toString(36).substr(2, 9); // Random string as PortfolioID
  
          // Create the document to store the purchased crypto
          await addDoc(portfolioRef, {
            AssetID: crypto.symbol, // Use crypto symbol as AssetID
            PortfolioID: portfolioID, // Randomly generated PortfolioID
            PurchaseDate: new Date(), // Current date and time
            PurchasePrice: crypto.price, // Current price of the crypto
            Quantity: quantity,
            totalCost: totalCost,
            UserID: userID, // Reference to the current user
            Type: "Crypto",
          });

          if (quantity > 1) {
            setUnitAmount("unit");
          }
          else {
            setUnitAmount("units");
          }
  
          // Notify the user of the successful purchase
          if (Platform.OS === 'web') {
            window.alert(`Purchase successful! You bought ${quantity} ${unitamount} of ${crypto.symbol} for $${totalCost.toFixed(2)}.`);
          } else {
            Alert.alert('Purchase Successful', `You bought ${quantity} ${unitamount} of ${crypto.symbol} for $${totalCost.toFixed(2)}.`);
          }
        } else {
          // Notify the user of insufficient credit
          window.alert('Insufficient Credit: You do not have enough credit to buy this crypto.');
        }
      } else {
        // Notify the user if no matching client is found
        Alert.alert('Error: Client not found or invalid ClientID.');
      }
    } catch (error) {
      // Log the error and notify the user of the issue
      console.error('Error buying crypto:', error);
      window.alert('Error: Unable to complete the purchase. Please try again.');
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Buy Cryptos</Text>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter Ticker (e.g., BTC)"
          value={searchSymbol}
          onChangeText={setSearchSymbol}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Searched Stock Result */}
      {searchedCrypto && (
        <TouchableOpacity style={styles.tile} onPress={() => openModal(searchedCrypto)}>
          <Text style={styles.tileTitle}>{searchedCrypto.name}</Text>
          <Text style={styles.tileValue}>${searchedCrypto.price.toFixed(2)}</Text>
          <Text style={styles.tileTicker}>{searchedCrypto.symbol}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.tilesContainer}>
        {displayedCryptos.map((crypto, index) => (
          <TouchableOpacity key={index} style={styles.tile} onPress={() => openModal(crypto)}>
            <Text style={styles.tileTitle}>{crypto.name}</Text>
            <Text style={styles.tileValue}>${crypto.price.toFixed(2)}</Text>
            <Text style={styles.tileTicker}>{crypto.symbol}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pagination */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity onPress={handlePrevPage} disabled={page === 0} style={styles.pageButton}>
          <Text style={[styles.pageButtonText, page === 0 && styles.disabledButtonText]}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNextPage}
          disabled={(page + 1) * cryptosPerPage >= cryptos.length}
          style={styles.pageButton}
        >
          <Text style={[styles.pageButtonText, (page + 1) * cryptosPerPage >= cryptos.length && styles.disabledButtonText]}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Stock Details */}
      <Modal transparent visible={!!selectedCrypto} animationType="fade" onRequestClose={closeModal}>
  <Pressable style={styles.modalOverlay} onPress={closeModal}>
    <View style={styles.modalContainer}>
      {selectedCrypto && (
        <View style={styles.modalContent}>
          {/* Chart Image on the Left */}
          {selectedCrypto.chart && (
            <Image
              style={styles.chartImage}
              source={{ uri: `data:image/png;base64,${selectedCrypto.chart}` }}
            />
          )}

          {/* Stock Info on the Right */}
          <View style={styles.stockInfo}>
            <Text style={styles.modalTitle}>{selectedCrypto.name}</Text>
            <Text style={styles.modalTicker}>Ticker: {selectedCrypto.symbol}</Text>
            <Text style={styles.modalPrice}>Price: ${selectedCrypto.price.toFixed(2)}</Text>
            <Text style={styles.modalPrice}>Day High: ${selectedCrypto.day_high.toFixed(2)}</Text>
            <Text style={styles.modalPrice}>Day Low: ${selectedCrypto.day_low.toFixed(2)}</Text>
            <Text style={styles.modalPrice}>Day Range: ${selectedCrypto.day_range.toFixed(2)}</Text>
            <Text style={styles.modalPrice}>Percentage Change: {selectedCrypto.percentage_change}%</Text>

            {/* Quantity Selector */}
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.quantityButton}>
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.quantityButton}>
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Buy Button */}
            <TouchableOpacity style={styles.buyButton} onPress={() => handleBuyNow(selectedCrypto)}>
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>

            {/* Make Recommendation Button */}
            {loadingRecommendation ? (
              <ActivityIndicator size="large" color="#2196F3" />
            ) : (
              <TouchableOpacity style={styles.recommendationButton} onPress={makeRecommendation}>
                <Text style={styles.recommendationButtonText}>Make Recommendation</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  </Pressable>
  </Modal>
  {/* Modal for Recommendation Info */}
  <Modal
    transparent
    visible={recommendationModalVisible}
    animationType="fade"
    onRequestClose={() => setRecommendationModalVisible(false)}
  >
    <Pressable style={styles.modalOverlay} onPress={() => setRecommendationModalVisible(false)}>
      <View style={styles.modalContainer}>
        {recommendationData && (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recommendation for {selectedCrypto?.name}</Text>
            <Text style={styles.recommendationTitle}>Recommendation: {recommendationData.buy_hold_sell_recomendation}</Text>
            <Text style={styles.recommendationReport}>{recommendationData.report}</Text>
            <Text style={styles.recommendationDescription}>{recommendationData.short_description}</Text>
        
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setRecommendationModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Pressable>
  </Modal>
        
    <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('ManagePortfolioClient', { clientID: userID })}>
      <Text style={styles.linkText}>Manage Portfolio</Text>
    </TouchableOpacity>
  </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e0e0e0',
  },
  disabledButton: {
    backgroundColor: '#B0BEC5', // Grey out the button for non-premium users
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 5,
    flex: 1,
    minWidth: '45%',
    elevation: 3,
    shadowColor: '#007bff',
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
    color: '#888888',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  pageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  pageButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#555555',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalTicker: {
    fontSize: 18,
    color: '#888',
    marginBottom: 5,
  },
  modalPrice: {
    fontSize: 20,
    color: '#000',
    marginBottom: 20,
  },
  buyButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#28a745',
    borderRadius: 5,
  },
  buyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginRight: 10,
    color: '000',
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContent: {
    flexDirection: 'row',  // Align chart and info side by side
    alignItems: 'center',  // Center items vertically
    justifyContent: 'flex-start',
    width: '100%',
  },
  chartImage: {
    width: 150,      // Set a large width for the chart image
    height: 200,     // Set a large height for the chart image
    resizeMode: 'contain',
    borderRadius: 10,
  },
  stockInfo: {
    marginLeft: 5,  // Space between the chart and the stock info
    flex: 1,
    justifyContent: 'flex-start',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  quantityButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  recommendationButton: {
    backgroundColor: '#2196F3', // Blue button color
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  recommendationReport: {
    fontSize: 16,
    marginTop: 10,
  },
  recommendationDescription: {
    fontSize: 16,
    marginTop: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff', // Red background for links
    borderRadius: 8,
    alignSelf: 'center',
  },
  linkText: {
    color: '#ffffff', // White text for the links
    fontWeight: 'bold',
    textAlign: 'center',
  },
});