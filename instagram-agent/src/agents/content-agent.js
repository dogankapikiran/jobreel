// src/agents/content-agent.js
// Claude API kullanarak post içeriği ve görsel promptu üretir

import Groq from 'groq-sdk';
import { getThemeForDate, BRAND_VOICE, HASHTAG_POOLS } from '../../templates/content-themes.js';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateContent(options = {}) {
  const {
    postType = 'image', // 'image' | 'reels'
    theme = null,
    date = new Date(),
    dryRun = false,
  } = options;

  const selectedTheme = theme || getThemeForDate(date);
  console.log(`[ContentAgent] Theme: ${selectedTheme.id} | Type: ${postType}`);

  const isReels = postType === 'reels';

  const systemPrompt = `Sen JobReel için Instagram içerik üreten uzman bir sosyal medya editörüsün.

${BRAND_VOICE}

Görevin: Verilen tema için eksiksiz bir Instagram post paketi üretmek.

ÇIKTI FORMATI: Yalnızca aşağıdaki JSON yapısını döndür, başka hiçbir şey yazma:
{
  "caption": "Instagram caption metni (emoji dahil, max 2200 karakter)",
  "hashtags": ["#tag1", "#tag2", ...],
  "image_prompt": "fal.ai/Stable Diffusion için İngilizce görsel üretim promptu",
  "alt_text": "Görsel için erişilebilirlik metni (Türkçe)",
  "story_hook": "İlk 1-2 saniye dikkat çekici açılış cümlesi",
  ${isReels ? `"reels_script": {
    "scenes": [
      {"duration": 3, "text": "Ekrana gelen metin", "visual": "Arka plan tarifi"},
      ...
    ],
    "total_duration": 30,
    "music_vibe": "upbeat/calm/motivational"
  },` : ''}
  "carousel_slides": ${isReels ? 'null' : `[
    {"slide": 1, "headline": "Kapak başlığı", "body": "Kısa metin"},
    {"slide": 2, "headline": "...", "body": "..."},
    {"slide": 3, "headline": "...", "body": "..."},
    {"slide": 4, "headline": "CTA", "body": "..."}
  ]`},
  "best_post_time": "HH:MM",
  "engagement_prediction": "low/medium/high",
  "ab_caption_variant": "Alternatif caption versiyonu"
}`;

  const userPrompt = `Bu hafta için post üret:

Tema ID: ${selectedTheme.id}
Tema Başlığı: ${selectedTheme.title}
Hook (dikkat çekici açılış): ${selectedTheme.hook}
Açı: ${selectedTheme.angle}
CTA: ${selectedTheme.cta}
Format: ${isReels ? 'Instagram Reels (15-30 saniye dikey video)' : 'Instagram Carousel veya Tek Görsel'}
Gün: ${isReels ? 'Cuma' : 'Salı'}

Önemli notlar:
- Caption'ı doğal, özgün ve paylaşılabilir yaz
- Hook ilk cümlede olmalı
- CTA son paragrafta olmalı
- Image prompt'u detaylı ve net yaz: stil, renkler, kompozisyon, duygu
- JobReel'in renk paleti: koyu lacivert (#0A1628) ve canlı turuncu (#FF6B35) veya elektriki mavi (#2563EB)
- Görsel modern, Türk iş dünyasını yansıtan, fotoğraf gerçekçiliğinden kaçın → flat design / editorial illustration stili tercih et`;

  if (dryRun) {
    console.log('[ContentAgent] DRY RUN - API çağrısı yapılmadı');
    return getMockContent(selectedTheme, postType);
  }

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const rawText = response.choices[0].message.content.trim();

    // JSON fence temizle
    const jsonText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const content = JSON.parse(jsonText);

    // Hashtag'leri birleştir (tema + üretilen + genel)
    const themeHashtags = selectedTheme.id.includes('remote')
      ? HASHTAG_POOLS.remote
      : selectedTheme.id.includes('cv')
        ? HASHTAG_POOLS.cv
        : HASHTAG_POOLS.general;

    content.hashtags = [...new Set([...content.hashtags, ...themeHashtags])].slice(0, 25);
    content.theme = selectedTheme;
    content.postType = postType;
    content.generatedAt = new Date().toISOString();

    console.log(`[ContentAgent] ✅ İçerik üretildi: ${content.caption.slice(0, 60)}...`);
    return content;
  } catch (err) {
    console.error('[ContentAgent] ❌ Hata:', err.message);
    throw err;
  }
}

