import './style.css'

const app = document.querySelector('#app')

const STORAGE_KEY = 'paylog-language'
const defaultLanguage = 'uz'

const translations = {
  uz: {
    htmlLang: 'uz',
    title: 'PayLog | Xarajatlarni boshqarish',
    description:
      "PayLog xarajatlarni kuzatish, budjetni boshqarish va to'lovlar tarixini bitta joyda yuritish uchun mo'ljallangan ilova.",
    languageLabel: 'Til',
    languages: {
      uz: 'O‘zbek',
      ru: 'Русский',
      en: 'English',
    },
    home: {
      heading: 'Xarajatlaringizni boshqarish osonlashadi',
      lead: "PayLog sizga kundalik to'lovlar, oylik hisobotlar va budjet nazoratini bitta joyda yuritishga yordam beradi.",
      privacyCta: 'Maxfiylik siyosati',
      features: [
        {
          title: 'Tez kiritish',
          text: "Har bir xarajatni bir necha soniyada qo'shing va kategoriya bo'yicha saqlang.",
        },
        {
          title: "Tahliliy ko'rinish",
          text: "Haftalik va oylik trendlarni ko'ring, qayerga ko'p pul ketayotganini biling.",
        },
        {
          title: 'Xavfsiz saqlash',
          text: "Ma'lumotlaringiz himoyalangan holatda saqlanadi va faqat sizga tegishli bo'ladi.",
        },
      ],
    },
    policy: {
      title: 'Maxfiylik siyosati',
      updatedAt: 'Oxirgi yangilanish sanasi: 11-mart, 2026-yil',
      sections: [
        {
          title: "1. Qanday ma'lumotlarni yig'amiz",
          text: "Hisob yaratishda ism, email va ilova ichida kiritilgan to'lov ma'lumotlari yig'ilishi mumkin.",
        },
        {
          title: "2. Ma'lumotlardan foydalanish",
          text: "Yig'ilgan ma'lumotlar xizmatni yaxshilash, statistik tahlil va foydalanuvchi tajribasini optimallashtirish uchun ishlatiladi.",
        },
        {
          title: '3. Uchinchi tomon xizmatlari',
          text: "To'lov yoki analitika xizmatlari ishlatilganda, ular o'z maxfiylik siyosati asosida ishlaydi.",
        },
        {
          title: "4. Ma'lumot xavfsizligi",
          text: "Ma'lumotlarni himoya qilish uchun texnik va tashkiliy choralar qo'llanadi, lekin internet orqali uzatish 100% kafolatlanmaydi.",
        },
        {
          title: "5. Bog'lanish",
          textPrefix: "Savollar bo'lsa, bizga ",
          email: 'support@paylog.uz',
          textSuffix: ' orqali murojaat qiling.',
        },
      ],
      homeCta: 'Bosh sahifa',
    },
  },
  ru: {
    htmlLang: 'ru',
    title: 'PayLog | Управление расходами',
    description:
      'PayLog помогает отслеживать расходы, контролировать бюджет и хранить историю платежей в одном месте.',
    languageLabel: 'Язык',
    languages: {
      uz: 'O‘zbek',
      ru: 'Русский',
      en: 'English',
    },
    home: {
      heading: 'Управлять расходами стало проще',
      lead: 'PayLog помогает вести ежедневные платежи, ежемесячные отчеты и контроль бюджета в одном месте.',
      privacyCta: 'Политика конфиденциальности',
      features: [
        {
          title: 'Быстрое добавление',
          text: 'Добавляйте каждый расход за несколько секунд и сохраняйте его по категориям.',
        },
        {
          title: 'Аналитический обзор',
          text: 'Смотрите недельные и месячные тренды и понимайте, куда уходит больше всего денег.',
        },
        {
          title: 'Безопасное хранение',
          text: 'Ваши данные хранятся в защищенном виде и принадлежат только вам.',
        },
      ],
    },
    policy: {
      title: 'Политика конфиденциальности',
      updatedAt: 'Дата последнего обновления: 11 марта 2026 года',
      sections: [
        {
          title: '1. Какие данные мы собираем',
          text: 'При создании аккаунта могут собираться имя, email и данные о платежах, введенные в приложении.',
        },
        {
          title: '2. Как используются данные',
          text: 'Собранные данные используются для улучшения сервиса, статистического анализа и оптимизации пользовательского опыта.',
        },
        {
          title: '3. Сервисы третьих сторон',
          text: 'Если используются платежные или аналитические сервисы, они работают на основе собственной политики конфиденциальности.',
        },
        {
          title: '4. Безопасность данных',
          text: 'Для защиты данных применяются технические и организационные меры, однако передача данных через интернет не может быть гарантирована на 100%.',
        },
        {
          title: '5. Контакты',
          textPrefix: 'Если у вас есть вопросы, свяжитесь с нами через ',
          email: 'support@paylog.uz',
          textSuffix: '.',
        },
      ],
      homeCta: 'Главная страница',
    },
  },
  en: {
    htmlLang: 'en',
    title: 'PayLog | Expense Management',
    description:
      'PayLog helps you track expenses, manage your budget, and keep payment history in one place.',
    languageLabel: 'Language',
    languages: {
      uz: 'O‘zbek',
      ru: 'Русский',
      en: 'English',
    },
    home: {
      heading: 'Managing your expenses gets easier',
      lead: 'PayLog helps you keep daily payments, monthly reports, and budget control in one place.',
      privacyCta: 'Privacy Policy',
      features: [
        {
          title: 'Quick entry',
          text: 'Add each expense in seconds and save it by category.',
        },
        {
          title: 'Analytics view',
          text: 'See weekly and monthly trends and understand where most of your money goes.',
        },
        {
          title: 'Secure storage',
          text: 'Your data is stored securely and remains accessible only to you.',
        },
      ],
    },
    policy: {
      title: 'Privacy Policy',
      updatedAt: 'Last updated: March 11, 2026',
      sections: [
        {
          title: '1. What information we collect',
          text: 'When creating an account, we may collect your name, email, and payment data entered in the app.',
        },
        {
          title: '2. How we use information',
          text: 'Collected information may be used to improve the service, analyze usage, and optimize user experience.',
        },
        {
          title: '3. Third-party services',
          text: 'If payment or analytics services are used, they operate under their own privacy policies.',
        },
        {
          title: '4. Data security',
          text: 'Technical and organizational measures are applied to protect data, but transmission over the internet cannot be guaranteed to be 100% secure.',
        },
        {
          title: '5. Contact',
          textPrefix: 'If you have questions, contact us via ',
          email: 'support@paylog.uz',
          textSuffix: '.',
        },
      ],
      homeCta: 'Home page',
    },
  },
}

