import { useEffect, useState } from 'react';
import {
  BrandPalette,
  brandColors,
  buildPaletteFromHex,
  extractDominantColor,
  extractedColorCache,
} from '@/services/logoService';

export function useBrandColor(company: string): BrandPalette {
  const [palette, setPalette] = useState<BrandPalette>(() => {
    const cached = extractedColorCache.get(company);
    return cached ? buildPaletteFromHex(cached) : brandColors(company);
  });

  useEffect(() => {
    if (extractedColorCache.has(company)) return;

    extractDominantColor(company).then((hex) => {
      if (hex) {
        extractedColorCache.set(company, hex);
        setPalette(buildPaletteFromHex(hex));
      }
    });
  }, [company]);

  return palette;
}
