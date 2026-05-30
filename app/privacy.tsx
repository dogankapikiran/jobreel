import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

export default function PrivacyScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Gizlilik Politikası</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.lastUpdated}>Son güncelleme: 30 Mayıs 2026</Text>

        <Text style={s.intro}>
          JobReel olarak kişisel verilerinizin korunmasına büyük önem veriyoruz. Bu politika, uygulamamızı
          kullanırken hangi verilerinizi topladığımızı, bu verileri nasıl kullandığımızı ve haklarınızın
          neler olduğunu açıklamaktadır. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında
          veri sorumlusu sıfatıyla hareket ediyoruz.
        </Text>

        <Section title="1. Topladığımız Veriler" s={s}>
          <Paragraph s={s}>
            <Bold s={s}>Kimlik ve İletişim Bilgileri:</Bold> Adınız, e-posta adresiniz ve (varsa) profil
            fotoğrafınız. Apple veya Google ile giriş yapmanız durumunda ilgili platformların sağladığı
            temel profil bilgileri aktarılır.
          </Paragraph>
          <Paragraph s={s}>
            <Bold s={s}>Özgeçmiş (CV):</Bold> Yüklediğiniz PDF dosyasından çıkarılan iş deneyimi,
            eğitim ve beceri bilgileri.
          </Paragraph>
          <Paragraph s={s}>
            <Bold s={s}>İş Tercihleri:</Bold> Sektör, konum, deneyim seviyesi ve iş türü gibi tercihleriniz.
          </Paragraph>
          <Paragraph s={s}>
            <Bold s={s}>Kullanım Verileri:</Bold> Swipe hareketleri, başvurular, kaydedilen ilanlar ve
            oluşturulan iş uyarıları.
          </Paragraph>
          <Paragraph s={s}>
            <Bold s={s}>Cihaz Bilgisi:</Bold> Push bildirimleri için Expo push token, işletim sistemi
            ve cihaz türü.
          </Paragraph>
        </Section>

        <Section title="2. Verileri Nasıl Kullanıyoruz" s={s}>
          <Paragraph s={s}>• Kişiselleştirilmiş iş ilanı önerileri sunmak</Paragraph>
          <Paragraph s={s}>• Başvuru süreçlerinizi yönetmek ve durum güncellemeleri göndermek</Paragraph>
          <Paragraph s={s}>• İş uyarılarını belirttiğiniz sıklıkta iletmek</Paragraph>
          <Paragraph s={s}>• Uygulama performansını ve kullanıcı deneyimini iyileştirmek</Paragraph>
          <Paragraph s={s}>• Yasal yükümlülüklerimizi yerine getirmek</Paragraph>
        </Section>

        <Section title="3. Veri Paylaşımı" s={s}>
          <Paragraph s={s}>
            Kişisel verilerinizi üçüncü taraflara satmıyor ve ticari amaçla paylaşmıyoruz.
            Aşağıdaki durumlarda sınırlı paylaşım söz konusu olabilir:
          </Paragraph>
          <Paragraph s={s}>
            <Bold s={s}>Altyapı Sağlayıcılar:</Bold> Supabase (veritabanı ve kimlik doğrulama),
            Expo (push bildirim altyapısı). Bu sağlayıcılar yalnızca hizmeti sunmak amacıyla
            veri işler.
          </Paragraph>
          <Paragraph s={s}>
            <Bold s={s}>Yapay Zeka (CV Analizi):</Bold> Yüklediğiniz CV'nin metni, beceri ve deneyim
            bilgilerini otomatik olarak çıkarmak amacıyla Groq, Inc. tarafından işlenmektedir.
            CV metniniz yalnızca bu analiz için Groq API'sine iletilir; Groq'un gizlilik politikası
            (groq.com/privacy) geçerlidir. CV yüklemek isteğe bağlıdır.
          </Paragraph>
          <Paragraph s={s}>
            <Bold s={s}>Analitik:</Bold> Mixpanel (kullanım analizi ve olay takibi). Uygulama
            davranışını iyileştirmek amacıyla anonim kullanım istatistikleri toplanır; bu veriler
            üçüncü taraflarla paylaşılmaz veya reklam amacıyla kullanılmaz.
          </Paragraph>
          <Paragraph s={s}>
            <Bold s={s}>Yasal Zorunluluk:</Bold> Mahkeme kararı veya yasal düzenleme gerektirdiğinde
            yetkili makamlarla paylaşım yapılabilir.
          </Paragraph>
        </Section>

        <Section title="4. Veri Saklama Süresi" s={s}>
          <Paragraph s={s}>
            Hesabınızı aktif tuttuğunuz sürece verilerinizi saklıyoruz. Hesabınızı sildiğinizde
            kişisel verileriniz 30 gün içinde sistemlerimizden kalıcı olarak silinir. Yasal
            saklama yükümlülüğü gerektiren veriler ilgili mevzuat süresince tutulur.
          </Paragraph>
        </Section>

        <Section title="5. KVKK Kapsamındaki Haklarınız" s={s}>
          <Paragraph s={s}>• Verilerinizin işlenip işlenmediğini öğrenme</Paragraph>
          <Paragraph s={s}>• Verilerinize erişim talep etme</Paragraph>
          <Paragraph s={s}>• Hatalı verilerin düzeltilmesini isteme</Paragraph>
          <Paragraph s={s}>• Verilerin silinmesini ya da yok edilmesini talep etme</Paragraph>
          <Paragraph s={s}>• İşlemenin kısıtlanmasını isteme</Paragraph>
          <Paragraph s={s}>• Veri taşınabilirliği hakkı</Paragraph>
          <Paragraph s={s}>
            Bu haklarınızı kullanmak için uygulama içindeki Destek & İletişim bölümünden bize ulaşabilirsiniz.
          </Paragraph>
        </Section>

        <Section title="6. Güvenlik" s={s}>
          <Paragraph s={s}>
            Verilerinizi korumak için SSL/TLS şifreleme, güvenli kimlik doğrulama (Supabase Auth)
            ve düzenli güvenlik denetimleri uyguluyoruz. Bununla birlikte hiçbir dijital sistemin
            %100 güvenli olmadığını belirtmek isteriz.
          </Paragraph>
        </Section>

        <Section title="7. Çerezler ve Takip" s={s}>
          <Paragraph s={s}>
            Mobil uygulamamız tarayıcı çerezi kullanmamaktadır. Oturum yönetimi için Supabase'in
            güvenli yerel depolama mekanizması kullanılmaktadır.
          </Paragraph>
        </Section>

        <Section title="8. Politika Değişiklikleri" s={s}>
          <Paragraph s={s}>
            Bu politikayı önemli değişiklikler söz konusu olduğunda güncelleyebiliriz. Değişiklikler
            uygulama içi bildirim veya e-posta ile size duyurulacaktır. Güncellenmiş politikanın
            yürürlüğe girmesinden sonra uygulamayı kullanmaya devam etmeniz, değişiklikleri
            kabul ettiğiniz anlamına gelir.
          </Paragraph>
        </Section>

        <Section title="9. İletişim" s={s}>
          <Paragraph s={s}>
            Gizlilik politikamıza ilişkin sorularınız için:{'\n'}
            E-posta: kvkk@jobreel.app{'\n'}
            Web: jobreel.app/iletisim
          </Paragraph>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, s }: { title: string; children: React.ReactNode; s: ReturnType<typeof makeStyles> }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children, s }: { children: React.ReactNode; s: ReturnType<typeof makeStyles> }) {
  return <Text style={s.paragraph}>{children}</Text>;
}

function Bold({ children, s }: { children: React.ReactNode; s: ReturnType<typeof makeStyles> }) {
  return <Text style={s.bold}>{children}</Text>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: RADII.full,
    backgroundColor: colors.cardBg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg },
  lastUpdated: {
    color: colors.textDim,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.md,
  },
  intro: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    color: colors.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  bold: { color: colors.text, fontWeight: '600' },
});
