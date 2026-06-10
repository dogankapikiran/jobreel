// hooks/useFollowCompany.ts

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useCompanyStore } from '@/store/companyStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';

export function useFollowCompany(companyName: string) {
  const { isFollowing, follow, unfollow } = useCompanyStore();
  const followed = isFollowing(companyName);

  const handleToggleFollow = useCallback(() => {
    const session = useAuthStore.getState().session;
    if (!session) {
      Alert.alert(
        'Giriş Gerekli',
        'Şirketleri takip edebilmek ve yeni ilanlardan haberdar olmak için lütfen giriş yapın.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Giriş Yap', onPress: () => router.push('/auth') },
        ]
      );
      return;
    }
    if (followed) {
      unfollow(companyName);
      api.unfollowCompany(companyName).catch(() => {});
    } else {
      follow(companyName);
      api.followCompany(companyName).catch(() => {});
    }
  }, [followed, companyName, follow, unfollow]);

  return { followed, handleToggleFollow };
}
