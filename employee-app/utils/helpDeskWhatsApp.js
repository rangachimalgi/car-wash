import { Alert, Linking } from 'react-native';
import { HELP_DESK_WHATSAPP_NUMBER } from '../config/support';

export async function openHelpDeskWhatsApp(messageText = 'Hi Woosh team, I need help.') {
  const digits = String(HELP_DESK_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  if (!digits) {
    Alert.alert('Help desk unavailable', 'WhatsApp number is not configured.');
    return;
  }

  const message = encodeURIComponent(messageText);
  const appUrl = `whatsapp://send?phone=${digits}&text=${message}`;
  const webUrl = `https://wa.me/${digits}?text=${message}`;

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
