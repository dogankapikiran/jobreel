// src/agents/image-agent.js
// Pollinations.ai ile ücretsiz görsel üretir (API key gerektirmez)

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

// Instagram boyutları
const DIMENSIONS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

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

  const seed = Date.now() % 1000000;
  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(fullPrompt)}?width=${dims.width}&height=${dims.height}&seed=${seed}&model=flux&nologo=true`;

  console.log(`[ImageAgent] URL: ${url.slice(0, 100)}...`);

  // Görseli tam olarak indir — Instagram fetch ettiğinde cache'de hazır olsun
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pollinations error ${response.status}`);
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