function getMockContent(theme, postType) {
  return {
    caption: `🎯 ${theme.hook}\n\n${theme.angle}\n\n${theme.cta} 👇\n\n#jobreel #kariyer`,
    hashtags: ['#jobreel', '#kariyer', '#iş', '#işbul'],
    image_prompt:
      'Modern flat design illustration, Turkish young professional, dark navy blue background #0A1628, orange accent #FF6B35, editorial style, high contrast, minimal',
    alt_text: `${theme.title} hakkında bilgi veren JobReel Instagram görseli`,
    story_hook: theme.hook,
    carousel_slides:
      postType === 'image'
        ? [
            { slide: 1, headline: theme.hook, body: '' },
            { slide: 2, headline: theme.angle, body: 'Detaylar burada' },
            { slide: 3, headline: theme.cta, body: 'JobReel\'i indir' },
          ]
        : null,
    reels_script:
      postType === 'reels'
        ? {
            scenes: [
              { duration: 3, text: theme.hook, visual: 'Dark background, bold text' },
              { duration: 10, text: theme.angle, visual: 'Animated list' },
              { duration: 5, text: theme.cta, visual: 'CTA screen' },
            ],
            total_duration: 18,
            music_vibe: 'upbeat',
          }
        : null,
    best_post_time: '10:00',
    engagement_prediction: 'medium',
    ab_caption_variant: `✨ ${theme.angle}\n\n${theme.hook}\n\n${theme.cta}`,
    theme,
    postType,
    generatedAt: new Date().toISOString(),
    _mock: true,
  };
}

export async function refineContent(existingContent, instruction) {
  if (process.env.DRY_RUN === 'true') {
    return { ...existingContent, caption: `[REFINED: ${instruction}]\n\n${existingContent.caption}` };
  }

  const systemPrompt = `Sen JobReel Instagram içerik editörüsün. Mevcut post içeriğini verilen talimata göre düzenle.

Sadece talimatla ilgili alanları güncelle, diğerlerini aynen koru.
Marka renkleri: Koyu lacivert (#0A1628), canlı turuncu (#FF6B35).
Caption Türkçe, image_prompt İngilizce olmalı.
Mutlaka valid JSON döndür, başka hiçbir şey yazma.`;

  const userPrompt = `Mevcut içerik:
\`\`\`json
${JSON.stringify({
    caption: existingContent.caption,
    hashtags: existingContent.hashtags,
    image_prompt: existingContent.image_prompt,
  }, null, 2)}
\`\`\`

Talimat: ${instruction}

Yalnızca şu 3 alanı içeren JSON döndür (sadece değiştirilenleri güncelle, diğerlerini koru):
{ "caption": "...", "hashtags": [...], "image_prompt": "..." }`;

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const rawText = response.choices[0].message.content.trim();
  const jsonText = rawText.replace(/```json\n?|\n?```/g, '').trim();
  const refined = JSON.parse(jsonText);

  return {
    ...existingContent,
    ...(refined.caption && { caption: refined.caption }),
    ...(refined.hashtags?.length && { hashtags: refined.hashtags }),
    ...(refined.image_prompt && { image_prompt: refined.image_prompt }),
  };
}

// CLI çalıştırma
if (process.argv[1].includes('content-agent.js')) {
  const dryRun = process.argv.includes('--dry-run');
  const postType = process.argv.includes('--reels') ? 'reels' : 'image';

  generateContent({ postType, dryRun }).then((content) => {
    console.log('\n--- ÜRETİLEN İÇERİK ---');
    console.log(JSON.stringify(content, null, 2));
  });
}
