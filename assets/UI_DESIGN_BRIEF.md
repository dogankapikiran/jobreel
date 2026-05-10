# JobReel — UI/UX Design Brief for Claude

## Proje Özeti

**JobReel**, Türkiye pazarına yönelik, Tinder/Reels mantığıyla çalışan bir iş ilanı mobil uygulamasıdır. Kullanıcılar iş ilanlarını kart şeklinde swipe ederek keşfeder, tek dokunuşla başvurur. Expo + React Native üzerinde çalışır; tasarım dili **dark-first**, **minimal**, **yüksek kontrastlı** ve **gradient odaklıdır**.

---

## Tasarım Dili & Kısıtlamalar

### Ton
- **Modern & dinamik** — Linear, Notion, Arc benzeri minimal monogram estetik
- **Türkçe kullanıcı** — tüm UI metinleri Türkçe
- **Mobile-first** — yalnızca mobil (iOS ağırlıklı, Android da desteklenir)
- **Karanlık tema** — açık tema ikincil öncelikte

### Renk Paleti

| Token | Hex | Kullanım |
|-------|-----|----------|
| `bg` | `#0d0d14` | Ana arka plan |
| `bgDeep` | `#0a0a0f` | Derin/kart altı bg |
| `surface` | `#1a1a2e` | Kart, modal, sheet yüzeyi |
| `surfaceAlt` | `#12121e` | İkincil yüzey |
| `accent` | `#7c6dfa` | Mor — birincil vurgu |
| `accentLight` | `#a89cfc` | Mor açık |
| `accentBlue` | `#4facfe` | Mavi — gradient bitiş |
| `text` | `#ffffff` | Birincil metin |
| `textSecondary` | `#a0a0b8` | İkincil metin |
| `textMuted` | `#5a5a7a` | Soluk metin |
| `success` | `#2ecc71` | Yeşil — onay/başarı |
| `warning` | `#ffc107` | Sarı — uyarı |
| `danger` | `#ef4444` | Kırmızı — red/sil |
| `border` | `rgba(255,255,255,0.06)` | İnce kenarlık |

### Ana Gradient
```
#7c6dfa → #4facfe  (açı: 135° veya soldan sağa)
```
Kullanım: CTA butonları, aktif ikonlar, vurgu elementleri, kart başlık barları.

### Kart Gradyanları (Şirket Arka Planları — 6 varyant)
```
1. #667eea → #764ba2  (Mor-İndigo)
2. #43e97b → #38f9d7  (Yeşil-Turkuaz)
3. #fa709a → #fee140  (Pembe-Sarı)
4. #4facfe → #00f2fe  (Mavi-Cyan)
5. #f093fb → #f5576c  (Pembe-Kırmızı)
6. #43e97b → #38f9d7  (Yeşil-Mint)
```

### Tipografi
| Token | Boyut | Ağırlık | Kullanım |
|-------|-------|---------|----------|
| `title` | 30px | 700 | Ekran başlıkları |
| `xxl` | 26px | 700 | Kart başlıkları |
| `xl` | 22px | 600 | Bölüm başlıkları |
| `lg` | 18px | 600 | Alt başlıklar |
| `md` | 15px | 400/500 | Gövde metni |
| `sm` | 13px | 400 | İkincil metin |
| `xs` | 11px | 400 | Badge, etiket |

Font ailesi: **System font** (San Francisco / Roboto)

### Boşluk Sistemi
`4 · 8 · 16 · 24 · 32 · 48 px`

### Border Radius
`sm:10 · md:14 · lg:18 · xl:24 · full:999`

---

## Ekran Listesi & Tasarım Gereksinimleri

---

### 1. Auth Ekranı — `auth.tsx`

**Amaç:** Kullanıcı ilk girişi. Apple Sign-In ve LinkedIn ile giriş.

**Layout:**
- Tam ekran koyu arka plan (`#0d0d14`)
- Üstte hafif mor gradient hale (radial, merkez-üst, `rgba(124,109,250,0.2)`)
- Merkez: JobReel logosu/wordmark (büyük, gradient harfler)
- Altında slogan: *"İş bulmak artık Reels kadar kolay."* — muted metin
- Alt bölge: 2 büyük CTA butonu
  - **Apple ile Giriş Yap** — beyaz arka plan, siyah metin, Apple logosu
  - **LinkedIn ile Giriş Yap** — `#0077B5` arka plan, beyaz metin, LinkedIn logosu
