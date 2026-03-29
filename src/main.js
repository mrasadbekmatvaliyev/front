import './style.css'

const app = document.querySelector('#app')
const STORAGE_KEY = 'paylog-language'
const defaultLanguage = 'uz'

const policyUz = {
  title: 'Paylog Maxfiylik Siyosati',
  updatedAt: 'Oxirgi yangilanish: 14-mart, 2026',
  intro:
    "Paylogdan foydalanganingizda sizning ma'lumotlaringizni qanday yig'ishimiz, ishlatishimiz, saqlashimiz va himoya qilishimiz ushbu siyosatda tushuntiriladi.",
  summary: [
    { label: 'Ilova', value: 'Paylog' },
    { label: 'Operator', value: 'Asadbek Matvaliyev' },
    { label: 'Aloqa', value: 'mr.asadbekmatvaliyev@gmail.com' },
    { label: 'Manzil', value: "Kenagas Qishlog'i, 198-uy, Pop 717000, Uzbekistan (UZ)" },
  ],
  sections: [
    { title: '1. Qamrov', paragraphs: ['Ushbu siyosat Paylog mobil ilovasining barcha modullariga tatbiq etiladi, jumladan:'], items: ['Debtor (qarzdorlar)', 'Moliya (kirim/chiqim)', 'Holisa AI', 'Market, Taxi, Invest (joriy yoki kelajakdagi modul funksiyalari)'] },
    { title: "2. Qanday ma'lumotlarni yig'amiz", paragraphs: ["Biz quyidagi turdagi ma'lumotlarni yig'ishimiz mumkin:"], groups: [{ title: "2.1. Akkount ma'lumotlari", items: ['Telefon raqami (OTP orqali kirish)', "Profil ma'lumotlari (ism, familiya, avatar URL, foydalanuvchi kiritganda)"] }, { title: '2.2. Ilova ichida yaratilgan kontent', items: ["Qarzdorlar ro'yxati, qarz summalari, to'lov holatlari", "Kirim/chiqim yozuvlari, kategoriya, sana, valyuta, izohlar", "AI bilan muloqot matnlari (funksiyani taqdim etish uchun zarur bo'lsa)"] }, { title: "2.3. Qurilma va texnik ma'lumot", items: ['device_id', 'ilova versiyasi', 'platforma (android/ios)', 'til (locale)', 'FCM token', "bildirishnoma yoqilgan/o'chirilgan holati"] }, { title: "2.4. Joylashuv ma'lumoti", items: ["Foydalanuvchi ruxsati bilan aniq yoki taxminiy joylashuv (masalan, Taxi yoki Marketdagi location-ga bog'liq funksiyalar uchun)"] }, { title: '2.5. Diagnostika va xavfsizlik', items: ['Xatolik va texnik loglar (xizmatni barqaror ishlatish uchun zarur minimal hajmda)'] }] },
    { title: "3. Ma'lumotlardan foydalanish maqsadlari", items: ['foydalanuvchini autentifikatsiya qilish', "qarzdorlik va moliyaviy hisobot funksiyalarini ishlatish", 'push bildirishnoma yuborish', "ilovani lokalizatsiya va sozlamalarga moslash", "xavfsizlikni ta'minlash va firibgarlikni oldini olish", 'xizmat sifatini yaxshilash'] },
    { title: '4. Huquqiy asos', paragraphs: ["Ma'lumotlarni qayta ishlash asoslari:"], items: ["shartnomaviy zarurat (xizmatni ko'rsatish)", 'foydalanuvchi roziligi (masalan, notifications/location)', "qonuniy manfaat (xavfsizlik va sifat)", "qonuniy majburiyatlar (amaldagi qonunchilikka rioya)"] },
    { title: '5. Ruxsatlar (Permissions)', paragraphs: ["Ilova quyidagi ruxsatlarni so'rashi mumkin:"], items: ['POST_NOTIFICATIONS - push bildirishnomalar', "ACCESS_COARSE_LOCATION / ACCESS_FINE_LOCATION - locationga bog'liq funksiyalar", 'INTERNET - server bilan aloqa'], note: "Foydalanuvchi ruxsatlarni istalgan vaqtda qurilma sozlamalarida o'zgartirishi mumkin." },
    { title: '6. Uchinchi tomon xizmatlari', paragraphs: ['Paylog quyidagi xizmatlardan foydalanishi mumkin:'], items: ['Firebase Cloud Messaging (push notifications)', 'Google Play Services', 'hosting/backend infratuzilmasi provayderlari'], links: ['https://policies.google.com/privacy', 'https://firebase.google.com/support/privacy'] },
    { title: "7. Ma'lumotlarni ulashish", paragraphs: ["Biz foydalanuvchi ma'lumotlarini sotmaymiz.", "Ma'lumotlar faqat quyidagi holatlarda uzatilishi mumkin:"], items: ['xizmatni bajarish uchun ishonchli texnik hamkorlarga', "qonuniy talab bo'lsa davlat organlariga", "kompaniya restrukturizatsiyasi (qo'shilish/sotib olish) holatida qonuniy tartibda"] },
    { title: '8. Saqlash muddati', paragraphs: ["Ma'lumotlar xizmat ko'rsatish uchun zarur davr davomida saqlanadi.", "Akkount yopilgach, ma'lumotlar amaldagi qonunchilik va texnik siyosatga muvofiq o'chiriladi yoki anonimizatsiya qilinadi."] },
    { title: '9. Xavfsizlik choralarimiz', items: ['HTTPS orqali uzatish', 'token asosidagi autentifikatsiya', "ruxsat nazorati va kirish cheklovlari", "server tomonda himoya choralarini qo'llash"], note: 'Shunga qaramay, internetdagi hech bir tizim 100% xavfsizlikni kafolatlamaydi.' },
    { title: '10. Foydalanuvchi huquqlari', paragraphs: ['Siz quyidagi huquqlarga egasiz:'], items: ["o'z ma'lumotlaringizga kirish", "noto'g'ri ma'lumotni tuzatish", "ma'lumotni o'chirishni so'rash", 'rozilikni qaytarib olish', "qayta ishlashga e'tiroz bildirish (qonun doirasida)"], note: "So'rovlar uchun: mr.asadbekmatvaliyev@gmail.com" },
    { title: '11. Bolalar maxfiyligi', paragraphs: ["Paylog barcha yoshdagi foydalanuvchilar uchun mo'ljallangan.", "Voyaga yetmagan foydalanuvchilarga ilovadan ota-ona yoki qonuniy vakil nazorati ostida foydalanish tavsiya etiladi."] },
    { title: '12. Xalqaro uzatish', paragraphs: ["Infratuzilma joylashuviga qarab ma'lumotlar boshqa davlat serverlarida qayta ishlanishi mumkin.", "Bunda mos xavfsizlik choralarini qo'llaymiz."] },
    { title: "13. Siyosatdagi o'zgarishlar", paragraphs: ['Siyosat vaqti-vaqti bilan yangilanishi mumkin.', "Yangi versiya ilova ichida yoki rasmiy sahifada e'lon qilinadi. Oxirgi yangilanish sanasi yuqorida ko'rsatiladi."] },
  ],
  contactTitle: "14. Bog'lanish",
  contactLines: ['Email: mr.asadbekmatvaliyev@gmail.com', "Mas'ul shaxs: Asadbek Matvaliyev", "Manzil: Kenagas Qishlog'i, 198-uy, Pop 717000, Uzbekistan (UZ)", 'Telefon: +998949767607'],
  homeCta: 'Bosh sahifa',
}

