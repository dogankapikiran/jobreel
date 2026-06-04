// src/publishers/instagram.js
// Meta Instagram Graph API ile post yayınlar
// NOT: graph.instagram.com deprecate edildi, tüm istekler graph.facebook.com üzerinden yapılmalı

const IG_API_BASE = 'https://graph.facebook.com/v21.0';

function getCredentials() {
  const rawAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const rawAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  const sanitize = (val, prefixes = []) => {
    if (!val) return '';
    let cleaned = val.trim();
    for (const prefix of prefixes) {
      if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleaned = cleaned.substring(prefix.length).trim();
      }
    }
    return cleaned.replace(/^["']|["']$/g, '').trim();
  };

  return {
    accountId: sanitize(rawAccountId, ['INSTAGRAM_ACCOUNT_ID=', 'account_id=']),
    accessToken: sanitize(rawAccessToken, ['INSTAGRAM_ACCESS_TOKEN=', 'access_token=', 'NEW_TOKEN=']),
  };
}

async function igRequest(endpoint, method = 'GET', body = null) {
  const { accessToken } = getCredentials();
  const isIGToken = accessToken.startsWith('IGAA') || accessToken.startsWith('IGQV') || accessToken.startsWith('IGAAV');
  const apiBase = isIGToken ? 'https://graph.instagram.com/v21.0' : 'https://graph.facebook.com/v21.0';

  const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint}`;

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const data = await response.json();

  if (data.error) {
    console.error(`[Instagram] API Hata Detayı:`, JSON.stringify(data.error, null, 2));
    const subcode = data.error.error_subcode ? ` (subcode: ${data.error.error_subcode})` : '';
    throw new Error(`Instagram API Error ${data.error.code}${subcode}: ${data.error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Instagram HTTP ${response.status}: Beklenmeyen yanıt`);
  }

  return data;
}

// Statik görsel post
export async function publishImagePost(content, imageUrl) {
  const { accountId, accessToken } = getCredentials();

  if (!accountId || !accessToken) {
    throw new Error('INSTAGRAM_ACCOUNT_ID veya INSTAGRAM_ACCESS_TOKEN eksik');
  }

  const caption = formatCaption(content);
  console.log('[Instagram] Görsel container oluşturuluyor...');
  console.log(`[Instagram] Görsel URL: ${imageUrl.slice(0, 80)}...`);

  // Step 1: Media container oluştur
  const container = await igRequest(`/${accountId}/media?access_token=${encodeURIComponent(accessToken)}`, 'POST', {
    image_url: imageUrl,
    caption: caption,
  });

  if (!container.id) throw new Error('Container ID alınamadı');
  console.log(`[Instagram] Container oluşturuldu: ${container.id}`);

  // Step 2: Container hazır olana kadar bekle
  await waitForContainer(container.id, accessToken);

  // Step 3: Yayınla
  const publish = await igRequest(`/${accountId}/media_publish?access_token=${encodeURIComponent(accessToken)}`, 'POST', {
    creation_id: container.id,
  });

  console.log(`[Instagram] ✅ Post yayınlandı! Media ID: ${publish.id}`);
  return {
    mediaId: publish.id,
    url: `https://www.instagram.com/p/${publish.id}`,
    type: 'IMAGE',
  };
}

// Story post
export async function publishStory(content, imageUrl) {
  const { accountId, accessToken } = getCredentials();

  if (!accountId || !accessToken) {
    throw new Error('INSTAGRAM_ACCOUNT_ID veya INSTAGRAM_ACCESS_TOKEN eksik');
  }

  console.log('[Instagram] Story container oluşturuluyor...');

  const container = await igRequest(`/${accountId}/media?access_token=${encodeURIComponent(accessToken)}`, 'POST', {
    image_url: imageUrl,
    media_type: 'STORIES',
  });

  if (!container.id) throw new Error('Story container ID alınamadı');
  console.log(`[Instagram] Story container: ${container.id}`);

  await waitForContainer(container.id, accessToken);

  const publish = await igRequest(`/${accountId}/media_publish?access_token=${encodeURIComponent(accessToken)}`, 'POST', {
    creation_id: container.id,
  });

  console.log(`[Instagram] ✅ Story yayınlandı! Media ID: ${publish.id}`);
  return {
    mediaId: publish.id,
    url: `https://www.instagram.com/stories/jobreel/${publish.id}`,
    type: 'STORY',
  };
}