- En altta küçük: "Giriş yaparak Kullanıcı Sözleşmesi'ni kabul edersiniz." — muted

**Tasarım Notları:**
- Butonlar tam genişlik, `border-radius: 14px`, yüksek `56px`
- Aralarında 12px boşluk
- Logoyu büyük ve cesur tutun — ekranın odak noktası

---

### 2. Onboarding — Welcome `onboarding/welcome.tsx`

**Amaç:** Yeni kullanıcıyı karşılama, değer önerisi.

**Layout:**
- Tam ekran, koyu bg
- 3 sayfa carousel (swipeable) — her sayfada:
  - Büyük illüstrasyon/ikon alanı (üst %50)
  - Başlık (bold, beyaz, büyük)
  - Alt açıklama (muted, orta)
- Sayfa indikatörleri (dots) — aktif mor, pasif muted
- Sağ üstte "Atla" linki (muted metin)
- Alt: "Devam" butonu (gradient, tam genişlik)

**3 Sayfa İçeriği:**
1. "Swipe ile iş bul" — sağa/sola kart akışı görseli
2. "Tek dokunuşla başvur" — CV upload + apply animasyonu
3. "Fırsatları kaçırma" — bildirim/alert görseli

---

### 3. Onboarding — CV Upload `onboarding/cv.tsx`

**Amaç:** CV yükleme veya LinkedIn'den import.

**Layout:**
- Üst: Geri butonu + progress bar (1/3 adım, mor)
- Başlık: "CV'ni Yükle"
- Alt başlık: "PDF formatında yükle veya LinkedIn'den çek"
- **Upload Kutusu:** Kesik kenarlı (`border: 1.5px dashed rgba(124,109,250,0.4)`), büyük, ortada
  - İkon: dosya/cloud upload (mor)
  - "PDF, DOC, DOCX — maks 10MB"
  - "Dosya Seç" butonu (outline, mor)
- **VEYA** ayırıcı
- **LinkedIn İmport** butonu (outline, LinkedIn mavi)
- Alt: "Atla, sonra eklerim" muted link

---

### 4. Onboarding — Preferences `onboarding/preferences.tsx`

**Amaç:** İş tercihleri kurulumu.

**Layout:**
- Progress bar (2/3 adım)
- Başlık: "Tercihlerini Belirle"
- **Bölümler:**
  1. **Konum** — şehir seçici (chip/badge grid: İstanbul, Ankara, İzmir, Uzaktan, +)
  2. **Sektör** — chip grid (Yazılım, Finans, Pazarlama, Tasarım, ...)
  3. **Deneyim Seviyesi** — chip grid (Stajyer, Junior, Mid, Senior, Yönetici)
  4. **İş Tipi** — chip grid (Tam Zamanlı, Part-time, Freelance, Uzaktan)
- Aktif chip: `#7c6dfa` bg, beyaz metin; pasif: surface bg, muted metin
- Alt: "Tamamla" gradient butonu

---

### 5. Feed Ekranı (Ana Ekran) — `(tabs)/index.tsx`

**Amaç:** Swipeable iş ilanı kartları — uygulamanın kalbi.

**Layout:**
- **Header:**
  - Sol: JobReel logosu (küçük) veya "Keşfet" başlığı
  - Sağ: Filtre ikonu (mor) + Bildirim ikonu
- **Kart Stack:** Ekranın %80'ini kaplar
  - Üstteki kart tam görünür, altındakiler hafif scale-down ve blur ile görünür
  - **Kart tasarımı** ↓ (ayrı bölümde)
- **Alt Aksiyon Butonları** (kart altında, yatay sıra):
  - ✕ Kırmızı daire — Geç
  - ★ Sarı daire — Kaydet
  - ✓ Yeşil daire — Başvur
  - (Orta buton daha büyük — "Başvur")

