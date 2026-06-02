# JobReel Instagram Otomasyon Ajanı

Salı ve Cuma günleri otomatik olarak Instagram post üreten ve yayınlayan pipeline.

## Akış

```
GitHub Actions (cron)
    ↓
Claude API → İçerik + Görsel Prompt
    ↓
fal.ai → Görsel (FLUX) veya Video (Kling)
    ↓
Telegram Bot → Önizleme + Onay Butonu
    ↓  ✅ Onayla
Instagram Graph API → Yayın
    ↓
Telegram → Başarı Bildirimi
```

---

## Kurulum (Sırasıyla)

### 1. Anthropic API Key
- https://console.anthropic.com/settings/keys → Key oluştur

### 2. fal.ai API Key
- https://fal.ai → Kayıt ol → Dashboard → Keys

### 3. Telegram Bot Kurulumu
```
1. Telegram'da @BotFather'a mesaj at
2. /newbot → isim ver → token al
3. Bota /start mesajı gönder
4. @userinfobot'a mesaj at → kendi chat_id'ni öğren
```

### 4. Instagram Graph API Kurulumu
```
1. https://developers.facebook.com → Yeni app oluştur (Business type)
2. Instagram Graph API ürününü ekle
3. Bir Facebook Page oluştur (yoksa)
4. Instagram Professional hesabını Facebook Page'e bağla
5. App'e gerekli permission'ları ekle:
   - instagram_basic
   - instagram_content_publish
   - pages_read_engagement
6. Access Token al:
   Graph API Explorer → Instagram hesabını seç → Generate Token
7. Short-lived token'ı long-lived token'a çevir:
```

```bash
curl -X GET "https://graph.facebook.com/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={SHORT_TOKEN}"
```

```
8. Instagram Account ID'ni bul:
```

```bash
curl "https://graph.instagram.com/v21.0/me?fields=id,username&access_token={TOKEN}"
```

### 5. GitHub Secrets Ayarla
Repository → Settings → Secrets → Actions → New repository secret:

| Secret | Değer |
|--------|-------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `FAL_API_KEY` | fal.ai API key |
| `TELEGRAM_BOT_TOKEN` | Bot token |
| `TELEGRAM_CHAT_ID` | Chat ID |
| `INSTAGRAM_ACCESS_TOKEN` | Long-lived token |
| `INSTAGRAM_ACCOUNT_ID` | Numerik hesap ID |

### 6. İlk Test
```bash
# Local test (dry run)
cp .env.example .env
# .env dosyasını doldur

npm install
DRY_RUN=true POST_TYPE=image node src/pipeline.js
```

GitHub'da manual workflow trigger için:
Actions → Instagram Post → Run workflow → dry_run: true

---

## Zamanlama

| Gün | Saat (İstanbul) | Format |
|-----|----------------|--------|
| Salı | 10:00 | Statik Görsel / Carousel |
| Cuma | 10:00 | Reels |

---

## Token Yenileme (60 Günde Bir)

Instagram token'ları 60 günde bir expire olur. Yenilemek için:

```bash
curl "https://graph.instagram.com/refresh_access_token
  ?grant_type=ig_refresh_token
  &access_token={MEVCUT_TOKEN}"
```

Yeni token'ı GitHub Secret'a güncelle.

---

## Özelleştirme

### Yeni Tema Ekle
`templates/content-themes.js` → `CONTENT_THEMES.tuesday` veya `.friday` dizisine obje ekle.

### Görsel Stili Değiştir
`src/agents/image-agent.js` → `brandStyle` string'ini düzenle.

### Caption Formatı
`src/agents/content-agent.js` → `systemPrompt` içindeki JSON çıktı formatını değiştir.

---

## Klasör Yapısı

```
jobreel-agent/
├── .github/workflows/
│   └── instagram-post.yml    # Cron scheduler
├── src/
│   ├── pipeline.js           # Ana orchestrator
│   ├── agents/
│   │   ├── content-agent.js  # Claude API
│   │   ├── image-agent.js    # fal.ai görsel/video
│   │   └── telegram-approval.js  # Onay botu
│   ├── publishers/
│   │   └── instagram.js      # Graph API
│   └── utils/
│       └── logger.js
├── templates/
│   └── content-themes.js     # Tema havuzu
├── output/                   # Run logları (gitignored)
├── .env.example
└── package.json
```
