import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { wooshGreen } from '../theme/wooshGreen';
import { getMembershipPlans, getMyMembership } from '../services/membershipApi';

const INK = '#0a0a0a';
const GREY = '#6b7280';
const WOOSH_GREEN_PLAN_IDS = new Set(['woosh_green', 'woosh_black']);

const DEFAULT_PLAN = {
  durationMonths: 12,
  price: 499,
  mrp: 1200,
  discountPercent: 40,
};

/**
 * Woosh Green membership card — loads plan from API, merges into cart (AsyncStorage) so the user stays on the screen.
 */
export default function WooshGreenCard({ navigation }) {
  const styles = useMemo(() => createStyles(), []);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [adding, setAdding] = useState(false);
  const [membershipInCart, setMembershipInCart] = useState(false);

  const refreshMembershipInCart = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('cartItems');
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      setMembershipInCart(list.some((i) => i?.packageType === 'Membership'));
    } catch (_) {
      setMembershipInCart(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshMembershipInCart();
    }, [refreshMembershipInCart])
  );

  useEffect(() => {
    refreshMembershipInCart();
  }, [refreshMembershipInCart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMembershipPlans();
        if (cancelled) return;
        const list = res?.data || [];
        const row =
          list.find((p) => WOOSH_GREEN_PLAN_IDS.has(p.planId)) || list[0];
        if (row) {
          setPlan(row);
        } else {
          setPlan(null);
        }
      } catch (e) {
        if (!cancelled) setPlan(null);
      } finally {
        if (!cancelled) setLoadingPlan(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const durationMonths = plan?.durationMonths ?? DEFAULT_PLAN.durationMonths;
  const price = plan?.price ?? DEFAULT_PLAN.price;
  const originalPrice = plan?.mrp ?? DEFAULT_PLAN.mrp;
  const savingsPercent = plan?.discountPercent ?? DEFAULT_PLAN.discountPercent;

  const handleAdd = useCallback(async () => {
    try {
      setAdding(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Sign in required', 'Please log in to add Woosh Green to your cart.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log in', onPress: () => navigation.navigate('Login') },
        ]);
        return;
      }
      if (!plan?.serviceId) {
        Alert.alert(
          'Unavailable',
          'Woosh Green is not set up on the server yet. Ask an admin to run the membership seed script.',
        );
        return;
      }
      try {
        const me = await getMyMembership();
        if (me?.success && me.data?.active) {
          Alert.alert('Woosh Green', 'You already have an active membership.');
          return;
        }
      } catch (_) {
        // ignore 401 etc.; cart + order will still enforce auth
      }

      const newItem = {
        id: 'membership_woosh_green',
        serviceId: plan.serviceId,
        serviceName: plan.name || 'Woosh Green',
        title: `${plan.name || 'Woosh Green'} – ${plan.durationMonths || 12} months`,
        packageType: 'Membership',
        packageTimes: 1,
        planId: plan.planId || 'woosh_green',
        price: Number(plan.price) || 0,
        quantity: 1,
        addOns: [],
      };

      const raw = await AsyncStorage.getItem('cartItems');
      let list = [];
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        list = Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        list = [];
      }
      if (list.some((i) => i.packageType === 'Membership')) {
        setMembershipInCart(true);
        return;
      }
      await AsyncStorage.setItem('cartItems', JSON.stringify([...list, newItem]));
      setMembershipInCart(true);
    } finally {
      setAdding(false);
    }
  }, [navigation, plan]);

  const handleRemove = useCallback(async () => {
    try {
      setAdding(true);
      const raw = await AsyncStorage.getItem('cartItems');
      let list = [];
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        list = Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        list = [];
      }
      const next = list.filter((i) => i?.packageType !== 'Membership');
      await AsyncStorage.setItem('cartItems', JSON.stringify(next));
      setMembershipInCart(false);
    } finally {
      setAdding(false);
    }
  }, []);

  return (
    <View style={styles.outer}>
      <View style={styles.topSection}>
        <View style={styles.topLeft}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/appicon.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Woosh logo"
            />
          </View>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.brandWoosh}>WOOSH </Text>
              <Text style={styles.brandGreen}>GREEN</Text>
              <View style={styles.infoWrap}>
                <MaterialCommunityIcons name="information-outline" size={12} color={wooshGreen.medium} />
              </View>
            </View>
            <Text style={styles.durationText}>for {durationMonths} months</Text>
          </View>
        </View>
        <View style={styles.topRight}>
          <View style={styles.priceRow}>
            <View style={styles.priceStack}>
              <Text style={styles.priceMain}>₹{price}</Text>
              <Text style={styles.priceStrike}>₹{originalPrice}</Text>
            </View>
            <TouchableOpacity
              style={[
                membershipInCart ? styles.removeButton : styles.addButton,
                (loadingPlan || adding) && styles.addButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={membershipInCart ? handleRemove : handleAdd}
              disabled={loadingPlan || adding}
              accessibilityRole="button"
              accessibilityLabel={membershipInCart ? 'Remove Woosh Green from cart' : 'Add Woosh Green to cart'}
            >
              {adding ? (
                <ActivityIndicator size="small" color={membershipInCart ? '#b91c1c' : '#fff'} />
              ) : (
                <Text style={membershipInCart ? styles.removeButtonText : styles.addButtonText}>
                  {membershipInCart ? 'Remove' : 'Add'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.bottomSection}>
        <Text style={styles.footerText}>
          Save upto <Text style={styles.footerHighlight}>{savingsPercent}%</Text> on every service{' '}
          <Text style={styles.footerDot}>●</Text> <Text style={styles.footerBrand}>WOOSH </Text>
          <Text style={styles.footerGreenItalic}>GREEN</Text>
        </Text>
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
  outer: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: wooshGreen.softBorder,
    overflow: 'hidden',
    backgroundColor: wooshGreen.soft,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: wooshGreen.soft,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 8,
  },
  logoWrap: {
    marginRight: 8,
    justifyContent: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  brandWoosh: {
    fontSize: 15,
    fontWeight: '800',
    color: INK,
    letterSpacing: 0.2,
  },
  brandGreen: {
    fontSize: 15,
    fontWeight: '900',
    fontStyle: 'italic',
    color: wooshGreen.primary,
    letterSpacing: 0.2,
  },
  infoWrap: {
    marginLeft: 4,
    justifyContent: 'center',
  },
  durationText: {
    marginTop: 2,
    fontSize: 12,
    color: wooshGreen.medium,
    fontWeight: '500',
  },
  topRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
    gap: 10,
  },
  priceStack: {
    alignItems: 'flex-end',
  },
  priceMain: {
    fontSize: 19,
    fontWeight: '800',
    color: wooshGreen.deep,
  },
  priceStrike: {
    marginTop: 2,
    fontSize: 12,
    color: GREY,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: wooshGreen.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 7,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.65,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  removeButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#b91c1c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c',
  },
  bottomSection: {
    backgroundColor: wooshGreen.deep,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
  },
  footerHighlight: {
    color: wooshGreen.light,
    fontWeight: '800',
  },
  footerDot: {
    color: wooshGreen.light,
    fontSize: 10,
  },
  footerBrand: {
    color: '#fff',
    fontWeight: '700',
  },
  footerGreenItalic: {
    color: wooshGreen.light,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  });
}
