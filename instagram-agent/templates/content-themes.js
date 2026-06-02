// templates/content-themes.js
// JobReel için haftalık içerik tema havuzu

export const CONTENT_THEMES = {
  // Salı postları - Eğitici / İpucu odaklı (statik görsel)
  tuesday: [
    {
      id: 'cv-tips',
      title: 'CV İpuçları',
      hook: 'İşe alım uzmanları CV\'nin ilk 6 saniyesine bakıyor',
      angle: 'CV\'nde mutlaka olması gereken 5 şey',
      cta: 'JobReel\'de CV\'ni oluştur, fark yarat',
    },
    {
      id: 'salary-insights',
      title: 'Maaş Trendleri',
      hook: 'Türkiye\'de {sector} sektöründe maaşlar bu ay nasıl?',
      angle: 'Gerçek verilerle maaş analizi',
      cta: 'JobReel\'de sektöre göre fırsatları keşfet',
    },
    {
      id: 'interview-prep',
      title: 'Mülakat Hazırlık',
      hook: 'Bu soruyu yanlış cevaplıyorsunuz',
      angle: 'En çok sorulan 3 mülakat sorusu ve güçlü cevapları',
      cta: 'Hayalindeki iş için JobReel\'de hazırlan',
    },
    {
      id: 'remote-work',
      title: 'Remote İş',
      hook: 'Evden çalışmak mı istiyorsun?',
      angle: 'Remote iş bulmak için bilmen gereken 4 şey',
      cta: 'JobReel\'de remote ilanları filtrele',
    },
    {
      id: 'career-change',
      title: 'Kariyer Değişikliği',
      hook: 'Sektör değiştirmek düşündüğünden kolay',
      angle: 'Transferable skills: sahip olduklarını fark et',
      cta: 'JobReel\'de yeni kariyerini keşfet',
    },
    {
      id: 'linkedin-tips',
      title: 'LinkedIn Optimizasyonu',
      hook: 'LinkedIn profilin seni işe aldırıyor ya da reddettiriyor',
      angle: 'Recruiter\'ların dikkat ettiği 3 profil detayı',
      cta: 'JobReel\'de profil gücünü artır',
    },
  ],

  // Cuma postları - Motivasyon / Haber / Trend odaklı (Reels)
  friday: [
    {
      id: 'friday-motivation',
      title: 'Hafta Sonu Motivasyonu',
      hook: 'Bu hafta sonu iş aramak için en iyi zaman',
      angle: 'Hafta sonu yapılacak 3 kariyer hamlesi',
      cta: 'JobReel\'i aç, fırsatları kaydır',
    },
    {
      id: 'hot-sectors',
      title: 'Sıcak Sektörler',
      hook: 'Bu hafta en çok hangi sektör işe aldı?',
      angle: 'Trend olan iş ilanları ve neden şimdi başvurmalısın',
      cta: 'JobReel\'de bu haftanın trend ilanlarını gör',
    },
    {
      id: 'success-story',
      title: 'Başarı Hikayesi',
      hook: '3 ayda iş buldu. İşte nasıl yaptı',
      angle: 'Gerçek kullanıcı deneyimi (anonim)',
      cta: 'Sen de JobReel ile başla',
    },
    {
      id: 'job-market',
      title: 'İş Piyasası Haberleri',
      hook: 'Bu hafta iş piyasasında neler oldu?',
      angle: 'Haftalık iş dünyası özeti',
      cta: 'Gelişmeleri takip et, JobReel\'de fırsatı yakala',
    },
  ],
};

// Hangi temayı kullanacağını belirleyen rotasyon
export function getThemeForDate(date = new Date()) {
  const dayOfWeek = date.getDay(); // 2=Salı, 5=Cuma
  const weekNumber = getWeekNumber(date);

  if (dayOfWeek === 2) {
    const themes = CONTENT_THEMES.tuesday;
    return themes[weekNumber % themes.length];
  } else if (dayOfWeek === 5) {
    const themes = CONTENT_THEMES.friday;
    return themes[weekNumber % themes.length];
  }

  // Manuel çalıştırma için fallback
  const allThemes = [...CONTENT_THEMES.tuesday, ...CONTENT_THEMES.friday];
  return allThemes[weekNumber % allThemes.length];
}

function getWeekNumber(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date - startOfYear;
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

export const BRAND_VOICE = `
JobReel, Türkiye'nin TikTok tarzı iş bulma uygulamasıdır.
Hedef kitle: 22-35 yaş arası aktif iş arayanlar ve kariyer değiştirmek isteyenler.

Marka sesi özellikleri:
- Samimi ve enerjik, ama profesyonel
- Karmaşık kariyer tavsiyelerini sade dille anlat
- Yargılamayan, teşvik edici ton
- Türkçe kullan, teknik terimleri açıkla
- "Kaydır, keşfet, başvur" zihniyeti yansıt
- Emoji kullan ama abartma (3-5 arası)
`;

export const HASHTAG_POOLS = {
  general: ['#iş', '#kariyer', '#işbul', '#JobReel', '#ilanlar', '#türkiye'],
  cv: ['#cv', '#özgeçmiş', '#işbaşvurusu', '#kariyer', '#yazılım'],
  remote: ['#remoteçalışma', '#evdençalış', '#uzaktankonum', '#dijitalgöçebe'],
  motivation: ['#kariyer', '#motivasyon', '#başarı', '#hedef', '#iş'],
  tech: ['#teknoloji', '#yazılım', '#yazılımcı', '#developer', '#startup'],
  salary: ['#maaş', '#zamzam', '#kariyer', '#iş', '#ekonomi'],
};
