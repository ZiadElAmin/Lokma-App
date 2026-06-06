import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Which tabs each role sees, in display order
const ROLE_TABS: Record<string, string[]> = {
  Customer: ['index', 'cart', 'profile'],
  Cook:     ['index', 'cook', 'cook-orders', 'cart', 'profile'],
  Rider:    ['index', 'rider-available', 'rider-deliveries', 'cart', 'profile'],
  Admin:    ['index', 'cook', 'cook-orders', 'rider-available', 'rider-deliveries', 'cart', 'profile'],
};

const TAB_META: Record<string, { title: string; icon: string }> = {
  'index':            { title: 'Home',       icon: 'home' },
  'cook':             { title: 'Kitchen',    icon: 'restaurant' },
  'cook-orders':      { title: 'Orders',     icon: 'receipt' },
  'rider-available':  { title: 'Available',  icon: 'bicycle' },
  'rider-deliveries': { title: 'Deliveries', icon: 'cube' },
  'cart':             { title: 'Cart',       icon: 'cart' },
  'profile':          { title: 'Profile',    icon: 'person' },
};

function CustomTabBar({ state, navigation }: any) {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const insets = useSafeAreaInsets();
  const cartCount = cartItems.reduce((sum: number, item: any) => sum + item.qty, 0);
  const allowedTabs = ROLE_TABS[user?.role ?? 'Customer'] ?? ROLE_TABS.Customer;

  const visibleRoutes = state.routes.filter((r: any) => allowedTabs.includes(r.name));

  return (
    <View style={[tabStyles.bar, { paddingBottom: insets.bottom || 12 }]}>
      {visibleRoutes.map((route: any) => {
        const isFocused = state.routes[state.index]?.name === route.name;
        const meta = TAB_META[route.name];
        const color = isFocused ? '#ff6b35' : '#999';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} style={tabStyles.tab} onPress={onPress} activeOpacity={0.7}>
            <View>
              <Ionicons name={meta.icon as any} size={24} color={color} />
              {route.name === 'cart' && cartCount > 0 && (
                <View style={tabStyles.badge}>
                  <Text style={tabStyles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[tabStyles.label, { color }]}>{meta.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#ff6b35', borderRadius: 10,
    minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});

export default function TabLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading]);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', color: '#1a1a1a' },
      }}
    >
      <Tabs.Screen name="index"            options={{ title: 'Home',       headerShown: false }} />
      <Tabs.Screen name="cook"             options={{ title: 'My Kitchen', headerShown: false }} />
      <Tabs.Screen name="cook-orders"      options={{ title: 'Orders',     headerShown: false }} />
      <Tabs.Screen name="rider-available"  options={{ title: 'Available',  headerShown: false }} />
      <Tabs.Screen name="rider-deliveries" options={{ title: 'Deliveries', headerShown: false }} />
      <Tabs.Screen name="cart"             options={{ title: 'Cart',       headerShown: false }} />
      <Tabs.Screen name="profile"          options={{ title: 'Profile',    headerShown: false }} />
    </Tabs>
  );
}
