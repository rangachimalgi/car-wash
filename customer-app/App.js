import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import HeaderNavigator from './navigators/HeaderNavigator';
import { ThemeProvider, useTheme } from './theme/ThemeContext';

// Show notifications when app is in foreground (e.g. OTP from employee)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Woosh',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  }).catch(() => {});
}

// Hide splash screen immediately - we want video to show right away
SplashScreen.hideAsync().catch(() => {});

function SplashVideo({ onVideoReady }) {
  const videoSource = require('./assets/splashvideo.mp4');
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    let isMounted = true;
    
    // Start playing video immediately
    const startVideo = async () => {
      try {
        // Very small delay to ensure player is initialized (0.1 sec for splash to hide)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted || !player) return;
        
        // Start playing the video
        player.play();
        
        if (isMounted && onVideoReady) {
          onVideoReady();
        }
      } catch (error) {
        console.warn('Error starting video:', error);
      }
    };

    startVideo();

    return () => {
      isMounted = false;
    };
  }, [player, onVideoReady]);

  return (
    <VideoView
      player={player}
      style={styles.splashVideo}
      contentFit="contain"
      nativeControls={false}
      fullscreenOptions={{}}
      allowsPictureInPicture={false}
      pointerEvents="none"
    />
  );
}

function AppContent() {
  const { isLightMode } = useTheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoReadyTimeRef = useRef(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // Wait for video to be ready first
        while (!videoReady) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Once video is ready, wait for video to complete (8 seconds)
        // This ensures the full video plays at least once
        const minDisplayTime = 8000; // 8 seconds to match video length
        const elapsed = videoReadyTimeRef.current 
          ? Date.now() - videoReadyTimeRef.current 
          : 0;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, [videoReady]);

  const handleVideoReady = () => {
    setVideoReady(true);
    videoReadyTimeRef.current = Date.now();
  };

  if (!appIsReady) {
    return (
      <>
        <StatusBar style="dark" translucent={true} />
        <View style={styles.splashContainer}>
          <SplashVideo onVideoReady={handleVideoReady} />
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style={isLightMode ? 'dark' : 'light'} />
      <NavigationContainer>
        <HeaderNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  splashVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});