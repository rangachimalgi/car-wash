import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const RED = '#DC2626';
const RED_LIGHT = '#FEF2F2';
const RED_BORDER = '#FECACA';

const ISSUE_TYPES = [
  {
    id: 'customer_not_responding',
    title: 'Customer Not Responding',
    subtitle: 'Customer is not answering calls or messages',
    icon: 'phone-outline',
    iconColor: '#16A34A',
    iconBg: '#F0FDF4',
  },
  {
    id: 'vehicle_unavailable',
    title: 'Vehicle Unavailable',
    subtitle: 'Vehicle is not available at the location',
    icon: 'car-outline',
    iconColor: '#EA580C',
    iconBg: '#FFF7ED',
  },
  {
    id: 'parking_issue',
    title: 'Parking Issue',
    subtitle: 'No parking available / parking too far',
    icon: 'parking',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
  },
  {
    id: 'rain_issue',
    title: 'Rain Issue',
    subtitle: 'Heavy rain / bad weather conditions',
    icon: 'weather-pouring',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
  },
  {
    id: 'other',
    title: 'Other Issue',
    subtitle: 'Any other problem',
    icon: 'dots-horizontal',
    iconColor: '#64748B',
    iconBg: '#F1F5F9',
  },
];

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  android: { elevation: 1 },
});

export default function ReportProblemScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [details, setDetails] = useState('');

  return (
    <View style={[styles.container, { paddingTop: 12 + insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BLUE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Problem</Text>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.alertBanner}>
          <View style={styles.alertIconWrap}>
            <MaterialCommunityIcons name="alert" size={20} color={RED} />
          </View>
          <View style={styles.alertText}>
            <Text style={styles.alertTitle}>Facing an issue?</Text>
            <Text style={styles.alertSubtext}>
              Let us know what's happening. Our team will assist you shortly.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Issue Type</Text>
        <View style={styles.issueList}>
          {ISSUE_TYPES.map((issue, index) => {
            const selected = selectedIssue === issue.id;
            return (
              <TouchableOpacity
                key={issue.id}
                style={[
                  styles.issueCard,
                  selected && styles.issueCardSelected,
                  index < ISSUE_TYPES.length - 1 && styles.issueCardBorder,
                ]}
                onPress={() => setSelectedIssue(issue.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.issueIcon, { backgroundColor: issue.iconBg }]}>
                  <MaterialCommunityIcons name={issue.icon} size={20} color={issue.iconColor} />
                </View>
                <View style={styles.issueBody}>
                  <Text style={styles.issueTitle}>{issue.title}</Text>
                  <Text style={styles.issueSubtitle}>{issue.subtitle}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Add Details (Optional)</Text>
        <TextInput
          style={styles.detailsInput}
          value={details}
          onChangeText={setDetails}
          placeholder="Describe the issue..."
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
        <TouchableOpacity style={styles.submitButton} activeOpacity={0.9}>
          <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
        <View style={styles.footerNoteRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color="#94A3B8" />
          <Text style={styles.footerNote}>Our team will contact you shortly.</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    headerBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: BLUE_LIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#0F172A',
      letterSpacing: -0.2,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      gap: 14,
    },
    alertBanner: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: RED_LIGHT,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: RED_BORDER,
      padding: 14,
    },
    alertIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    alertText: {
      flex: 1,
      gap: 3,
    },
    alertTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#991B1B',
    },
    alertSubtext: {
      fontSize: 12,
      color: '#B91C1C',
      lineHeight: 17,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: -4,
    },
    issueList: {
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      overflow: 'hidden',
      ...cardShadow,
    },
    issueCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      backgroundColor: '#FFFFFF',
    },
    issueCardSelected: {
      backgroundColor: '#F8FAFC',
    },
    issueCardBorder: {
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    issueIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    issueBody: {
      flex: 1,
      gap: 2,
    },
    issueTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0F172A',
    },
    issueSubtitle: {
      fontSize: 12,
      color: '#64748B',
      lineHeight: 16,
    },
    detailsInput: {
      minHeight: 110,
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: '#0F172A',
      lineHeight: 20,
      ...cardShadow,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#F8FAFC',
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: BLUE,
      borderRadius: 14,
      paddingVertical: 16,
    },
    submitButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    footerNoteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      marginTop: 10,
    },
    footerNote: {
      fontSize: 12,
      color: '#94A3B8',
    },
  });
