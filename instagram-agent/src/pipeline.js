// src/pipeline.js
// JobReel Instagram Otomasyon Pipeline'ı
// Sıra: İçerik üret → Görsel/Video üret → Telegram onay → Instagram yayınla

import { randomUUID } from 'crypto';
import { generateContent } from './agents/content-agent.js';
import { generateImage, generateReelsVideo } from './agents/image-agent.js';
import { sendForApproval, sendPublishNotification, sendErrorNotification } from './agents/telegram-approval.js';
import { publishImagePost, publishCarouselPost, publishReels, checkTokenValidity } from './publishers/instagram.js';
import { saveRunLog, log } from './utils/logger.js';

async function runPipeline() {
  const runId = randomUUID().split('-')[0]; // Kısa ID
  const postType = process.env.POST_TYPE || 'image';
  const dryRun = process.env.DRY_RUN === 'true';

  log('info', `Pipeline başladı`, { runId, postType, dryRun });

  const runLog = {
    runId,
    postType,
    dryRun,
    startedAt: new Date().toISOString(),
    steps: {},
    result: null,
    error: null,
  };

  try {
    // ─────────────────────────────────────
    // ADIM 0: Token Kontrolü
    // ─────────────────────────────────────
    if (!dryRun) {
      log('info', 'Instagram token kontrol ediliyor...');
      const tokenStatus = await checkTokenValidity();
      if (!tokenStatus.valid) {
        throw new Error(`Instagram token geçersiz: ${tokenStatus.error}`);
      }
      runLog.steps.tokenCheck = tokenStatus;
    }

    // ─────────────────────────────────────
    // ADIM 1: İçerik Üretimi (Claude)
    // ─────────────────────────────────────
    log('info', 'ADIM 1: İçerik üretiliyor...');
    const content = await generateContent({ postType, dryRun });
    runLog.steps.contentGeneration = {
      theme: content.theme?.id,
      captionLength: content.caption?.length,
      hashtagCount: content.hashtags?.length,
      engagementPrediction: content.engagement_prediction,
    };
    log('success', 'İçerik üretildi');

    // ─────────────────────────────────────
    // ADIM 2: Görsel / Video Üretimi (fal.ai)
    // ─────────────────────────────────────
    log('info', 'ADIM 2: Medya üretiliyor...');
    let mediaResult;

    if (postType === 'reels') {
      mediaResult = await generateReelsVideo(content, { dryRun });
    } else {
      mediaResult = await generateImage(content, {
        format: 'portrait',
        dryRun,
      });
    }

    runLog.steps.mediaGeneration = {
      model: mediaResult.model,
      url: mediaResult.url,
      isStatic: mediaResult.isStatic,
    };
    log('success', 'Medya üretildi');

    // ─────────────────────────────────────
    // ADIM 3: Telegram Onayı
    // ─────────────────────────────────────
    log('info', 'ADIM 3: Telegram onayı bekleniyor...');
    let approvalResult;

    const autoApprove = process.env.AUTO_APPROVE === 'true';

    if (dryRun || autoApprove) {
      log('info', autoApprove ? 'AUTO_APPROVE: Telegram atlanıyor' : 'DRY RUN: Otomatik onay simüle ediliyor');
      approvalResult = { action: 'approve', runId };
    } else {
      try {
        approvalResult = await sendForApproval(content, mediaResult, runId);
      } catch (telegramErr) {
        console.warn(`[Telegram] Ulaşılamadı, otomatik onaylanıyor: ${telegramErr.message}`);
        approvalResult = { action: 'approve', runId };
      }
    }

    runLog.steps.telegramApproval = { action: approvalResult.action };

    // Onay sonucuna göre davran
    if (approvalResult.action === 'reject') {
      log('warn', 'Post reddedildi, pipeline durduruluyor');
      runLog.result = 'rejected';
      saveRunLog(runId, runLog);
      return;
    }

    if (approvalResult.action === 'timeout') {
      log('warn', 'Onay timeout, post atlandı');
      runLog.result = 'timeout';
      saveRunLog(runId, runLog);
      return;
    }

    if (approvalResult.action === 'regenerate') {
      log('info', 'Yeniden üretim istendi, pipeline yeniden başlıyor...');
      // Yeni run başlat
      process.env.POST_TYPE = postType;
      await runPipeline();
      return;
    }

    // İçerik veya görsel Telegram'dan güncellendiyse kullan
    const finalContent = approvalResult.updatedContent || content;
    const finalMedia = approvalResult.updatedMedia || mediaResult;
    log('success', 'Onay alındı, yayınlanıyor...');

    // ─────────────────────────────────────
    // ADIM 4: Instagram'a Yayın
    // ─────────────────────────────────────
    log('info', 'ADIM 4: Instagram\'a yayınlanıyor...');
    let publishResult;

    if (dryRun) {
      log('info', 'DRY RUN: Yayın simüle ediliyor');
      publishResult = { mediaId: 'mock-123', url: 'https://instagram.com/p/mock', type: postType.toUpperCase() };
    } else if (postType === 'reels' && !finalMedia.isStatic) {
      publishResult = await publishReels(
        finalContent,
        finalMedia.url,
        finalMedia.cover_url
      );
    } else {
      publishResult = await publishImagePost(finalContent, finalMedia.url);
    }

    runLog.steps.publishing = publishResult;
    runLog.result = 'published';
    runLog.completedAt = new Date().toISOString();

    log('success', `Pipeline tamamlandı! ${publishResult.url}`);

    // ─────────────────────────────────────
    // ADIM 5: Başarı Bildirimi
    // ─────────────────────────────────────
    if (!dryRun) {
      await sendPublishNotification(finalContent, publishResult.url, runId).catch((e) =>
        console.warn(`[Telegram] Bildirim gönderilemedi: ${e.message}`)
      );
    }

    saveRunLog(runId, runLog);
    log('success', `Run ${runId} başarıyla tamamlandı`);

  } catch (err) {
    log('error', `Pipeline hatası: ${err.message}`);
    runLog.error = err.message;
    runLog.result = 'error';
    saveRunLog(runId, runLog);

    if (!dryRun) {
      await sendErrorNotification(err, runId).catch(() => {});
    }

    process.exit(1);
  }
}

// Çalıştır
runPipeline();
