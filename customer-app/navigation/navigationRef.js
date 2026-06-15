import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function handleCustomerNotificationResponse(data) {
  const type = data?.type;
  const orderId = data?.orderId;

  if (!navigationRef.isReady()) return;

  switch (type) {
    case 'on_the_way':
      if (orderId) {
        navigationRef.navigate('EmployeeLiveLocation', { orderId });
      } else {
        navigationRef.navigate('MainTabs', { screen: 'Bookings' });
      }
      break;
    case 'service_starting':
    case 'service_started':
    case 'booking_confirmed':
      navigationRef.navigate('MainTabs', { screen: 'Bookings' });
      break;
    case 'service_completed':
    case 'rate_service':
      if (orderId) {
        navigationRef.navigate('YourOrders', { rateOrderId: orderId });
      } else {
        navigationRef.navigate('YourOrders');
      }
      break;
    default:
      navigationRef.navigate('MainTabs', { screen: 'Notifications' });
      break;
  }
}
