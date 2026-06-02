// src/agents/image-agent.js
// fal.ai API kullanarak görsel ve video üretir

const FAL_API_BASE = 'https://fal.run';

// fal.ai API wrapper
async function falRequest(modelPath, input) {
  const response = await fetch(`${FAL_API_BASE}/${modelPath}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${process.env.FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`fal.ai error ${response.status}: ${err}`);
  }

  return response.json();
}

// Instagram boyutları
const DIMENSIONS = {
  square: { width: 1080, height: 1080 },      // Feed
  portrait: { width: 1080, height: 1350 },    // Feed dikey
  story: { width: 1080, height: 1920 },        // Story / Reels
};

export async function generateImage(content, options = {}) {
  const {
    format = 'portrait',
    dryRun = false,
    style = 'editorial',
  } = options;

  const dims = DIMENSIONS[format] || DIMENSIONS.portrait;

  // JobReel marka stili eklentisi
  const brandStyle = `
    flat editorial illustration, modern minimal design,
    dark navy blue palette (#0A1628), orange accent color (#FF6B35),
    professional clean aesthetic, Turkish urban setting,
    no text overlays, high quality, instagram-ready,
    ${style === 'reels' ? 'vertical format 9:16' : 'portrait format 4:5'}
  `.trim();

  const fullPrompt = `${content.image_prompt}. Style: ${brandStyle}`;
  const negativePrompt =
    'text, watermark, logo, ugly, blurry, distorted, low quality, nsfw, violent, stock photo cliché';

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

  try {
    // FLUX ile yüksek kaliteli görsel üret
    const result = await falRequest('fal-ai/flux/schnell', {
      prompt: fullPrompt,
      negative_prompt: negativePrompt,
      image_size: `${dims.width}x${dims.height}`,
      num_images: 1,
      num_inference_steps: 4, // schnell için optimal
      guidance_scale: 3.5,
    });

    const imageUrl = result.images?.[0]?.url;
    if (!imageUrl) throw new Error('fal.ai görsel URL döndürmedi');

    console.log(`[ImageAgent] ✅ Görsel hazır: ${imageUrl.slice(0, 60)}...`);
    return {
      url: imageUrl,
      width: dims.width,
      height: dims.height,
      model: 'flux-schnell',
      prompt: fullPrompt,
    };
  } catch (err) {
    console.error('[ImageAgent] ❌ FLUX başarısız, SD fallback deneniyor...');

    // Fallback: Stable Diffusion XL
    try {
      const result = await falRequest('fal-ai/stable-diffusion-xl', {
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        width: dims.width,
        height: dims.height,
        num_images: 1,
      });

      const imageUrl = result.images?.[0]?.url;
      return { url: imageUrl, width: dims.width, height: dims.height, model: 'sdxl' };
    } catch (fallbackErr) {
      throw new Error(`Görsel üretim başarısız: ${fallbackErr.message}`);
    }
  }
}

// Reels için video üretimi (kling veya animate)
export async function generateReelsVideo(content, options = {}) {
  const { dryRun = false } = options;

  console.log('[ImageAgent] Reels videosu üretiliyor...');

  if (dryRun) {
    return {
      url: 'https://sample-videos.com/zip/10mb.zip', // placeholder
      duration: content.reels_script?.total_duration || 15,
      model: 'mock',
    };
  }

  // Önce cover frame üret
  const coverImage = await generateImage(content, { format: 'story', style: 'reels', dryRun });

  try {
    // fal.ai Kling ile image-to-video
    const result = await falRequest('fal-ai/kling-video/v1.6/standard/image-to-video', {
      prompt: `${content.story_hook} - dynamic motion, smooth animation, professional`,
      image_url: coverImage.url,
      duration: '5',
      aspect_ratio: '9:16',
    });

    const videoUrl = result.video?.url;
    if (!videoUrl) throw new Error('Video URL alınamadı');

    console.log(`[ImageAgent] ✅ Video hazır: ${videoUrl.slice(0, 60)}...`);
    return {
      url: videoUrl,
      cover_url: coverImage.url,
      duration: 5,
      model: 'kling-v1.6',
    };
  } catch (err) {
    console.warn('[ImageAgent] ⚠️ Video üretim başarısız, statik görsel ile devam:', err.message);
    // Video başarısız olursa statik görselle devam et
    return {
      url: coverImage.url,
      cover_url: coverImage.url,
      duration: 0,
      model: 'static-fallback',
      isStatic: true,
    };
  }
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
