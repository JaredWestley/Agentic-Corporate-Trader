import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Pressable, Alert, ScrollView, Image, Platform } from 'react-native';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './config/firebaseConfig';

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

export default function ManagePortfolioClient({ route, navigation }: any) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userID, setUserID] = useState(route.params.clientID || ''); // Fetch client ID from route params
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<PortfolioItem | null>(null);
  const [quantityToSell, setQuantityToSell] = useState(1);
  const [page, setPage] = useState<number>(0);
  const [currentPrices, setCurrentPrices] = useState<{ [key: string]: number }>({}); // Store current prices by AssetID

  const itemsPerPage = 12;

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        if (userID) {
          const portfolioRef = collection(db, 'Portfolios');
          const q = query(portfolioRef, where('UserID', '==', userID));

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
          console.error('Client ID not provided.');
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [userID]);

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

  const handleNextPage = () => {
    if ((page + 1) * itemsPerPage < portfolio.length) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const openSellModal = async (asset: PortfolioItem) => {
      setSelectedAsset(asset);
      setQuantityToSell(1); // Reset quantity to 1
      setLoading(true);
      
      if (asset.Type === 'Stock'){
          try {
              // Fetch the chart for the selected stock
              const response = await fetch(`http://45.13.119.55:5000/get-stock/${asset.AssetID}`);
              const data = await response.json();
          
              if (data.stocks) {
                // Update the selected stock with the fetched chart
                const updatedStock = {
                  ...asset,
                  search_name: data.stocks.name,
                  search_price: data.stocks.price,
                  search_ticker: data.stocks.ticker,
                  search_dayHigh: data.stocks.dayHigh,
                  search_dayLow: data.stocks.dayLow,
                  search_dayRange: data.stocks.dayRange,
                  search_industry: data.stocks.industry,
                  search_percentage_change: data.stocks.percentage_change,
                  search_chart: data.stocks.chart,
                };
                setSelectedAsset(updatedStock);
              } else {
                Alert.alert('Error', 'Failed to load stock details.');
              }
            } catch (error) {
              console.error('Error fetching stock chart:', error);
              Alert.alert('Error', 'An error occurred while fetching stock details.');
            } finally {
              setLoading(false);
            }
      }
      if (asset.Type === 'Crypto'){
          try {
              // Fetch the chart for the selected stock
              const cryptoID = asset.AssetID.slice(0, 3);
              const response = await fetch(`http://45.13.119.55:5000/get-crypto/${cryptoID}`);
              const data = await response.json();
          
              if (data.stocks) {
                // Update the selected stock with the fetched chart
                const updatedStock = {
                  ...asset,
                  search_name: data.stocks.name,
                  search_price: data.stocks.price,
                  search_ticker: data.stocks.symbol,
                  search_dayHigh: data.stocks.day_high,
                  search_dayLow: data.stocks.day_low,
                  search_dayRange: data.stocks.day_low,
                  search_industry: 'Crypto',
                  search_percentage_change: data.stocks.percentage_change,
                  search_chart: data.stocks.chart,
                };
                setSelectedAsset(updatedStock);
              } else {
                Alert.alert('Error', 'Failed to load stock details.');
              }
            } catch (error) {
              console.error('Error fetching stock chart:', error);
              Alert.alert('Error', 'An error occurred while fetching stock details.');
            } finally {
              setLoading(false);
            }
      }
    };

  const closeSellModal = () => {
    setSelectedAsset(null);
    setQuantityToSell(1);
  };

  const refreshPortfolio = async () => {
      try {
        const user = auth.currentUser;
  
        if (user) {
          const portfolioRef = collection(db, 'Portfolios');
          const q = query(portfolioRef, where('UserID', '==', userID));
  
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

    const handleSell = async () => {
      if (!selectedAsset) return;
    
      const { AssetID, PortfolioID, Quantity, search_price } = selectedAsset;
    
      if (quantityToSell > Quantity) {
        Alert.alert('Error', 'You cannot sell more than you own.');
        return;
      }
    
      try {
        const portfolioRef = collection(db, 'Portfolios');
        const q = query(portfolioRef, where('PortfolioID', '==', PortfolioID));
    
        const querySnapshot = await getDocs(q);
    
        // Ensure that the portfolio item exists
        if (querySnapshot.empty) {
          Alert.alert('Error', 'Portfolio item not found.');
          return;
        }
    
        // Get the document reference to the item
        const docRef = querySnapshot.docs[0].ref; // Assuming only one document with the same PortfolioID
    
        // Calculate the total amount to add to the user's credit
        const totalSaleAmount = search_price * quantityToSell;
    
        // Fetch the current user from the authentication state
        const userRef = collection(db, 'Clients');
        const userQuery = query(userRef, where('ClientID', '==', userID)); // Find user by UserID
    
        const userQuerySnapshot = await getDocs(userQuery);
    
        // Ensure the user exists
        if (userQuerySnapshot.empty) {
          Alert.alert('Error', 'User not found.');
          return;
        }
    
        // Get the user document reference
        const userDoc = userQuerySnapshot.docs[0];
        const userDocRef = doc(db, 'Clients', userDoc.id); // Get reference to that specific document
    
        // Get current credit of the user
        const currentCredit = userDoc.data().Credit || 0;
    
        // Calculate the new credit balance
        const newCredit = currentCredit + totalSaleAmount;
    
        // Update the user's credit in Firestore
        await updateDoc(userDocRef, { Credit: newCredit });
    
        // If the quantity is greater than 1, update it by subtracting the quantity to sell
        if (Quantity > 1) {
          await updateDoc(docRef, {
            Quantity: Quantity - quantityToSell,
          });
          Alert.alert('Sell Successful', `You sold ${quantityToSell} units of ${AssetID}.`);
          if (Platform.OS === 'web'){
            window.alert(`Sell Successful: You sold ${quantityToSell} units of ${AssetID}.`)
          }
        } else {
          // If the quantity is 1, delete the document
          await deleteDoc(docRef);
          Alert.alert('Sell Successful', `You sold all units of ${AssetID}.`);
          if (Platform.OS === 'web'){
            window.alert(`Sell Successful: You sold all units of ${AssetID}.`)
          }
        }
    
        // Refresh portfolio by removing the sold asset from the state
        setPortfolio((prev) =>
          prev.filter(
            (item) => item.PortfolioID !== PortfolioID || item.Quantity > quantityToSell
          )
        );
    
        await refreshPortfolio();
    
        closeSellModal();
      } catch (error) {
        console.error('Error selling asset:', error);
        Alert.alert('Error', 'Could not complete the transaction.');
        if (Platform.OS === 'web'){
          window.alert(`Error: Unable to sell ${AssetID}.`)
        }
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
        <Text style={styles.title}>Manage Portfolio</Text>
  
        {/* Displayed Stocks */}
        <View style={styles.tilesContainer}>
          {paginatedPortfolio.map((asset, index) => (
            <TouchableOpacity key={index} style={styles.tile} onPress={() => openSellModal(asset)}>
              <Text style={styles.tileTitle}>{asset.AssetID}</Text>
              <Text style={styles.tileValue}>
                Current Price: ${currentPrices[asset.AssetID]?.toFixed(2) || 'Loading...'}
              </Text>
              <Text style={[styles.tileTicker, currentPrices[asset.AssetID]< asset.PurchasePrice?styles.redText : styles.greenText]}>
                Quantity: {asset.Quantity} | Purchase Price: ${asset.PurchasePrice.toFixed(2)}
              </Text>
              <Text style={styles.tileTicker}>
                Type: {asset.Type}
              </Text>
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
            disabled={(page + 1) * itemsPerPage >= portfolio.length}
            style={styles.pageButton}
          >
            <Text style={[styles.pageButtonText, (page + 1) * itemsPerPage >= portfolio.length && styles.disabledButtonText]}>Next</Text>
          </TouchableOpacity>
        </View>
  
        {/* Sell Modal */}
        {/* <Modal transparent visible={modalVisible} animationType="slide" onRequestClose={closeSellModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {selectedAsset && (
                <>
                  <Text style={styles.modalTitle}>Sell {selectedAsset.AssetID}</Text>
                  <Text>Quantity Owned: {selectedAsset.Quantity}</Text>
                  <View style={styles.quantityContainer}>
                    {selectedAsset.Quantity > 1 && (
                      <>
                        <TouchableOpacity
                          onPress={() => setQuantityToSell(Math.max(1, quantityToSell - 1))}
                          style={styles.quantityButton}
                        >
                          <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantityToSell}</Text>
                        <TouchableOpacity
                          onPress={() => setQuantityToSell(Math.min(selectedAsset.Quantity, quantityToSell + 1))}
                          style={styles.quantityButton}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                  <TouchableOpacity style={styles.sellButton} onPress={handleSell}>
                    <Text style={styles.sellButtonText}>Sell</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal> */}
        <Modal transparent visible={!!selectedAsset} animationType="fade" onRequestClose={closeSellModal}>
    <Pressable style={styles.modalOverlay} onPress={closeSellModal}>
      <View style={styles.modalContainer}>
        {selectedAsset && (
          <View style={styles.modalContent}>
            {/* Chart Image on the Left */}
            {selectedAsset.search_chart && (
              <Image
                style={styles.chartImage}
                source={{ uri: `data:image/png;base64,${selectedAsset.search_chart}` }}
              />
            )}
  
            {/* Stock Info on the Right */}
            <View style={styles.stockInfo}>
              <Text style={styles.modalTitle}>{selectedAsset.search_name}</Text>
              <Text style={styles.modalTicker}>Ticker: {selectedAsset.search_ticker}</Text>
              <Text style={styles.modalPrice}>Price: ${selectedAsset.search_price.toFixed(2)}</Text>
              <Text style={styles.modalPrice}>Day High: {selectedAsset.search_dayHigh.toFixed(2)}</Text>
              <Text style={styles.modalPrice}>Day Low: {selectedAsset.search_dayLow.toFixed(2)}</Text>
              <Text style={styles.modalPrice}>Day Range: {selectedAsset.search_dayRange.toFixed(2)}</Text>
              <Text style={styles.modalPrice}>Percentage Change: {selectedAsset.search_percentage_change.toFixed(2)}%</Text>
              <Text style={styles.modalPrice}>Industry: {selectedAsset.search_industry}</Text>
  
              {/* Quantity Selector */}
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => setQuantityToSell(Math.max(1, quantityToSell - 1))} style={styles.quantityButton}>
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantityToSell}</Text>
                <TouchableOpacity onPress={() => setQuantityToSell(quantityToSell + 1)} style={styles.quantityButton}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
  
              {/* Buy Button */}
              <TouchableOpacity style={styles.sellButton} onPress={() => handleSell()}>
                <Text style={styles.sellButtonText}>Sell Asset</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  </Modal>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
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
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalTicker: {
    fontSize: 18,
    color: '#888',
    marginBottom: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  sellButton: {
    backgroundColor: '#FF5722', // Red for selling
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  sellButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  disabledButtonText: {
    color: '#ccc',
  },
  modalContent: {
    flexDirection: 'row',  // Align chart and info side by side
    alignItems: 'center',  // Center items vertically
    justifyContent: 'flex-start',
    width: '100%',
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
  greenText: {
    color: 'green',
  },
  redText: {
    color: 'red',
  },
  chartImage: {
    width: 200,      // Set a large width for the chart image
    height: 200,     // Set a large height for the chart image
    resizeMode: 'contain',
    borderRadius: 10,
  },
});
