import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

export default function TermsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kullanım Koşulları</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.lastUpdated}>Son güncelleme: 1 Mayıs 2025</Text>

        <Text style={s.intro}>
          JobReel uygulamasını ("Uygulama") kullanmadan önce lütfen bu Kullanım Koşullarını dikkatlice
          okuyun. Uygulamayı kullanarak bu koşulları kabul etmiş sayılırsınız.
        </Text>

        <Section title="1. Hizmetin Kapsamı" s={s}>
          <Paragraph s={s}>
            JobReel, iş arayanların iş ilanlarını keşfetmesine ve başvurmasına olanak tanıyan bir
            mobil platformdur. Uygulama; ilan listeleme, başvuru takibi, CV yükleme ve iş uyarısı
            oluşturma gibi özellikler sunar.
          </Paragraph>
          <Paragraph s={s}>
            JobReel bir istihdam ajansı değildir. İş ilanları üçüncü taraf kaynaklardan derlenir;
            başvuruların sonuçlanması için herhangi bir garanti verilmez.
          </Paragraph>
        </Section>

        <Section title="2. Hesap Oluşturma ve Güvenlik" s={s}>
          <Paragraph s={s}>
            Uygulamayı kullanmak için geçerli bir hesap oluşturmanız gerekmektedir. Hesap
            bilgilerinizin gizliliğini korumak ve hesabınızda gerçekleşen tüm eylemlerden sorumlu
            olmak sizin yükümlülüğünüzdedir.
          </Paragraph>
          <Paragraph s={s}>
            Hesabınızın yetkisiz kullanıldığından şüpheleniyorsanız derhal{' '}
            <Text style={s.bold}>destek@jobreel.app</Text> adresine bildiriniz.
          </Paragraph>
        </Section>

        <Section title="3. Kullanıcı Yükümlülükleri" s={s}>
          <Paragraph s={s}>Uygulamayı kullanırken aşağıdakileri yapmamayı kabul edersiniz:</Paragraph>
          <Paragraph s={s}>• Yanlış, yanıltıcı veya sahte bilgi paylaşmak</Paragraph>
          <Paragraph s={s}>• Başka kullanıcıların hesaplarına yetkisiz erişim girişiminde bulunmak</Paragraph>
          <Paragraph s={s}>• Uygulamayı spam, kötü amaçlı yazılım veya dolandırıcılık amacıyla kullanmak</Paragraph>
          <Paragraph s={s}>• Telif hakkı veya marka hakkı ihlali içeren içerik yüklemek</Paragraph>
          <Paragraph s={s}>• Uygulamanın normal işleyişini engelleyecek teknik müdahalelerde bulunmak</Paragraph>
        </Section>

        <Section title="4. İçerik ve Fikri Mülkiyet" s={s}>
          <Paragraph s={s}>
            Uygulama içindeki tasarım, yazılım, logo ve içerikler JobReel'e aittir ve fikri mülkiyet
            yasalarıyla korunmaktadır. Yazılı izin olmaksızın kopyalanamaz, dağıtılamaz veya
            türev eser oluşturulamaz.
          </Paragraph>
          <Paragraph s={s}>
            CV'niz ve profil bilgileriniz dahil olmak üzere yüklediğiniz içeriklerin tüm hakları
            size aittir. Bu içerikleri hizmet sunumu amacıyla işlememize izin vermiş olursunuz.
          </Paragraph>
        </Section>

        <Section title="5. Üçüncü Taraf Bağlantılar ve İlanlar" s={s}>
          <Paragraph s={s}>
            Uygulama üzerinden erişilen iş ilanları ve üçüncü taraf web siteleri JobReel tarafından
            kontrol edilmemektedir. Bu sitelerin içeriklerinden veya uygulamalarından JobReel sorumlu
            tutulamaz. Başvuru öncesinde ilgili şirketin güvenilirliğini bağımsız olarak
            değerlendirmenizi tavsiye ederiz.
          </Paragraph>
        </Section>

        <Section title="6. Hizmet Kesintileri ve Değişiklikler" s={s}>
          <Paragraph s={s}>
            JobReel, önceden bildirimde bulunmaksızın uygulamanın herhangi bir özelliğini
            değiştirme, askıya alma veya sonlandırma hakkını saklı tutar. Planlı bakım
            çalışmaları mümkün olduğunca önceden duyurulacaktır.
          </Paragraph>
        </Section>

        <Section title="7. Sorumluluk Sınırı" s={s}>
          <Paragraph s={s}>
            JobReel, uygulama üzerinden yapılan başvuruların sonuçları, iş ilanlarının doğruluğu
            veya kullanıcı ile işverenler arasındaki ilişkiler konusunda sorumluluk üstlenmez.
            Hizmet "olduğu gibi" sunulmaktadır.
          </Paragraph>
          <Paragraph s={s}>
            Yasal olarak izin verilen azami ölçüde, JobReel'in herhangi bir zarardan doğan
            sorumluluğu, ilgili dönemde ödediğiniz abonelik ücretiyle sınırlıdır.
          </Paragraph>
        </Section>

        <Section title="8. Hesap Feshi" s={s}>
          <Paragraph s={s}>
            Bu koşulları ihlal etmeniz durumunda hesabınız önceden bildirimde bulunulmaksızın
            askıya alınabilir veya silinebilir. Hesabınızı dilediğiniz zaman uygulama içindeki
            Ayarlar bölümünden silebilirsiniz.
          </Paragraph>
        </Section>

        <Section title="9. Uygulanacak Hukuk" s={s}>
          <Paragraph s={s}>
            Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri
            ve İcra Daireleri yetkilidir.
          </Paragraph>
        </Section>

        <Section title="10. Değişiklikler" s={s}>
          <Paragraph s={s}>
            Bu koşulları zaman zaman güncelleyebiliriz. Önemli değişiklikler uygulama bildirimi
            veya e-posta yoluyla duyurulacaktır. Değişikliklerin yürürlüğe girmesinin ardından
            uygulamayı kullanmayı sürdürmeniz, güncel koşulları kabul ettiğiniz anlamına gelir.
          </Paragraph>
        </Section>

        <Section title="11. İletişim" s={s}>
          <Paragraph s={s}>
            Bu koşullara ilişkin sorularınız için:{'\n'}
            E-posta: destek@jobreel.app{'\n'}
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
