import { AuthProvider, useAuth } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';
import { SocketProvider } from '../hooks/useSocket';
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TlAzhKR2ZB1vdGpg0cpaAEaJQIHnM3vkDGV2bTXfX1gtUCyotysS1BAz3woxqSq7DOhd5R5g9eKR7HCA9iEMOwA00bnBcf3YZ';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '../components/useColorScheme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.lokma">
      <SafeAreaProvider>
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              <RootLayoutNav />
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      const { orderId, type } = data;
      if (!orderId) return;

      const role = user?.role;

      if (type === 'compliance') {
        if (role === 'Cook' || role === 'Admin') {
          router.push(`/ai-verify?orderId=${orderId}&mode=compliance`);
        }
        return;
      }
      if (type === 'rejected') {
        if (role === 'Customer' || role === 'Admin') {
          router.push(`/recommendations?orderId=${orderId}`);
        }
        return;
      }
      router.push(`/order/${orderId}`);
    });
    return () => subscription.remove();
  }, [user?.role]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ headerShown: true, title: 'Sign In', headerTintColor: '#ff6b35' }} />
        <Stack.Screen name="signup" options={{ headerShown: true, title: 'Create Account', headerTintColor: '#ff6b35' }} />
        <Stack.Screen name="role-select" options={{ headerShown: true, title: 'Choose Your Role', headerTintColor: '#ff6b35', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="my-orders" options={{ headerShown: true, title: 'My Orders', headerTintColor: '#ff6b35' }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout', headerTintColor: '#ff6b35' }} />
        <Stack.Screen name="admin" options={{ headerShown: true, title: 'Admin Panel', headerTintColor: '#e91e63' }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: true, title: 'Order Details', headerTintColor: '#ff6b35' }} />
        <Stack.Screen name="recommendations" options={{ headerShown: true, title: 'You Might Like', headerTintColor: '#ff6b35' }} />
        <Stack.Screen name="ai-verify" options={{ headerShown: true, title: 'Hygiene Check', headerTintColor: '#ff6b35' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
