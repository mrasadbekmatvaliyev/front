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
  reactions: "voha.reactions",
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
    blockStatus: null,
    chatSearchQuery: "",
    inChatSearchQuery: "",
    chatSearchOpen: false,
    chatPlusMenuOpen: false,
    activeChatModal: null,
    chatMoreMenuOpen: false,
    emojiPickerOpen: false,
    attachMenuOpen: false,
    peerPresence: {},
    reactions: readJson(STORAGE.reactions, {}),
    playingAudioId: null,
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

  const activeChat = detail || state.data.chats.find((item) => Number(item.id) === Number(chatId));
  const peer = activeChat?.peer || (detail?.participants || []).find((p) => Number(p.id) !== Number(state.user?.id));
  if (peer?.id) {
    try {
      const pres = await api(`/presence/${peer.id}`);
      state.data.peerPresence = state.data.peerPresence || {};
      state.data.peerPresence[peer.id] = pres;
    } catch {
      // ignore
    }
  }
  scrollTgMessagesToBottom();
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
      await Promise.allSettled([loadChats(), loadContacts()]);
      if (state.data.selectedChatId) {
        await loadChat(state.data.selectedChatId);
      } else if (state.data.chats.length > 0 && window.innerWidth > 760) {
        await loadChat(state.data.chats[0].id);
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
        <section class="content ${state.view === "chats" ? "chat-view-content" : ""}">
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
      <div class="stack">
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
            <div><h3>Blok boshqaruvi</h3><p>ID orqali bloklash / blokdan chiqarish</p></div>
          </div>
          <div class="panel-body stack">
            <form class="form-grid" data-action="manage-block-user">
              <div class="field">
                <label>User ID</label>
                <input name="user_id" type="number" min="1" placeholder="12" required>
              </div>
              <div class="actions">
                <button class="btn warning" type="button" data-action="unblock-user-form">Blokdan chiqarish</button>
                <button class="btn danger" type="button" data-action="block-user-form">Bloklash</button>
                <button class="btn" type="button" data-action="check-block-form">Status</button>
              </div>
            </form>
            ${state.data.blockStatus ? `<div class="alert ${state.data.blockStatus.is_blocked ? "danger" : "ok"}">User #${state.data.blockStatus.user_id}: ${state.data.blockStatus.is_blocked ? "Bloklangan" : "Bloklanmagan"}</div>` : ""}
          </div>
        </section>
      </div>
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
          <button class="btn warning" type="button" data-action="unblock-user" data-user-id="${user.id}">Blokdan chiqarish</button>
          <button class="btn danger" type="button" data-action="block-user" data-user-id="${user.id}">Bloklash</button>
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
            <div class="item-sub">${escapeHtml(contact.phone)} ${contact.username ? `@${escapeHtml(contact.username)}` : ""} · #${escapeHtml(contact.user_id)}</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn" type="button" data-action="start-chat" data-user-id="${contact.user_id}">Chat</button>
          <button class="btn warning" type="button" data-action="check-presence" data-user-id="${contact.user_id}">Status</button>
          <button class="btn warning" type="button" data-action="unblock-user" data-user-id="${contact.user_id}">Blokdan chiqarish</button>
          <button class="btn danger" type="button" data-action="block-user" data-user-id="${contact.user_id}">Bloklash</button>
          <button class="btn danger" type="button" data-action="remove-contact" data-user-id="${contact.user_id}">O'chirish</button>
        </div>
      </div>
    </div>
  `;
}

const TG_ICONS = {
  back: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
  search: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  call: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.053 15.053 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.57 3.9a1 1 0 00-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z"/></svg>`,
  more: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`,
  clip: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`,
  emoji: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`,
  mic: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`,
  send: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
  plus: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  refresh: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  doubleCheck: `<span class="tg-checks read" title="O'qildi"><svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M11.07.72a.85.85 0 0 0-1.2 0L5.34 5.25l-1.2-1.2a.85.85 0 0 0-1.2 1.2l1.8 1.8a.85.85 0 0 0 1.2 0l5.13-5.13a.85.85 0 0 0 0-1.2z" fill="currentColor"/><path d="M14.67.72a.85.85 0 0 0-1.2 0L8.94 5.25 7.74 4.05a.85.85 0 0 0-1.2 1.2l1.8 1.8a.85.85 0 0 0 1.2 0l5.13-5.13a.85.85 0 0 0 0-1.2z" fill="currentColor"/></svg></span>`,
  singleCheck: `<span class="tg-checks sent" title="Yuborildi"><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M9.87.72a.85.85 0 0 0-1.2 0L4.14 5.25l-1.2-1.2a.85.85 0 0 0-1.2 1.2l1.8 1.8a.85.85 0 0 0 1.2 0l5.13-5.13a.85.85 0 0 0 0-1.2z" fill="currentColor"/></svg></span>`,
  play: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
  pause: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
};

const TG_COLORS = [
  "#e17076", "#faa774", "#a695e7", "#7bc862",
  "#6ec9cb", "#65aadd", "#ee7aae", "#e56555",
];

function getTgColor(id) {
  const num = Number(id) || (typeof id === "string" ? id.charCodeAt(0) : 0);
  return TG_COLORS[Math.abs(num) % TG_COLORS.length];
}

function renderTgAvatar(chatOrUser, isChat = false, className = "tg-avatar") {
  const avatarImg = assetUrl(chatOrUser?.avatar_url || chatOrUser?.image_url);
  const name = isChat ? chatName(chatOrUser) : fullName(chatOrUser);
  const letter = initials(name);
  const color = getTgColor(chatOrUser?.id || name);
  return `<div class="${className}" style="background:${color};">${
    avatarImg ? `<img src="${escapeHtml(avatarImg)}" alt="">` : escapeHtml(letter)
  }</div>`;
}

function formatChatTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatChatDateBadge(value) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "Today";
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    if (date.toDateString() === y.toDateString()) return "Yesterday";
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function formatLastSeen(presence) {
  if (!presence) return "last seen 18 minutes ago";
  if (presence.online) return "online";
  if (!presence.last_seen) return "last seen 18 minutes ago";
  try {
    const then = new Date(presence.last_seen).getTime();
    const now = Date.now();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin <= 1) return "last seen just now";
    if (diffMin < 60) return `last seen ${diffMin} minutes ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `last seen ${diffHour} hours ago`;
    return `last seen ${formatDate(presence.last_seen)}`;
  } catch {
    return "last seen 18 minutes ago";
  }
}

const TG_WAVEFORM_BARS = [4, 6, 12, 16, 10, 8, 14, 18, 15, 9, 7, 13, 16, 12, 8, 14, 17, 11, 7, 10, 15, 18, 13, 8, 12, 14, 9, 6, 11, 8, 5, 4];

function renderWaveformBars(isPlaying) {
  return TG_WAVEFORM_BARS.map((height, idx) => {
    const isActive = isPlaying && idx < Math.floor(TG_WAVEFORM_BARS.length * 0.6);
    return `<div class="tg-wave-bar ${isActive ? "active" : ""}" style="height:${height}px;"></div>`;
  }).join("");
}

function renderTextWithLinks(text) {
  if (!text) return "";
  const escaped = escapeHtml(text);
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formatted = escaped.replace(urlRegex, (url) => {
    return `<a class="tg-link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
  const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
  formatted = formatted.replace(mentionRegex, (mention) => {
    return `<span class="tg-mention">${mention}</span>`;
  });
  return formatted;
}

function playVoiceMock(messageId) {
  if (state.data.playingAudioId === messageId) {
    state.data.playingAudioId = null;
    render();
    return;
  }
  state.data.playingAudioId = messageId;
  render();

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.1);
    }
  } catch {
    // AudioContext blocked
  }

  window.setTimeout(() => {
    if (state.data.playingAudioId === messageId) {
      state.data.playingAudioId = null;
      render();
    }
  }, 1400);
}

