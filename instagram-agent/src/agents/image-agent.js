// src/agents/image-agent.js
// Fal.ai veya Pollinations.ai ile görsel üretir

const POLLINATIONS_BASE = 'https://gen.pollinations.ai/image';

// Instagram boyutları
const DIMENSIONS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

async function generateImageWithFal(prompt, width, height) {
  const url = 'https://fal.run/fal-ai/flux/schnell';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${process.env.FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      image_size: { width, height },
      num_images: 1,
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fal.ai API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (!data.images || data.images.length === 0) {
    throw new Error('Fal.ai did not return any images');
  }

  return data.images[0].url;
}

export async function generateImage(content, options = {}) {
  const { format = 'portrait', dryRun = false, style = 'editorial' } = options;
  const dims = DIMENSIONS[format] || DIMENSIONS.portrait;

  const brandStyle = `flat editorial illustration, modern minimal design, dark navy blue palette, orange accent color, professional clean aesthetic, Turkish urban setting, no text overlays, high quality, instagram-ready, ${style === 'reels' ? 'vertical format 9:16' : 'portrait format 4:5'}`;

  const fullPrompt = `${content.image_prompt}. Style: ${brandStyle}`;

  console.log(`[ImageAgent] Görsel üretiliyor... (${dims.width}x${dims.height})`);

  if (dryRun) {
    console.log('[ImageAgent] DRY RUN - Placeholder URL döndürülüyor');
    return {
      url: `https://placehold.co/${dims.width}x${dims.height}/0A1628/FF6B35?text=JobReel+Preview`,
      width: dims.width,
      height: dims.height,
      model: 'mock',
    };
  }

  if (process.env.FAL_API_KEY) {
    console.log('[ImageAgent] Fal.ai API kullanılıyor...');
    try {
      const url = await generateImageWithFal(fullPrompt, dims.width, dims.height);
      console.log(`[ImageAgent] ✅ Görsel hazır (Fal.ai)`);
      return {
        url,
        width: dims.width,
        height: dims.height,
        model: 'fal-flux-schnell',
        prompt: fullPrompt,
      };
    } catch (err) {
      console.error('[ImageAgent] ❌ Fal.ai Hatası:', err.message);
      console.log('[ImageAgent] Pollinations.ai fallback deneniyor...');
    }
  }

  // Fallback to Pollinations
  console.log('[ImageAgent] Pollinations.ai kullanılıyor...');
  const seed = Date.now() % 1000000;
  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(fullPrompt)}?width=${dims.width}&height=${dims.height}&seed=${seed}&model=flux&nologo=true`;

  console.log(`[ImageAgent] URL: ${url.slice(0, 100)}...`);

  const headers = {};
  if (process.env.POLLINATIONS_API_KEY) {
    console.log('[ImageAgent] API Key ile istek yapılıyor');
    headers['Authorization'] = `Bearer ${process.env.POLLINATIONS_API_KEY}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    let errText = '';
    try { errText = await response.text(); } catch (_) {}
    throw new Error(`Pollinations error ${response.status}: ${errText}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('image')) throw new Error(`Pollinations beklenmedik içerik: ${contentType}`);

  console.log(`[ImageAgent] ✅ Görsel hazır (${contentType})`);
  return {
    url,
    width: dims.width,
    height: dims.height,
    model: 'pollinations-flux',
    prompt: fullPrompt,
  };
}

// Reels için video üretimi — statik görsel fallback ile
export async function generateReelsVideo(content, options = {}) {
  const { dryRun = false } = options;

  console.log('[ImageAgent] Reels görseli üretiliyor...');

  const coverImage = await generateImage(content, { format: 'story', style: 'reels', dryRun });

  // Video üretimi mevcut değil, statik görselle devam et
  return {
    url: coverImage.url,
    cover_url: coverImage.url,
    duration: 0,
    model: 'static-pollinations',
    isStatic: true,
  };
}

// CLI
if (process.argv[1].includes('image-agent.js')) {
  const dryRun = process.argv.includes('--dry-run');
  const mockContent = {
    image_prompt: 'Young Turkish professional using smartphone, job searching app, modern office',
    story_hook: 'İş bulmanın yeni yolu burada',
    reels_script: { total_duration: 15 },
  };

  generateImage(mockContent, { dryRun }).then((r) => console.log('Image result:', r));
}
