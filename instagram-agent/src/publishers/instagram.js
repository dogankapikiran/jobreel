// src/publishers/instagram.js
// Meta Instagram Graph API ile post yayınlar

const IG_API_BASE = 'https://graph.instagram.com/v21.0';

async function igRequest(endpoint, method = 'GET', body = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${IG_API_BASE}${endpoint}`;

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const data = await response.json();

  if (data.error) {
    throw new Error(`Instagram API Error ${data.error.code}: ${data.error.message}`);
  }

  return data;
}

// Statik görsel post
export async function publishImagePost(content, imageUrl) {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accountId || !accessToken) {
    throw new Error('INSTAGRAM_ACCOUNT_ID veya INSTAGRAM_ACCESS_TOKEN eksik');
  }

  const caption = formatCaption(content);
  console.log('[Instagram] Görsel container oluşturuluyor...');

  // Step 1: Media container oluştur
  const container = await igRequest(`/${accountId}/media?access_token=${accessToken}`, 'POST', {
    image_url: imageUrl,
    caption: caption,
    media_type: 'IMAGE',
  });

  if (!container.id) throw new Error('Container ID alınamadı');
  console.log(`[Instagram] Container oluşturuldu: ${container.id}`);

  // Step 2: Container hazır olana kadar bekle
  await waitForContainer(container.id, accessToken);

  // Step 3: Yayınla
  const publish = await igRequest(`/${accountId}/media_publish?access_token=${accessToken}`, 'POST', {
    creation_id: container.id,
  });

  console.log(`[Instagram] ✅ Post yayınlandı! Media ID: ${publish.id}`);
  return {
    mediaId: publish.id,
    url: `https://www.instagram.com/p/${publish.id}`,
    type: 'IMAGE',
  };
}

// Carousel post (birden fazla görsel)
export async function publishCarouselPost(content, imageUrls) {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const caption = formatCaption(content);

  console.log(`[Instagram] ${imageUrls.length} slide'lı carousel oluşturuluyor...`);

  // Her slide için container oluştur
  const childContainers = await Promise.all(
    imageUrls.map(async (url, i) => {
      const child = await igRequest(`/${accountId}/media?access_token=${accessToken}`, 'POST', {
        image_url: url,
        is_carousel_item: true,
      });
      console.log(`[Instagram] Slide ${i + 1} container: ${child.id}`);
      return child.id;
    })
  );

  // Carousel container
  const carousel = await igRequest(`/${accountId}/media?access_token=${accessToken}`, 'POST', {
    media_type: 'CAROUSEL',
    caption: caption,
    children: childContainers.join(','),
  });

  await waitForContainer(carousel.id, accessToken);

  const publish = await igRequest(`/${accountId}/media_publish?access_token=${accessToken}`, 'POST', {
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
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const caption = formatCaption(content);

  console.log('[Instagram] Reels container oluşturuluyor...');

  const container = await igRequest(`/${accountId}/media?access_token=${accessToken}`, 'POST', {
    media_type: 'REELS',
    video_url: videoUrl,
    cover_url: coverUrl,
    caption: caption,
    share_to_feed: true,
  });

  if (!container.id) throw new Error('Reels container ID alınamadı');

  // Video işleme daha uzun sürer
  await waitForContainer(container.id, accessToken, 20, 10000);

  const publish = await igRequest(`/${accountId}/media_publish?access_token=${accessToken}`, 'POST', {
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
      `/${containerId}?fields=status_code,status&access_token=${accessToken}`
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

// Token geçerliliğini kontrol et
export async function checkTokenValidity() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  try {
    const info = await igRequest(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );
    const expiresAt = new Date(info.data?.expires_at * 1000);
    const daysLeft = Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

    console.log(`[Instagram] Token geçerli. ${daysLeft} gün kaldı (${expiresAt.toLocaleDateString('tr-TR')})`);

    if (daysLeft < 10) {
      console.warn('[Instagram] ⚠️ Token 10 günden az kaldı! Yenilemeyi unutma.');
    }

    return { valid: true, daysLeft, expiresAt };
  } catch (err) {
    console.error('[Instagram] ❌ Token geçersiz:', err.message);
    return { valid: false, error: err.message };
  }
}
