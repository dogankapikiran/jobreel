// src/agents/telegram-approval.js
// Post hazırlandığında Telegram'a önizleme gönderir ve onay bekler

import TelegramBot from 'node-telegram-bot-api';
import { refineContent } from './content-agent.js';
import { generateImage } from './image-agent.js';

const APPROVAL_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 saat
const INPUT_TIMEOUT_MS = 10 * 60 * 1000;        // 10 dk — talimat yazma süresi

function buildKeyboard(runId) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Onayla ve Yayınla', callback_data: `approve:${runId}` },
        { text: '❌ İptal Et', callback_data: `reject:${runId}` },
      ],
      [
        { text: '✏️ İçerik Düzenle', callback_data: `edit_content:${runId}` },
        { text: '🎨 Görsel Değiştir', callback_data: `edit_image:${runId}` },
      ],
      [
        { text: '🔄 Yeni İçerik Üret', callback_data: `regenerate:${runId}` },
      ],
    ],
  };
}

export async function sendForApproval(content, mediaResult, runId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN veya TELEGRAM_CHAT_ID eksik');
  }

  const bot = new TelegramBot(token, { polling: false });

  const postTypeLabels = { reels: '🎬 Reels', story: '📱 Story', image: '🖼️ Görsel Post' };
  const postType = postTypeLabels[content.postType] || '🖼️ Görsel Post';
  const emoji = content.engagement_prediction === 'high' ? '🔥' : content.engagement_prediction === 'medium' ? '👍' : '📊';

  const previewText = `
*JobReel Instagram Post Onayı* ${emoji}

*Tür:* ${postType}
*Tema:* ${content.theme?.title || 'Genel'}
*Engagement tahmini:* ${content.engagement_prediction?.toUpperCase()}
*Run ID:* \`${runId}\`

─────────────────
*📝 CAPTION ÖNİZLEME:*
${content.caption.slice(0, 500)}${content.caption.length > 500 ? '...' : ''}

*🏷️ HASHTAG'LER (${content.hashtags?.length}):*
${content.hashtags?.slice(0, 10).join(' ')} ...

─────────────────
*Ne yapmak istiyorsun?*
  `.trim();

  let sentMessage;
  try {
    if (mediaResult.isStatic || content.postType === 'image') {
      sentMessage = await bot.sendPhoto(chatId, mediaResult.url, {
        caption: previewText,
        parse_mode: 'Markdown',
        reply_markup: buildKeyboard(runId),
      });
    } else {
      sentMessage = await bot.sendVideo(chatId, mediaResult.url, {
        caption: previewText,
        parse_mode: 'Markdown',
        reply_markup: buildKeyboard(runId),
        supports_streaming: true,
      });
    }
  } catch (mediaErr) {
    console.warn('[TelegramApproval] Medya gönderilemedi, text olarak deniyor:', mediaErr.message);
    sentMessage = await bot.sendMessage(chatId, previewText + `\n\n*Görsel URL:* ${mediaResult.url}`, {
      parse_mode: 'Markdown',
      reply_markup: buildKeyboard(runId),
    });
  }

  console.log(`[TelegramApproval] ✅ Onay mesajı gönderildi (message_id: ${sentMessage.message_id})`);

  return waitForApproval(bot, chatId, runId, content, mediaResult);
}