function getInitialLanguage() {
  const savedLanguage = window.localStorage.getItem(STORAGE_KEY)
  if (savedLanguage && translations[savedLanguage]) {
    return savedLanguage
  }

  const browserLanguage = window.navigator.language.slice(0, 2).toLowerCase()
  if (translations[browserLanguage]) {
    return browserLanguage
  }

  return defaultLanguage
}

let currentLanguage = getInitialLanguage()

function updateDocumentMetadata(copy) {
  document.documentElement.lang = copy.htmlLang
  document.title = copy.title

  const description = document.querySelector('meta[name="description"]')
  if (description) {
    description.setAttribute('content', copy.description)
  }
}

function renderLanguageSwitcher(copy) {
  const buttons = Object.entries(copy.languages)
    .map(([code, label]) => {
      const activeClass = code === currentLanguage ? ' language-button active' : ' language-button'
      return `<button class="${activeClass.trim()}" type="button" data-language="${code}">${label}</button>`
    })
    .join('')

  return `
    <div class="language-switcher" aria-label="${copy.languageLabel}">
      <span class="language-switcher-label">${copy.languageLabel}</span>
      <div class="language-switcher-actions">${buttons}</div>
    </div>
  `
}

function renderHomePage(copy) {
  const features = copy.home.features
    .map(
      (feature) => `
        <article class="feature-card">
          <h2>${feature.title}</h2>
          <p>${feature.text}</p>
        </article>
      `,
    )
    .join('')

  return `
    <main class="page">
      ${renderLanguageSwitcher(copy)}
      <header class="hero">
        <p class="eyebrow">PayLog</p>
        <h1>${copy.home.heading}</h1>
        <p class="lead">${copy.home.lead}</p>
        <a class="button" href="/privacy-policy">${copy.home.privacyCta}</a>
      </header>

      <section class="features">
        ${features}
      </section>
    </main>
  `
}

function renderPolicyPage(copy) {
  const sections = copy.policy.sections
    .map((section) => {
      if (section.email) {
        return `
          <h2>${section.title}</h2>
          <p>${section.textPrefix}<a href="mailto:${section.email}">${section.email}</a>${section.textSuffix}</p>
        `
      }

      return `
        <h2>${section.title}</h2>
        <p>${section.text}</p>
      `
    })
    .join('')

  return `
    <main class="page policy-page">
      ${renderLanguageSwitcher(copy)}
      <header class="policy-header">
        <p class="eyebrow">PayLog</p>
        <h1>${copy.policy.title}</h1>
        <p class="lead">${copy.policy.updatedAt}</p>
      </header>

      <section class="policy-content">
        ${sections}
        <a class="button secondary" href="/">${copy.policy.homeCta}</a>
      </section>
    </main>
  `
}

const routes = {
  '/': renderHomePage,
  '/privacy-policy': renderPolicyPage,
}

function render() {
  const copy = translations[currentLanguage]
  const routeRenderer = routes[window.location.pathname] || renderHomePage

  updateDocumentMetadata(copy)
  app.innerHTML = routeRenderer(copy)
}

document.addEventListener('click', (event) => {
  const languageButton = event.target.closest('[data-language]')
  if (languageButton) {
    currentLanguage = languageButton.getAttribute('data-language')
    window.localStorage.setItem(STORAGE_KEY, currentLanguage)
    render()
    return
  }

  const link = event.target.closest('a[href^="/"]')
  if (!link) {
    return
  }

  event.preventDefault()
  window.history.pushState({}, '', link.getAttribute('href'))
  render()
})

window.addEventListener('popstate', render)
render()
