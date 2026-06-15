import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function navigateToJobQueue() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Jobs');
  }
}

export function handleEmployeeNotificationResponse(data) {
  const type = data?.type;
  const orderId = data?.orderId;
  if (type === 'new_job') {
    if (orderId) {
      navigate('JobDetail', { orderId });
    } else {
      navigateToJobQueue();
    }
    return;
  }
  navigateToJobQueue();
}
