import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { track } from '@/services/analytics';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_NAMES: Record<string, string> = {
  saved: 'Kaydettiklerim',
  applications: 'Başvurularım',
  index: 'Ana Sayfa',
  alerts: 'Uyarılar',
  profile: 'Profil',
};

const TAB_CONFIG: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  center?: boolean;
}> = {
  saved:        { icon: 'bookmark-outline',      iconFocused: 'bookmark' },
  applications: { icon: 'briefcase-outline',     iconFocused: 'briefcase' },
  index:        { icon: 'home-outline',           iconFocused: 'home', center: true },
  alerts:       { icon: 'notifications-outline', iconFocused: 'notifications' },
  profile:      { icon: 'person-outline',        iconFocused: 'person' },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { isDark, navBg, navBorder } = useTheme();

  const iconFocused  = isDark ? 'rgba(255,255,255,0.85)' : '#051650';
  const iconDefault  = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(5,22,80,0.30)';
  const centerActive = isDark ? '#1a2540' : '#051650';
  const centerIdle   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(5,22,80,0.08)';

  return (
    <View style={[styles.container, { borderColor: navBorder, shadowColor: isDark ? '#000000' : '#051650' }]}>
      <BlurView
        intensity={55}
        tint={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: navBg }]}
      />

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const cfg = TAB_CONFIG[route.name];
          if (!cfg) return null;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              track('Screen Viewed', { screen: SCREEN_NAMES[route.name] ?? route.name });
              navigation.navigate(route.name);
            }
          };

          const color = focused ? (cfg.center ? '#ffffff' : iconFocused) : iconDefault;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              {cfg.center ? (
                <View style={[styles.centerPill, { backgroundColor: focused ? centerActive : centerIdle }]}>
                  <Ionicons name={focused ? cfg.iconFocused : cfg.icon} size={22} color={focused ? '#fff' : color} />
                </View>
              ) : (
                <Ionicons
                  name={focused ? cfg.iconFocused : cfg.icon}
                  size={22}
                  color={color}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();

  useEffect(() => {
    if (!session) router.replace('/auth');
  }, [session]);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="applications" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 58,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
