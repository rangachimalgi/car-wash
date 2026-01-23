import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Employee Home</Text>
      <Text style={styles.subtitle}>You are logged in.</Text>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F6F8',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: '#6B7280',
    },
  });
