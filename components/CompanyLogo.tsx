import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clearbitLogoUrl, faviconFallbackUrl } from '@/services/logoService';
import { GRADIENTS } from '@/constants/theme';

interface Props {
  company: string | undefined | null;
  size: number;
  borderRadius: number;
}

function companyGradient(company: string | undefined | null): readonly [string, string] {
  if (!company) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = (hash * 31 + company.charCodeAt(i)) | 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function CompanyLogo({ company, size, borderRadius }: Props) {
  const [logoUri, setLogoUri] = useState<string | null>(() => clearbitLogoUrl(company));
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    setLogoUri(clearbitLogoUrl(company));
    setLogoLoaded(false);
  }, [company]);

  const gradient = companyGradient(company);
  const containerStyle = { width: size, height: size, borderRadius, overflow: 'hidden' as const };
  const imgSize = size * 0.72;

  return (
    <View style={containerStyle}>
      <LinearGradient
        colors={gradient as [string, string]}
        style={[StyleSheet.absoluteFillObject, styles.center]}
      >
        <Text style={[styles.letter, { fontSize: size * 0.42 }]}>
          {(company || '?').charAt(0).toUpperCase()}
        </Text>
      </LinearGradient>

      {logoUri !== null && (
        <View style={[StyleSheet.absoluteFillObject, logoLoaded ? styles.whiteBg : null, styles.center]}>
          <Image
            source={{ uri: logoUri }}
            style={{ width: imgSize, height: imgSize }}
            resizeMode="contain"
            onLoad={() => setLogoLoaded(true)}
            onError={() => {
              setLogoLoaded(false);
              if (logoUri === clearbitLogoUrl(company)) {
                setLogoUri(faviconFallbackUrl(company));
              } else {
                setLogoUri(null);
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  whiteBg: {
    backgroundColor: '#ffffff',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
