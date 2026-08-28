const BACKEND_API_BASE = "https://44-212-221-136.sslip.io";
const API_PROXY_BASE = "/api";
const DEFAULT_API_BASE = defaultApiBase();
const STORAGE = {
  apiBase: "voha.apiBase",
  accessToken: "voha.accessToken",
  refreshToken: "voha.refreshToken",
  user: "voha.user",
  view: "voha.view",
  cart: "voha.cart",
  adminKey: "voha.adminKey",
};

const app = document.getElementById("app");

const state = {
  apiBase: initialApiBase(),
  accessToken: localStorage.getItem(STORAGE.accessToken) || "",
  refreshToken: localStorage.getItem(STORAGE.refreshToken) || "",
  user: readJson(STORAGE.user, null),
  view: localStorage.getItem(STORAGE.view) || "overview",
  authStep: "phone",
  authPhone: localStorage.getItem("voha.authPhone") || "+998",
  registrationToken: "",
  loading: false,
  notice: null,
  sidebarOpen: false,
  health: { ok: false, label: "Tekshirilmagan" },
  filters: {
    latitude: "",
    longitude: "",
    limit: "24",
  },
  data: {
    chats: [],
    contacts: [],
    markets: [],
    marketDetails: {},
    selectedMarketId: null,
    myMarket: null,
    analytics: null,
    analyticsPeriod: "day",
    orders: [],
    orderFilter: "pending",
    selectedChatId: null,
    chatDetail: null,
    messages: [],
    searchUser: null,
    presence: null,
    pushLogs: null,
    adminKey: localStorage.getItem(STORAGE.adminKey) || "",
  },
  cart: readJson(STORAGE.cart, { marketId: null, items: {} }),
  wsChat: null,
  wsUser: null,
  heartbeatTimer: null,
};

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: "DB" },
  { id: "chats", label: "Chatlar", icon: "CH" },
  { id: "contacts", label: "Kontaktlar", icon: "KO" },
  { id: "markets", label: "Marketlar", icon: "MA" },
  { id: "store", label: "Mening marketim", icon: "ST" },
  { id: "push", label: "Push", icon: "PU" },
  { id: "profile", label: "Profil", icon: "PR" },
];

function isLocalFrontend() {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function defaultApiBase() {
  return isLocalFrontend() ? BACKEND_API_BASE : API_PROXY_BASE;
}

function normalizeBase(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function isDirectBackendBase(value) {
  const base = normalizeBase(value);
  return base === BACKEND_API_BASE || base === BACKEND_API_BASE.replace(/^https:/i, "http:");
}

function initialApiBase() {
  const saved = normalizeBase(localStorage.getItem(STORAGE.apiBase));
  if (!isLocalFrontend() && isDirectBackendBase(saved)) {
    localStorage.setItem(STORAGE.apiBase, API_PROXY_BASE);
    return API_PROXY_BASE;
  }
  return cleanBase(saved || DEFAULT_API_BASE);
}

function cleanBase(value) {
  return normalizeBase(value || defaultApiBase()) || defaultApiBase();
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function encodeQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, value);
    }
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

function initials(userOrName) {
  if (!userOrName) return "V";
  const source = typeof userOrName === "string"
    ? userOrName
    : `${userOrName.first_name || ""} ${userOrName.last_name || ""}`.trim();
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "V").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

function assetUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${state.apiBase}${url.startsWith("/") ? url : `/${url}`}`;
}

function wsBase() {
  if (state.apiBase.startsWith("/")) {
    return BACKEND_API_BASE.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
  }
  return state.apiBase.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("uz-UZ", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";
  return new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 2,
  }).format(number);
}

function fullName(user) {
  if (!user) return "";
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || `User #${user.id}`;
}

