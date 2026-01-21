import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackHeader from '../components/BackHeader';

const { width } = Dimensions.get('window');

export default function CartScreen({ navigation, route }) {
  const [cartItems, setCartItems] = useState([]);

  // Handle adding items from navigation params
  useEffect(() => {
    if (route?.params?.addItem) {
      const newItem = route.params.addItem;
      setCartItems(prevItems => {
        // Check if item already exists, if so update quantity
        const existingIndex = prevItems.findIndex(item => item.title === newItem.title);
        if (existingIndex >= 0) {
          const updated = [...prevItems];
          updated[existingIndex].quantity += 1;
          return updated;
        }
        // Add new item
        return [...prevItems, newItem];
      });
      // Clear the route params to prevent re-adding on re-render
      navigation.setParams({ addItem: undefined });
    }
  }, [route?.params?.addItem, navigation]);

  const updateQuantity = (id, change) => {
    setCartItems(items =>
      items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const formatSlot = (item) => {
    if (!item?.selectedDate || !item?.selectedTimeSlot) return null;
    const date = new Date(item.selectedDate);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    return `${label} • ${item.selectedTimeSlot.time}`;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <BackHeader navigation={navigation} title="Cart" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cart-off" size={64} color="#666666" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity 
              style={styles.continueShoppingButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={styles.continueShoppingText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.itemsContainer}>
              {cartItems.map(item => (
                <View key={item.id} style={styles.cartItem}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                    {formatSlot(item) && (
                      <Text style={styles.slotText}>{formatSlot(item)}</Text>
                    )}
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, -1)}
                      >
                        <MaterialCommunityIcons name="minus" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, 1)}
                      >
                        <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.itemRightSection}>
                    <Text style={styles.itemTotalPrice}>
                      ₹{item.price * item.quantity}
                    </Text>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{subtotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (18%)</Text>
                <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={() => navigation.navigate('Checkout', {
                cartItems,
                subtotal,
                tax,
                total,
              })}
            >
              <Text style={styles.checkoutButtonText}>Checkout</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#000000" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 24,
  },
  continueShoppingButton: {
    backgroundColor: '#31C5FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueShoppingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  slotText: {
    fontSize: 12,
    color: '#31C5FF',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  itemRightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  summaryContainer: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  summaryValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#31C5FF',
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#31C5FF',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 8,
  },
});