const policyRu = {
  title: 'Политика конфиденциальности Paylog',
  updatedAt: 'Последнее обновление: 14 марта 2026 года',
  intro: 'В этом документе объясняется, как Paylog собирает, использует, хранит и защищает ваши данные при использовании приложения.',
  summary: [
    { label: 'Приложение', value: 'Paylog' },
    { label: 'Оператор', value: 'Asadbek Matvaliyev' },
    { label: 'Контакт', value: 'mr.asadbekmatvaliyev@gmail.com' },
    { label: 'Адрес', value: "Kenagas Qishlog'i, 198-uy, Pop 717000, Uzbekistan (UZ)" },
  ],
  sections: [
    { title: '1. Область действия', paragraphs: ['Настоящая политика применяется ко всем модулям мобильного приложения Paylog, включая:'], items: ['Debtor (должники)', 'Moliya (доходы/расходы)', 'Holisa AI', 'Market, Taxi, Invest (текущие или будущие модули)'] },
    { title: '2. Какие данные мы собираем', paragraphs: ['Мы можем собирать следующие категории данных:'], groups: [{ title: '2.1. Данные аккаунта', items: ['Номер телефона (вход через OTP)', 'Данные профиля (имя, фамилия, URL аватара, если пользователь их указал)'] }, { title: '2.2. Контент, созданный в приложении', items: ['Список должников, суммы долгов, статусы платежей', 'Записи о доходах и расходах, категория, дата, валюта, заметки', 'Тексты общения с AI, если это необходимо для предоставления функции'] }, { title: '2.3. Данные устройства и технические данные', items: ['device_id', 'версия приложения', 'платформа (android/ios)', 'язык (locale)', 'FCM token', 'статус включения/отключения уведомлений'] }, { title: '2.4. Данные о местоположении', items: ['Точное или приблизительное местоположение с разрешения пользователя, например для функций Taxi или Market, зависящих от location'] }, { title: '2.5. Диагностика и безопасность', items: ['Логи ошибок и технические журналы в минимально необходимом объеме для стабильной работы сервиса'] }] },
    { title: '3. Цели использования данных', items: ['аутентификация пользователя', 'работа функций учета долгов и финансовой отчетности', 'отправка push-уведомлений', 'адаптация приложения под локализацию и настройки', 'обеспечение безопасности и предотвращение мошенничества', 'улучшение качества сервиса'] },
    { title: '4. Правовые основания', paragraphs: ['Основания для обработки данных:'], items: ['договорная необходимость (оказание услуги)', 'согласие пользователя (например, notifications/location)', 'законный интерес (безопасность и качество)', 'законные обязательства (соблюдение применимого законодательства)'] },
    { title: '5. Разрешения (Permissions)', paragraphs: ['Приложение может запрашивать следующие разрешения:'], items: ['POST_NOTIFICATIONS - push-уведомления', 'ACCESS_COARSE_LOCATION / ACCESS_FINE_LOCATION - функции, зависящие от location', 'INTERNET - связь с сервером'], note: 'Пользователь может изменить разрешения в настройках устройства в любое время.' },
    { title: '6. Сторонние сервисы', paragraphs: ['Paylog может использовать следующие сервисы:'], items: ['Firebase Cloud Messaging (push notifications)', 'Google Play Services', 'провайдеры hosting/backend инфраструктуры'], links: ['https://policies.google.com/privacy', 'https://firebase.google.com/support/privacy'] },
    { title: '7. Передача данных', paragraphs: ['Мы не продаем данные пользователей.', 'Данные могут передаваться только в следующих случаях:'], items: ['надежным техническим партнерам для оказания сервиса', 'государственным органам при наличии законного требования', 'в рамках реорганизации компании в соответствии с законом'] },
    { title: '8. Срок хранения', paragraphs: ['Данные хранятся столько, сколько необходимо для оказания сервиса.', 'После закрытия аккаунта данные удаляются или обезличиваются в соответствии с применимым законодательством и технической политикой.'] },
    { title: '9. Наши меры безопасности', items: ['передача по HTTPS', 'аутентификация на основе токенов', 'контроль разрешений и ограничение доступа', 'защитные меры на стороне сервера'], note: 'При этом ни одна система в интернете не может гарантировать 100% безопасность.' },
    { title: '10. Права пользователя', paragraphs: ['Вы имеете следующие права:'], items: ['доступ к своим данным', 'исправление неверных данных', 'запрос на удаление данных', 'отзыв согласия', 'возражение против обработки, если это допускается законом'], note: 'Для запросов: mr.asadbekmatvaliyev@gmail.com' },
    { title: '11. Конфиденциальность детей', paragraphs: ['Paylog предназначен для пользователей всех возрастов.', 'Несовершеннолетним рекомендуется использовать приложение под наблюдением родителей или законных представителей.'] },
    { title: '12. Международная передача', paragraphs: ['В зависимости от расположения инфраструктуры данные могут обрабатываться на серверах в других странах.', 'В таких случаях мы применяем соответствующие меры защиты.'] },
    { title: '13. Изменения политики', paragraphs: ['Политика может время от времени обновляться.', 'Новая версия публикуется в приложении или на официальной странице. Дата последнего обновления указывается выше.'] },
  ],
  contactTitle: '14. Контакты',
  contactLines: ['Email: mr.asadbekmatvaliyev@gmail.com', 'Ответственное лицо: Asadbek Matvaliyev', "Адрес: Kenagas Qishlog'i, 198-uy, Pop 717000, Uzbekistan (UZ)", 'Телефон: +998949767607'],
  homeCta: 'Главная страница',
}

