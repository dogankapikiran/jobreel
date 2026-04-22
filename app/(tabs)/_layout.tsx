import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BOTTOM_NAV_HEIGHT, COLORS } from '@/constants/theme';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.item}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: BOTTOM_NAV_HEIGHT,
          backgroundColor: COLORS.navBg,
          borderTopColor: COLORS.navBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⚡" label="Keşfet" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🔖" label="Kaydettiklerim" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📨" label="Başvurularım" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profil" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  labelActive: {
    color: COLORS.accent,
  },
});