**Job Card Tasarımı:**
- Tam genişlik, `border-radius: 24px`, `min-height: 520px`
- **Arka plan:** Şirket logosu varsa koyu surface + şirket rengi gradient; yoksa `gradients.card[n]` varyantı
- **Üst bölge (şirket alanı):**
  - Gradient overlay (üstten aşağı fade)
  - Şirket logosu (yuvarlak, beyaz bg'li kutu, 56×56)
  - Şirket adı (beyaz, bold)
  - "Takip Et" küçük butonu (outline, beyaz)
- **Alt bölge (iş detayı, koyu surface):**
  - İş unvanı (beyaz, xxl, bold)
  - Konum + iş tipi satırı (ikon + muted metin)
  - Maaş aralığı (accent rengi, bold)
  - Etiketler (tag chips: React Native, Remote, Startup...)
  - "Detayları Gör" küçük link

---

### 6. İş Detay Ekranı — `job/[id].tsx`

**Amaç:** İş ilanı tam detayı.

**Layout:**
- **Header:** Geri oku + Kaydet ikonu (sağ üst)
- **Hero Bölgesi:**
  - Şirket gradient arka plan (kart ile aynı gradient varyantı)
  - Şirket logosu (büyük, 80×80, ortada)
  - Şirket adı + şehir (beyaz, ortada)
- **İçerik (scroll edilebilir):**
  - İş unvanı (title, beyaz)
  - Meta satırları: 📍 Konum · 💼 Tip · ⏰ İlan tarihi
  - Maaş bloğu (accent rengi, büyük, öne çıkaran card)
  - "İş Tanımı" bölümü (md metin)
  - "Aranan Nitelikler" (madde listesi)
  - "Etiketler" (chip grid)
- **Sabit Alt Bar:**
  - Maaş (sol, küçük) + "Başvur" gradient butonu (sağ, büyük)

---

### 7. Applications Ekranı — `(tabs)/applications.tsx`

**Amaç:** Başvurulan işlerin listesi.

**Layout:**
- Header: "Başvurularım" başlığı
- **Durum Tabları:** Tümü · Beklemede · Görüşme · Reddedildi (horizontal scroll chips)
- **Liste:** Her item bir kart:
  - Sol: Şirket logosu (küçük, 44×44)
  - Orta: İş unvanı + şirket adı + tarih
  - Sağ: Durum badge (Beklemede: sarı, Görüşme: mor, Reddedildi: kırmızı)
- Boş durum (empty state): İllüstrasyon + "Henüz başvurun yok" + "İşleri Keşfet" CTA

---

### 8. Saved Jobs Ekranı — `(tabs)/saved.tsx`

**Amaç:** Kaydedilen iş ilanları.

**Layout:**
- Header: "Kaydedilenler"
- **Liste (2 kolon grid):** Mini iş kartları
  - Kart: gradient arka plan, şirket adı, iş unvanı, kaydet ikonu (dolu, sarı)
- Boş durum: "Henüz kaydettiğin ilan yok" + "Keşfet" butonu

---

### 9. Profile Ekranı — `(tabs)/profile.tsx`

**Amaç:** Kullanıcı profili, CV, tercihler.

**Layout:**
- **Üst Bölge:**
  - Gradient arka plan (ince, header yüksekliğinde)
  - Avatar (büyük, yuvarlak, 96×96) — baş harfi veya fotoğraf
  - Kullanıcı adı (bold, beyaz)
  - E-posta (muted)
  - "Profili Düzenle" outline butonu
- **Bölümler (grouped list, iOS tarzı):**
  - **CV:** Yüklü PDF bilgisi veya "CV Yükle" CTA
  - **Tercihler:** Sektör, seviye, konum özeti → "Düzenle" oku
  - **Bildirimler:** Toggle switch
  - **Hesap:** Oturumu Kapat (kırmızı metin)
- Her bölüm koyu `surface` kart içinde, aralarında boşluk

---

### 10. Filter Sheet — `components/FilterSheet.tsx`

**Amaç:** Feed için filtre ayarlama (bottom sheet modal).

**Layout:**
- Bottom sheet, `border-radius: 24px 24px 0 0`, `surface` bg
- Üstte drag handle (kısa çizgi, muted)
- Başlık: "Filtrele" + "Sıfırla" sağ link (accent rengi)
- **Bölümler:**
  - Konum (chip grid)
  - İş Tipi (chip grid)
  - Deneyim Seviyesi (chip grid)
  - Sektör (chip grid)
  - Maaş Aralığı (range slider, mor)
- Alt: "Sonuçları Gör (42 ilan)" gradient butonu

---

### 11. Alerts Ekranı — `alerts.tsx`

**Amaç:** İş uyarıları (saved search) yönetimi.

**Layout:**
- Header: "İş Uyarıları"
- Sağ üst: "+ Yeni Uyarı" ikon butonu (mor)
- **Liste:** Her uyarı bir kart
  - İkon (zil), uyarı adı, filtre özeti, frekans (Günlük/Anında)
  - Toggle switch (aktif/pasif)
  - Kaydırarak sil (swipe-to-delete, kırmızı)
- Boş durum: "Henüz uyarı oluşturmadın"

---

## Tab Bar Tasarımı

**5 tab:**
| Sıra | İkon | Label |
|------|------|-------|
| 1 | Ev / Home | Keşfet |
| 2 | Belge / Document | Başvurularım |
| 3 | Kalp / Bookmark | Kaydettiklerim |
| 4 | Zil / Bell | Uyarılar |
| 5 | Kişi / Person | Profil |

- **Aktif tab:** Mor (`#7c6dfa`) ikon + label
- **Pasif tab:** Muted (`#5a5a7a`) ikon, label yok (sadece ikon)
- Arka plan: `#0d0d14` + üstte ince border
- iOS'ta safe area (home indicator) için padding

---

## Ortak Bileşenler

### Primary Button (Gradient CTA)
- Arka plan: `#7c6dfa → #4facfe` gradient
- Metin: beyaz, bold, 16px
- Yükseklik: 56px
- Border radius: 14px
- Tam genişlik

### Outline Button
- Arka plan: transparent
- Kenarlık: `1.5px solid accent`
- Metin: accent rengi

### Tag / Chip Badgeleri
- Arka plan: `rgba(124,109,250,0.15)`
- Metin: `#a89cfc`
- Border: `1px solid rgba(124,109,250,0.3)`
- Padding: `4px 12px`, border-radius: 999

### Status Badges
- Beklemede: `rgba(255,193,7,0.15)` bg, `#ffc107` metin
- Görüşme: `rgba(124,109,250,0.15)` bg, `#7c6dfa` metin
- Kabul: `rgba(46,204,113,0.15)` bg, `#2ecc71` metin
- Reddedildi: `rgba(239,68,68,0.15)` bg, `#ef4444` metin

### Skeleton / Loading State
- Arka plan: `rgba(255,255,255,0.06)` animated shimmer
- Kart şeklinde, aynı layout'u taklit eder

---

## Tasarım Talepleri

Bu brief'i kullanarak aşağıdaki çıktıları oluştur:

1. **Her ekran için** high-fidelity mobil mockup (375px genişlik, iPhone frame)
2. **Dark mode** — zorunlu; açık mod opsiyonel
3. **Türkçe placeholder metin** — gerçekçi şirket/pozisyon isimleri (Trendyol, Getir, Insider, vb.)
4. **Gradient ve blur efektleri** dahil — glassmorphism arka planlar kabul edilebilir
5. **Tab bar ve status bar** dahil her mockup'ta
6. Öncelik sırası: **Feed Ekranı > Job Card > Auth > Onboarding > Profil > Diğerleri**

---

## Referans Uygulamalar

- **Kart swipe mekanizması:** Tinder, Bumble
- **Feed akışı:** Instagram Reels, TikTok
- **Minimalist ikon stili:** Linear, Notion, Arc
- **İş ilanı UX:** LinkedIn, Glassdoor
- **Koyu tema mükemmelliği:** Vercel Dashboard, GitHub Dark

---

*Bu dosya `c:\Yazılım\jobreel\assets\UI_DESIGN_BRIEF.md` konumundadır.*
*Proje kodu: `c:\Yazılım\jobreel\` | Stack: Expo 54, React Native, TypeScript, Supabase*
