// src/agents/telegram-approval.js
// Post hazırlandığında Telegram'a önizleme gönderir ve onay bekler

import TelegramBot from 'node-telegram-bot-api';

const APPROVAL_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 saat

export async function sendForApproval(content, mediaResult, runId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN veya TELEGRAM_CHAT_ID eksik');
  }

  const bot = new TelegramBot(token, { polling: false });

  const postType = content.postType === 'reels' ? '🎬 Reels' : '🖼️ Görsel Post';
  const emoji = content.engagement_prediction === 'high' ? '🔥' : content.engagement_prediction === 'medium' ? '👍' : '📊';

  // Önizleme mesajı
  const previewText = `
*JobReel Instagram Post Onayı* ${emoji}

*Tür:* ${postType}
*Tema:* ${content.theme?.title || 'Genel'}
*Engagement tahmini:* ${content.engagement_prediction?.toUpperCase()}
*Run ID:* \`${runId}\`

─────────────────
*📝 CAPTION ÖNİZLEME:*
${content.caption.slice(0, 500)}${content.caption.length > 500 ? '...' : ''}

*🏷️ HASHTAG'LER (${content.hashtags?.length}):'*
${content.hashtags?.slice(0, 10).join(' ')} ...

─────────────────
*Ne yapmak istiyorsun?*
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Onayla ve Yayınla', callback_data: `approve:${runId}` },
        { text: '✏️ Caption Düzenle', callback_data: `edit_caption:${runId}` },
      ],
      [
        { text: '🔄 Yeni İçerik Üret', callback_data: `regenerate:${runId}` },
        { text: '❌ Bu Postu İptal Et', callback_data: `reject:${runId}` },
      ],
    ],
  };

  // Görseli gönder
  let sentMessage;
  try {
    if (mediaResult.isStatic || content.postType === 'image') {
      sentMessage = await bot.sendPhoto(chatId, mediaResult.url, {
        caption: previewText,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else {
      // Video
      sentMessage = await bot.sendVideo(chatId, mediaResult.url, {
        caption: previewText,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        supports_streaming: true,
      });
    }
  } catch (mediaErr) {
    console.warn('[TelegramApproval] Medya gönderilemedi, text olarak deniyor:', mediaErr.message);
    sentMessage = await bot.sendMessage(chatId, previewText + `\n\n*Görsel URL:* ${mediaResult.url}`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  console.log(`[TelegramApproval] ✅ Onay mesajı gönderildi (message_id: ${sentMessage.message_id})`);

  // Callback bekleme (polling ile)
  return waitForApproval(bot, chatId, runId, content, sentMessage.message_id);
}

function waitForApproval(bot, chatId, runId, content, messageId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      bot.stopPolling();
      console.log('[TelegramApproval] ⏰ Timeout: 4 saat içinde yanıt gelmedi, post atlandı');
      resolve({ action: 'timeout', runId });
    }, APPROVAL_TIMEOUT_MS);

    // Polling başlat
    bot.startPolling({ timeout: 60, allowed_updates: ['callback_query', 'message'] });

    bot.on('callback_query', async (query) => {
      if (!query.data.includes(runId)) return; // Başka run'ın callback'i

      clearTimeout(timeout);
      bot.stopPolling();

      const [action] = query.data.split(':');

      // Butonu devre dışı bırak
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [[{ text: `→ ${getActionLabel(action)}`, callback_data: 'done' }]] },
        { chat_id: chatId, message_id: messageId }
      ).catch(() => {});

      await bot.answerCallbackQuery(query.id, { text: getActionLabel(action) });

      if (action === 'approve') {
        await bot.sendMessage(chatId, '🚀 Post yayınlanıyor...');
        resolve({ action: 'approve', runId });

      } else if (action === 'edit_caption') {
        await bot.sendMessage(chatId, '✏️ Yeni caption\'ı yaz (sonraki mesajın caption olarak kaydedilecek):');

        // Sonraki text mesajını caption olarak al
        bot.startPolling();
        bot.once('message', async (msg) => {
          bot.stopPolling();
          if (msg.chat.id.toString() === chatId.toString() && msg.text) {
            content.caption = msg.text;
            await bot.sendMessage(chatId, '✅ Caption güncellendi, yayınlanıyor...');
            resolve({ action: 'approve', runId, updatedContent: content });
          }
        });

      } else if (action === 'regenerate') {
        await bot.sendMessage(chatId, '🔄 Yeni içerik üretiliyor, bekle...');
        resolve({ action: 'regenerate', runId });

      } else if (action === 'reject') {
        await bot.sendMessage(chatId, '❌ Post iptal edildi.');
        resolve({ action: 'reject', runId });
      }
    });
  });
}

function getActionLabel(action) {
  const labels = {
    approve: '✅ Onaylandı',
    edit_caption: '✏️ Caption Düzenleniyor',
    regenerate: '🔄 Yeniden Üretiliyor',
    reject: '❌ İptal Edildi',
    timeout: '⏰ Zaman Aşımı',
  };
  return labels[action] || action;
}

// Post yayınlandıktan sonra bildirim gönder
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
