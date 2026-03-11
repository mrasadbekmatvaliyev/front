import './style.css'

const app = document.querySelector('#app')

const homePage = `
  <main class="page">
    <header class="hero">
      <p class="eyebrow">PayLog</p>
      <h1>Xarajatlaringizni boshqarish osonlashadi</h1>
      <p class="lead">
        PayLog sizga kundalik to'lovlar, oylik hisobotlar va budjet nazoratini bitta joyda yuritishga yordam beradi.
      </p>
      <a class="button" href="/privacy-policy">Privacy Policy</a>
    </header>

    <section class="features">
      <article class="feature-card">
        <h2>Tez kiritish</h2>
        <p>Har bir xarajatni bir necha soniyada qo'shing va kategoriya bo'yicha saqlang.</p>
      </article>
      <article class="feature-card">
        <h2>Tahliliy ko'rinish</h2>
        <p>Haftalik va oylik trendlarni ko'ring, qayerga ko'p pul ketayotganini biling.</p>
      </article>
      <article class="feature-card">
        <h2>Xavfsiz saqlash</h2>
        <p>Ma'lumotlaringiz himoyalangan holatda saqlanadi va faqat sizga tegishli bo'ladi.</p>
      </article>
    </section>
  </main>
`

const privacyPolicyPage = `
  <main class="page policy-page">
    <header class="policy-header">
      <p class="eyebrow">PayLog</p>
      <h1>Privacy Policy</h1>
      <p class="lead">Oxirgi yangilanish sanasi: 11-mart, 2026-yil</p>
    </header>

    <section class="policy-content">
      <h2>1. Qanday ma'lumotlarni yig'amiz</h2>
      <p>Hisob yaratishda ism, email va ilova ichida kiritilgan to'lov ma'lumotlari yig'ilishi mumkin.</p>

      <h2>2. Ma'lumotlardan foydalanish</h2>
      <p>Yig'ilgan ma'lumotlar xizmatni yaxshilash, statistik tahlil va foydalanuvchi tajribasini optimallashtirish uchun ishlatiladi.</p>

      <h2>3. Uchinchi tomon xizmatlari</h2>
      <p>To'lov yoki analitika xizmatlari ishlatilganda, ular o'z maxfiylik siyosati asosida ishlaydi.</p>

      <h2>4. Ma'lumot xavfsizligi</h2>
      <p>Ma'lumotlarni himoya qilish uchun texnik va tashkiliy choralar qo'llanadi, lekin internet orqali uzatish 100% kafolatlanmaydi.</p>

      <h2>5. Bog'lanish</h2>
      <p>Savollar bo'lsa, bizga <a href="mailto:support@paylog.uz">support@paylog.uz</a> orqali murojaat qiling.</p>

      <a class="button secondary" href="/">Home page</a>
    </section>
  </main>
`

const routes = {
  '/': homePage,
  '/privacy-policy': privacyPolicyPage,
}

function render() {
  app.innerHTML = routes[window.location.pathname] || homePage
}

document.addEventListener('click', (event) => {
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