const policyEn = {
  title: 'Paylog Privacy Policy',
  updatedAt: 'Last updated: March 14, 2026',
  intro: 'This policy explains how Paylog collects, uses, stores, and protects your information when you use the application.',
  summary: [
    { label: 'Application', value: 'Paylog' },
    { label: 'Operator', value: 'Asadbek Matvaliyev' },
    { label: 'Contact', value: 'mr.asadbekmatvaliyev@gmail.com' },
    { label: 'Address', value: "Kenagas Qishlog'i, 198-uy, Pop 717000, Uzbekistan (UZ)" },
  ],
  sections: [
    { title: '1. Scope', paragraphs: ['This policy applies to all modules of the Paylog mobile application, including:'], items: ['Debtor', 'Moliya (income/expense tracking)', 'Holisa AI', 'Market, Taxi, Invest (current or future module functionality)'] },
    { title: '2. What information we collect', paragraphs: ['We may collect the following categories of information:'], groups: [{ title: '2.1. Account information', items: ['Phone number (OTP-based sign-in)', 'Profile information such as first name, last name, and avatar URL when provided by the user'] }, { title: '2.2. Content created inside the app', items: ['Debtor lists, debt amounts, and payment statuses', 'Income and expense records, category, date, currency, and notes', 'AI conversation text where necessary to provide the feature'] }, { title: '2.3. Device and technical information', items: ['device_id', 'app version', 'platform (android/ios)', 'language (locale)', 'FCM token', 'notification enabled or disabled status'] }, { title: '2.4. Location information', items: ["Precise or approximate location with the user's permission, for example for Taxi or Market features that depend on location"] }, { title: '2.5. Diagnostics and security', items: ['Error reports and technical logs in the minimum amount needed to keep the service stable'] }] },
    { title: '3. Purposes of use', items: ['to authenticate the user', 'to provide debt tracking and financial reporting features', 'to send push notifications', 'to adapt the app to localization and settings', 'to maintain security and prevent fraud', 'to improve service quality'] },
    { title: '4. Legal bases', paragraphs: ['The bases for processing information are:'], items: ['contractual necessity to provide the service', 'user consent, for example for notifications or location', 'legitimate interest such as security and service quality', 'legal obligations under applicable law'] },
    { title: '5. Permissions', paragraphs: ['The app may request the following permissions:'], items: ['POST_NOTIFICATIONS - push notifications', 'ACCESS_COARSE_LOCATION / ACCESS_FINE_LOCATION - location-based features', 'INTERNET - communication with the server'], note: 'Users can change permissions at any time in their device settings.' },
    { title: '6. Third-party services', paragraphs: ['Paylog may use the following services:'], items: ['Firebase Cloud Messaging (push notifications)', 'Google Play Services', 'hosting and backend infrastructure providers'], links: ['https://policies.google.com/privacy', 'https://firebase.google.com/support/privacy'] },
    { title: '7. Sharing of information', paragraphs: ['We do not sell user information.', 'Information may be disclosed only in the following cases:'], items: ['to trusted technical partners that help us provide the service', 'to government authorities where required by law', 'during company restructuring such as a merger or acquisition, subject to applicable law'] },
    { title: '8. Retention period', paragraphs: ['Information is stored for as long as necessary to provide the service.', 'After account closure, information is deleted or anonymized in accordance with applicable law and technical policy.'] },
    { title: '9. Security measures', items: ['HTTPS transmission', 'token-based authentication', 'permission controls and access restrictions', 'server-side protection measures'], note: 'Even so, no internet-based system can guarantee 100% security.' },
    { title: '10. User rights', paragraphs: ['You may have the following rights:'], items: ['to access your information', 'to correct inaccurate information', 'to request deletion of information', 'to withdraw consent', 'to object to processing where permitted by law'], note: 'Requests: mr.asadbekmatvaliyev@gmail.com' },
    { title: "11. Children's privacy", paragraphs: ['Paylog is intended for users of all ages.', 'Minor users are recommended to use the app under the supervision of a parent or legal guardian.'] },
    { title: '12. International transfers', paragraphs: ['Depending on infrastructure location, information may be processed on servers in other countries.', 'In such cases, we apply appropriate safeguards.'] },
    { title: '13. Changes to this policy', paragraphs: ['This policy may be updated from time to time.', 'A new version will be announced in the app or on an official page. The latest update date will be shown above.'] },
  ],
  contactTitle: '14. Contact',
  contactLines: ['Email: mr.asadbekmatvaliyev@gmail.com', 'Responsible person: Asadbek Matvaliyev', "Address: Kenagas Qishlog'i, 198-uy, Pop 717000, Uzbekistan (UZ)", 'Phone: +998949767607'],
  homeCta: 'Home page',
}