function waitForApproval(bot, chatId, runId, initialContent, initialMedia) {
  return new Promise((resolve) => {
    let currentContent = { ...initialContent };
    let currentMedia = { ...initialMedia };
    let expectingTextFor = null; // 'content_edit' | 'image_edit' | null
    let isProcessing = false;

    const mainTimeout = setTimeout(() => {
      bot.stopPolling();
      console.log('[TelegramApproval] ⏰ Timeout: 4 saat içinde yanıt gelmedi');
      resolve({ action: 'timeout', runId });
    }, APPROVAL_TIMEOUT_MS);

    function finish(result) {
      clearTimeout(mainTimeout);
      bot.stopPolling();
      resolve(result);
    }

    bot.startPolling({ timeout: 60, allowed_updates: ['callback_query', 'message'] });

    bot.on('callback_query', async (query) => {
      if (!query.data.endsWith(`:${runId}`)) return;
      if (isProcessing) {
        await bot.answerCallbackQuery(query.id, { text: '⏳ İşlem devam ediyor...' }).catch(() => {});
        return;
      }

      const [action] = query.data.split(':');
      await bot.answerCallbackQuery(query.id, { text: getActionLabel(action) }).catch(() => {});

      if (action === 'approve') {
        await bot.sendMessage(chatId, '🚀 Post yayınlanıyor...');
        finish({ action: 'approve', runId, updatedContent: currentContent, updatedMedia: currentMedia });

      } else if (action === 'reject') {
        await bot.sendMessage(chatId, '❌ Post iptal edildi.');
        finish({ action: 'reject', runId });

      } else if (action === 'regenerate') {
        await bot.sendMessage(chatId, '🔄 Yeni içerik üretiliyor, bekle...');
        finish({ action: 'regenerate', runId });

      } else if (action === 'edit_content') {
        expectingTextFor = 'content_edit';
        await bot.sendMessage(chatId,
          '✏️ *İçerik talimatını yaz:*\n\nÖrn: "daha kısa yap", "daha enerjik ton kullan", "CTA güçlendir", "hashtag\'leri güncelle"',
          { parse_mode: 'Markdown' }
        );

      } else if (action === 'edit_image') {
        expectingTextFor = 'image_edit';
        await bot.sendMessage(chatId,
          '🎨 *Görsel talimatını yaz:*\n\nÖrn: "daha aydınlık zemin", "kadın karakter ekle", "İstanbul silueti arka planda"',
          { parse_mode: 'Markdown' }
        );
      }
    });

    bot.on('message', async (msg) => {
      if (msg.chat.id.toString() !== chatId.toString()) return;
      if (!msg.text || !expectingTextFor || isProcessing) return;

      const instruction = msg.text;
      const mode = expectingTextFor;
      expectingTextFor = null;
      isProcessing = true;

      if (mode === 'content_edit') {
        await bot.sendMessage(chatId, `⏳ Groq işliyor: _"${instruction}"_`, { parse_mode: 'Markdown' });
        try {
          currentContent = await refineContent(currentContent, instruction);

          const captionPreview = currentContent.caption.slice(0, 800);
          const hasMore = currentContent.caption.length > 800;
          await bot.sendMessage(chatId,
            `✅ *İçerik güncellendi:*\n\n${captionPreview}${hasMore ? '...' : ''}\n\n*Hashtag'ler:* ${currentContent.hashtags?.slice(0, 8).join(' ')}`,
            { parse_mode: 'Markdown', reply_markup: buildKeyboard(runId) }
          );
        } catch (err) {
          console.error('[TelegramApproval] refineContent hatası:', err.message);
          await bot.sendMessage(chatId,
            `❌ Groq hatası: ${err.message}\n\nOrijinal içerik korundu.`,
            { reply_markup: buildKeyboard(runId) }
          );
        }

      } else if (mode === 'image_edit') {
        await bot.sendMessage(chatId, `⏳ Görsel prompt güncelleniyor ve görsel üretiliyor: _"${instruction}"_`, { parse_mode: 'Markdown' });
        try {
          // image_prompt'u Groq ile güncelle
          const refined = await refineContent(currentContent, `Sadece image_prompt alanını şu talimata göre güncelle, diğer alanları aynen koru: ${instruction}`);
          currentContent = { ...currentContent, image_prompt: refined.image_prompt };

          // Yeni görseli üret
          const imageFormat = (currentContent.postType === 'reels' || currentContent.postType === 'story') ? 'story' : 'portrait';
          currentMedia = await generateImage(currentContent, { format: imageFormat });

          await bot.sendPhoto(chatId, currentMedia.url, {
            caption: `🎨 *Yeni görsel hazır*\n\n_Prompt: ${currentContent.image_prompt.slice(0, 200)}_`,
            parse_mode: 'Markdown',
            reply_markup: buildKeyboard(runId),
          });
        } catch (err) {
          console.error('[TelegramApproval] görsel üretim hatası:', err.message);
          await bot.sendMessage(chatId,
            `❌ Görsel üretim hatası: ${err.message}\n\nEski görsel korundu.`,
            { reply_markup: buildKeyboard(runId) }
          );
        }
      }

      isProcessing = false;
    });
  });
}

function getActionLabel(action) {
  const labels = {
    approve: '✅ Onaylandı',
    edit_content: '✏️ İçerik Düzenleniyor',
    edit_image: '🎨 Görsel Değiştiriliyor',
    regenerate: '🔄 Yeniden Üretiliyor',
    reject: '❌ İptal Edildi',
    timeout: '⏰ Zaman Aşımı',
  };
  return labels[action] || action;
}

export async function sendPublishNotification(content, postUrl, runId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const bot = new TelegramBot(token, { polling: false });

  const message = `
✅ *Post başarıyla yayınlandı!*

🔗 [Instagram'da görüntüle](${postUrl || 'https://instagram.com/jobreel'})
🕐 ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
📊 Tema: ${content.theme?.title}
  `.trim();

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

export async function sendErrorNotification(error, runId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const bot = new TelegramBot(token, { polling: false });

  await bot.sendMessage(
    chatId,
    `❌ *Pipeline Hatası*\n\nRun: \`${runId}\`\nHata: ${error.message}`,
    { parse_mode: 'Markdown' }
  );
}