function nullable(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function optionalNumber(value) {
  const text = String(value ?? "").trim();
  return text ? Number(text) : null;
}

function parseIdList(value) {
  return String(value || "")
    .split(/[,\s]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function parseImageList(value) {
  return String(value || "")
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function checked(form, name) {
  const field = form.elements[name];
  return Boolean(field && field.checked);
}

function getErrorMessage(error) {
  if (!error) return "Xatolik yuz berdi";
  return error.userMessage || error.message || "Xatolik yuz berdi";
}

function notify(type, text) {
  state.notice = { type, text };
  render();
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => {
    if (state.notice?.text === text) {
      state.notice = null;
      render();
    }
  }, 4500);
}

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.userMessage = message;
  }
}

async function api(path, options = {}, retry = true) {
  const {
    method = "GET",
    body,
    auth = true,
    token,
    headers = {},
    adminKey = "",
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };
  const bearer = token || state.accessToken;
  if (auth && bearer) {
    requestHeaders.Authorization = `Bearer ${bearer}`;
  }
  if (adminKey) {
    requestHeaders["X-Admin-Key"] = adminKey;
  }

  const request = { method, headers: requestHeaders };
  if (body instanceof FormData) {
    request.body = body;
  } else if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    request.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${state.apiBase}${path}`, request);
  } catch (error) {
    throw new ApiError(`API ulanmadı: ${error.message}`, 0, null);
  }

  if (response.status === 401 && retry && auth && state.refreshToken && !token) {
    await refreshAccessToken();
    return api(path, options, false);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    let message = "So'rov bajarilmadi";
    const detail = payload && typeof payload === "object" ? payload.detail : payload;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail.map((item) => item.msg || JSON.stringify(item)).join("; ");
    } else if (detail) {
      message = JSON.stringify(detail);
    }
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

async function refreshAccessToken() {
  if (!state.refreshToken) {
    throw new ApiError("Refresh token topilmadi", 401, null);
  }
  const response = await api("/auth/refresh", {
    method: "POST",
    auth: false,
    body: { refresh_token: state.refreshToken },
  }, false);
  state.accessToken = response.access_token;
  localStorage.setItem(STORAGE.accessToken, state.accessToken);
  return state.accessToken;
}

async function checkHealth() {
  try {
    const response = await api("/health", { auth: false });
    state.health = { ok: response?.status === "ok", label: "Online" };
  } catch {
    state.health = { ok: false, label: "Offline" };
  }
}

function storeSession(payload) {
  state.accessToken = payload.access_token;
  state.refreshToken = payload.refresh_token || state.refreshToken;
  state.user = payload.user;
  localStorage.setItem(STORAGE.accessToken, state.accessToken);
  localStorage.setItem(STORAGE.refreshToken, state.refreshToken);
  saveJson(STORAGE.user, state.user);
}

function clearSession() {
  state.accessToken = "";
  state.refreshToken = "";
  state.user = null;
  state.registrationToken = "";
  state.data.selectedChatId = null;
  state.data.messages = [];
  state.data.chatDetail = null;
  localStorage.removeItem(STORAGE.accessToken);
  localStorage.removeItem(STORAGE.refreshToken);
  localStorage.removeItem(STORAGE.user);
  closeSockets();
  stopHeartbeat();
  render();
}

async function loadMe() {
  state.user = await api("/users/me");
  saveJson(STORAGE.user, state.user);
  return state.user;
}

async function loadChats() {
  state.data.chats = await api("/chats?limit=100");
}

async function loadContacts() {
  state.data.contacts = await api("/users/contacts");
}

async function loadNearbyMarkets() {
  state.data.markets = await api(`/markets/nearby${encodeQuery(state.filters)}`, {
    auth: false,
  });
  if (!state.data.selectedMarketId && state.data.markets[0]) {
    state.data.selectedMarketId = state.data.markets[0].id;
  }
}

async function loadMarketDetail(marketId) {
  if (!marketId) return null;
  const detail = await api(`/markets/${marketId}`, { auth: false });
  state.data.marketDetails[marketId] = detail;
  return detail;
}

async function loadMyMarket() {
  state.data.myMarket = await api("/markets/me");
  return state.data.myMarket;
}

async function loadAnalytics(period = state.data.analyticsPeriod) {
  state.data.analyticsPeriod = period;
  state.data.analytics = await api(`/markets/me/analytics${encodeQuery({
    period,
    timezone: "Asia/Tashkent",
  })}`);
}

async function loadOrders(status = state.data.orderFilter) {
  state.data.orderFilter = status || "";
  state.data.orders = await api(`/markets/me/orders${encodeQuery({
    status: state.data.orderFilter,
    limit: 100,
  })}`);
}

async function loadChat(chatId) {
  state.data.selectedChatId = Number(chatId);
  const [detail, messageResponse] = await Promise.all([
    api(`/chats/${chatId}`),
    api(`/chats/${chatId}/messages?limit=100`),
  ]);
  state.data.chatDetail = detail;
  state.data.messages = messageResponse.messages || [];
  connectChatSocket(chatId);
  await markLatestIncomingRead();
}

async function markLatestIncomingRead() {
  const incoming = [...state.data.messages]
    .filter((message) => (message.sender?.id || message.sender_id) !== state.user?.id)
    .sort((a, b) => Number(a.id) - Number(b.id));
  const latest = incoming[incoming.length - 1];
  if (!latest || latest.is_read) return;
  try {
    await api(`/chats/messages/${latest.id}/read`, { method: "POST" });
  } catch {
    return;
  }
}

async function loadPushLogs(userId) {
  const key = state.data.adminKey;
  state.data.pushLogs = await api(`/push/logs/${userId}?limit=50`, {
    auth: false,
    adminKey: key,
  });
}

async function loadForView(view = state.view) {
  state.loading = true;
  state.view = view;
  localStorage.setItem(STORAGE.view, view);
  render();
  try {
    await checkHealth();
    if (state.accessToken) {
      await loadMe();
    }
    if (view === "overview") {
      await Promise.allSettled([
        loadChats(),
        loadContacts(),
        loadNearbyMarkets(),
        loadMyMarket(),
      ]);
      if (state.data.selectedMarketId) {
        await loadMarketDetail(state.data.selectedMarketId).catch(() => null);
      }
      if (state.data.myMarket) {
        await Promise.allSettled([loadAnalytics(), loadOrders()]);
      }
    }
    if (view === "contacts") {
      await loadContacts();
    }
    if (view === "chats") {
      await loadChats();
      if (state.data.selectedChatId) {
        await loadChat(state.data.selectedChatId);
      }
    }
    if (view === "markets") {
      await loadNearbyMarkets();
      if (state.data.selectedMarketId) {
        await loadMarketDetail(state.data.selectedMarketId);
      }
    }
    if (view === "store") {
      await loadMyMarket();
      if (state.data.myMarket) {
        await Promise.allSettled([loadAnalytics(), loadOrders()]);
      }
    }
    if (view === "profile") {
      await loadMe();
    }
  } catch (error) {
    notify("error", getErrorMessage(error));
  } finally {
    state.loading = false;
    render();
  }
}

function closeSockets() {
  if (state.wsChat) state.wsChat.close();
  if (state.wsUser) state.wsUser.close();
  state.wsChat = null;
  state.wsUser = null;
}

function connectUserSocket() {
  if (!state.accessToken || state.wsUser?.readyState === WebSocket.OPEN) return;
  if (state.wsUser) state.wsUser.close();
  const socket = new WebSocket(`${wsBase()}/ws/user?token=${encodeURIComponent(state.accessToken)}`);
  state.wsUser = socket;
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "new_chat") {
      upsertById(state.data.chats, data.chat);
      render();
    }
    if (data.type === "new_message") {
      const selected = Number(state.data.selectedChatId) === Number(data.message.chat_id);
      const chat = state.data.chats.find((item) => Number(item.id) === Number(data.message.chat_id));
      if (chat) {
        chat.last_message = data.message;
        if (!selected && (data.message.sender?.id || data.message.sender_id) !== state.user?.id) {
          chat.unread_count = Number(chat.unread_count || 0) + 1;
        }
      }
      if (selected) upsertById(state.data.messages, data.message);
      render();
    }
  };
  socket.onclose = () => {
    if (state.accessToken) {
      window.setTimeout(connectUserSocket, 4000);
    }
  };
}

function connectChatSocket(chatId) {
  if (!state.accessToken) return;
  if (state.wsChat && Number(state.wsChat.chatId) === Number(chatId) && state.wsChat.readyState === WebSocket.OPEN) {
    return;
  }
  if (state.wsChat) state.wsChat.close();
  const socket = new WebSocket(`${wsBase()}/ws/chats/${chatId}?token=${encodeURIComponent(state.accessToken)}`);
  socket.chatId = Number(chatId);
  state.wsChat = socket;
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "new_message" || data.type === "message_updated") {
      upsertById(state.data.messages, data.message);
      render();
    }
    if (data.type === "message_edited") {
      const message = state.data.messages.find((item) => Number(item.id) === Number(data.message_id));
      if (message) {
        message.text = data.text;
        message.is_edited = true;
        message.edited_at = data.edited_at;
      }
      render();
    }
    if (data.type === "message_deleted") {
      const message = state.data.messages.find((item) => Number(item.id) === Number(data.message_id));
      if (message) {
        message.is_deleted = true;
        message.text = "Bu xabar o'chirildi";
      }
      render();
    }
    if (data.type === "read_receipt") {
      state.data.messages
        .filter((item) => Number(item.id) <= Number(data.read_until_id))
        .forEach((item) => {
          if ((item.sender?.id || item.sender_id) === state.user?.id) item.is_read = true;
        });
      render();
    }
  };
}

function upsertById(list, item) {
  const index = list.findIndex((entry) => Number(entry.id) === Number(item.id));
  if (index >= 0) {
    list[index] = { ...list[index], ...item };
  } else {
    list.unshift(item);
  }
}

function startHeartbeat() {
  stopHeartbeat();
  if (!state.user) return;
  const beat = async () => {
    try {
      await api("/presence/heartbeat", {
        method: "POST",
        body: {
          userId: state.user.id,
          deviceId: "web-local",
          ttlSeconds: 90,
        },
      });
    } catch {
      return;
    }
  };
  beat();
  state.heartbeatTimer = window.setInterval(beat, 60000);
}

function stopHeartbeat() {
  if (state.heartbeatTimer) window.clearInterval(state.heartbeatTimer);
  state.heartbeatTimer = null;
}

function avatar(user, className = "avatar") {
  const image = assetUrl(user?.avatar_url);
  return `<div class="${className}">${image
    ? `<img src="${escapeHtml(image)}" alt="">`
    : escapeHtml(initials(user))}</div>`;
}

function render() {
  if (!state.accessToken || !state.user) {
    app.innerHTML = renderAuth();
    return;
  }
  app.innerHTML = renderShell();
}

function renderAuth() {
  const isOtp = state.authStep === "otp";
  const isRegister = Boolean(state.registrationToken);
  return `
    <main class="auth-page">
      <section class="auth-side">
        <div class="auth-brand">
          <div class="brand-mark">V</div>
          <h1>Voha</h1>
          <p>Chat, market va buyurtmalar.</p>
        </div>
        <div class="auth-card panel">
          <div class="panel-body">
            ${state.notice ? `<div class="alert ${state.notice.type}">${escapeHtml(state.notice.text)}</div>` : ""}
            ${!isOtp && !isRegister ? renderPhoneForm() : ""}
            ${isOtp && !isRegister ? renderOtpForm() : ""}
            ${isRegister ? renderRegisterForm() : ""}
          </div>
        </div>
        <div class="auth-footer">
          <div class="status-row"><span class="dot ${state.health.ok ? "ok" : "warn"}"></span>${escapeHtml(state.health.label)}: ${escapeHtml(state.apiBase)}</div>
        </div>
      </section>
      <section class="auth-visual" aria-hidden="true"></section>
    </main>
  `;
}

function renderPhoneForm() {
  return `
    <form class="form-grid" data-action="auth-send-otp">
      <h2>Kirish</h2>
      <div class="field">
        <label for="phone">Telefon</label>
        <input id="phone" name="phone" value="${escapeHtml(state.authPhone)}" placeholder="+998901234567" autocomplete="tel" required>
      </div>
      <button class="btn primary" type="submit">OTP yuborish</button>
    </form>
  `;
}

function renderOtpForm() {
  return `
    <form class="form-grid" data-action="auth-verify-otp">
      <h2>OTP</h2>
      <div class="field">
        <label for="otp-phone">Telefon</label>
        <input id="otp-phone" name="phone" value="${escapeHtml(state.authPhone)}" required>
      </div>
      <div class="field">
        <label for="otp">Kod</label>
        <input id="otp" name="otp" inputmode="numeric" maxlength="5" placeholder="12345" required>
      </div>
      <div class="actions">
        <button class="btn primary" type="submit">Tasdiqlash</button>
        <button class="btn" type="button" data-action="auth-back">Telefonni o'zgartirish</button>
      </div>
    </form>
  `;
}

function renderRegisterForm() {
  return `
    <form class="form-grid" data-action="auth-register">
      <h2>Ro'yxatdan o'tish</h2>
      <div class="form-grid two">
        <div class="field">
          <label for="first-name">Ism</label>
          <input id="first-name" name="first_name" maxlength="50" required>
        </div>
        <div class="field">
          <label for="last-name">Familya</label>
          <input id="last-name" name="last_name" maxlength="50" required>
        </div>
      </div>
      <button class="btn primary" type="submit">Akkaunt yaratish</button>
    </form>
  `;
}

function renderShell() {
  const title = NAV_ITEMS.find((item) => item.id === state.view)?.label || "Dashboard";
  return `
    <div class="app-shell">
      ${renderSidebar()}
      <main class="main">
        <header class="topbar">
          <div class="row">
            <button class="btn icon mobile-menu" type="button" data-action="toggle-sidebar">=</button>
            <div>
              <h2>${escapeHtml(title)}</h2>
              <small>${escapeHtml(state.apiBase)}</small>
            </div>
          </div>
          <div class="row">
            <div class="status-row"><span class="dot ${state.health.ok ? "ok" : "warn"}"></span>${escapeHtml(state.health.label)}</div>
            ${avatar(state.user)}
          </div>
        </header>
        <section class="content">
          ${state.notice ? `<div class="alert ${state.notice.type}">${escapeHtml(state.notice.text)}</div>` : ""}
          ${renderView()}
        </section>
      </main>
    </div>
  `;
}

function renderSidebar() {
  const unread = state.data.chats.reduce((sum, chat) => sum + Number(chat.unread_count || 0), 0);
  return `
    <aside class="sidebar ${state.sidebarOpen ? "open" : ""}">
      <div class="brand">
        <div class="brand-mark">V</div>
        <h1>Voha</h1>
        <p>${escapeHtml(fullName(state.user))}</p>
      </div>
      <nav class="nav">
        ${NAV_ITEMS.map((item) => `
          <button class="nav-button ${state.view === item.id ? "active" : ""}" type="button" data-view="${item.id}">
            <span class="nav-icon">${escapeHtml(item.icon)}</span>
            <span>${escapeHtml(item.label)}</span>
            ${item.id === "chats" && unread ? `<span class="nav-badge">${unread}</span>` : ""}
          </button>
        `).join("")}
      </nav>
      <div class="sidebar-footer">
        <div class="item-sub">${escapeHtml(state.user.phone || "")}</div>
        <button class="btn danger" type="button" data-action="logout">Chiqish</button>
      </div>
    </aside>
  `;
}

function renderView() {
  if (state.view === "chats") return renderChats();
  if (state.view === "contacts") return renderContacts();
  if (state.view === "markets") return renderMarkets();
  if (state.view === "store") return renderStore();
  if (state.view === "push") return renderPush();
  if (state.view === "profile") return renderProfile();
  return renderOverview();
}

function renderOverview() {
  const unread = state.data.chats.reduce((sum, chat) => sum + Number(chat.unread_count || 0), 0);
  const analytics = state.data.analytics;
  return `
    <div class="grid four">
      ${metric("Chatlar", state.data.chats.length)}
      ${metric("O'qilmagan", unread)}
      ${metric("Kontaktlar", state.data.contacts.length)}
      ${metric("Market savdo", analytics ? `${formatMoney(analytics.total_sales)} so'm` : "0")}
    </div>
    <div class="grid two">
      <section class="panel">
        <div class="panel-header">
          <div><h3>So'nggi chatlar</h3><p>${state.data.chats.length} ta suhbat</p></div>
          <button class="btn" type="button" data-view="chats">Ochish</button>
        </div>
        <div class="panel-body list">
          ${state.data.chats.slice(0, 6).map(renderChatListItem).join("") || empty("Chatlar topilmadi")}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div><h3>Yaqin marketlar</h3><p>${state.data.markets.length} ta market</p></div>
          <button class="btn" type="button" data-view="markets">Ko'rish</button>
        </div>
        <div class="panel-body product-grid">
          ${state.data.markets.slice(0, 4).map(renderMarketCard).join("") || empty("Marketlar topilmadi")}
        </div>
      </section>
    </div>
    <section class="panel">
      <div class="panel-header">
        <div><h3>Mening marketim</h3><p>${state.data.myMarket ? escapeHtml(state.data.myMarket.name) : "Market yaratilmagan"}</p></div>
        <button class="btn" type="button" data-view="store">Boshqarish</button>
      </div>
      <div class="panel-body">
        ${analytics ? renderAnalyticsChart(analytics) : empty("Savdo statistikasi mavjud emas")}
      </div>
    </section>
  `;
}

function metric(label, value) {
  return `
    <section class="panel metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </section>
  `;
}

function empty(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function renderContacts() {
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-header">
          <div><h3>Qidirish</h3><p>E.164 telefon formatida</p></div>
        </div>
        <div class="panel-body stack">
          <form class="form-grid" data-action="search-user">
            <div class="field">
              <label>Telefon</label>
              <input name="phone" placeholder="+998901234567" required>
            </div>
            <button class="btn primary" type="submit">Qidirish</button>
          </form>
          ${state.data.searchUser ? renderSearchResult(state.data.searchUser) : ""}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div><h3>Kontaktlar</h3><p>${state.data.contacts.length} ta kontakt</p></div>
          <button class="btn" type="button" data-action="refresh-contacts">Yangilash</button>
        </div>
        <div class="panel-body list">
          ${state.data.contacts.map(renderContact).join("") || empty("Kontaktlar yo'q")}
        </div>
      </section>
    </div>
  `;
}

function renderSearchResult(user) {
  return `
    <div class="item">
      <div class="item-head">
        <div class="row">
          ${avatar(user)}
          <div>
            <div class="item-title">${escapeHtml(fullName(user))}</div>
            <div class="item-sub">@${escapeHtml(user.username || "username yo'q")} · #${escapeHtml(user.id)}</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn primary" type="button" data-action="add-contact-result" data-user-id="${user.id}">Qo'shish</button>
          <button class="btn" type="button" data-action="start-chat" data-user-id="${user.id}">Chat</button>
        </div>
      </div>
    </div>
  `;
}

function renderContact(contact) {
  return `
    <div class="item">
      <div class="item-head">
        <div class="row">
          ${avatar(contact)}
          <div>
            <div class="item-title">${escapeHtml(`${contact.first_name} ${contact.last_name}`)}</div>
            <div class="item-sub">${escapeHtml(contact.phone)} ${contact.username ? `@${escapeHtml(contact.username)}` : ""}</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn" type="button" data-action="start-chat" data-user-id="${contact.user_id}">Chat</button>
          <button class="btn warning" type="button" data-action="check-presence" data-user-id="${contact.user_id}">Status</button>
          <button class="btn danger" type="button" data-action="remove-contact" data-user-id="${contact.user_id}">O'chirish</button>
        </div>
      </div>
    </div>
  `;
}

function renderChats() {
  const selected = state.data.selectedChatId;
  return `
    <div class="chat-layout">
      <section class="panel chat-list">
        <div class="panel-header">
          <div><h3>Chatlar</h3><p>${state.data.chats.length} ta suhbat</p></div>
          <button class="btn" type="button" data-action="refresh-chats">Yangilash</button>
        </div>
        <div class="panel-body stack">
          <form class="form-grid" data-action="create-private-chat">
            <div class="field">
              <label>Telefon</label>
              <input name="phone" placeholder="+998901234567">
            </div>
            <button class="btn primary" type="submit">Private chat</button>
          </form>
          <form class="form-grid" data-action="create-group-chat">
            <div class="field">
              <label>Guruh nomi</label>
              <input name="name" maxlength="100">
            </div>
            <div class="field">
              <label>User ID lar</label>
              <input name="user_ids" placeholder="12, 18, 24">
            </div>
            <button class="btn" type="submit">Guruh yaratish</button>
          </form>
          <div class="list">
            ${state.data.chats.map(renderChatListItem).join("") || empty("Chatlar topilmadi")}
          </div>
        </div>
      </section>
      <section class="panel chat-window">
        ${selected ? renderChatWindow() : `<div class="panel-body">${empty("Chat tanlang")}</div>`}
      </section>
    </div>
  `;
}

function chatName(chat) {
  if (!chat) return "Chat";
  if (chat.chat_type === "group") return chat.name || `Group #${chat.id}`;
  if (chat.peer) return fullName(chat.peer);
  return chat.name || `Chat #${chat.id}`;
}

function renderChatListItem(chat) {
  const last = chat.last_message?.text || "Xabar yo'q";
  const active = Number(chat.id) === Number(state.data.selectedChatId);
  return `
    <button class="item clickable ${active ? "active" : ""}" type="button" data-action="select-chat" data-chat-id="${chat.id}">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(chatName(chat))}</div>
          <div class="item-sub">${escapeHtml(last)}</div>
        </div>
        ${chat.unread_count ? `<span class="badge">${chat.unread_count}</span>` : ""}
      </div>
    </button>
  `;
}

function renderChatWindow() {
  const detail = state.data.chatDetail;
  const messages = [...state.data.messages].sort((a, b) => Number(a.id) - Number(b.id));
  return `
    <div class="panel-header">
      <div>
        <h3>${escapeHtml(chatName(detail || state.data.chats.find((item) => Number(item.id) === Number(state.data.selectedChatId))))}</h3>
        <p>${detail?.participants?.map((item) => escapeHtml(fullName(item))).join(", ") || "Ishtirokchilar"}</p>
      </div>
      <div class="actions">
        <button class="btn warning" type="button" data-action="report-chat">Shikoyat</button>
        <button class="btn danger" type="button" data-action="delete-chat">O'chirish</button>
      </div>
    </div>
    <div class="messages">
      ${messages.map(renderMessage).join("") || empty("Xabarlar yo'q")}
    </div>
    <form class="composer" data-action="send-message">
      <div class="form-grid">
        <div class="field">
          <label>Xabar</label>
          <textarea name="text" maxlength="4096" required></textarea>
        </div>
        <div class="form-grid two">
          <div class="field">
            <label>Turi</label>
            <select name="message_type">
              <option value="text">Text</option>
              <option value="account">Hisob</option>
            </select>
          </div>
          <div class="field">
            <label>Yo'nalish</label>
            <select name="account_direction">
              <option value="">Tanlanmagan</option>
              <option value="income">Kirim</option>
              <option value="expense">Chiqim</option>
            </select>
          </div>
          <div class="field">
            <label>Summa</label>
            <input name="account_amount" type="number" min="0" step="0.01">
          </div>
          <div class="field">
            <label>Valyuta</label>
            <select name="account_currency">
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>
      <button class="btn primary" type="submit">Yuborish</button>
    </form>
  `;
}

function renderMessage(message) {
  const senderId = message.sender?.id || message.sender_id;
  const mine = Number(senderId) === Number(state.user?.id);
  const deleted = message.is_deleted;
  return `
    <article class="message ${mine ? "mine" : ""} ${deleted ? "deleted" : ""}">
      <div class="item-sub">${escapeHtml(message.sender ? fullName(message.sender) : "System")}</div>
      <div>${escapeHtml(message.text)}</div>
      ${message.message_type === "account" ? renderAccountMessage(message) : ""}
      ${message.market_order ? renderOrderMessage(message.market_order) : ""}
      <div class="message-meta">
        <span>${formatDate(message.created_at)}</span>
        ${message.is_edited ? "<span>tahrirlangan</span>" : ""}
        ${mine && message.is_read ? "<span>o'qildi</span>" : ""}
        ${mine && !deleted ? `<button class="btn ghost" type="button" data-action="edit-message" data-message-id="${message.id}" data-text="${escapeHtml(message.text)}">Edit</button>` : ""}
        ${mine && !deleted ? `<button class="btn ghost" type="button" data-action="delete-message" data-message-id="${message.id}">Delete</button>` : ""}
      </div>
    </article>
  `;
}

function renderAccountMessage(message) {
  return `
    <div class="alert">
      <strong>${message.account_direction === "income" ? "Kirim" : "Chiqim"}</strong>
      ${formatMoney(message.account_amount)} ${escapeHtml(message.account_currency || "UZS")}
      ${message.account_reason ? `<div class="item-sub">${escapeHtml(message.account_reason)}</div>` : ""}
    </div>
  `;
}

function renderOrderMessage(order) {
  return `
    <div class="alert">
      <strong>Buyurtma #${order.id}</strong>
      <div>${escapeHtml(order.market_name)} · ${formatMoney(order.total_amount)} so'm</div>
      <span class="pill ${order.status}">${escapeHtml(order.status)}</span>
    </div>
  `;
}

function renderMarkets() {
  const selectedId = state.data.selectedMarketId;
  const detail = selectedId ? state.data.marketDetails[selectedId] : null;
  return `
    <section class="panel">
      <div class="panel-header">
        <div><h3>Market qidirish</h3><p>${state.data.markets.length} ta natija</p></div>
        <button class="btn" type="button" data-action="use-location">Lokatsiya</button>
      </div>
      <div class="panel-body">
        <form class="form-grid two" data-action="filter-markets">
          <div class="field">
            <label>Latitude</label>
            <input name="latitude" value="${escapeHtml(state.filters.latitude)}" type="number" step="any">
          </div>
          <div class="field">
            <label>Longitude</label>
            <input name="longitude" value="${escapeHtml(state.filters.longitude)}" type="number" step="any">
          </div>
          <div class="field">
            <label>Limit</label>
            <input name="limit" value="${escapeHtml(state.filters.limit)}" type="number" min="1" max="50">
          </div>
          <div class="actions">
            <button class="btn primary" type="submit">Qidirish</button>
          </div>
        </form>
      </div>
    </section>
    <div class="split">
      <section class="panel">
        <div class="panel-header"><h3>Marketlar</h3></div>
        <div class="panel-body product-grid">
          ${state.data.markets.map(renderMarketCard).join("") || empty("Market topilmadi")}
        </div>
      </section>
      <section class="panel">
        ${detail ? renderMarketDetail(detail) : `<div class="panel-body">${empty("Market tanlang")}</div>`}
      </section>
    </div>
  `;
}

function renderMarketCard(market) {
  const image = assetUrl(market.image_url);
  const selected = Number(market.id) === Number(state.data.selectedMarketId);
  return `
    <button class="market-card clickable ${selected ? "active" : ""}" type="button" data-action="select-market" data-market-id="${market.id}">
      <div class="market-image">${image ? `<img src="${escapeHtml(image)}" alt="">` : escapeHtml(initials(market.name))}</div>
      <div class="market-card-body">
        <div class="item-title">${escapeHtml(market.name)}</div>
        <div class="item-sub">${escapeHtml(market.address || "Manzil kiritilmagan")}</div>
        <div class="row fill">
          <span class="pill">${market.products_count || 0} mahsulot</span>
          ${market.distance_km !== null && market.distance_km !== undefined ? `<span class="item-sub">${formatMoney(market.distance_km)} km</span>` : ""}
        </div>
      </div>
    </button>
  `;
}

function renderMarketDetail(market) {
  const cartItems = getCartItems(market);
  return `
    <div class="panel-header">
      <div>
        <h3>${escapeHtml(market.name)}</h3>
        <p>${escapeHtml(market.address || "")}</p>
      </div>
      <span class="pill">${market.allow_debt ? "Qarz mumkin" : "Naqd"}</span>
    </div>
    <div class="panel-body stack">
      ${market.description ? `<p>${escapeHtml(market.description)}</p>` : ""}
      <div class="product-grid">
        ${market.products.map((product) => renderProductCard(product, market.id)).join("") || empty("Mahsulotlar yo'q")}
      </div>
      ${cartItems.length ? renderCart(market, cartItems) : ""}
    </div>
  `;
}

function renderProductCard(product, marketId) {
  const image = assetUrl(product.image_url || product.image_urls?.[0]);
  const qty = Number(state.cart.marketId) === Number(marketId)
    ? Number(state.cart.items[product.id] || 0)
    : 0;
  return `
    <article class="product-card">
      <div class="product-image">${image ? `<img src="${escapeHtml(image)}" alt="">` : escapeHtml(initials(product.name))}</div>
      <div class="product-card-body">
        <div>
          <div class="item-title">${escapeHtml(product.name)}</div>
          <div class="item-sub">${escapeHtml(product.description || "")}</div>
        </div>
        <div class="row fill">
          <span class="price">${formatMoney(product.price)} so'm</span>
          <span class="pill">${product.stock} ${escapeHtml(product.unit)}</span>
        </div>
        <div class="actions">
          <button class="btn primary" type="button" data-action="cart-add" data-market-id="${marketId}" data-product-id="${product.id}">Qo'shish</button>
          ${qty ? `<button class="btn" type="button" data-action="cart-dec" data-market-id="${marketId}" data-product-id="${product.id}">-</button><span class="badge">${qty}</span><button class="btn" type="button" data-action="cart-inc" data-market-id="${marketId}" data-product-id="${product.id}">+</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function getCartItems(market) {
  if (Number(state.cart.marketId) !== Number(market.id)) return [];
  return market.products
    .map((product) => ({ product, quantity: Number(state.cart.items[product.id] || 0) }))
    .filter((item) => item.quantity > 0);
}

function renderCart(market, cartItems) {
  const total = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  return `
    <form class="cart-bar form-grid" data-action="checkout" data-market-id="${market.id}">
      <div class="row fill">
        <strong>Savat: ${formatMoney(total)} so'm</strong>
        <button class="btn danger" type="button" data-action="cart-clear">Tozalash</button>
      </div>
      <div class="list">
        ${cartItems.map((item) => `
          <div class="row fill">
            <span>${escapeHtml(item.product.name)} x ${item.quantity}</span>
            <span>${formatMoney(Number(item.product.price) * item.quantity)} so'm</span>
          </div>
        `).join("")}
      </div>
      <div class="form-grid two">
        <div class="field">
          <label>To'lov</label>
          <select name="payment_method">
            <option value="cash">Naqd</option>
            ${market.allow_debt ? `<option value="debt">Qarz</option>` : ""}
          </select>
        </div>
        <div class="field">
          <label>Izoh</label>
          <input name="note" maxlength="1000">
        </div>
      </div>
      <button class="btn primary" type="submit">Buyurtma berish</button>
    </form>
  `;
}

function renderStore() {
  const market = state.data.myMarket;
  if (!market) {
    return `
      <section class="panel">
        <div class="panel-header"><h3>Market yaratish</h3></div>
        <div class="panel-body">${renderMarketForm("create-market")}</div>
      </section>
    `;
  }
  return `
    <div class="grid two">
      <section class="panel">
        <div class="panel-header">
          <div><h3>Market sozlamalari</h3><p>${escapeHtml(market.name)}</p></div>
          <button class="btn danger" type="button" data-action="delete-market">O'chirish</button>
        </div>
        <div class="panel-body">${renderMarketForm("update-market", market)}</div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div><h3>Analitika</h3><p>${state.data.analytics?.period_label || ""}</p></div>
          <div class="segmented">
            ${["day", "week", "month"].map((period) => `
              <button class="segment ${state.data.analyticsPeriod === period ? "active" : ""}" type="button" data-action="analytics-period" data-period="${period}">${period}</button>
            `).join("")}
          </div>
        </div>
        <div class="panel-body">${state.data.analytics ? renderAnalyticsChart(state.data.analytics) : empty("Analitika yo'q")}</div>
      </section>
    </div>
    <section class="panel">
      <div class="panel-header"><h3>Mahsulot qo'shish</h3></div>
      <div class="panel-body">${renderProductForm("create-product")}</div>
    </section>
    <section class="panel">
      <div class="panel-header"><h3>Mahsulotlar</h3><p>${market.products.length} ta mahsulot</p></div>
      <div class="panel-body product-grid">
        ${market.products.map(renderStoreProduct).join("") || empty("Mahsulotlar yo'q")}
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <div><h3>Buyurtmalar</h3><p>${state.data.orders.length} ta buyurtma</p></div>
        <div class="segmented">
          ${["pending", "confirmed", "cancelled", ""].map((status) => `
            <button class="segment ${state.data.orderFilter === status ? "active" : ""}" type="button" data-action="order-filter" data-status="${status}">${status || "all"}</button>
          `).join("")}
        </div>
      </div>
      <div class="panel-body">${renderOrdersTable(state.data.orders)}</div>
    </section>
  `;
}

function renderMarketForm(action, market = {}) {
  return `
    <form class="form-grid" data-action="${action}">
      <div class="form-grid two">
        <div class="field">
          <label>Nomi</label>
          <input name="name" value="${escapeHtml(market.name || "")}" maxlength="100" required>
        </div>
        <div class="field">
          <label>Telefon</label>
          <input name="phone" value="${escapeHtml(market.phone || "")}" maxlength="20">
        </div>
        <div class="field">
          <label>Manzil</label>
          <input name="address" value="${escapeHtml(market.address || "")}" maxlength="255">
        </div>
        <div class="field">
          <label>Latitude</label>
          <input name="latitude" value="${escapeHtml(market.latitude ?? "")}" type="number" step="any">
        </div>
        <div class="field">
          <label>Longitude</label>
          <input name="longitude" value="${escapeHtml(market.longitude ?? "")}" type="number" step="any">
        </div>
        <div class="field">
          <label>Holat</label>
          <select name="is_active">
            <option value="true" ${market.is_active !== false ? "selected" : ""}>Faol</option>
            <option value="false" ${market.is_active === false ? "selected" : ""}>Nofaol</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Tavsif</label>
        <textarea name="description" maxlength="2000">${escapeHtml(market.description || "")}</textarea>
      </div>
      <label class="status-row">
        <input name="allow_debt" type="checkbox" ${market.allow_debt ? "checked" : ""}>
        Qarzga buyurtma
      </label>
      <button class="btn primary" type="submit">Saqlash</button>
    </form>
  `;
}

function renderProductForm(action, product = {}) {
  return `
    <form class="form-grid" data-action="${action}" ${product.id ? `data-product-id="${product.id}"` : ""}>
      <div class="form-grid two">
        <div class="field">
          <label>Nomi</label>
          <input name="name" value="${escapeHtml(product.name || "")}" maxlength="120" required>
        </div>
        <div class="field">
          <label>Narx</label>
          <input name="price" value="${escapeHtml(product.price ?? "")}" type="number" min="0" step="0.01" required>
        </div>
        <div class="field">
          <label>Birlik</label>
          <input name="unit" value="${escapeHtml(product.unit || "dona")}" maxlength="30" required>
        </div>
        <div class="field">
          <label>Qoldiq</label>
          <input name="stock" value="${escapeHtml(product.stock ?? 0)}" type="number" min="0" step="1" required>
        </div>
      </div>
      <div class="field">
        <label>Tavsif</label>
        <textarea name="description" maxlength="2000">${escapeHtml(product.description || "")}</textarea>
      </div>
      <div class="field">
        <label>Rasm URL</label>
        <textarea name="image_urls" maxlength="2048">${escapeHtml((product.image_urls || []).join("\n"))}</textarea>
      </div>
      <div class="field">
        <label>Rasm fayl</label>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp">
      </div>
      <label class="status-row">
        <input name="is_active" type="checkbox" ${product.is_active !== false ? "checked" : ""}>
        Faol
      </label>
      <button class="btn primary" type="submit">Saqlash</button>
    </form>
  `;
}

function renderStoreProduct(product) {
  const image = assetUrl(product.image_url || product.image_urls?.[0]);
  return `
    <article class="product-card">
      <div class="product-image">${image ? `<img src="${escapeHtml(image)}" alt="">` : escapeHtml(initials(product.name))}</div>
      <div class="product-card-body">
        <div class="item-head">
          <div>
            <div class="item-title">${escapeHtml(product.name)}</div>
            <div class="item-sub">${formatMoney(product.price)} so'm · ${product.stock} ${escapeHtml(product.unit)}</div>
          </div>
          <button class="btn danger" type="button" data-action="delete-product" data-product-id="${product.id}">O'chirish</button>
        </div>
        <details>
          <summary class="btn">Tahrirlash</summary>
          ${renderProductForm("update-product", product)}
        </details>
      </div>
    </article>
  `;
}

function renderAnalyticsChart(analytics) {
  const points = analytics.points || [];
  const max = Math.max(...points.map((point) => Number(point.value || 0)), 1);
  return `
    <div class="grid three">
      ${metric("Savdo", `${formatMoney(analytics.total_sales)} so'm`)}
      ${metric("Buyurtma", analytics.order_count)}
      ${metric("O'rtacha chek", `${formatMoney(analytics.average_check)} so'm`)}
    </div>
    <div class="chart" style="--bars: ${Math.max(points.length, 1)}">
      ${points.map((point) => {
        const height = Math.max(4, Math.round((Number(point.value || 0) / max) * 100));
        return `<div class="bar" title="${escapeHtml(point.label)}: ${formatMoney(point.value)}" style="height:${height}%"><span>${escapeHtml(point.label)}</span></div>`;
      }).join("")}
    </div>
  `;
}

function renderOrdersTable(orders) {
  if (!orders.length) return empty("Buyurtmalar yo'q");
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Mijoz</th>
            <th>Mahsulotlar</th>
            <th>Summa</th>
            <th>Holat</th>
            <th>Vaqt</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((order) => `
            <tr>
              <td>#${order.id}</td>
              <td>${escapeHtml(fullName(order.customer))}<div class="item-sub">${escapeHtml(order.customer?.phone || "")}</div></td>
              <td>${order.items.map((item) => `${escapeHtml(item.product_name)} x ${item.quantity}`).join("<br>")}</td>
              <td>${formatMoney(order.total_amount)} so'm<div class="item-sub">${escapeHtml(order.payment_method)}</div></td>
              <td><span class="pill ${order.status}">${escapeHtml(order.status)}</span></td>
              <td>${formatDate(order.created_at)}</td>
              <td>
                ${order.status === "pending" ? `
                  <div class="actions">
                    <button class="btn primary" type="button" data-action="order-status" data-order-id="${order.id}" data-status="confirmed">Tasdiqlash</button>
                    <button class="btn danger" type="button" data-action="order-status" data-order-id="${order.id}" data-status="cancelled">Bekor</button>
                  </div>
                ` : ""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderProfile() {
  return `
    <div class="grid two">
      <section class="panel">
        <div class="panel-header">
          <div><h3>Profil</h3><p>${escapeHtml(state.user.phone)}</p></div>
          ${avatar(state.user)}
        </div>
        <div class="panel-body stack">
          <form class="form-grid" data-action="update-profile">
            <div class="form-grid two">
              <div class="field">
                <label>Ism</label>
                <input name="first_name" value="${escapeHtml(state.user.first_name || "")}" required>
              </div>
              <div class="field">
                <label>Familya</label>
                <input name="last_name" value="${escapeHtml(state.user.last_name || "")}" required>
              </div>
              <div class="field">
                <label>Username</label>
                <input name="username" value="${escapeHtml(state.user.username || "")}" minlength="3" maxlength="32">
              </div>
              <div class="field">
                <label>Avatar URL</label>
                <input name="avatar_url" value="${escapeHtml(state.user.avatar_url || "")}">
              </div>
            </div>
            <div class="actions">
              <button class="btn primary" type="submit">Saqlash</button>
              <button class="btn" type="button" data-action="check-username">Username tekshirish</button>
            </div>
          </form>
          <form class="form-grid" data-action="upload-avatar">
            <div class="field">
              <label>Avatar fayl</label>
              <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required>
            </div>
            <button class="btn" type="submit">Yuklash</button>
          </form>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h3>API</h3></div>
        <div class="panel-body stack">
          <form class="form-grid" data-action="save-api-base">
            <div class="field">
              <label>Base URL</label>
              <input name="api_base" value="${escapeHtml(state.apiBase)}" required>
            </div>
            <button class="btn primary" type="submit">Saqlash</button>
          </form>
          <div class="actions">
            <a class="btn" href="${escapeHtml(`${state.apiBase}/privacy-policy`)}" target="_blank" rel="noreferrer">Privacy</a>
            <a class="btn" href="${escapeHtml(`${state.apiBase}/account-deletion`)}" target="_blank" rel="noreferrer">Account deletion</a>
          </div>
          <button class="btn danger" type="button" data-action="delete-account">Akkauntni o'chirish</button>
        </div>
      </section>
    </div>
  `;
}

function renderPush() {
  return `
    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><h3>Presence</h3></div>
        <div class="panel-body stack">
          <form class="form-grid" data-action="presence-check">
            <div class="field">
              <label>User ID</label>
              <input name="user_id" type="number" min="1" value="${escapeHtml(state.user.id)}">
            </div>
            <button class="btn primary" type="submit">Tekshirish</button>
          </form>
          ${state.data.presence ? `<div class="alert ok">User #${state.data.presence.user_id}: ${state.data.presence.online ? "online" : "offline"} ${state.data.presence.last_seen ? `· ${formatDate(state.data.presence.last_seen)}` : ""}</div>` : ""}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h3>Device token</h3></div>
        <div class="panel-body stack">
          <form class="form-grid" data-action="device-register">
            <div class="field">
              <label>FCM token</label>
              <input name="fcm_token" maxlength="512" required>
            </div>
            <div class="form-grid two">
              <div class="field">
                <label>Platform</label>
                <select name="platform">
                  <option value="android">android</option>
                  <option value="ios">ios</option>
                </select>
              </div>
              <div class="field">
                <label>Device ID</label>
                <input name="device_id" value="web-local" maxlength="128">
              </div>
            </div>
            <div class="actions">
              <button class="btn primary" type="submit">Register</button>
              <button class="btn danger" type="button" data-action="device-remove">Remove</button>
            </div>
          </form>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h3>Admin push</h3></div>
        <div class="panel-body">
          <form class="form-grid" data-action="admin-push-send">
            <div class="field">
              <label>Admin key</label>
              <input name="admin_key" value="${escapeHtml(state.data.adminKey)}">
            </div>
            <div class="form-grid two">
              <div class="field">
                <label>User ID</label>
                <input name="user_id" type="number" min="1">
              </div>
              <div class="field">
                <label>Delivery</label>
                <select name="delivery_mode">
                  <option value="auto">auto</option>
                  <option value="full">full</option>
                  <option value="silent">silent</option>
                  <option value="skip_if_online">skip_if_online</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Title</label>
              <input name="title" maxlength="255" required>
            </div>
            <div class="field">
              <label>Body</label>
              <textarea name="body" maxlength="1024" required></textarea>
            </div>
            <button class="btn primary" type="submit">Yuborish</button>
          </form>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h3>Push logs</h3></div>
        <div class="panel-body stack">
          <form class="form-grid" data-action="push-logs">
            <div class="field">
              <label>User ID</label>
              <input name="user_id" type="number" min="1" value="${escapeHtml(state.user.id)}">
            </div>
            <button class="btn" type="submit">Logs</button>
          </form>
          ${state.data.pushLogs ? renderPushLogs(state.data.pushLogs) : ""}
        </div>
      </section>
    </div>
  `;
}

function renderPushLogs(logs) {
  if (!logs.items?.length) return empty("Loglar yo'q");
  return `
    <div class="list">
      ${logs.items.map((item) => `
        <div class="item">
          <div class="item-head">
            <div>
              <div class="item-title">${escapeHtml(item.title)}</div>
              <div class="item-sub">${escapeHtml(item.body)}</div>
            </div>
            <span class="pill ${item.status === "failed" ? "error" : ""}">${escapeHtml(item.status)}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function withBusy(task, okMessage) {
  state.loading = true;
  render();
  try {
    await task();
    if (okMessage) notify("ok", okMessage);
  } catch (error) {
    notify("error", getErrorMessage(error));
  } finally {
    state.loading = false;
    render();
  }
}

async function handleSubmit(event) {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  event.preventDefault();
  const action = form.dataset.action;
  const values = formValues(form);

  if (action === "auth-send-otp") {
    await withBusy(async () => {
      state.authPhone = values.phone.trim();
      localStorage.setItem("voha.authPhone", state.authPhone);
      await api("/auth/send-otp", {
        method: "POST",
        auth: false,
        body: { phone: state.authPhone },
      });
      state.authStep = "otp";
    }, "OTP yuborildi");
    return;
  }

  if (action === "auth-verify-otp") {
    await withBusy(async () => {
      const response = await api("/auth/verify-otp", {
        method: "POST",
        auth: false,
        body: { phone: values.phone.trim(), otp: values.otp.trim() },
      });
      if (response.is_new) {
        state.registrationToken = response.token;
        state.authStep = "register";
        return;
      }
      storeSession(response);
      connectUserSocket();
      startHeartbeat();
      await loadForView("overview");
    }, "Kirish bajarildi");
    return;
  }

  if (action === "auth-register") {
    await withBusy(async () => {
      const response = await api("/auth/register", {
        method: "POST",
        token: state.registrationToken,
        body: {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
        },
      });
      storeSession(response);
      connectUserSocket();
      startHeartbeat();
      await loadForView("overview");
    }, "Akkaunt yaratildi");
    return;
  }

  if (action === "search-user") {
    await withBusy(async () => {
      state.data.searchUser = await api(`/users/search${encodeQuery({ phone: values.phone })}`);
    });
    return;
  }

  if (action === "create-private-chat") {
    await withBusy(async () => {
      const user = await api(`/users/search${encodeQuery({ phone: values.phone })}`);
      const chat = await api("/chats", {
        method: "POST",
        body: { user_ids: [user.id], chat_type: "private", name: null },
      });
      state.data.selectedChatId = chat.id;
      await loadForView("chats");
    }, "Chat tayyor");
    return;
  }

  if (action === "create-group-chat") {
    await withBusy(async () => {
      const ids = parseIdList(values.user_ids);
      const chat = await api("/chats", {
        method: "POST",
        body: { user_ids: ids, chat_type: "group", name: values.name.trim() },
      });
      state.data.selectedChatId = chat.id;
      await loadForView("chats");
    }, "Guruh yaratildi");
    return;
  }

  if (action === "send-message") {
    await withBusy(async () => {
      const payload = {
        text: values.text.trim(),
        message_type: values.message_type || "text",
        client_message_id: `web-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      };
      if (payload.message_type === "account") {
        payload.account_direction = values.account_direction || "expense";
        payload.account_amount = values.account_amount;
        payload.account_currency = values.account_currency || "UZS";
        payload.account_reason = values.text.trim();
      }
      const socketReady = state.wsChat?.readyState === WebSocket.OPEN
        && Number(state.wsChat.chatId) === Number(state.data.selectedChatId);
      if (socketReady) {
        state.wsChat.send(JSON.stringify({ type: "send", ...payload }));
      } else {
        const message = await api(`/chats/${state.data.selectedChatId}/messages`, {
          method: "POST",
          body: payload,
        });
        upsertById(state.data.messages, message);
      }
      form.reset();
    });
    return;
  }

  if (action === "filter-markets") {
    await withBusy(async () => {
      state.filters.latitude = values.latitude;
      state.filters.longitude = values.longitude;
      state.filters.limit = values.limit || "24";
      await loadForView("markets");
    });
    return;
  }

  if (action === "checkout") {
    await withBusy(async () => {
      const marketId = Number(form.dataset.marketId);
      const items = Object.entries(state.cart.items)
        .map(([productId, quantity]) => ({
          product_id: Number(productId),
          quantity: Number(quantity),
        }))
        .filter((item) => item.quantity > 0);
      const response = await api(`/markets/${marketId}/orders`, {
        method: "POST",
        body: {
          payment_method: values.payment_method,
          note: nullable(values.note),
          items,
        },
      });
      state.cart = { marketId: null, items: {} };
      saveJson(STORAGE.cart, state.cart);
      state.data.selectedChatId = response.chat_id;
      await loadForView("chats");
    }, "Buyurtma yuborildi");
    return;
  }

  if (action === "create-market" || action === "update-market") {
    await withBusy(async () => {
      const body = marketPayload(values, form);
      if (action === "create-market") {
        await api("/markets", { method: "POST", body });
      } else {
        await api("/markets/me", { method: "PUT", body });
      }
      await loadForView("store");
    }, "Market saqlandi");
    return;
  }

  if (action === "create-product" || action === "update-product") {
    await withBusy(async () => {
      const body = await productPayload(values, form);
      if (action === "create-product") {
        await api("/markets/me/products", { method: "POST", body });
      } else {
        await api(`/markets/me/products/${form.dataset.productId}`, {
          method: "PUT",
          body,
        });
      }
      await loadForView("store");
    }, "Mahsulot saqlandi");
    return;
  }

  if (action === "update-profile") {
    await withBusy(async () => {
      const body = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        username: nullable(values.username),
        avatar_url: nullable(values.avatar_url),
      };
      state.user = await api("/users/me", { method: "PUT", body });
      saveJson(STORAGE.user, state.user);
    }, "Profil saqlandi");
    return;
  }

  if (action === "upload-avatar") {
    await withBusy(async () => {
      const file = form.elements.avatar.files[0];
      const body = new FormData();
      body.append("avatar", file);
      state.user = await api("/users/me/avatar", { method: "POST", body });
      saveJson(STORAGE.user, state.user);
    }, "Avatar yuklandi");
    return;
  }

  if (action === "save-api-base") {
    await withBusy(async () => {
      state.apiBase = cleanBase(values.api_base);
      localStorage.setItem(STORAGE.apiBase, state.apiBase);
      await checkHealth();
      connectUserSocket();
    }, "API saqlandi");
    return;
  }

  if (action === "presence-check") {
    await withBusy(async () => {
      state.data.presence = await api(`/presence/${Number(values.user_id)}`);
    });
    return;
  }

  if (action === "device-register") {
    await withBusy(async () => {
      await api("/device/register-token", {
        method: "POST",
        body: {
          userId: state.user.id,
          fcmToken: values.fcm_token,
          platform: values.platform || "android",
          deviceId: nullable(values.device_id),
        },
      });
    }, "Device token saqlandi");
    return;
  }

  if (action === "admin-push-send") {
    await withBusy(async () => {
      state.data.adminKey = values.admin_key.trim();
      localStorage.setItem(STORAGE.adminKey, state.data.adminKey);
      await api("/push/send", {
        method: "POST",
        auth: false,
        adminKey: state.data.adminKey,
        body: {
          userId: Number(values.user_id),
          title: values.title,
          body: values.body,
          deliveryMode: values.delivery_mode || "auto",
          data: {},
        },
      });
    }, "Push navbatga qo'shildi");
    return;
  }

  if (action === "push-logs") {
    await withBusy(async () => {
      await loadPushLogs(Number(values.user_id));
    });
  }
}

function marketPayload(values, form) {
  return {
    name: values.name.trim(),
    description: nullable(values.description),
    address: nullable(values.address),
    phone: nullable(values.phone),
    latitude: optionalNumber(values.latitude),
    longitude: optionalNumber(values.longitude),
    is_active: values.is_active !== "false",
    allow_debt: checked(form, "allow_debt"),
  };
}

async function productPayload(values, form) {
  let imageUrls = parseImageList(values.image_urls);
  const file = form.elements.image?.files?.[0];
  if (file) {
    const body = new FormData();
    body.append("image", file);
    const uploaded = await api("/markets/me/product-images", { method: "POST", body });
    imageUrls = [uploaded.image_url, ...imageUrls.filter((url) => url !== uploaded.image_url)].slice(0, 5);
  }
  return {
    name: values.name.trim(),
    description: nullable(values.description),
    price: String(values.price),
    unit: values.unit.trim(),
    stock: Number(values.stock),
    image_url: imageUrls[0] || null,
    image_urls: imageUrls,
    is_active: checked(form, "is_active"),
  };
}

async function handleClick(event) {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    event.preventDefault();
    state.sidebarOpen = false;
    await loadForView(viewButton.dataset.view);
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "toggle-sidebar") {
    state.sidebarOpen = !state.sidebarOpen;
    render();
    return;
  }

  if (action === "auth-back") {
    state.authStep = "phone";
    state.registrationToken = "";
    render();
    return;
  }

  if (action === "logout") {
    await withBusy(async () => {
      if (state.refreshToken) {
        await api("/auth/logout", {
          method: "POST",
          body: { refresh_token: state.refreshToken },
        }).catch(() => null);
      }
      clearSession();
    });
    return;
  }

  if (action === "refresh-contacts") {
    await loadForView("contacts");
    return;
  }

  if (action === "refresh-chats") {
    await loadForView("chats");
    return;
  }

  if (action === "add-contact-result") {
    await addContact(Number(button.dataset.userId));
    return;
  }

  if (action === "remove-contact") {
    if (!window.confirm("Kontakt o'chirilsinmi?")) return;
    await withBusy(async () => {
      await api(`/users/contacts/${button.dataset.userId}`, { method: "DELETE" });
      await loadContacts();
    }, "Kontakt o'chirildi");
    return;
  }

  if (action === "check-presence") {
    await withBusy(async () => {
      state.data.presence = await api(`/presence/${button.dataset.userId}`);
      notify("ok", `User #${state.data.presence.user_id}: ${state.data.presence.online ? "online" : "offline"}`);
    });
    return;
  }

  if (action === "start-chat") {
    await withBusy(async () => {
      const chat = await api("/chats", {
        method: "POST",
        body: {
          user_ids: [Number(button.dataset.userId)],
          chat_type: "private",
          name: null,
        },
      });
      state.data.selectedChatId = chat.id;
      await loadForView("chats");
    }, "Chat tayyor");
    return;
  }

  if (action === "select-chat") {
    await withBusy(async () => {
      await loadChat(Number(button.dataset.chatId));
      const chat = state.data.chats.find((item) => Number(item.id) === Number(button.dataset.chatId));
      if (chat) chat.unread_count = 0;
    });
    return;
  }

  if (action === "delete-chat") {
    if (!state.data.selectedChatId || !window.confirm("Chat o'chirilsinmi?")) return;
    await withBusy(async () => {
      await api(`/chats/${state.data.selectedChatId}`, { method: "DELETE" });
      state.data.selectedChatId = null;
      state.data.chatDetail = null;
      state.data.messages = [];
      await loadForView("chats");
    }, "Chat o'chirildi");
    return;
  }

  if (action === "report-chat") {
    const details = window.prompt("Shikoyat matni", "");
    if (details === null) return;
    await withBusy(async () => {
      await api(`/chats/${state.data.selectedChatId}/reports`, {
        method: "POST",
        body: { reason: "other", details },
      });
    }, "Shikoyat yuborildi");
    return;
  }

  if (action === "edit-message") {
    const text = window.prompt("Xabar", button.dataset.text || "");
    if (text === null) return;
    await withBusy(async () => {
      const message = await api(`/messages/${button.dataset.messageId}`, {
        method: "PUT",
        body: { text },
      });
      upsertById(state.data.messages, message);
    }, "Xabar tahrirlandi");
    return;
  }

  if (action === "delete-message") {
    if (!window.confirm("Xabar o'chirilsinmi?")) return;
    await withBusy(async () => {
      const message = await api(`/messages/${button.dataset.messageId}`, {
        method: "DELETE",
      });
      upsertById(state.data.messages, message);
    }, "Xabar o'chirildi");
    return;
  }

  if (action === "use-location") {
    if (!navigator.geolocation) {
      notify("error", "Geolocation mavjud emas");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      state.filters.latitude = String(position.coords.latitude);
      state.filters.longitude = String(position.coords.longitude);
      await loadForView("markets");
    }, (error) => notify("error", error.message));
    return;
  }

  if (action === "select-market") {
    await withBusy(async () => {
      state.data.selectedMarketId = Number(button.dataset.marketId);
      await loadMarketDetail(state.data.selectedMarketId);
    });
    return;
  }

  if (action.startsWith("cart-")) {
    updateCart(action, button);
    render();
    return;
  }

  if (action === "delete-market") {
    if (!window.confirm("Market butunlay o'chirilsinmi?")) return;
    await withBusy(async () => {
      await api("/markets/me", { method: "DELETE" });
      state.data.myMarket = null;
      await loadForView("store");
    }, "Market o'chirildi");
    return;
  }

  if (action === "delete-product") {
    if (!window.confirm("Mahsulot o'chirilsinmi?")) return;
    await withBusy(async () => {
      await api(`/markets/me/products/${button.dataset.productId}`, { method: "DELETE" });
      await loadForView("store");
    }, "Mahsulot o'chirildi");
    return;
  }

  if (action === "analytics-period") {
    await withBusy(async () => {
      await loadAnalytics(button.dataset.period);
    });
    return;
  }

  if (action === "order-filter") {
    await withBusy(async () => {
      await loadOrders(button.dataset.status);
    });
    return;
  }

  if (action === "order-status") {
    await withBusy(async () => {
      await api(`/markets/me/orders/${button.dataset.orderId}`, {
        method: "PATCH",
        body: { status: button.dataset.status },
      });
      await loadOrders(state.data.orderFilter);
      await loadMyMarket();
    }, "Buyurtma yangilandi");
    return;
  }

  if (action === "check-username") {
    const input = document.querySelector("input[name='username']");
    const username = input?.value?.trim();
    if (!username) {
      notify("error", "Username kiriting");
      return;
    }
    await withBusy(async () => {
      const result = await api(`/users/username-available${encodeQuery({ username })}`);
      notify(result.available ? "ok" : "error", result.available ? "Username bo'sh" : "Username band");
    });
    return;
  }

  if (action === "delete-account") {
    if (!window.confirm("Akkaunt o'chirilsinmi?")) return;
    await withBusy(async () => {
      await api("/users/me", { method: "DELETE" });
      clearSession();
    }, "Akkaunt o'chirildi");
    return;
  }

  if (action === "device-remove") {
    const token = document.querySelector("input[name='fcm_token']")?.value?.trim();
    if (!token) {
      notify("error", "FCM token kiriting");
      return;
    }
    await withBusy(async () => {
      await api("/device/remove-token", {
        method: "DELETE",
        body: { fcmToken: token },
      });
    }, "Device token o'chirildi");
  }
}

