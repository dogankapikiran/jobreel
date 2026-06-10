# backend/services/job_scraper/translator.py

class KeywordTranslator:
    _KEYWORD_TR_EN: dict[str, str] = {
        'proje yöneticisi':           'project manager',
        'proje uzmanı':               'project specialist',
        'proje koordinatörü':         'project coordinator',
        'yazılım geliştirici':        'software developer',
        'yazılım mühendisi':          'software engineer',
        'ön uç geliştirici':          'frontend developer',
        'arka uç geliştirici':        'backend developer',
        'veri analisti':              'data analyst',
        'veri bilimci':               'data scientist',
        'ürün yöneticisi':            'product manager',
        'satış uzmanı':               'sales specialist',
        'satış temsilcisi':           'sales representative',
        'satış yöneticisi':           'sales manager',
        'iş geliştirme uzmanı':       'business development specialist',
        'iş geliştirme müdürü':       'business development manager',
        'pazarlama uzmanı':           'marketing specialist',
        'pazarlama müdürü':           'marketing manager',
        'insan kaynakları uzmanı':    'hr specialist',
        'muhasebeci':                 'accountant',
        'mali müşavir':               'financial advisor',
        'operasyon uzmanı':           'operations specialist',
        'lojistik uzmanı':            'logistics specialist',
        'tedarik zinciri uzmanı':     'supply chain specialist',
        'kalite güvence uzmanı':      'quality assurance specialist',
        'müşteri hizmetleri uzmanı':  'customer service specialist',
        'grafik tasarımcı':           'graphic designer',
        'ui/ux tasarımcı':            'ui ux designer',
        'elektrik mühendisi':         'electrical engineer',
        'makine mühendisi':           'mechanical engineer',
        'inşaat mühendisi':           'civil engineer',
    }

    SECTOR_TERMS: dict[str, str] = {
        'Yazılım & Teknoloji': 'software developer',
        'E-ticaret':           'e-commerce developer',
        'Fintech':             'fintech developer',
        'Gaming':              'game developer',
        'SaaS':                'SaaS developer',
        'Lojistik':            'logistics software developer',
        'Sağlık':              'health tech developer',
        'Eğitim':              'edtech developer',
        'Medya':               'media technology developer',
        'Üretim':              'manufacturing software developer',
    }

    def translate_keyword(self, kw: str) -> str:
        """Translates a Turkish job title to its English equivalent for index matching."""
        if not kw:
            return ""
        return self._KEYWORD_TR_EN.get(kw.lower().strip(), kw)

    def get_sector_term(self, sector: str) -> str:
        """Gets search term for a given sector name."""
        return self.SECTOR_TERMS.get(sector, sector)
