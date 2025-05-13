// BuyStock.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Pressable, TextInput, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { Image } from 'react-native';
import { doc, addDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from './config/firebaseConfig';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BuyStock'>;

type Stock = {
  name: string;
  price: number;
  ticker: string;
  dayHigh: number;
  dayLow: number;
  dayRange: number;
  industry: string;
  percentage_change: number;
  chart: string;
};

interface RecommendationData {
  buy_hold_sell_recomendation: string;
  report: string;
  short_description: string;
}

export default function BuyStock({ route }: any) {
  const [recommendationModalVisible, setRecommendationModalVisible] = useState(false);

  const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [userID, setUserID] = useState(route.params.clientID || '');
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [currentCredit, setCurrentCredit] = useState(0);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchTicker, setSearchTicker] = useState<string>('');
  const [searchedStock, setSearchedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitamount, setUnitAmount] = useState("unit");

  const stocksPerPage = 12;

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch('http://45.13.119.55:5000/stock-data');
        const data = await response.json();
        const user = auth.currentUser;
        setStocks(data.stocks);
        setLoading(false);
        if (user) {
          // setUserID(user.uid);
          fetchUserDetails(userID);
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
        setLoading(false);
      }
    };

    fetchStockData();
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
    if (!searchTicker.trim()) {
      Alert.alert('Error', 'Please enter a valid ticker symbol');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://45.13.119.55:5000/get-stock/${searchTicker}`);
      const data = await response.json();
      if (data.stocks) {
        setSearchedStock({
          name: data.stocks.name,
          price: data.stocks.price,
          ticker: searchTicker.toUpperCase(),
          dayHigh: data.stocks.dayHigh,
          dayLow: data.stocks.dayLow,
          dayRange: data.stocks.dayRange,
          industry: data.stocks.industry,
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

  const displayedStocks = stocks.slice(page * stocksPerPage, (page + 1) * stocksPerPage);

  const makeRecommendation = async () => {
    try {
      setLoadingRecommendation(true); // Show loading spinner
      const ticker = selectedStock?.ticker;
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
    if ((page + 1) * stocksPerPage < stocks.length) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const openModal = async (stock: Stock) => {
  setSelectedStock(stock); // Reset previous selection for better UX
  setLoading(true);
  setQuantity(1);

  try {
    // Fetch the chart for the selected stock
    const response = await fetch(`http://45.13.119.55:5000/get-stock/${stock.ticker}`);
    const data = await response.json();

    if (data.stocks) {
      // Update the selected stock with the fetched chart
      const updatedStock = {
        ...stock,
        chart: data.stocks.chart,
      };
      setSelectedStock(updatedStock);
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
    setSelectedStock(null);
    setQuantity(1);
  };

  const handleBuyNow = async (stock: Stock) => {
    try {
      // Fetch the current user from the authentication state
      const userRef = collection(db, 'Clients');
      const q = query(userRef, where('ClientID', '==', userID)); // Find user by UserID
  
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; // Assuming we get only one document
        const userDocRef = doc(db, 'Clients', userDoc.id); // Get reference to that specific document
        const currentCredit = userDoc.data().Credit || 0; // Get current credit
        const totalCost = stock.price * quantity;
  
        // Check if the user has enough credit to buy the stock
        if (currentCredit >= totalCost) {
          // Calculate the new credit balance
          const newCredit = currentCredit - totalCost;
  
          // Update Firestore with the new credit balance
          await updateDoc(userDocRef, { Credit: newCredit });
  
          // Update the state with the new balance
          setCurrentCredit(newCredit);
  
          // Now, add the purchased stock to the Portfolios collection
          const portfolioRef = collection(db, 'Portfolios');
          
          // Create a random PortfolioID
          const portfolioID = Math.random().toString(36).substr(2, 9);  // Generate a random string as PortfolioID
  
          // Create the document to store the purchased stock
          await addDoc(portfolioRef, {
            AssetID: stock.ticker, // Use stock ticker as AssetID
            PortfolioID: portfolioID, // Randomly generated PortfolioID
            PurchaseDate: new Date(), // Current date and time
            PurchasePrice: stock.price, // Current price of the stock
            Quantity: quantity,
            totalCost: totalCost,
            UserID: userID, // Reference to the current user
            Type: "Stock",
          });

          if (quantity > 1) {
            setUnitAmount("unit");
          }
          else {
            setUnitAmount("units");
          }
  
          if (Platform.OS === 'web') {
            window.alert(`Purchase successful! You bought ${quantity} ${unitamount} of ${stock.ticker} for $${totalCost.toFixed(2)}.`);
          } else {
            Alert.alert('Purchase Successful', `You bought ${quantity} ${unitamount} of ${stock.ticker} for $${totalCost.toFixed(2)}.`);
          }
        } else {
          window.alert('Insufficient Credit: You do not have enough credit to buy this Stock.');
        }
      } else {
        Alert.alert('Error: Client not found or invalid ClientID.');
      }
    } catch (error) {
      console.error('Error buying crypto:', error);
      window.alert('Error: Unable to complete the purchase. Please try again.');
    }
  };
  

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Buy Stocks</Text>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter Ticker (e.g., AAPL)"
          value={searchTicker}
          onChangeText={setSearchTicker}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Searched Stock Result */}
      {searchedStock && (
        <TouchableOpacity style={styles.tile} onPress={() => openModal(searchedStock)}>
          <Text style={styles.tileTitle}>{searchedStock.name}</Text>
          <Text style={styles.tileValue}>${searchedStock.price.toFixed(2)}</Text>
          <Text style={styles.tileTicker}>{searchedStock.ticker}</Text>
        </TouchableOpacity>
      )}

      {/* Displayed Stocks */}
      <View style={styles.tilesContainer}>
        {displayedStocks.map((stock, index) => (
          <TouchableOpacity key={index} style={styles.tile} onPress={() => openModal(stock)}>
            <Text style={styles.tileTitle}>{stock.name}</Text>
            <Text style={styles.tileValue}>${stock.price.toFixed(2)}</Text>
            <Text style={styles.tileTicker}>{stock.ticker}</Text>
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
          disabled={(page + 1) * stocksPerPage >= stocks.length}
          style={styles.pageButton}
        >
          <Text style={[styles.pageButtonText, (page + 1) * stocksPerPage >= stocks.length && styles.disabledButtonText]}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Stock Details */}
      <Modal transparent visible={!!selectedStock} animationType="fade" onRequestClose={closeModal}>
  <Pressable style={styles.modalOverlay} onPress={closeModal}>
    <View style={styles.modalContainer}>
      {selectedStock && (
        <View style={styles.modalContent}>
          {/* Chart Image on the Left */}
          {selectedStock.chart && (
            <Image
              style={styles.chartImage}
              source={{ uri: `data:image/png;base64,${selectedStock.chart}` }}
            />
          )}

          {/* Stock Info on the Right */}
          <View style={styles.stockInfo}>
            <Text style={styles.modalTitle}>{selectedStock.name}</Text>
            <Text style={styles.modalTicker}>Ticker: {selectedStock.ticker}</Text>
            <Text style={styles.modalPrice}>Price: ${selectedStock.price.toFixed(2)}</Text>
            <Text style={styles.modalPrice}>Day High: ${selectedStock.dayHigh.toFixed(2)}</Text>
            <Text style={styles.modalPrice}>Day Low: ${selectedStock.dayLow.toFixed(2)}</Text>
            <Text style={styles.modalPrice}>Day Range: ${selectedStock.dayRange.toFixed(2)}</Text>
            <Text style={styles.modalPrice}>Percentage Change: {selectedStock.percentage_change.toFixed(2)}%</Text>
            <Text style={styles.modalPrice}>Industry: {selectedStock.industry}</Text>

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
            <TouchableOpacity style={styles.buyButton} onPress={() => handleBuyNow(selectedStock)}>
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
          <Text style={styles.modalTitle}>Recommendation for {selectedStock?.name}</Text>
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
  recommendationButton: {
    backgroundColor: '#2196F3', // Blue button color
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  recommendationButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartImage: {
    width: 150,      // Set a large width for the chart image
    height: 150,     // Set a large height for the chart image
    resizeMode: 'contain',
    borderRadius: 10,
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
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
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
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e0e0e0',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tileValue: {
    fontSize: 16,
    color: '#555',
  },
  tileTicker: {
    fontSize: 14,
    color: '#888',
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
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#ccc',
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
    flexDirection: 'row',  // This is where we set the horizontal layout
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  modalTicker: {
    fontSize: 18,
    color: '#888',
    marginBottom: 5,
  },
  modalPrice: {
    fontSize: 18,
    color: '#000',
    marginBottom: 20,
  },
  stockInfo: {
    // marginLeft: 20,  // Space between the chart and the stock info
    flex: 1,
    justifyContent: 'flex-start',
  },
  
  modalContent: {
    flexDirection: 'row',  // Align chart and info side by side
    alignItems: 'center',  // Center items vertically
    justifyContent: 'flex-start',
    width: '100%',
  },
  buyButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#28a745',
    borderRadius: 5,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  },
});