const translations = {
  uz: { htmlLang: 'uz', title: 'PayLog | Xarajatlarni boshqarish', description: "PayLog to'lovlar, transport, marketpleys va shaxsiy moliyani bitta ilovada boshqarishga yordam beradi.", languageLabel: 'Til', languages: { uz: "O'zbek", ru: 'Русский', en: 'English' }, home: { nav: { features: 'Imkoniyatlar', process: 'Jarayon', security: 'Xavfsizlik', privacy: 'Maxfiylik', download: 'Ilovani yuklash' }, badge: 'v2.0 ishga tushdi', heroTitle: "Sizga kerak bo'ladigan yagona ilova.", heroAccent: 'Barchasi bir joyda.', heroLead: "To'lovlar, qarzdorlik va kundalik moliyani bitta chiroyli tajribada boshqaring.", featuresTitle: "Sizga kerak bo'ladigan hamma narsa, bitta kuchli ilovada.", featuresLead: "Paylog kundalik moliya, qarzdorlik va AI yordamchi funksiyalarini bir tajribaga jamlaydi.", primaryCta: 'Ilovani yuklash', secondaryCta: "Ko'proq bilish", footerPrivacy: 'Maxfiylik', footerLead: 'Kundalik servislar va moliyaviy boshqaruvni bitta integratsiyalashgan ekotizimga jamlaymiz.' }, policy: policyUz },
  ru: { htmlLang: 'ru', title: 'PayLog | Финансовое приложение', description: 'PayLog помогает управлять платежами, долгами и личными финансами в одном приложении.', languageLabel: 'Язык', languages: { uz: "O'zbek", ru: 'Русский', en: 'English' }, home: { nav: { features: 'Возможности', process: 'Процесс', security: 'Безопасность', privacy: 'Конфиденциальность', download: 'Скачать приложение' }, badge: 'v2.0 уже доступен', heroTitle: 'Одно приложение для ежедневных финансовых задач.', heroAccent: 'Все в одном месте.', heroLead: 'Управляйте платежами, долгами и ежедневными финансовыми записями в одном интерфейсе.', featuresTitle: 'Все, что нужно, в одном сильном приложении.', featuresLead: 'Paylog объединяет ежедневный финансовый учет, работу с долгами и AI-помощника.', primaryCta: 'Скачать приложение', secondaryCta: 'Подробнее', footerPrivacy: 'Конфиденциальность', footerLead: 'Единая экосистема для ежедневных сервисов и финансового управления.' }, policy: policyRu },
  en: { htmlLang: 'en', title: 'PayLog | Finance in One App', description: 'PayLog helps you manage payments, debts, and personal finances in one secure app.', languageLabel: 'Language', languages: { uz: "O'zbek", ru: 'Русский', en: 'English' }, home: { nav: { features: 'Features', process: 'Process', security: 'Security', privacy: 'Privacy', download: 'Download App' }, badge: 'v2.0 is now live', heroTitle: 'One app for everyday finance workflows.', heroAccent: 'Everything in one place.', heroLead: 'Track payments, debts, and daily money activity in one clear interface.', featuresTitle: 'Everything you need, in one focused product.', featuresLead: 'Paylog brings together daily money tracking, debtor workflows, and AI assistance.', primaryCta: 'Download App', secondaryCta: 'Learn More', footerPrivacy: 'Privacy', footerLead: 'An integrated ecosystem for daily services and financial management.' }, policy: policyEn },
}

