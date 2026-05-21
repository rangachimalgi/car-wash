import { Alert, Linking } from 'react-native';

const SUPPORT_WHATSAPP_NUMBER = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || '918744050709';

export async function openSupportWhatsApp(messageText = 'Hi Woosh team, I need help with my booking.') {
  const message = encodeURIComponent(messageText);
  const appUrl = `whatsapp://send?phone=${SUPPORT_WHATSAPP_NUMBER}&text=${message}`;
  const webUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${message}`;

  try {
    const supported = await Linking.canOpenURL(appUrl);
    if (supported) {
      await Linking.openURL(appUrl);
      return;
    }
    await Linking.openURL(webUrl);
  } catch {
    Alert.alert('Unable to open WhatsApp', 'Please make sure WhatsApp is installed.');
  }
}