// Carousel post (birden fazla görsel)
export async function publishCarouselPost(content, imageUrls) {
  const { accountId, accessToken } = getCredentials();
  const caption = formatCaption(content);

  console.log(`[Instagram] ${imageUrls.length} slide'lı carousel oluşturuluyor...`);

  // Her slide için container oluştur
  const childContainers = await Promise.all(
    imageUrls.map(async (url, i) => {
      const child = await igRequest(`/${accountId}/media?access_token=${encodeURIComponent(accessToken)}`, 'POST', {
        image_url: url,
        is_carousel_item: true,
      });
      console.log(`[Instagram] Slide ${i + 1} container: ${child.id}`);
      return child.id;
    })
  );

  // Carousel container
  const carousel = await igRequest(`/${accountId}/media?access_token=${encodeURIComponent(accessToken)}`, 'POST', {
    media_type: 'CAROUSEL',
    caption: caption,
    children: childContainers.join(','),
  });

  await waitForContainer(carousel.id, accessToken);

  const publish = await igRequest(`/${accountId}/media_publish?access_token=${encodeURIComponent(accessToken)}`, 'POST', {
    creation_id: carousel.id,
  });

  console.log(`[Instagram] ✅ Carousel yayınlandı! Media ID: ${publish.id}`);
  return {
    mediaId: publish.id,
    url: `https://www.instagram.com/p/${publish.id}`,
    type: 'CAROUSEL',
  };
}

// Reels post
export async function publishReels(content, videoUrl, coverUrl) {
  const { accountId, accessToken } = getCredentials();
  const caption = formatCaption(content);

  console.log('[Instagram] Reels container oluşturuluyor...');

  const container = await igRequest(`/${accountId}/media?access_token=${encodeURIComponent(accessToken)}`, 'POST', {
    media_type: 'REELS',
    video_url: videoUrl,
    cover_url: coverUrl,
    caption: caption,
    share_to_feed: true,
  });

  if (!container.id) throw new Error('Reels container ID alınamadı');

  // Video işleme daha uzun sürer
  await waitForContainer(container.id, accessToken, 20, 10000);

  const publish = await igRequest(`/${accountId}/media_publish?access_token=${encodeURIComponent(accessToken)}`, 'POST', {
    creation_id: container.id,
  });

  console.log(`[Instagram] ✅ Reels yayınlandı! Media ID: ${publish.id}`);
  return {
    mediaId: publish.id,
    url: `https://www.instagram.com/reel/${publish.id}`,
    type: 'REELS',
  };
}

