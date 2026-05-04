export const LOCALES = ["tr", "en", "de", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

export const NATIVE_NAMES: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

export interface UIStrings {
  brand: { overline: string };
  nav: { home: string; categories: string; search: string; favorites: string };
  aria: {
    primaryNav: string;
    breadcrumb: string;
    languageSwitcher: string;
    languagePanel: string;
    search: string;
    more: string;
    closePanel: string;
  };
  cta: {
    addToFavorites: string;
    removeFromFavorites: string;
    askAtBoutique: string;
    apply: string;
    reset: string;
    close: string;
    showAll: string;
    browseCategories: string;
  };
  stock: {
    inStock: string;
    soldOut: string;
    atBoutique: string;
    lastN: (n: number) => string;
    loading: string;
  };
  spec: {
    volume: string;
    madeIn: string;
  };
  settings: {
    title: string;
    privacyLabel: string;
    privacyDesc: string;
    revealHint: string;
    about: string;
    language: string;
    currencyNote: (symbol: string) => string;
  };
  filter: {
    title: string;
    type: string;
    priceRange: string;
    inStockOnly: string;
    showCount: (n: number) => string;
    openAria: string;
    priceMinAria: string;
    priceMaxAria: string;
    priceRangeWithBounds: (min: string, max: string) => string;
    resultsCount: (n: number) => string;
  };
  sort: {
    title: string;
    default: string;
    priceAsc: string;
    priceDesc: string;
    openAria: string;
    triggerLabel: (option: string) => string;
  };
  emptyStates: {
    favorites: { headline: string; body: string; cta: string };
    results: { headline: string; body: string; cta: string };
    offline: { headline: string; body: string };
  };
  toast: {
    addedToFavorites: string;
    removedFromFavorites: string;
    copied: string;
  };
  ageGate: {
    body: string;
    cta: string;
    leave: string;
  };
  productCount: (total: number, inStock: number) => string;
  breadcrumb: { categories: string };
  categories: {
    indexOverline: string;
    viewAllCta: string;
    emptyHeadline: string;
    emptyBody: string;
    allFilterLabel: string;
  };
  homepage: {
    boutiqueOverline: string;
    intro: string;
    scanHint: string;
    exploreOverline: string;
    boutiqueFooterOverline: string;
    hoursLine: (open: string, close: string) => string;
  };
  pdp: {
    detailsOverline: string;
    favorited: string;
    imageOf: (i: number, total: number) => string;
    descriptionLabel: string;
    openZoomAria: string;
    closeZoomAria: string;
  };
  search: {
    placeholder: string;
    clearAria: string;
    idleHint: string;
    noResultsHeadline: string;
    noResultsBody: string;
  };
}

const tr: UIStrings = {
  brand: { overline: "Sex Shop" },
  nav: { home: "Ana Sayfa", categories: "Kategoriler", search: "Ara", favorites: "Favoriler" },
  aria: {
    primaryNav: "Birincil",
    breadcrumb: "İçerik haritası",
    languageSwitcher: "Dil",
    languagePanel: "Dil seçimi",
    search: "Ara",
    more: "Daha fazla",
    closePanel: "Paneli kapat",
  },
  cta: {
    addToFavorites: "Favorilere Ekle",
    removeFromFavorites: "Favorilerden Çıkar",
    askAtBoutique: "Butikte Sor",
    apply: "Uygula",
    reset: "Sıfırla",
    close: "Kapat",
    showAll: "Tümünü göster",
    browseCategories: "Kategorilere göz at",
  },
  stock: {
    inStock: "Stokta",
    soldOut: "Tükendi",
    atBoutique: "Butikte mevcut",
    lastN: (n) => `Son ${n} adet`,
    loading: "Stok yükleniyor",
  },
  spec: { volume: "Hacim", madeIn: "Üretim" },
  settings: {
    title: "Ayarlar",
    privacyLabel: "Gizli mod",
    privacyDesc: "Görselleri bulanıklaştır",
    revealHint: "Görmek için dokun",
    about: "Hakkında",
    language: "Dil",
    currencyNote: (symbol) => `Fiyatlar ${symbol} cinsinden — para birimini değiştirmek için dili değiştirin.`,
  },
  filter: {
    title: "Filtrele",
    type: "Tür",
    priceRange: "Fiyat aralığı",
    inStockOnly: "Sadece stokta",
    showCount: (n) => `${n} ürünü göster`,
    openAria: "Filtreleri aç",
    priceMinAria: "En düşük fiyat",
    priceMaxAria: "En yüksek fiyat",
    priceRangeWithBounds: (min, max) => `Fiyat aralığı, ${min} ile ${max} arası`,
    resultsCount: (n) => `${n} sonuç`,
  },
  sort: {
    title: "Sırala",
    default: "Varsayılan",
    priceAsc: "Ucuzdan Pahalıya",
    priceDesc: "Pahalıdan Ucuza",
    openAria: "Sıralamayı aç",
    triggerLabel: (option) => `Sırala: ${option}`,
  },
  emptyStates: {
    favorites: {
      headline: "Henüz favori yok",
      body: "Bir ürünü kaydetmek için kalbe dokunun.",
      cta: "Kategorilere göz at",
    },
    results: {
      headline: "Eşleşen sonuç yok",
      body: "Daha kısa bir arama terimi veya farklı bir kategori deneyin.",
      cta: "Filtreleri sıfırla",
    },
    offline: {
      headline: "Çevrimdışısınız",
      body: "Canlı stoğu görmek için bağlantınızı kontrol edin.",
    },
  },
  toast: {
    addedToFavorites: "Favorilere eklendi",
    removedFromFavorites: "Kaldırıldı",
    copied: "Kopyalandı",
  },
  ageGate: {
    body: "Bu sayfa yetişkinler içindir. Devam etmek için 18 yaşından büyük olmanız gerekir.",
    cta: "18 yaşından büyüğüm",
    leave: "Çık",
  },
  productCount: (total, inStock) => `${total} ürün · ${inStock} stokta`,
  breadcrumb: { categories: "Kategoriler" },
  categories: {
    indexOverline: "Kategoriler",
    viewAllCta: "Tüm kategorileri gör",
    emptyHeadline: "Bu kategori şu an boş",
    emptyBody: "Yakında yeni ürünler eklenecek.",
    allFilterLabel: "Tümü",
  },
  homepage: {
    boutiqueOverline: "Otel Mağazası",
    intro: "Mağazamız siz değerli misafirlerimize haftada 6 gün 12:00-00:00 arasında atrium katında hizmet vermektedir. Web katalogda bulunup mağazada stoğu bulunmayan ürünleri kasiyerimiz ile irtibata geçerek 1 gün içerisinde teslime hazır duruma getirebilirsiniz.",
    scanHint: "İyi alışverişler dileriz.",
    exploreOverline: "Keşfet",
    boutiqueFooterOverline: "Mağaza",
    hoursLine: (open, close) => `Her gün açık, ${open} — ${close}.`,
  },
  pdp: {
    detailsOverline: "Özellikler",
    favorited: "Favorilerde",
    imageOf: (i, total) => `Görsel ${i} / ${total}`,
    descriptionLabel: "Açıklama",
    openZoomAria: "Görseli büyüt",
    closeZoomAria: "Yakınlaştırmayı kapat",
  },
  search: {
    placeholder: "Ürün ara",
    clearAria: "Aramayı temizle",
    idleHint: "Ürün, kategori veya özellik ile ara",
    noResultsHeadline: "Eşleşen sonuç yok",
    noResultsBody: "Daha kısa bir arama terimi veya farklı bir kategori deneyin.",
  },
};

const en: UIStrings = {
  brand: { overline: "Sex Shop" },
  nav: { home: "Home", categories: "Categories", search: "Search", favorites: "Favorites" },
  aria: {
    primaryNav: "Primary",
    breadcrumb: "Breadcrumb",
    languageSwitcher: "Language",
    languagePanel: "Language selection",
    search: "Search",
    more: "More",
    closePanel: "Close panel",
  },
  cta: {
    addToFavorites: "Add to Favorites",
    removeFromFavorites: "Remove from Favorites",
    askAtBoutique: "Ask at Boutique",
    apply: "Apply",
    reset: "Reset",
    close: "Close",
    showAll: "Show all",
    browseCategories: "Browse categories",
  },
  stock: {
    inStock: "In Stock",
    soldOut: "Sold Out",
    atBoutique: "Available at boutique",
    lastN: (n) => `Last ${n} left`,
    loading: "Loading stock",
  },
  spec: { volume: "Volume", madeIn: "Made in" },
  settings: {
    title: "Settings",
    privacyLabel: "Privacy mode",
    privacyDesc: "Blur product images",
    revealHint: "Tap to reveal",
    about: "About",
    language: "Language",
    currencyNote: (symbol) => `Prices shown in ${symbol} — change language to switch currency.`,
  },
  filter: {
    title: "Filter",
    type: "Type",
    priceRange: "Price range",
    inStockOnly: "In stock only",
    showCount: (n) => `Show ${n} results`,
    openAria: "Open filters",
    priceMinAria: "Minimum price",
    priceMaxAria: "Maximum price",
    priceRangeWithBounds: (min, max) => `Price range, ${min} to ${max}`,
    resultsCount: (n) => `${n} results`,
  },
  sort: {
    title: "Sort",
    default: "Default",
    priceAsc: "Price: Low to High",
    priceDesc: "Price: High to Low",
    openAria: "Open sort",
    triggerLabel: (option) => `Sort: ${option}`,
  },
  emptyStates: {
    favorites: {
      headline: "No favorites yet",
      body: "Tap the heart on a product to save it for the boutique.",
      cta: "Browse categories",
    },
    results: {
      headline: "Nothing matches that",
      body: "Try a shorter search term or different category.",
      cta: "Reset filters",
    },
    offline: {
      headline: "We're offline",
      body: "Reconnect to view live stock.",
    },
  },
  toast: {
    addedToFavorites: "Added to favorites",
    removedFromFavorites: "Removed",
    copied: "Copied",
  },
  ageGate: {
    body: "This page is for adults. You must be 18 or older to continue.",
    cta: "I am 18 or older",
    leave: "Leave",
  },
  productCount: (total, inStock) => `${total} products · ${inStock} in stock`,
  breadcrumb: { categories: "Categories" },
  categories: {
    indexOverline: "Categories",
    viewAllCta: "View all categories",
    emptyHeadline: "This category is empty",
    emptyBody: "New pieces are coming soon.",
    allFilterLabel: "All",
  },
  homepage: {
    boutiqueOverline: "Hotel Boutique",
    intro: "Our boutique welcomes you on the atrium floor, six days a week from 12:00 to midnight. If a product listed in the web catalog is not in stock at the boutique, please speak with our cashier — we'll have it ready for you within one day.",
    scanHint: "We wish you a pleasant shopping experience.",
    exploreOverline: "Explore",
    boutiqueFooterOverline: "Boutique",
    hoursLine: (open, close) => `Open daily, ${open} — ${close}.`,
  },
  pdp: {
    detailsOverline: "Details",
    favorited: "Favorited",
    imageOf: (i, total) => `Image ${i} of ${total}`,
    descriptionLabel: "Description",
    openZoomAria: "Open image gallery",
    closeZoomAria: "Close zoom view",
  },
  search: {
    placeholder: "Search products",
    clearAria: "Clear search",
    idleHint: "Search by product, category, or feature",
    noResultsHeadline: "Nothing matches that",
    noResultsBody: "Try a shorter search term or different category.",
  },
};

const de: UIStrings = {
  brand: { overline: "Sex Shop" },
  nav: { home: "Startseite", categories: "Kategorien", search: "Suche", favorites: "Favoriten" },
  aria: {
    primaryNav: "Primär",
    breadcrumb: "Brotkrumen",
    languageSwitcher: "Sprache",
    languagePanel: "Sprachauswahl",
    search: "Suche",
    more: "Mehr",
    closePanel: "Panel schließen",
  },
  cta: {
    addToFavorites: "Zu Favoriten hinzufügen",
    removeFromFavorites: "Aus Favoriten entfernen",
    askAtBoutique: "Im Shop fragen",
    apply: "Anwenden",
    reset: "Zurücksetzen",
    close: "Schließen",
    showAll: "Alle anzeigen",
    browseCategories: "Kategorien ansehen",
  },
  stock: {
    inStock: "Verfügbar",
    soldOut: "Ausverkauft",
    atBoutique: "Im Shop verfügbar",
    lastN: (n) => `Nur noch ${n}`,
    loading: "Bestand lädt",
  },
  spec: { volume: "Volumen", madeIn: "Hergestellt in" },
  settings: {
    title: "Einstellungen",
    privacyLabel: "Privater Modus",
    privacyDesc: "Produktbilder unscharf",
    revealHint: "Tippen zum Anzeigen",
    about: "Über uns",
    language: "Sprache",
    currencyNote: (symbol) => `Preise in ${symbol} — Sprache wechseln, um die Währung zu ändern.`,
  },
  filter: {
    title: "Filter",
    type: "Art",
    priceRange: "Preisspanne",
    inStockOnly: "Nur verfügbar",
    showCount: (n) => `${n} Ergebnisse zeigen`,
    openAria: "Filter öffnen",
    priceMinAria: "Mindestpreis",
    priceMaxAria: "Höchstpreis",
    priceRangeWithBounds: (min, max) => `Preisspanne, ${min} bis ${max}`,
    resultsCount: (n) => `${n} Ergebnisse`,
  },
  sort: {
    title: "Sortieren",
    default: "Standard",
    priceAsc: "Preis: Aufsteigend",
    priceDesc: "Preis: Absteigend",
    openAria: "Sortierung öffnen",
    triggerLabel: (option) => `Sortieren: ${option}`,
  },
  emptyStates: {
    favorites: {
      headline: "Noch keine Favoriten",
      body: "Tippen Sie auf das Herz, um ein Produkt zu speichern.",
      cta: "Kategorien ansehen",
    },
    results: {
      headline: "Nichts gefunden",
      body: "Versuchen Sie einen kürzeren Suchbegriff oder eine andere Kategorie.",
      cta: "Filter zurücksetzen",
    },
    offline: {
      headline: "Offline",
      body: "Verbinden Sie sich neu, um den Bestand zu sehen.",
    },
  },
  toast: {
    addedToFavorites: "Zu Favoriten hinzugefügt",
    removedFromFavorites: "Entfernt",
    copied: "Kopiert",
  },
  ageGate: {
    body: "Diese Seite ist für Erwachsene. Sie müssen 18 oder älter sein, um fortzufahren.",
    cta: "Ich bin 18 oder älter",
    leave: "Verlassen",
  },
  productCount: (total, inStock) => `${total} Produkte · ${inStock} verfügbar`,
  breadcrumb: { categories: "Kategorien" },
  categories: {
    indexOverline: "Kategorien",
    viewAllCta: "Alle Kategorien ansehen",
    emptyHeadline: "Diese Kategorie ist leer",
    emptyBody: "Neue Produkte folgen in Kürze.",
    allFilterLabel: "Alle",
  },
  homepage: {
    boutiqueOverline: "Hotel-Boutique",
    intro: "Unsere Boutique heißt Sie im Atriumgeschoss willkommen — sechs Tage die Woche, von 12:00 bis Mitternacht. Sollte ein im Online-Katalog gelistetes Produkt im Geschäft nicht vorrätig sein, sprechen Sie bitte mit unserer Kassiererin — wir stellen es innerhalb eines Tages für Sie bereit.",
    scanHint: "Wir wünschen Ihnen einen angenehmen Einkauf.",
    exploreOverline: "Entdecken",
    boutiqueFooterOverline: "Boutique",
    hoursLine: (open, close) => `Täglich geöffnet, ${open} — ${close}.`,
  },
  pdp: {
    detailsOverline: "Details",
    favorited: "In Favoriten",
    imageOf: (i, total) => `Bild ${i} von ${total}`,
    descriptionLabel: "Beschreibung",
    openZoomAria: "Bildergalerie öffnen",
    closeZoomAria: "Zoomansicht schließen",
  },
  search: {
    placeholder: "Produkte suchen",
    clearAria: "Suche löschen",
    idleHint: "Nach Produkt, Kategorie oder Eigenschaft suchen",
    noResultsHeadline: "Nichts gefunden",
    noResultsBody: "Versuchen Sie einen kürzeren Suchbegriff oder eine andere Kategorie.",
  },
};

const ru: UIStrings = {
  brand: { overline: "Sex Shop" },
  nav: { home: "Главная", categories: "Категории", search: "Поиск", favorites: "Избранное" },
  aria: {
    primaryNav: "Основная",
    breadcrumb: "Хлебные крошки",
    languageSwitcher: "Язык",
    languagePanel: "Выбор языка",
    search: "Поиск",
    more: "Ещё",
    closePanel: "Закрыть панель",
  },
  cta: {
    addToFavorites: "Добавить в избранное",
    removeFromFavorites: "Удалить из избранного",
    askAtBoutique: "Спросить в бутике",
    apply: "Применить",
    reset: "Сбросить",
    close: "Закрыть",
    showAll: "Показать все",
    browseCategories: "Категории",
  },
  stock: {
    inStock: "В наличии",
    soldOut: "Распродано",
    atBoutique: "Есть в бутике",
    lastN: (n) => `Осталось ${n}`,
    loading: "Загрузка наличия",
  },
  spec: { volume: "Объём", madeIn: "Произведено в" },
  settings: {
    title: "Настройки",
    privacyLabel: "Приватный режим",
    privacyDesc: "Размытие изображений",
    revealHint: "Нажмите, чтобы увидеть",
    about: "О нас",
    language: "Язык",
    currencyNote: (symbol) => `Цены в ${symbol} — смените язык, чтобы изменить валюту.`,
  },
  filter: {
    title: "Фильтр",
    type: "Тип",
    priceRange: "Ценовой диапазон",
    inStockOnly: "Только в наличии",
    showCount: (n) => `Показать ${n}`,
    openAria: "Открыть фильтры",
    priceMinAria: "Минимальная цена",
    priceMaxAria: "Максимальная цена",
    priceRangeWithBounds: (min, max) => `Ценовой диапазон, от ${min} до ${max}`,
    resultsCount: (n) => `${n} результатов`,
  },
  sort: {
    title: "Сортировка",
    default: "По умолчанию",
    priceAsc: "Цена: По возрастанию",
    priceDesc: "Цена: По убыванию",
    openAria: "Открыть сортировку",
    triggerLabel: (option) => `Сортировка: ${option}`,
  },
  emptyStates: {
    favorites: {
      headline: "Пока нет избранного",
      body: "Нажмите на сердце, чтобы сохранить товар.",
      cta: "Категории",
    },
    results: {
      headline: "Ничего не найдено",
      body: "Попробуйте более короткий запрос или другую категорию.",
      cta: "Сбросить фильтры",
    },
    offline: {
      headline: "Нет связи",
      body: "Переподключитесь, чтобы увидеть наличие.",
    },
  },
  toast: {
    addedToFavorites: "Добавлено в избранное",
    removedFromFavorites: "Удалено",
    copied: "Скопировано",
  },
  ageGate: {
    body: "Эта страница для взрослых. Чтобы продолжить, вам должно быть 18 лет или больше.",
    cta: "Мне 18 лет или больше",
    leave: "Покинуть",
  },
  productCount: (total, inStock) => `${total} товаров · ${inStock} в наличии`,
  breadcrumb: { categories: "Категории" },
  categories: {
    indexOverline: "Категории",
    viewAllCta: "Все категории",
    emptyHeadline: "В этой категории пока нет товаров",
    emptyBody: "Новые поступления скоро появятся.",
    allFilterLabel: "Все",
  },
  homepage: {
    boutiqueOverline: "Бутик отеля",
    intro: "Наш бутик ждёт вас на атриумном этаже шесть дней в неделю, с 12:00 до полуночи. Если товар, указанный в онлайн-каталоге, отсутствует в наличии в магазине, обратитесь к нашему кассиру — мы подготовим его к выдаче в течение одного дня.",
    scanHint: "ОЖелаем вам приятных покупок.",
    exploreOverline: "Исследовать",
    boutiqueFooterOverline: "Бутик",
    hoursLine: (open, close) => `Ежедневно, ${open} — ${close}.`,
  },
  pdp: {
    detailsOverline: "Подробности",
    favorited: "В избранном",
    imageOf: (i, total) => `Изображение ${i} из ${total}`,
    descriptionLabel: "Описание",
    openZoomAria: "Открыть галерею изображений",
    closeZoomAria: "Закрыть просмотр",
  },
  search: {
    placeholder: "Поиск товаров",
    clearAria: "Очистить поиск",
    idleHint: "Поиск по продукту, категории или особенности",
    noResultsHeadline: "Ничего не найдено",
    noResultsBody: "Попробуйте более короткий запрос или другую категорию.",
  },
};

export const ui: Record<Locale, UIStrings> = { tr, en, de, ru };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