const supportedLanguages = Object.keys(translations)

function getInitialLanguage() {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved && translations[saved]) return saved
  const browser = window.navigator.language.slice(0, 2).toLowerCase()
  return translations[browser] ? browser : defaultLanguage
}

let currentLanguage = getInitialLanguage()
let isLanguageMenuOpen = false

const getPrivacyPath = (language = currentLanguage) => `/privacy/${language}`
const getLanguageFromPath = (pathname) => pathname.match(/^\/privacy\/([a-z]{2})\/?$/)?.[1] || null
const isPrivacyRoute = (pathname) => pathname === '/privacy' || pathname === '/privacy/' || Boolean(getLanguageFromPath(pathname))

function updateDocumentMetadata(copy, pathname) {
  document.documentElement.lang = copy.htmlLang
  document.title = isPrivacyRoute(pathname) ? `${copy.policy.title} | PayLog` : copy.title
  const description = document.querySelector('meta[name="description"]')
  if (description) description.setAttribute('content', isPrivacyRoute(pathname) ? copy.policy.intro : copy.description)
}

function renderLanguageSwitcher(copy) {
  const currentLabel = copy.languages[currentLanguage]
  const options = Object.entries(copy.languages)
    .map(([code, label]) => `<button class="${code === currentLanguage ? 'language-button active' : 'language-button'}" type="button" data-language="${code}"><img src="/${code}.svg" alt="${label} flag" class="language-flag" /><span>${label}</span></button>`)
    .join('')

  return `<div class="language-switcher" aria-label="${copy.languageLabel}"><button class="language-trigger" type="button" data-language-toggle="true" aria-expanded="${isLanguageMenuOpen}"><img src="/${currentLanguage}.svg" alt="${currentLabel} flag" class="language-flag" /><span>${currentLabel}</span><span class="language-caret">${isLanguageMenuOpen ? '▴' : '▾'}</span></button>${isLanguageMenuOpen ? `<div class="language-menu">${options}</div>` : ''}</div>`
}

