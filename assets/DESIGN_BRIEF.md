# JobReel — Asset Design Brief

## Marka Kimliği

**Uygulama adı:** JobReel  
**Konsept:** Tinder/Reels tarzı iş ilanı uygulaması — hızlı, modern, dinamik  
**Harf/Logo:** "J" harfi veya "JR" monogram  
**Slogan:** "İş bulmak artık Reels kadar kolay."

### Renk Paleti

| Renk | Hex | Kullanım |
|------|-----|----------|
| Accent (Mor) | `#7c6dfa` | Ana vurgu, gradient başlangıç |
| Accent (Mavi) | `#4facfe` | Gradient bitiş |
| Koyu Arka Plan | `#0d0d14` | Dark mode bg |
| Derin Siyah | `#0a0a0f` | Dark mode deep bg |
| Beyaz | `#ffffff` | Metin, ikonlar |

**Ana gradient:** `#7c6dfa` → `#4facfe` (sol-üstten sağ-alta veya soldan sağa)

---

## 1. App Icon — `icon.png`

**Boyut:** 1024 × 1024 px  
**Format:** PNG, şeffaf arka plan YOK (düz renk veya gradient arka plan)  
**Kullanım:** iOS App Store, Ana ekran ikonu

### Tasarım İstekleri

- **Arka plan:** Koyu → `#0d0d14` düz renk VEYA `#1a0f35` → `#0d0d14` yukarıdan aşağıya gradient
- **Ön plan:** Ortada büyük, bold "J" harfi veya "JR" monogramı
- **Harf rengi:** `#7c6dfa` → `#4facfe` gradient (sola yatık açılı, 135°)
- **Opsiyonel detay:** Harfin arkasında çok hafif bir "hız/akış" motifi (şerit, dalga) — ama minimal tutulmalı
- **Köşeler:** iOS otomatik kırpar (1024px teslim et, köşe kesmene gerek yok)
- **Stil:** Flat, modern — gölge veya 3D efekt YOK

### Referans Stil
Notion, Linear, Arc gibi uygulamaların minimal monogram ikonları.

---

## 2. Splash Screen — `splash.png`

**Boyut:** 1284 × 2778 px (iPhone 14 Pro Max — güvenli alan için bu boyutu tavsiye ederim)  
**Minimum boyut:** 1242 × 2688 px  
**Format:** PNG  
**Kullanım:** Uygulama açılışında tam ekran görünür (kısa süre)

### Tasarım İstekleri

- **Arka plan:** `#0d0d14` düz renk (tüm ekran)
- **Üst bölge:** Hafif mor gradient hale → `rgba(124, 109, 250, 0.15)` yukarıdan aşağıya soluklaşır
- **Merkez:** App icon (yukarıdaki `icon.png`) — ekranın ortasında, yaklaşık 200px genişliğinde
- **Altında:** "JobReel" yazısı — beyaz, bold, büyük (opsiyonel; yoksa sadece ikon da olur)
- **En alt:** "İş bulmak artık Reels kadar kolay." tagline — gri/muted, küçük (opsiyonel)
- **İçerik, ekranın orta %50'sinde toplanmalı** — kenarlarda boşluk bırak (safe area için)

### Not
Splash ekranın arka planı `app.json`'da `"backgroundColor": "#0d0d14"` olarak zaten ayarlı. Resmin arka planını şeffaf bırakabilirsin veya aynı renkle doldurabilirsin — ikisi de çalışır.

---

## 3. Notification Icon — `notification-icon.png`

**Boyut:** 96 × 96 px  
**Format:** PNG, **şeffaf arka plan** (Android bu dosyayı maske olarak kullanır)  
**Kullanım:** Android bildirim çubuğunda görünür (status bar)

### Tasarım İstekleri

- **Arka plan:** Şeffaf (transparent)
- **Renk:** Sadece **beyaz** (`#ffffff`) — tek renk, başka renk kullanma
- **İçerik:** "J" harfi veya "JR" monogramı — kalın, okunaklı, basit
- **Kenar boşluğu:** 4-8px padding bırak (Android kırpabilir)
- **Stil:** Flat, icon font kalınlığında — detay YOK, çok basit tutulmalı

### Neden sadece beyaz?
Android bildirim ikonları yalnızca tek renkle çalışır. Sistem rengi uygular, gradientle render etmez.

---

## Özet Teslim Listesi

| Dosya | Boyut | Format | Öncelik |
|-------|-------|--------|---------|
| `icon.png` | 1024×1024 | PNG | Kritik (App Store zorunlu) |
| `splash.png` | 1284×2778 | PNG | Yüksek |
| `notification-icon.png` | 96×96 | PNG, şeffaf bg | Orta (Android) |

Tüm dosyaları `/assets/` klasörüne koy: `jobreel/assets/icon.png` vb.