// Container işlenene kadar bekle (polling)
async function waitForContainer(containerId, accessToken, maxRetries = 10, interval = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    const status = await igRequest(
      `/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`
    );

    if (status.status_code === 'FINISHED') {
      console.log(`[Instagram] Container hazır (${i + 1}. deneme)`);
      return true;
    }

    if (status.status_code === 'ERROR') {
      throw new Error(`Container işleme hatası: ${status.status}`);
    }

    console.log(`[Instagram] Container işleniyor... (${i + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error('Container timeout: İşleme çok uzun sürdü');
}

// Caption formatlama (hashtag'leri sona ekle)
function formatCaption(content) {
  const hashtags = content.hashtags?.join(' ') || '';
  const mainCaption = content.caption || '';

  // Instagram caption limiti: 2200 karakter
  const combined = `${mainCaption}\n\n${hashtags}`;
  return combined.slice(0, 2200);
}

// Token geçerliliğini kontrol et + otomatik yenile
export async function checkTokenValidity() {
  const { accountId, accessToken } = getCredentials();

  console.log(`[Instagram] Debug: Token Length=${accessToken?.length}, AccountID=${accountId}`);
  if (accessToken) {
    console.log(`[Instagram] Debug: Token starts with: "${accessToken.substring(0, 10)}...", ends with: "...${accessToken.substring(accessToken.length - 10)}"`);
    console.log(`[Instagram] Debug: Token first 5 charCodes:`, [...accessToken.substring(0, 5)].map(c => c.charCodeAt(0)));
    console.log(`[Instagram] Debug: Token last 5 charCodes:`, [...accessToken.substring(accessToken.length - 5)].map(c => c.charCodeAt(0)));
  }

  if (!accessToken) {
    return { valid: false, error: 'INSTAGRAM_ACCESS_TOKEN env değişkeni eksik' };
  }

  if (!accountId) {
    return { valid: false, error: 'INSTAGRAM_ACCOUNT_ID env değişkeni eksik' };
  }

  try {
    // graph.facebook.com veya graph.instagram.com üzerinden token'ı doğrula
    const info = await igRequest(
      `/${accountId}?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
    );

    console.log(`[Instagram] ✅ Token geçerli. Kullanıcı: @${info.username || info.name || info.id}`);

    // Token'ın kalan süresini kontrol et
    try {
      const debugInfo = await igRequest(
        `/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(accessToken)}`
      );
      if (debugInfo.data?.expires_at) {
        const expiresAt = new Date(debugInfo.data.expires_at * 1000);
        const daysLeft = Math.floor((expiresAt - Date.now()) / 86400000);
        console.log(`[Instagram] Token geçerlilik: ${expiresAt.toISOString()} (${daysLeft} gün kaldı)`);
        if (daysLeft < 14) {
          console.warn(`[Instagram] ⚠️ Token ${daysLeft} gün içinde expire olacak! Yenilemeyi dene.`);
        }
      }
    } catch (_debugErr) {
      // debug_token başarısız olabilir, kritik değil
    }

    // Token yenilemeyi dene — IGAAV tokenlar için Instagram endpoint, EAA için Facebook
    const isIGToken = accessToken.startsWith('IGAA') || accessToken.startsWith('IGQV') || accessToken.startsWith('IGAAV');
    try {
      let refreshed;
      if (isIGToken) {
        // IGAAV long-lived token → refresh (app credentials gerekmez)
        refreshed = await igRequest(
          `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(accessToken)}`
        );
      } else {
        // EAA token → Facebook fb_exchange_token
        refreshed = await igRequest(
          `/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(process.env.META_APP_ID || '')}&client_secret=${encodeURIComponent(process.env.META_APP_SECRET || '')}&fb_exchange_token=${encodeURIComponent(accessToken)}`
        );
      }

      if (refreshed.access_token && refreshed.access_token !== accessToken) {
        process.env.INSTAGRAM_ACCESS_TOKEN = refreshed.access_token;
        const expiresInDays = Math.floor((refreshed.expires_in || 0) / 86400);
        console.log(`[Instagram] ✅ Token yenilendi! ${expiresInDays} gün daha geçerli.`);
        console.warn('[Instagram] ⚠️ Yeni token aşağıda — GitHub Secret\'ı güncelle:');
        console.warn(`NEW_TOKEN=${refreshed.access_token}`);
      }
    } catch (refreshErr) {
      // Short-lived IGAAV token ise exchange gerekir (app credentials ile)
      if (isIGToken && process.env.META_APP_ID && process.env.META_APP_SECRET) {
        try {
          const exchanged = await igRequest(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_id=${encodeURIComponent(process.env.META_APP_ID)}&client_secret=${encodeURIComponent(process.env.META_APP_SECRET)}&access_token=${encodeURIComponent(accessToken)}`
          );
          if (exchanged.access_token) {
            process.env.INSTAGRAM_ACCESS_TOKEN = exchanged.access_token;
            const expiresInDays = Math.floor((exchanged.expires_in || 0) / 86400);
            console.log(`[Instagram] ✅ IGAAV token long-lived'e çevrildi! ${expiresInDays} gün geçerli.`);
            console.warn(`NEW_TOKEN=${exchanged.access_token}`);
          }
        } catch (_) {
          console.warn(`[Instagram] Token exchange başarısız: ${refreshErr.message}`);
        }
      } else if (!isIGToken && process.env.META_APP_ID) {
        console.warn(`[Instagram] Token yenilenemedi: ${refreshErr.message}`);
      }
    }

    return { valid: true };

  } catch (err) {
    console.error('[Instagram] ❌ Token geçersiz:', err.message);
    console.error('[Instagram] 💡 Çözüm: https://developers.facebook.com/tools/explorer/ adresinden yeni token al');
    console.error('[Instagram] 💡 Gerekli izinler: instagram_basic, instagram_content_publish, pages_read_engagement');
    return { valid: false, error: err.message };
  }
}