function renderHomePage(copy) {
  return `
    <nav class="fixed top-0 w-full z-50 py-4 px-6 md:px-12">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4 glass px-6 py-3 rounded-full shadow-sm">
        <div class="flex items-center gap-3"><img src="/vite.svg" alt="PayLog icon" class="w-9 h-9 rounded-lg bg-white p-1" /><span class="text-xl font-bold tracking-tight text-slate-900">PayLog</span></div>
        <div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a class="hover:text-indigo-600 transition-colors" href="#features">${copy.home.nav.features}</a>
          <a class="hover:text-indigo-600 transition-colors" href="#process">${copy.home.nav.process}</a>
          <a class="hover:text-indigo-600 transition-colors" href="#security">${copy.home.nav.security}</a>
          <a class="hover:text-indigo-600 transition-colors" href="${getPrivacyPath()}">${copy.home.nav.privacy}</a>
        </div>
        <div class="hidden lg:block">${renderLanguageSwitcher(copy)}</div>
      </div>
    </nav>
    <main class="font-sans">
      <section class="relative pt-32 pb-24 md:pt-44 md:pb-32 px-6 overflow-hidden">
        <div class="absolute inset-0 -z-10"><div class="absolute top-[-10%] left-[-10%] w-[38%] h-[38%] bg-indigo-200/50 rounded-full blur-[120px]"></div><div class="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-cyan-200/40 rounded-full blur-[120px]"></div></div>
        <div class="max-w-6xl mx-auto text-center">
          <div class="mb-5 lg:hidden">${renderLanguageSwitcher(copy)}</div>
          <span class="px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-6 inline-flex">${copy.home.badge}</span>
          <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8">${copy.home.heroTitle}<br /><span class="gradient-text">${copy.home.heroAccent}</span></h1>
          <p class="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">${copy.home.heroLead}</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button class="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all">${copy.home.primaryCta}</button>
            <a class="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-50 hover:scale-105 transition-all" href="#features">${copy.home.secondaryCta}</a>
          </div>
          <div class="mx-auto max-w-3xl rounded-[2rem] border border-white/60 bg-white/80 backdrop-blur p-8 shadow-2xl">
            <div class="grid gap-6 md:grid-cols-3 text-left">
              <div class="rounded-3xl bg-slate-50 p-6"><div class="text-3xl mb-4">💳</div><h3 class="font-bold text-slate-900 mb-2">Payments</h3><p class="text-slate-600 text-sm">Fast daily transaction tracking.</p></div>
              <div class="rounded-3xl bg-slate-50 p-6"><div class="text-3xl mb-4">🧾</div><h3 class="font-bold text-slate-900 mb-2">Debtor</h3><p class="text-slate-600 text-sm">Debt records and payment status in one place.</p></div>
              <div class="rounded-3xl bg-slate-50 p-6"><div class="text-3xl mb-4">🤖</div><h3 class="font-bold text-slate-900 mb-2">Holisa AI</h3><p class="text-slate-600 text-sm">AI support for notes and routine workflows.</p></div>
            </div>
          </div>
        </div>
      </section>
      <section class="py-24 px-6 bg-white" id="features"><div class="max-w-5xl mx-auto text-center"><h2 class="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">${copy.home.featuresTitle}</h2><p class="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">${copy.home.featuresLead}</p></div></section>
      <section class="py-24 px-6 bg-slate-50" id="process"><div class="max-w-5xl mx-auto grid gap-6 md:grid-cols-3"><div class="rounded-[2rem] bg-white p-8 shadow-sm border border-slate-100"><div class="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mb-5">1</div><h3 class="font-bold text-xl mb-3">${copy.home.nav.download}</h3><p class="text-slate-600">iOS va Android uchun mavjud.</p></div><div class="rounded-[2rem] bg-white p-8 shadow-sm border border-slate-100"><div class="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mb-5">2</div><h3 class="font-bold text-xl mb-3">OTP</h3><p class="text-slate-600">Qisqa onboarding va xavfsiz kirish.</p></div><div class="rounded-[2rem] bg-white p-8 shadow-sm border border-slate-100"><div class="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mb-5">3</div><h3 class="font-bold text-xl mb-3">Start</h3><p class="text-slate-600">Darhol modullar bilan ishlashni boshlang.</p></div></div></section>
      <section class="py-20 border-y border-slate-100 bg-white" id="security"><div class="max-w-6xl mx-auto px-6"><p class="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">${copy.home.footerLead}</p><div class="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-70"><div class="text-2xl font-black text-slate-900">HTTPS</div><div class="text-2xl font-black text-slate-900">OTP</div><div class="text-2xl font-black text-slate-900">FCM</div><div class="text-2xl font-black text-slate-900">ACCESS</div></div></div></section>
    </main>
    <footer class="bg-white border-t border-slate-100 py-12 px-6"><div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6 items-center"><p class="text-slate-500">${copy.home.footerLead}</p><a class="button secondary" href="${getPrivacyPath()}">${copy.home.footerPrivacy}</a></div></footer>
  `
}

