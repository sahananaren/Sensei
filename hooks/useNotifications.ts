import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    scheduleDailyNotification,
    cancelAllNotifications,
    checkAndScheduleNotification
  };
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'ec9b6121-50a4-4517-9316-349e01ba1d97', // Your EAS project ID
    })).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

// Schedule daily notification at 12 PM
export const scheduleDailyNotification = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  const trigger = new Date();
  trigger.setHours(12, 0, 0, 0); // 12 PM
  
  // If it's already past 12 PM today, schedule for tomorrow
  if (trigger.getTime() <= Date.now()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Let's work towards your goals",
      body: "Time to check in on your progress and stay motivated!",
      data: { type: 'daily_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 12,
      minute: 0,
      repeats: true,
    },
  });

  console.log('Daily notification scheduled for 12 PM');
};

// Cancel all notifications
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All notifications cancelled');
};

// Check if user opened app today and schedule notification if needed
export const checkAndScheduleNotification = async () => {
  const today = new Date().toDateString();
  const lastOpened = await AsyncStorage.getItem('lastAppOpen');
  
  if (lastOpened !== today) {
    // User hasn't opened the app today, schedule notification
    await scheduleDailyNotification();
  }
  
  // Update last opened date
  await AsyncStorage.setItem('lastAppOpen', today);
}; 