async function addContact(userId) {
  await withBusy(async () => {
    await api("/users/contacts", {
      method: "POST",
      body: { user_id: userId },
    });
    await loadContacts();
  }, "Kontakt qo'shildi");
}

function updateCart(action, button) {
  if (action === "cart-clear") {
    state.cart = { marketId: null, items: {} };
    saveJson(STORAGE.cart, state.cart);
    return;
  }
  const marketId = Number(button.dataset.marketId);
  const productId = Number(button.dataset.productId);
  if (state.cart.marketId && Number(state.cart.marketId) !== marketId) {
    state.cart = { marketId, items: {} };
  }
  state.cart.marketId = marketId;
  const current = Number(state.cart.items[productId] || 0);
  if (action === "cart-add" || action === "cart-inc") {
    state.cart.items[productId] = current + 1;
  }
  if (action === "cart-dec") {
    const next = current - 1;
    if (next > 0) state.cart.items[productId] = next;
    else delete state.cart.items[productId];
  }
  saveJson(STORAGE.cart, state.cart);
}

async function boot() {
  render();
  await checkHealth();
  if (state.accessToken) {
    try {
      await loadMe();
      connectUserSocket();
      startHeartbeat();
      await loadForView(state.view);
      return;
    } catch {
      clearSession();
      notify("error", "Sessiya tugagan");
    }
  }
  render();
}

document.addEventListener("submit", handleSubmit);
document.addEventListener("click", handleClick);
window.addEventListener("beforeunload", closeSockets);

boot();