function scrollTgMessagesToBottom() {
  window.requestAnimationFrame(() => {
    const el = document.querySelector(".tg-messages-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  });
}

function toggleMessageReaction(messageId, reaction = "❤️") {
  const numId = Number(messageId);
  const current = state.data.reactions[numId] || [];
  if (current.includes(reaction)) {
    state.data.reactions[numId] = current.filter((r) => r !== reaction);
  } else {
    state.data.reactions[numId] = [...current, reaction];
  }
  saveJson(STORAGE.reactions || "voha.reactions", state.data.reactions);
  render();
}

async function cancelCall() {
  state.data.activeChatModal = null;
  render();
  if (!state.data.selectedChatId) return;
  await withBusy(async () => {
    const payload = {
      text: "Canceled call",
      message_type: "call",
      client_message_id: `web-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };
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
    scrollTgMessagesToBottom();
  });
}

async function sendVoiceMessageMock() {
  if (!state.data.selectedChatId) return;
  await withBusy(async () => {
    const payload = {
      text: "[Ovozli xabar]",
      message_type: "audio",
      client_message_id: `web-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };
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
    scrollTgMessagesToBottom();
  }, "Ovozli xabar yuborildi");
}

function loadSampleMessages() {
  const now = new Date();
  const sep12 = new Date(now.getFullYear(), 8, 12, 11, 31);
  const sep13 = new Date(now.getFullYear(), 8, 13, 12, 36);

  state.data.messages = [
    {
      id: 101,
      sender: { id: 999, first_name: "Bobur", last_name: "" },
      sender_id: 999,
      text: "M",
      message_type: "text",
      is_read: true,
      created_at: new Date(sep12.getTime()).toISOString(),
    },
    {
      id: 102,
      sender: state.user,
      sender_id: state.user?.id,
      text: "[Ovozli xabar]",
      message_type: "audio",
      is_read: true,
      created_at: new Date(sep12.getTime() + 2.5 * 3600000).toISOString(),
    },
    {
      id: 103,
      sender: state.user,
      sender_id: state.user?.id,
      text: "Canceled call",
      message_type: "call",
      is_read: true,
      created_at: new Date(sep12.getTime() + 7 * 3600000).toISOString(),
    },
    {
      id: 104,
      sender: state.user,
      sender_id: state.user?.id,
      text: "https://t.me/poemzonee",
      message_type: "text",
      is_read: true,
      created_at: new Date(sep12.getTime() + 12 * 3600000).toISOString(),
    },
    {
      id: 105,
      sender: { id: 999, first_name: "Bobur", last_name: "" },
      sender_id: 999,
      text: "@poemzonee",
      message_type: "text",
      is_read: true,
      created_at: new Date(sep13.getTime() - 10 * 3600000).toISOString(),
    },
    {
      id: 106,
      sender: state.user,
      sender_id: state.user?.id,
      text: "2",
      message_type: "text",
      is_read: true,
      created_at: new Date(sep13.getTime()).toISOString(),
    },
    {
      id: 107,
      sender: state.user,
      sender_id: state.user?.id,
      text: "33",
      message_type: "text",
      is_read: true,
      created_at: new Date(sep13.getTime() + 1000).toISOString(),
    },
  ];
  state.data.reactions[102] = ["❤️"];
  saveJson(STORAGE.reactions || "voha.reactions", state.data.reactions);
  render();
  scrollTgMessagesToBottom();
}

function renderChats() {
  const selected = state.data.selectedChatId;
  return `
    <div class="chat-layout ${selected ? "has-selected" : ""}">
      ${renderTgSidebar()}
      ${renderChatWindow()}
      ${renderTgModals()}
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

function renderTgSidebar() {
  return `
    <aside class="tg-chat-sidebar">
      <div class="tg-sidebar-header">
        <div class="tg-sidebar-title-row">
          <h3 class="tg-sidebar-title">Chatlar</h3>
          <span class="tg-sidebar-count">${state.data.chats.length}</span>
        </div>
        <div class="tg-sidebar-actions">
          <button class="tg-icon-btn" type="button" data-action="refresh-chats" title="Yangilash">
            ${TG_ICONS.refresh}
          </button>
          <button class="tg-plus-btn" type="button" data-action="toggle-chat-plus" title="Yangi chat / guruh / kontakt (+)">
            ${TG_ICONS.plus}
          </button>
        </div>
      </div>

      <div class="tg-search-bar">
        <span class="tg-search-icon">${TG_ICONS.search}</span>
        <input class="tg-search-input" type="text" placeholder="Qidiruv..." value="${escapeHtml(state.data.chatSearchQuery)}" data-action="chat-search-input">
      </div>

      ${state.data.chatPlusMenuOpen ? `
        <div class="tg-plus-menu">
          <button class="tg-menu-item" type="button" data-action="open-chat-modal" data-modal="new-private-chat">
            <span class="tg-menu-icon">💬</span>
            <div>
              <strong>Yangi shaxsiy chat</strong>
              <small>Kontakt yoki telefon raqam orqali</small>
            </div>
          </button>
          <button class="tg-menu-item" type="button" data-action="open-chat-modal" data-modal="new-group-chat">
            <span class="tg-menu-icon">👥</span>
            <div>
              <strong>Yangi guruh</strong>
              <small>Guruh nomi va a'zolar</small>
            </div>
          </button>
          <button class="tg-menu-item" type="button" data-action="open-chat-modal" data-modal="add-contact">
            <span class="tg-menu-icon">👤</span>
            <div>
              <strong>Yangi kontakt qo'shish</strong>
              <small>Telefon orqali kontakt saqlash</small>
            </div>
          </button>
          <button class="tg-menu-item" type="button" data-action="open-chat-modal" data-modal="search-user">
            <span class="tg-menu-icon">🔍</span>
            <div>
              <strong>Foydalanuvchi qidirish</strong>
              <small>Telefon raqam bo'yicha global qidiruv</small>
            </div>
          </button>
        </div>
      ` : ""}

      <div class="tg-chat-list">
        ${renderTgChatListItems()}
      </div>
    </aside>
  `;
}

function renderTgChatListItems() {
  let list = state.data.chats;
  if (state.data.chatSearchQuery.trim()) {
    const q = state.data.chatSearchQuery.toLowerCase();
    list = list.filter((c) => chatName(c).toLowerCase().includes(q) || (c.last_message?.text || "").toLowerCase().includes(q));
  }
  if (!list.length) {
    return `
      <div class="tg-chat-empty-state">
        <div class="tg-chat-empty-pill">Chatlar topilmadi</div>
        <button class="btn primary" type="button" data-action="toggle-chat-plus" style="margin-top:6px;">+ Chat yaratish</button>
      </div>
    `;
  }
  return list.map(renderTgChatListItem).join("");
}

function renderTgChatListItem(chat) {
  const active = Number(chat.id) === Number(state.data.selectedChatId);
  const peer = chat.peer || (chat.participants || []).find((p) => Number(p.id) !== Number(state.user?.id));
  const isOnline = Boolean(peer && state.data.peerPresence[peer.id]?.online);

  let lastText = chat.last_message?.text || "Xabar yo'q";
  if (chat.last_message?.message_type === "audio") lastText = "🎤 Ovozli xabar";
  else if (chat.last_message?.message_type === "call" || lastText === "Canceled call") lastText = "📞 Canceled call";
  else if (chat.last_message?.message_type === "account") lastText = "💳 Hisob tranzaksiyasi";
  else if (chat.last_message?.market_order) lastText = "🛒 Market buyurtmasi";

  const isMine = Number(chat.last_message?.sender?.id || chat.last_message?.sender_id) === Number(state.user?.id);
  const timeText = chat.last_message?.created_at ? formatChatTime(chat.last_message.created_at) : "";

  return `
    <button class="tg-chat-item ${active ? "active" : ""}" type="button" data-action="select-chat" data-chat-id="${chat.id}">
      <div style="position:relative;">
        ${renderTgAvatar(chat, true)}
        ${isOnline ? `<span class="tg-online-badge"></span>` : ""}
      </div>
      <div class="tg-chat-info">
        <div class="tg-chat-title">${escapeHtml(chatName(chat))}</div>
        <div class="tg-chat-preview">${isMine ? "<span style='color:#64b5f6;'>Siz: </span>" : ""}${escapeHtml(lastText)}</div>
      </div>
      <div class="tg-chat-meta">
        <span class="tg-chat-time">${escapeHtml(timeText)}</span>
        ${chat.unread_count ? `<span class="tg-unread-badge">${chat.unread_count}</span>` : ""}
      </div>
    </button>
  `;
}

function renderChatWindow() {
  const selected = state.data.selectedChatId;
  if (!selected) {
    return `
      <section class="tg-chat-window">
        <div class="tg-chat-empty-state">
          <div style="font-size:48px;">💬</div>
          <div class="tg-chat-empty-pill">Suhbatni tanlang yoki yangi chat oching</div>
          <button class="btn primary" type="button" data-action="toggle-chat-plus" style="margin-top:8px;">+ Yangi chat yaratish</button>
        </div>
      </section>
    `;
  }

  const detail = state.data.chatDetail;
  const activeChat = detail || state.data.chats.find((item) => Number(item.id) === Number(selected));
  const isPrivate = activeChat?.chat_type === "private";
  const peer = activeChat?.peer || (detail?.participants || []).find((p) => Number(p.id) !== Number(state.user?.id));
  const peerUserId = peer?.id;
  const presence = peerUserId ? state.data.peerPresence[peerUserId] : null;
  const isOnline = Boolean(presence?.online);
  const statusText = isPrivate ? formatLastSeen(presence) : `${detail?.participants?.length || 2} ta a'zo`;

  return `
    <section class="tg-chat-window">
      <header class="tg-chat-header">
        <div class="tg-header-left">
          <button class="tg-back-btn" type="button" data-action="back-to-chat-list" title="Orqaga">
            ${TG_ICONS.back}
          </button>
          <div class="tg-header-user" data-action="open-chat-modal" data-modal="user-info">
            <div style="position:relative;">
              ${renderTgAvatar(activeChat, true)}
              ${isOnline ? `<span class="tg-online-badge"></span>` : ""}
            </div>
            <div class="tg-header-info">
              <div class="tg-header-name">${escapeHtml(chatName(activeChat))}</div>
              <div class="tg-header-status ${isOnline ? "online" : ""}">${escapeHtml(statusText)}</div>
            </div>
          </div>
        </div>

        <div class="tg-header-right">
          <button class="tg-icon-btn ${state.data.chatSearchOpen ? "active" : ""}" type="button" data-action="toggle-chat-search" title="Qidirish">
            ${TG_ICONS.search}
          </button>
          <button class="tg-icon-btn" type="button" data-action="start-call" title="Qo'ng'iroq">
            ${TG_ICONS.call}
          </button>
          <button class="tg-icon-btn" type="button" data-action="toggle-chat-more" title="Batafsil">
            ${TG_ICONS.more}
          </button>
          <div class="tg-window-controls">
            <span>_</span>
            <span>□</span>
            <span>✕</span>
          </div>
        </div>

        ${state.data.chatMoreMenuOpen ? renderChatMoreDropdown(activeChat, peer) : ""}
      </header>

      ${state.data.chatSearchOpen ? `
        <div class="tg-inchat-search-bar">
          <span style="color:#708499;display:grid;place-items:center;">${TG_ICONS.search}</span>
          <input type="text" placeholder="Xabarlar orasidan qidirish..." value="${escapeHtml(state.data.inChatSearchQuery)}" data-action="inchat-search-input">
          <button class="tg-icon-btn" type="button" data-action="clear-inchat-search" style="width:28px;height:28px;">✕</button>
        </div>
      ` : ""}

      <div class="tg-messages-scroll">
        ${renderTgMessagesInner()}
      </div>

      <form class="tg-composer" data-action="send-tg-message">
        <button class="tg-icon-btn" type="button" data-action="toggle-attach-menu" title="Biriktirish">
          ${TG_ICONS.clip}
        </button>

        ${state.data.attachMenuOpen ? renderAttachDropdown() : ""}

        <div class="tg-composer-input-wrap">
          <textarea
            id="tg-message-input"
            name="text"
            rows="1"
            placeholder="Write a message..."
            autocomplete="off"
          ></textarea>
        </div>

        <button class="tg-icon-btn" type="button" data-action="toggle-emoji-picker" title="Emoji">
          ${TG_ICONS.emoji}
        </button>

        ${state.data.emojiPickerOpen ? renderEmojiPicker() : ""}

        <button class="tg-icon-btn" type="submit" id="tg-send-btn" title="Ovozli xabar">
          ${TG_ICONS.mic}
        </button>
      </form>
    </section>
  `;
}

function renderChatMoreDropdown(activeChat, peer) {
  const peerId = peer?.id;
  return `
    <div class="tg-header-dropdown">
      <button class="tg-menu-item" type="button" data-action="open-chat-modal" data-modal="user-info">
        <span class="tg-menu-icon">👤</span>
        <div><strong>Ma'lumotlar</strong><small>Foydalanuvchi profili</small></div>
      </button>
      ${peerId ? `
        <button class="tg-menu-item" type="button" data-action="unblock-user" data-user-id="${peerId}">
          <span class="tg-menu-icon">🔓</span>
          <div><strong>Blokdan chiqarish</strong></div>
        </button>
        <button class="tg-menu-item" type="button" data-action="block-user" data-user-id="${peerId}">
          <span class="tg-menu-icon">🚫</span>
          <div><strong>Bloklash</strong></div>
        </button>
      ` : ""}
      <button class="tg-menu-item" type="button" data-action="report-chat">
        <span class="tg-menu-icon">⚠️</span>
        <div><strong>Shikoyat qilish</strong></div>
      </button>
      <button class="tg-menu-item" type="button" data-action="delete-chat" style="color:#ff595a;">
        <span class="tg-menu-icon" style="color:#ff595a;">🗑</span>
        <div><strong style="color:#ff595a;">Chatni o'chirish</strong></div>
      </button>
    </div>
  `;
}

function renderTgMessagesInner() {
  let messages = [...state.data.messages].sort((a, b) => Number(a.id) - Number(b.id));

  if (state.data.inChatSearchQuery.trim()) {
    const q = state.data.inChatSearchQuery.toLowerCase();
    messages = messages.filter((m) => (m.text || "").toLowerCase().includes(q));
  }

  if (messages.length === 0) {
    return `
      <div class="tg-chat-empty-state">
        <div class="tg-chat-empty-pill">Bu chatda hozircha xabarlar yo'q</div>
        <button class="btn" type="button" data-action="load-sample-messages" style="margin-top:6px;">📸 Namuna xabarlarni ko'rish</button>
      </div>
    `;
  }

  let lastDateBadge = "";
  const htmlParts = [];

  for (const message of messages) {
    const badge = formatChatDateBadge(message.created_at);
    if (badge && badge !== lastDateBadge) {
      lastDateBadge = badge;
      htmlParts.push(`<div class="tg-date-badge"><span>${escapeHtml(badge)}</span></div>`);
    }
    htmlParts.push(renderTgMessageItem(message));
  }

  return htmlParts.join("");
}

function renderTgMessageItem(message) {
  const senderId = message.sender?.id || message.sender_id;
  const mine = Number(senderId) === Number(state.user?.id);
  const deleted = message.is_deleted;
  const isCall = message.message_type === "call" || message.text === "Canceled call" || (message.text && message.text.toLowerCase().includes("canceled call"));
  const isAudio = message.message_type === "audio" || message.message_type === "voice" || (message.text && message.text.startsWith("[Ovozli"));
  const isPlaying = state.data.playingAudioId === message.id;
  const numId = Number(message.id);
  const reactions = state.data.reactions[numId] || (isAudio ? ["❤️"] : []);
  const showHeartBadge = reactions.includes("❤️") || isAudio;

  return `
    <div class="tg-msg-row ${mine ? "outgoing" : "incoming"} ${deleted ? "deleted" : ""}" id="msg-${message.id}">
      <div class="tg-quick-actions">
        <button class="tg-quick-btn" type="button" data-action="quick-react" data-message-id="${message.id}" data-reaction="❤️" title="Yurakcha">❤️</button>
        <button class="tg-quick-btn" type="button" data-action="quick-react" data-message-id="${message.id}" data-reaction="👍" title="Layk">👍</button>
        <button class="tg-quick-btn" type="button" data-action="quick-react" data-message-id="${message.id}" data-reaction="🔥" title="Olov">🔥</button>
        ${mine && !deleted ? `<button class="tg-quick-btn" type="button" data-action="edit-message" data-message-id="${message.id}" data-text="${escapeHtml(message.text)}" title="Tahrirlash">✏️</button>` : ""}
        ${mine && !deleted ? `<button class="tg-quick-btn" type="button" data-action="delete-message" data-message-id="${message.id}" title="O'chirish">🗑</button>` : ""}
      </div>
      <div class="tg-bubble">
        ${!mine && message.sender && state.data.chatDetail?.chat_type === "group" ? `<div class="tg-msg-sender">${escapeHtml(fullName(message.sender))}</div>` : ""}

        ${isAudio ? renderTgAudioContent(message, mine, isPlaying) : ""}
        ${isCall ? renderTgCallContent(message, mine) : ""}
        ${!isAudio && !isCall && message.message_type === "account" ? renderTgAccountContent(message) : ""}
        ${!isAudio && !isCall && message.market_order ? renderOrderMessage(message.market_order) : ""}
        ${!isAudio && !isCall && message.message_type !== "account" && !message.market_order ? `
          <div class="tg-msg-text">${renderTextWithLinks(message.text)}</div>
          <span class="tg-bubble-meta">
            ${message.is_edited ? "<span style='font-size:10px;opacity:0.8;'>tahrirlangan</span> " : ""}
            <span>${formatChatTime(message.created_at)}</span>
            ${mine ? (message.is_read ? TG_ICONS.doubleCheck : TG_ICONS.singleCheck) : ""}
          </span>
        ` : ""}

        ${showHeartBadge ? `
          <div class="tg-reaction-badge" data-action="toggle-reaction" data-message-id="${message.id}" data-reaction="❤️" title="Reaksiya: ❤️">
            ❤️
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function renderTgAudioContent(message, mine, isPlaying) {
  return `
    <div class="tg-audio-bubble">
      <button class="tg-play-btn" type="button" data-action="play-voice" data-message-id="${message.id}" title="${isPlaying ? "To'xtatish" : "Eshitish"}">
        ${isPlaying ? TG_ICONS.pause : TG_ICONS.play}
      </button>
      <div class="tg-audio-content">
        <div class="tg-waveform" data-action="play-voice" data-message-id="${message.id}">
          ${renderWaveformBars(isPlaying)}
        </div>
        <div class="tg-audio-sub">
          <span>00:01, 4.6 KB</span>
          <span class="tg-bubble-meta">
            <span>${formatChatTime(message.created_at)}</span>
            ${mine ? (message.is_read ? TG_ICONS.doubleCheck : TG_ICONS.singleCheck) : ""}
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderTgCallContent(message, mine) {
  return `
    <div class="tg-call-bubble">
      <div>
        <div class="tg-call-title">Canceled call</div>
        <div class="tg-call-sub">
          <span class="tg-call-arrow">↙</span>
          <span>${formatChatTime(message.created_at)}</span>
        </div>
      </div>
      <div class="tg-call-icon">
        ${TG_ICONS.call}
      </div>
    </div>
  `;
}

function renderTgAccountContent(message) {
  const isIncome = message.account_direction === "income";
  return `
    <div class="tg-account-card">
      <div class="tg-account-head">${isIncome ? "⬇ Kirim" : "⬆ Chiqim"}</div>
      <div class="tg-account-amount">${formatMoney(message.account_amount)} ${escapeHtml(message.account_currency || "UZS")}</div>
      ${message.account_reason ? `<div class="tg-account-reason">${escapeHtml(message.account_reason)}</div>` : ""}
      <div style="text-align:right;">
        <span class="tg-bubble-meta">
          <span>${formatChatTime(message.created_at)}</span>
        </span>
      </div>
    </div>
  `;
}

const TG_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😋", "😛", "😜",
  "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞",
  "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢",
  "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱",
  "👍", "👎", "👏", "🙌", "🤝", "👊", "✊", "✌️", "🤞", "🤟",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "🔥",
  "🎉", "✨", "⚡", "💥", "💯", "🚀", "⭐", "🌟", "🙏", "💪"
];

function renderEmojiPicker() {
  return `
    <div class="tg-emoji-picker">
      ${TG_EMOJIS.map((emoji) => `
        <button class="tg-emoji-btn" type="button" data-action="insert-emoji" data-emoji="${emoji}">${emoji}</button>
      `).join("")}
    </div>
  `;
}

function renderAttachDropdown() {
  return `
    <div class="tg-attach-menu">
      <button class="tg-menu-item" type="button" data-action="send-voice-message">
        <span class="tg-menu-icon">🎤</span>
        <div>
          <strong>Ovozli xabar</strong>
          <small>To'lqinli audio yuborish</small>
        </div>
      </button>
      <button class="tg-menu-item" type="button" data-action="open-chat-modal" data-modal="attach-account">
        <span class="tg-menu-icon">💳</span>
        <div>
          <strong>Hisob / Tranzaksiya</strong>
          <small>Kirim yoki Chiqim</small>
        </div>
      </button>
      <button class="tg-menu-item" type="button" data-action="start-call">
        <span class="tg-menu-icon">📞</span>
        <div>
          <strong>Ovozli qo'ng'iroq</strong>
          <small>Qo'ng'iroq qilish</small>
        </div>
      </button>
    </div>
  `;
}

function renderTgModals() {
  const modal = state.data.activeChatModal;
  if (!modal) return "";

  if (modal === "new-private-chat") return renderNewPrivateChatModal();
  if (modal === "new-group-chat") return renderNewGroupChatModal();
  if (modal === "add-contact") return renderAddContactModal();
  if (modal === "search-user") return renderSearchUserModal();
  if (modal === "call") return renderCallModal();
  if (modal === "user-info") return renderUserInfoModal();
  if (modal === "attach-account") return renderAttachAccountModal();
  return "";
}

function renderNewPrivateChatModal() {
  return `
    <div class="tg-modal-backdrop" data-action="close-chat-modal">
      <div class="tg-modal" onclick="event.stopPropagation()">
        <div class="tg-modal-header">
          <h3>💬 Yangi shaxsiy chat</h3>
          <button class="tg-icon-btn" type="button" data-action="close-chat-modal">✕</button>
        </div>
        <div class="tg-modal-body">
          <form class="tg-input-field" data-action="create-private-chat">
            <label>Telefon raqam orqali boshlash</label>
            <div style="display:flex;gap:8px;">
              <input name="phone" placeholder="+998901234567" autocomplete="tel" required style="flex:1;">
              <button class="btn primary" type="submit">Boshlash</button>
            </div>
          </form>

          <div>
            <label style="font-size:13px;color:#708499;font-weight:600;display:block;margin-bottom:8px;">Kontaktlarimdan tanlash (${state.data.contacts.length})</label>
            <div style="max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
              ${state.data.contacts.map((c) => `
                <div class="tg-menu-item" style="justify-content:space-between;border:1px solid #242f3d;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    ${renderTgAvatar(c)}
                    <div>
                      <strong>${escapeHtml(`${c.first_name} ${c.last_name}`)}</strong>
                      <small>${escapeHtml(c.phone)}</small>
                    </div>
                  </div>
                  <button class="btn primary" type="button" data-action="start-chat-with-contact" data-user-id="${c.user_id}">Chat</button>
                </div>
              `).join("") || empty("Kontaktlar mavjud emas")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNewGroupChatModal() {
  return `
    <div class="tg-modal-backdrop" data-action="close-chat-modal">
      <div class="tg-modal" onclick="event.stopPropagation()">
        <div class="tg-modal-header">
          <h3>👥 Yangi guruh yaratish</h3>
          <button class="tg-icon-btn" type="button" data-action="close-chat-modal">✕</button>
        </div>
        <div class="tg-modal-body">
          <form class="stack" data-action="create-group-chat">
            <div class="tg-input-field">
              <label>Guruh nomi</label>
              <input name="name" maxlength="100" placeholder="Masalan: Jamoa / Do'stlar" required>
            </div>

            <div>
              <label style="font-size:13px;color:#708499;font-weight:600;display:block;margin-bottom:8px;">A'zolarni tanlang (${state.data.contacts.length} ta kontakt)</label>
              <div style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
                ${state.data.contacts.map((c) => `
                  <label class="tg-menu-item" style="cursor:pointer;border:1px solid #242f3d;">
                    <input type="checkbox" name="group_contact_id" value="${c.user_id}" style="width:18px;height:18px;accent-color:#5288c1;margin-right:6px;">
                    ${renderTgAvatar(c)}
                    <div>
                      <strong>${escapeHtml(`${c.first_name} ${c.last_name}`)}</strong>
                      <small>${escapeHtml(c.phone)} · #${c.user_id}</small>
                    </div>
                  </label>
                `).join("") || empty("Kontaktlar mavjud emas")}
              </div>
            </div>

            <div class="tg-input-field">
              <label>Qo'shimcha User ID lar (vergul bilan)</label>
              <input name="user_ids" placeholder="12, 18, 24">
            </div>

            <button class="btn primary" type="submit" style="width:100%;margin-top:8px;">Guruh yaratish</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderAddContactModal() {
  return `
    <div class="tg-modal-backdrop" data-action="close-chat-modal">
      <div class="tg-modal" onclick="event.stopPropagation()">
        <div class="tg-modal-header">
          <h3>👤 Yangi kontakt qo'shish</h3>
          <button class="tg-icon-btn" type="button" data-action="close-chat-modal">✕</button>
        </div>
        <div class="tg-modal-body">
          <form class="tg-input-field" data-action="search-contact-to-add">
            <label>Telefon raqam bo'yicha topish</label>
            <div style="display:flex;gap:8px;">
              <input name="phone" placeholder="+998901234567" required style="flex:1;">
              <button class="btn primary" type="submit">Qidirish</button>
            </div>
          </form>

          ${state.data.searchUser ? `
            <div class="tg-menu-item" style="justify-content:space-between;border:1px solid #5288c1;padding:12px;">
              <div style="display:flex;align-items:center;gap:12px;">
                ${renderTgAvatar(state.data.searchUser)}
                <div>
                  <strong>${escapeHtml(fullName(state.data.searchUser))}</strong>
                  <small>@${escapeHtml(state.data.searchUser.username || "username yo'q")} · #${state.data.searchUser.id}</small>
                </div>
              </div>
              <button class="btn primary" type="button" data-action="confirm-add-contact" data-user-id="${state.data.searchUser.id}">Qo'shish</button>
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderSearchUserModal() {
  return `
    <div class="tg-modal-backdrop" data-action="close-chat-modal">
      <div class="tg-modal" onclick="event.stopPropagation()">
        <div class="tg-modal-header">
          <h3>🔍 Foydalanuvchini qidirish</h3>
          <button class="tg-icon-btn" type="button" data-action="close-chat-modal">✕</button>
        </div>
        <div class="tg-modal-body">
          <form class="tg-input-field" data-action="search-user-modal-form">
            <label>Telefon raqami</label>
            <div style="display:flex;gap:8px;">
              <input name="phone" placeholder="+998901234567" required style="flex:1;">
              <button class="btn primary" type="submit">Qidirish</button>
            </div>
          </form>

          ${state.data.searchUser ? `
            <div class="tg-menu-item" style="flex-direction:column;align-items:stretch;border:1px solid #242f3d;padding:14px;gap:12px;">
              <div style="display:flex;align-items:center;gap:12px;">
                ${renderTgAvatar(state.data.searchUser)}
                <div>
                  <strong style="font-size:16px;">${escapeHtml(fullName(state.data.searchUser))}</strong>
                  <small>@${escapeHtml(state.data.searchUser.username || "username yo'q")} · #${state.data.searchUser.id}</small>
                </div>
              </div>
              <div class="actions" style="display:flex;gap:8px;">
                <button class="btn primary" type="button" data-action="start-chat" data-user-id="${state.data.searchUser.id}">Chat</button>
                <button class="btn" type="button" data-action="add-contact-result" data-user-id="${state.data.searchUser.id}">Kontaktlarga qo'shish</button>
              </div>
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderCallModal() {
  const detail = state.data.chatDetail;
  const activeChat = detail || state.data.chats.find((item) => Number(item.id) === Number(state.data.selectedChatId));
  const peer = activeChat?.peer || (detail?.participants || []).find((p) => Number(p.id) !== Number(state.user?.id));
  const name = activeChat ? chatName(activeChat) : "Bobur";
  const avatarLetter = initials(name);

  return `
    <div class="tg-modal-backdrop" data-action="close-chat-modal">
      <div class="tg-modal" onclick="event.stopPropagation()">
        <div class="tg-call-modal">
          <div class="tg-call-avatar-pulse">
            ${avatarLetter}
          </div>
          <h3 style="margin:8px 0 0;font-size:22px;color:#fff;">${escapeHtml(name)}</h3>
          <p style="margin:0;color:#708499;font-size:14px;">Chaqirilmoqda...</p>
          <button class="tg-call-cancel-btn" type="button" data-action="cancel-call" title="Bekor qilish">
            ${TG_ICONS.call}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderUserInfoModal() {
  const detail = state.data.chatDetail;
  const activeChat = detail || state.data.chats.find((item) => Number(item.id) === Number(state.data.selectedChatId));
  const peer = activeChat?.peer || (detail?.participants || []).find((p) => Number(p.id) !== Number(state.user?.id));
  const name = activeChat ? chatName(activeChat) : "Foydalanuvchi";
  const presence = peer ? state.data.peerPresence[peer.id] : null;

  return `
    <div class="tg-modal-backdrop" data-action="close-chat-modal">
      <div class="tg-modal" onclick="event.stopPropagation()">
        <div class="tg-modal-header">
          <h3>Foydalanuvchi ma'lumotlari</h3>
          <button class="tg-icon-btn" type="button" data-action="close-chat-modal">✕</button>
        </div>
        <div class="tg-modal-body" style="align-items:center;text-align:center;">
          ${renderTgAvatar(peer || activeChat, false, "tg-call-avatar-pulse")}
          <h3 style="margin:8px 0 0;font-size:20px;color:#fff;">${escapeHtml(name)}</h3>
          <p style="margin:0;color:#708499;font-size:13.5px;">${escapeHtml(formatLastSeen(presence))}</p>

          <div style="width:100%;margin-top:14px;background:#242f3d;border-radius:12px;padding:12px;text-align:left;display:flex;flex-direction:column;gap:8px;">
            ${peer?.phone ? `<div><small style="color:#708499;">Telefon</small><div style="font-weight:600;">${escapeHtml(peer.phone)}</div></div>` : ""}
            ${peer?.username ? `<div><small style="color:#708499;">Username</small><div style="font-weight:600;">@${escapeHtml(peer.username)}</div></div>` : ""}
            ${peer?.id ? `<div><small style="color:#708499;">User ID</small><div style="font-weight:600;">#${peer.id}</div></div>` : ""}
          </div>

          <div style="display:flex;gap:8px;width:100%;margin-top:12px;">
            ${peer?.id ? `
              <button class="btn warning" type="button" data-action="unblock-user" data-user-id="${peer.id}" style="flex:1;">Blokdan chiqarish</button>
              <button class="btn danger" type="button" data-action="block-user" data-user-id="${peer.id}" style="flex:1;">Bloklash</button>
            ` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAttachAccountModal() {
  return `
    <div class="tg-modal-backdrop" data-action="close-chat-modal">
      <div class="tg-modal" onclick="event.stopPropagation()">
        <div class="tg-modal-header">
          <h3>💳 Hisob / Tranzaksiya yuborish</h3>
          <button class="tg-icon-btn" type="button" data-action="close-chat-modal">✕</button>
        </div>
        <div class="tg-modal-body">
          <form class="stack" data-action="send-account-message-form">
            <div class="tg-input-field">
              <label>Yo'nalish</label>
              <select name="account_direction">
                <option value="expense">Chiqim</option>
                <option value="income">Kirim</option>
              </select>
            </div>
            <div class="tg-input-field">
              <label>Summa</label>
              <input name="account_amount" type="number" min="0" step="0.01" placeholder="Masalan: 50000" required>
            </div>
            <div class="tg-input-field">
              <label>Valyuta</label>
              <select name="account_currency">
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div class="tg-input-field">
              <label>Izoh</label>
              <input name="text" placeholder="Masalan: Tushlik to'lovi" required>
            </div>
            <button class="btn primary" type="submit" style="width:100%;margin-top:8px;">Yuborish</button>
          </form>
        </div>
      </div>
    </div>
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

  if (action === "manage-block-user") {
    const userId = Number(values.user_id);
    if (!userId) {
      notify("error", "User ID kiriting");
      return;
    }
    await unblockUser(userId);
    return;
  }

  if (action === "create-private-chat") {
    await withBusy(async () => {
      state.data.activeChatModal = null;
      state.data.chatPlusMenuOpen = false;
      const user = await api(`/users/search${encodeQuery({ phone: values.phone.trim() })}`);
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
      state.data.activeChatModal = null;
      state.data.chatPlusMenuOpen = false;
      const checkedInputs = Array.from(form.querySelectorAll('input[name="group_contact_id"]:checked'));
      const checkedIds = checkedInputs.map((input) => Number(input.value)).filter((id) => Number.isInteger(id) && id > 0);
      const typedIds = parseIdList(values.user_ids);
      const allIds = Array.from(new Set([...checkedIds, ...typedIds]));
      if (!allIds.length) {
        throw new Error("Kamida bitta ishtirokchi tanlang");
      }
      const chat = await api("/chats", {
        method: "POST",
        body: { user_ids: allIds, chat_type: "group", name: values.name.trim() },
      });
      state.data.selectedChatId = chat.id;
      await loadForView("chats");
    }, "Guruh yaratildi");
    return;
  }

  if (action === "search-contact-to-add") {
    await withBusy(async () => {
      state.data.searchUser = await api(`/users/search${encodeQuery({ phone: values.phone.trim() })}`);
      render();
    });
    return;
  }

  if (action === "search-user-modal-form") {
    await withBusy(async () => {
      state.data.searchUser = await api(`/users/search${encodeQuery({ phone: values.phone.trim() })}`);
      render();
    });
    return;
  }

  if (action === "send-account-message-form") {
    await withBusy(async () => {
      state.data.activeChatModal = null;
      const payload = {
        text: values.text.trim(),
        message_type: "account",
        account_direction: values.account_direction || "expense",
        account_amount: values.account_amount,
        account_currency: values.account_currency || "UZS",
        account_reason: values.text.trim(),
        client_message_id: `web-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      };
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
      scrollTgMessagesToBottom();
    });
    return;
  }

  if (action === "send-message" || action === "send-tg-message") {
    const textVal = values.text?.trim() || "";
    if (!textVal && !values.message_type) {
      await sendVoiceMessageMock();
      return;
    }
    await withBusy(async () => {
      const payload = {
        text: textVal,
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
      const sendBtn = document.getElementById("tg-send-btn");
      if (sendBtn) {
        sendBtn.innerHTML = TG_ICONS.mic;
        sendBtn.setAttribute("title", "Ovozli xabar");
      }
      scrollTgMessagesToBottom();
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

  if (action === "toggle-chat-plus") {
    state.data.chatPlusMenuOpen = !state.data.chatPlusMenuOpen;
    render();
    return;
  }

  if (action === "open-chat-modal") {
    state.data.activeChatModal = button.dataset.modal;
    state.data.chatPlusMenuOpen = false;
    state.data.chatMoreMenuOpen = false;
    state.data.attachMenuOpen = false;
    state.data.emojiPickerOpen = false;
    render();
    return;
  }

  if (action === "close-chat-modal") {
    state.data.activeChatModal = null;
    render();
    return;
  }

  if (action === "toggle-chat-more") {
    state.data.chatMoreMenuOpen = !state.data.chatMoreMenuOpen;
    render();
    return;
  }

  if (action === "toggle-chat-search") {
    state.data.chatSearchOpen = !state.data.chatSearchOpen;
    if (!state.data.chatSearchOpen) {
      state.data.inChatSearchQuery = "";
    }
    render();
    return;
  }

  if (action === "clear-inchat-search") {
    state.data.inChatSearchQuery = "";
    const scroll = document.querySelector(".tg-messages-scroll");
    if (scroll) scroll.innerHTML = renderTgMessagesInner();
    return;
  }

  if (action === "toggle-emoji-picker") {
    state.data.emojiPickerOpen = !state.data.emojiPickerOpen;
    render();
    return;
  }

  if (action === "insert-emoji") {
    const input = document.getElementById("tg-message-input");
    if (input) {
      input.value += button.dataset.emoji;
      input.focus();
      const sendBtn = document.getElementById("tg-send-btn");
      if (sendBtn) {
        sendBtn.innerHTML = TG_ICONS.send;
        sendBtn.setAttribute("title", "Yuborish");
      }
    }
    return;
  }

  if (action === "toggle-attach-menu") {
    state.data.attachMenuOpen = !state.data.attachMenuOpen;
    render();
    return;
  }

  if (action === "play-voice") {
    playVoiceMock(Number(button.dataset.messageId));
    return;
  }

  if (action === "toggle-reaction" || action === "quick-react") {
    toggleMessageReaction(button.dataset.messageId, button.dataset.reaction || "❤️");
    return;
  }

  if (action === "start-call") {
    state.data.activeChatModal = "call";
    state.data.attachMenuOpen = false;
    render();
    return;
  }

  if (action === "cancel-call") {
    await cancelCall();
    return;
  }

  if (action === "send-voice-message") {
    state.data.attachMenuOpen = false;
    await sendVoiceMessageMock();
    return;
  }

  if (action === "back-to-chat-list") {
    state.data.selectedChatId = null;
    render();
    return;
  }

  if (action === "start-chat-with-contact") {
    state.data.activeChatModal = null;
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

  if (action === "load-sample-messages") {
    loadSampleMessages();
    return;
  }

  if (action === "confirm-add-contact") {
    await addContact(Number(button.dataset.userId));
    state.data.activeChatModal = null;
    render();
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

  if (action === "unblock-user") {
    await unblockUser(Number(button.dataset.userId));
    return;
  }

  if (action === "block-user") {
    await blockUser(Number(button.dataset.userId));
    return;
  }

  if (action === "unblock-user-form") {
    const form = button.closest("form");
    const userId = Number(form?.elements?.user_id?.value?.trim());
    if (!userId) {
      notify("error", "User ID kiriting");
      return;
    }
    await unblockUser(userId);
    return;
  }

  if (action === "block-user-form") {
    const form = button.closest("form");
    const userId = Number(form?.elements?.user_id?.value?.trim());
    if (!userId) {
      notify("error", "User ID kiriting");
      return;
    }
    await blockUser(userId);
    return;
  }

  if (action === "check-block-form") {
    const form = button.closest("form");
    const userId = Number(form?.elements?.user_id?.value?.trim());
    if (!userId) {
      notify("error", "User ID kiriting");
      return;
    }
    await checkBlockStatus(userId);
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

async function unblockUser(userId) {
  if (!userId) return;
  await withBusy(async () => {
    await api(`/users/${userId}/block`, { method: "DELETE" });
    if (state.data.blockStatus && Number(state.data.blockStatus.user_id) === Number(userId)) {
      state.data.blockStatus.is_blocked = false;
    }
  }, `User #${userId} blokdan chiqarildi`);
}

async function blockUser(userId) {
  if (!userId) return;
  if (!window.confirm(`User #${userId} bloklansinmi?`)) return;
  await withBusy(async () => {
    await api(`/users/${userId}/block`, { method: "POST" });
    if (state.data.blockStatus && Number(state.data.blockStatus.user_id) === Number(userId)) {
      state.data.blockStatus.is_blocked = true;
    }
    if (state.data.selectedChatId) {
      const activeChat = state.data.chatDetail || state.data.chats.find((c) => Number(c.id) === Number(state.data.selectedChatId));
      const peer = activeChat?.peer || (state.data.chatDetail?.participants || []).find((p) => Number(p.id) !== Number(state.user?.id));
      if (peer && Number(peer.id) === Number(userId)) {
        state.data.selectedChatId = null;
        state.data.chatDetail = null;
        state.data.messages = [];
        await loadChats();
      }
    }
  }, `User #${userId} bloklandi`);
}

async function checkBlockStatus(userId) {
  if (!userId) return;
  await withBusy(async () => {
    const result = await api(`/users/${userId}/block`);
    state.data.blockStatus = { user_id: userId, is_blocked: Boolean(result?.is_blocked) };
    notify(result?.is_blocked ? "warning" : "ok", `User #${userId}: ${result?.is_blocked ? "Bloklangan" : "Bloklanmagan"}`);
  });
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

document.addEventListener("click", (e) => {
  if (state.data.chatPlusMenuOpen && !e.target.closest(".tg-plus-menu") && !e.target.closest("[data-action='toggle-chat-plus']")) {
    state.data.chatPlusMenuOpen = false;
    render();
  }
  if (state.data.chatMoreMenuOpen && !e.target.closest(".tg-header-dropdown") && !e.target.closest("[data-action='toggle-chat-more']")) {
    state.data.chatMoreMenuOpen = false;
    render();
  }
  if (state.data.emojiPickerOpen && !e.target.closest(".tg-emoji-picker") && !e.target.closest("[data-action='toggle-emoji-picker']")) {
    state.data.emojiPickerOpen = false;
    render();
  }
  if (state.data.attachMenuOpen && !e.target.closest(".tg-attach-menu") && !e.target.closest("[data-action='toggle-attach-menu']")) {
    state.data.attachMenuOpen = false;
    render();
  }
});

document.addEventListener("input", (e) => {
  if (e.target.id === "tg-message-input") {
    const val = e.target.value.trim();
    const sendBtn = document.getElementById("tg-send-btn");
    if (sendBtn) {
      if (val.length > 0) {
        sendBtn.innerHTML = TG_ICONS.send;
        sendBtn.setAttribute("title", "Yuborish");
      } else {
        sendBtn.innerHTML = TG_ICONS.mic;
        sendBtn.setAttribute("title", "Ovozli xabar");
      }
    }
  }
  if (e.target.dataset.action === "chat-search-input") {
    state.data.chatSearchQuery = e.target.value.toLowerCase();
    const chatList = document.querySelector(".tg-chat-list");
    if (chatList) {
      chatList.innerHTML = renderTgChatListItems();
    }
  }
  if (e.target.dataset.action === "inchat-search-input") {
    state.data.inChatSearchQuery = e.target.value;
    const scrollArea = document.querySelector(".tg-messages-scroll");
    if (scrollArea) {
      scrollArea.innerHTML = renderTgMessagesInner();
    }
  }
});

document.addEventListener("keydown", (e) => {
  if (e.target.id === "tg-message-input" && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const form = e.target.closest("form");
    if (form) {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    }
  }
});

window.addEventListener("beforeunload", closeSockets);

boot();