function renderPolicySection(section) {
  const paragraphs = (section.paragraphs || []).map((paragraph) => `<p>${paragraph}</p>`).join('')
  const items = section.items?.length ? `<ul>${section.items.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''
  const groups = (section.groups || []).map((group) => `<div class="policy-subsection"><h3>${group.title}</h3><ul>${group.items.map((item) => `<li>${item}</li>`).join('')}</ul></div>`).join('')
  const links = section.links?.length ? `<div class="policy-links">${section.links.map((link) => `<a href="${link}" target="_blank" rel="noreferrer">${link}</a>`).join('')}</div>` : ''
  const note = section.note ? `<p class="policy-note">${section.note}</p>` : ''
  return `<article class="policy-section"><h2>${section.title}</h2>${paragraphs}${items}${groups}${links}${note}</article>`
}

function renderContactItem(line) {
  const separatorIndex = line.indexOf(': ')
  if (separatorIndex === -1) return `<div class="policy-contact-card"><span>Contact</span><strong>${line}</strong></div>`

  const label = line.slice(0, separatorIndex)
  const value = line.slice(separatorIndex + 2)
  let content = `<strong>${value}</strong>`

  if (/^email$/i.test(label)) {
    content = `<a href="mailto:${value}">${value}</a>`
  } else if (/telefon|phone/i.test(label)) {
    content = `<a href="tel:${value.replace(/\s+/g, '')}">${value}</a>`
  }

  return `<div class="policy-contact-card"><span>${label}</span>${content}</div>`
}

function renderPolicyPage(copy) {
  const summary = copy.policy.summary.map((item) => `<div class="policy-summary-card"><span>${item.label}</span><strong>${item.value}</strong></div>`).join('')
  const sections = copy.policy.sections.map(renderPolicySection).join('')
  const contact = copy.policy.contactLines.map(renderContactItem).join('')

  return `<main class="page policy-page font-sans"><div class="policy-topbar"><a class="policy-brand" href="/"><img src="/vite.svg" alt="PayLog icon" class="policy-brand-icon" /><span>PayLog</span></a>${renderLanguageSwitcher(copy)}</div><header class="policy-header"><p class="eyebrow">PayLog</p><h1>${copy.policy.title}</h1><p class="lead">${copy.policy.updatedAt}</p><p class="policy-intro">${copy.policy.intro}</p></header><section class="policy-summary">${summary}</section><section class="policy-content">${sections}<article class="policy-section policy-contact"><h2>${copy.policy.contactTitle}</h2><div class="policy-contact-grid">${contact}</div></article><a class="button secondary" href="/">${copy.policy.homeCta}</a></section></main>`
}

function render() {
  const routeLanguage = getLanguageFromPath(window.location.pathname)
  if (routeLanguage && supportedLanguages.includes(routeLanguage)) {
    currentLanguage = routeLanguage
    window.localStorage.setItem(STORAGE_KEY, currentLanguage)
  }
  if (window.location.pathname === '/privacy' || window.location.pathname === '/privacy/') {
    window.history.replaceState({}, '', getPrivacyPath())
  }

  const copy = translations[currentLanguage]
  updateDocumentMetadata(copy, window.location.pathname)
  app.innerHTML = isPrivacyRoute(window.location.pathname) ? renderPolicyPage(copy) : renderHomePage(copy)
}

document.addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-language-toggle]')
  if (toggle) {
    isLanguageMenuOpen = !isLanguageMenuOpen
    render()
    return
  }

  const languageButton = event.target.closest('[data-language]')
  if (languageButton) {
    currentLanguage = languageButton.getAttribute('data-language')
    window.localStorage.setItem(STORAGE_KEY, currentLanguage)
    isLanguageMenuOpen = false
    if (isPrivacyRoute(window.location.pathname)) window.history.pushState({}, '', getPrivacyPath(currentLanguage))
    render()
    return
  }

  if (isLanguageMenuOpen) {
    isLanguageMenuOpen = false
    render()
  }

  const link = event.target.closest('a[href^="/"]')
  if (!link) return
  event.preventDefault()
  window.history.pushState({}, '', link.getAttribute('href'))
  render()
})

window.addEventListener('popstate', render)
render()
