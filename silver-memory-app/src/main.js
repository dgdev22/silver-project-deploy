const STORAGE_KEY = 'silver-memory-demo'
const DEFAULT_MEMORY_SLUG = 'kim-youngsu'
const API_BASE_URL =
  window.SILVER_MEMORY_API_BASE_URL ??
  (window.location.port === '5175' ? 'http://127.0.0.1:8080' : '')
const DEFAULT_DESIGN_THEME = 'warm'
const DEFAULT_MEMORIAL_KIND = 'person'
const DEFAULT_PAGE_TEMPLATE = 'classic'
const MAX_PROFILE_TAGS = 12
const MAX_HERO_IMAGE_BYTES = 5 * 1024 * 1024
const DESIGN_THEMES = [
  {
    id: 'warm',
    label: '따뜻한 기록',
    description: '상아색, 세이지, 구리빛',
    qrDark: '#3b2a21',
    swatches: ['#f8f1e7', '#6f7f62', '#b87a3d'],
  },
  {
    id: 'ocean',
    label: '강릉 바다',
    description: '안개빛, 깊은 남색, 바다청록',
    qrDark: '#13243a',
    swatches: ['#eef7f7', '#16324f', '#2f8f9d'],
  },
  {
    id: 'garden',
    label: '조용한 정원',
    description: '연녹색, 자두빛, 부드러운 금색',
    qrDark: '#253420',
    swatches: ['#f3f8ee', '#536a45', '#9f5261'],
  },
  {
    id: 'graphite',
    label: '담백한 기록관',
    description: '회백색, 먹색, 차분한 파랑',
    qrDark: '#1f2933',
    swatches: ['#f5f5f2', '#1f2933', '#6e8fa3'],
  },
  {
    id: 'blossom',
    label: '봄날의 꽃',
    description: '연분홍, 잎사귀, 따뜻한 금색',
    qrDark: '#49323b',
    swatches: ['#fff5f7', '#7b5d68', '#d6a34f'],
  },
  {
    id: 'paper',
    label: '한지 편지',
    description: '종이결, 먹색, 차분한 올리브',
    qrDark: '#2f2b27',
    swatches: ['#faf4e6', '#2f2b27', '#7a8662'],
  },
  {
    id: 'lake',
    label: '고요한 호수',
    description: '물빛 회색, 청록, 은은한 노랑',
    qrDark: '#17353b',
    swatches: ['#edf7f4', '#2e7478', '#d9ba68'],
  },
]
const MEMORIAL_KINDS = [
  {
    id: 'person',
    label: '사람',
    description: '가족, 지인, 은사, 삶의 기록',
  },
  {
    id: 'pet',
    label: '반려동물',
    description: '함께한 일상, 산책길, 사진 중심',
  },
]
const PAGE_TEMPLATES = [
  {
    id: 'classic',
    label: '기록관형',
    description: '타임라인과 기억을 균형 있게',
  },
  {
    id: 'album',
    label: '앨범형',
    description: '사진과 짧은 장면을 먼저',
  },
  {
    id: 'letter',
    label: '편지형',
    description: '남겨진 마음과 글을 먼저',
  },
  {
    id: 'gallery',
    label: '사진첩형',
    description: '기억 카드를 여러 장 펼쳐보기',
  },
  {
    id: 'story',
    label: '스토리형',
    description: '짧은 장면을 크게 넘겨보기',
  },
]

const initialState = {
  activeTab: 'life',
  storyIndex: 0,
  editorName: '유족',
  editorToken: '',
  currentEditorLabel: '',
  lastIssuedEditorToken: '',
  lastBackupDownloadedAt: '',
  pendingHeroPreview: '',
  pendingHeroFileName: '',
  pendingBackupImport: null,
  backupImportMessage: '',
  inviteLink: '',
  editorInvites: [],
  ownedGuestbookEntries: [],
  designTheme: DEFAULT_DESIGN_THEME,
  memorialKind: DEFAULT_MEMORIAL_KIND,
  pageTemplate: DEFAULT_PAGE_TEMPLATE,
  tagSuggestions: [],
  profile: {
    name: '김영수',
    years: '1942 - 2026',
    subtitle: '바다와 가족을 사랑한 사람',
    location: '강원특별자치도 강릉',
    visibility: 'link',
    heroImage: '',
    tags: ['가족', '강릉 바다', '교직 38년', '노래', '정직함'],
  },
  timeline: [
    {
      id: 't1',
      year: '1942',
      title: '강릉에서 태어남',
      body: '주문진 바닷가 근처에서 어린 시절을 보냈습니다.',
    },
    {
      id: 't2',
      year: '1968',
      title: '첫 교단에 섬',
      body: '아이들이 스스로 생각하게 돕는 선생님이 되고자 했습니다.',
    },
    {
      id: 't3',
      year: '1981',
      title: '가족과 함께한 집',
      body: '주말마다 가족을 데리고 바다와 시장을 찾았습니다.',
    },
    {
      id: 't4',
      year: '2026',
      title: '가족의 기억으로 남음',
      body: '남겨진 사람들은 그의 다정함과 성실함을 기억합니다.',
    },
  ],
  moments: [
    {
      id: 'm1',
      title: '손주에게 남긴 말',
      body: '천천히 가도 괜찮다. 네 마음이 바른 곳을 향하면 된다.',
      tag: '가족의 말',
      mediaUrl: '',
    },
    {
      id: 'm2',
      title: '가장 좋아한 풍경',
      body: '겨울 아침 주문진 항구와 막 들어온 배의 불빛을 좋아했습니다.',
      tag: '좋아한 것',
      mediaUrl: '',
    },
    {
      id: 'm3',
      title: '기억하는 습관',
      body: '약속 시간보다 늘 10분 먼저 도착했고, 작은 수첩에 하루를 적었습니다.',
      tag: '삶의 태도',
      mediaUrl: '',
    },
  ],
  guestbook: [
    {
      id: 'g1',
      author: '박민정',
      relation: '제자',
      message: '선생님께 배운 말들이 아직도 제 삶의 기준이 됩니다.',
      status: 'approved',
      pinned: true,
      createdAt: '2026.05.31',
    },
    {
      id: 'g2',
      author: '이현우',
      relation: '이웃',
      message: '매일 아침 먼저 인사해주시던 모습이 오래 기억날 것 같습니다.',
      status: 'approved',
      pinned: false,
      createdAt: '2026.05.31',
    },
    {
      id: 'g3',
      author: '익명',
      relation: '지인',
      message: '가족분들께 깊은 위로를 전합니다.',
      status: 'pending',
      pinned: false,
      createdAt: '2026.06.01',
    },
  ],
  editHistory: [
    {
      id: 'e1',
      editorName: '시스템',
      actionType: 'memorial_created',
      summary: '샘플 생애 페이지를 만들었습니다.',
      createdAt: '2026.06.01',
    },
  ],
}

const app = document.querySelector('#app')
let state = {
  ...loadState(),
  isApiBacked: false,
  isLoading: false,
  apiError: '',
  isPrivateBlocked: false,
}

const initialInviteToken = inviteTokenFromUrl()
if (initialInviteToken) {
  state = {
    ...state,
    activeTab: 'editor',
    editorToken: initialInviteToken,
  }
  window.history.replaceState(null, '', memoryPageUrl())
  saveState()
}

function loadState() {
  try {
    const saved = window.localStorage.getItem(storageKey())
    return saved ? { ...initialState, ...JSON.parse(saved) } : structuredClone(initialState)
  } catch {
    return structuredClone(initialState)
  }
}

function saveState() {
  if (isCreateRoute()) return

  const {
    isApiBacked,
    isLoading,
    apiError,
    isPrivateBlocked,
    currentEditorLabel,
    pendingHeroPreview,
    pendingHeroFileName,
    pendingBackupImport,
    backupImportMessage,
    ...persistedState
  } = state
  window.localStorage.setItem(storageKey(), JSON.stringify(persistedState))
}

function setState(nextState) {
  state = typeof nextState === 'function' ? nextState(state) : nextState
  saveState()
  render()
}

function currentDesignTheme() {
  return (
    DESIGN_THEMES.find((theme) => theme.id === state.designTheme) ??
    DESIGN_THEMES.find((theme) => theme.id === DEFAULT_DESIGN_THEME)
  )
}

function currentMemorialKind() {
  return (
    MEMORIAL_KINDS.find((kind) => kind.id === state.memorialKind) ??
    MEMORIAL_KINDS.find((kind) => kind.id === DEFAULT_MEMORIAL_KIND)
  )
}

function currentPageTemplate() {
  return (
    PAGE_TEMPLATES.find((template) => template.id === state.pageTemplate) ??
    PAGE_TEMPLATES.find((template) => template.id === DEFAULT_PAGE_TEMPLATE)
  )
}

function applyDesignTheme() {
  document.documentElement.dataset.memoryTheme = currentDesignTheme().id
  document.documentElement.dataset.memorialKind = currentMemorialKind().id
  document.documentElement.dataset.pageTemplate = currentPageTemplate().id
}

async function apiRequest(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...editorTokenHeader(),
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const error = new Error(`API ${response.status}`)
    error.status = response.status
    throw error
  }

  if (response.status === 204) {
    return null
  }

  const text = await response.text()

  return text ? JSON.parse(text) : null
}

function apiUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${API_BASE_URL}${path}`
}

function editorTokenHeader() {
  return state.editorToken ? { 'X-Memory-Editor-Token': state.editorToken } : {}
}

function guestbookOwnerHeader(ownerToken) {
  return ownerToken ? { 'X-Memory-Guestbook-Token': ownerToken } : {}
}

async function loadFromApi({ includeModeration = false, activeTab } = {}) {
  setState((current) => ({
    ...current,
    isLoading: true,
    apiError: '',
  }))

  try {
    const data = await apiRequest(
      `/api/memory/memorials/${currentMemorySlug()}?includeModeration=${includeModeration}`,
    )

    setState((current) => {
      const normalized = normalizeApiMemorial(data, current)

      return {
        ...current,
        ...normalized,
        activeTab: activeTab ?? current.activeTab,
        isApiBacked: true,
        isLoading: false,
        apiError: '',
        isPrivateBlocked: false,
      }
    })
  } catch (error) {
    const privateBlocked = error.status === 403 && !includeModeration

    setState((current) => ({
      ...current,
      activeTab: activeTab ?? current.activeTab,
      isApiBacked: error.status === 403 ? true : false,
      isLoading: false,
      isPrivateBlocked: privateBlocked || (current.isPrivateBlocked && error.status === 403),
      apiError:
        privateBlocked
          ? '가족만 볼 수 있는 비공개 추모관입니다.'
          : error.status === 403
            ? '유족 코드가 맞지 않아 편집 정보를 불러오지 못했습니다.'
          : '백엔드 연결 전이라 브라우저에 임시 저장합니다.',
    }))
  }
}

async function runApiAction(action) {
  try {
    await action()
    return true
  } catch (error) {
    setState((current) => ({
      ...current,
      apiError:
        error.status === 403
          ? '유족 코드가 맞지 않습니다. 코드를 확인해주세요.'
          : error.status === 429
            ? '짧은 시간에 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
            : '저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    }))
    return false
  }
}

async function runGuestbookOwnerAction(action) {
  try {
    await action()
    return true
  } catch (error) {
    setState((current) => ({
      ...current,
      apiError:
        error.status === 403
          ? '이 브라우저에서 작성한 방명록만 수정하거나 삭제할 수 있습니다.'
          : error.status === 429
            ? '짧은 시간에 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
            : '방명록을 저장하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    }))
    return false
  }
}

function normalizeApiMemorial(data, current = state) {
  const { profile, timeline, moments, guestbook, editorInvites, editHistory } = data
  const currentEditorLabel = data.currentEditorLabel ?? ''
  const normalizedGuestbook = guestbook.map((entry) => normalizeGuestbookEntry(entry))

  return {
    designTheme: profile.designTheme ?? DEFAULT_DESIGN_THEME,
    memorialKind: profile.memorialKind ?? DEFAULT_MEMORIAL_KIND,
    pageTemplate: profile.pageTemplate ?? DEFAULT_PAGE_TEMPLATE,
    currentEditorLabel,
    pendingHeroPreview: '',
    pendingHeroFileName: '',
    pendingBackupImport: null,
    backupImportMessage: '',
    editorName: shouldUseCurrentEditorLabel(current.editorName, currentEditorLabel)
      ? currentEditorLabel
      : current.editorName,
    tagSuggestions: [],
    profile: {
      id: profile.id,
      slug: profile.slug,
      name: profile.displayName,
      years: profile.years ?? '',
      subtitle: profile.subtitle ?? '',
      location: profile.location ?? '',
      visibility: profile.visibility,
      heroImage: profile.heroImageUrl ?? '',
      tags: profile.tags ?? [],
    },
    timeline: timeline.map((item) => ({
      id: String(item.id),
      year: item.eventYear,
      title: item.title,
      body: item.body,
    })),
    moments: moments.map((item) => ({
      id: String(item.id),
      title: item.title,
      body: item.body,
      tag: item.tag ?? '기억',
      mediaUrl: item.mediaUrl ?? '',
    })),
    guestbook: normalizedGuestbook,
    ownedGuestbookEntries: mergeOwnedGuestbookEntries(current.ownedGuestbookEntries, normalizedGuestbook),
    editorInvites: (editorInvites ?? []).map((invite) => ({
      id: String(invite.id),
      inviteeLabel: invite.inviteeLabel ?? '가족',
      status: invite.status,
      expiresAt: formatDate(invite.expiresAt),
      lastUsedAt: formatDateTime(invite.lastUsedAt),
      createdAt: formatDateTime(invite.createdAt),
    })),
    editHistory: (editHistory ?? []).map((event) => ({
      id: String(event.id),
      editorName: event.editorName,
      actionType: event.actionType,
      targetType: event.targetType,
      targetId: event.targetId,
      summary: event.summary,
      createdAt: formatDateTime(event.createdAt),
    })),
  }
}

function shouldUseCurrentEditorLabel(editorName, currentEditorLabel) {
  if (!currentEditorLabel) return false

  const normalizedName = String(editorName ?? '').trim()

  return !normalizedName || normalizedName === '유족'
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatDateTime(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function memoryPageUrl() {
  return memoryPageUrlForSlug(currentMemorySlug())
}

function memoryPageUrlForSlug(slug) {
  return `${memoryBaseUrl()}#/m/${encodeURIComponent(slug)}`
}

function memoryCreateUrl() {
  return `${memoryBaseUrl()}#/new`
}

function memoryBaseUrl() {
  const url = new URL(window.location.href)

  return `${url.origin}${url.pathname}`
}

function isCreateRoute() {
  const hasQuerySlug = Boolean(new URLSearchParams(window.location.search).get('slug'))

  return window.location.hash.startsWith('#/new') || (!window.location.hash && !hasQuerySlug)
}

function currentMemorySlug() {
  const hashMatch = window.location.hash.match(/^#\/m\/([^/?#]+)/)
  const querySlug = new URLSearchParams(window.location.search).get('slug')
  const rawSlug = hashMatch?.[1] ?? querySlug ?? DEFAULT_MEMORY_SLUG

  try {
    return decodeURIComponent(rawSlug)
  } catch {
    return DEFAULT_MEMORY_SLUG
  }
}

function inviteTokenFromUrl() {
  const [, hashQuery = ''] = window.location.hash.split('?')

  if (!hashQuery) return ''

  try {
    return new URLSearchParams(hashQuery).get('invite')?.trim() ?? ''
  } catch {
    return ''
  }
}

function memoryInviteUrl(token) {
  return `${memoryPageUrl()}?invite=${encodeURIComponent(token)}`
}

function storageKey() {
  return `${STORAGE_KEY}:${currentMemorySlug()}`
}

function visibleGuestbookEntries() {
  return state.guestbook
    .filter((entry) => entry.status === 'approved')
    .sort((left, right) => Number(right.pinned) - Number(left.pinned))
}

function ownedGuestbookEntries() {
  return (state.ownedGuestbookEntries ?? [])
    .filter((entry) => entry.ownerToken && entry.status !== 'hidden')
    .sort(sortGuestbookEntriesDesc)
}

function pendingGuestbookEntries() {
  return state.guestbook.filter((entry) => entry.status === 'pending')
}

function normalizeGuestbookEntry(entry, ownerToken = entry.ownerToken ?? '') {
  return {
    id: String(entry.id),
    author: entry.author,
    relation: entry.relation ?? '',
    message: entry.message,
    status: entry.status,
    pinned: Boolean(entry.pinned),
    createdAt: formatDate(entry.createdAt),
    updatedAt: formatDate(entry.updatedAt ?? entry.createdAt),
    ownerToken,
  }
}

function mergeOwnedGuestbookEntries(ownedEntries = [], serverEntries = []) {
  const serverById = new Map(serverEntries.map((entry) => [String(entry.id), entry]))

  return ownedEntries
    .map((entry) => ({
      ...entry,
      ...(serverById.get(String(entry.id)) ?? {}),
      ownerToken: entry.ownerToken,
    }))
    .filter((entry) => entry.ownerToken && entry.status !== 'hidden')
}

function guestbookStatusLabel(status) {
  const labels = {
    pending: '승인 대기',
    approved: '공개 중',
    hidden: '숨김',
  }

  return labels[status] ?? '승인 대기'
}

function sortGuestbookEntriesDesc(left, right) {
  const leftId = Number(left.id)
  const rightId = Number(right.id)

  if (Number.isFinite(leftId) && Number.isFinite(rightId)) {
    return rightId - leftId
  }

  return String(right.id).localeCompare(String(left.id))
}

function currentEditorName() {
  const inputValue = app.querySelector('[data-editor-name]')?.value?.trim()

  return inputValue || state.editorName || '유족'
}

function render() {
  applyDesignTheme()

  if (isCreateRoute()) {
    app.innerHTML = `
      <header class="app-header">
        <a class="brand" href="${escapeHtml(memoryCreateUrl())}" aria-label="Silver Memory 홈">
          <span>Silver Memory</span>
        </a>
        <nav class="top-nav" aria-label="주요 메뉴">
          ${navLink(memoryCreateUrl(), '새 추모관', true)}
          ${navLink(memoryPageUrlForSlug(DEFAULT_MEMORY_SLUG), '샘플 보기', false)}
        </nav>
        <div class="storage-status is-live">운영 저장</div>
      </header>

      <main>
        ${state.apiError ? `<p class="status-note">${escapeHtml(state.apiError)}</p>` : ''}
        ${renderCreateMemorial()}
      </main>
    `
    bindGlobalEvents()
    return
  }

  app.innerHTML = `
    <header class="app-header">
      <a class="brand" href="${escapeHtml(memoryPageUrl())}" data-tab="life" aria-label="Silver Memory 홈">
        <span>Silver Memory</span>
      </a>
      <nav class="top-nav" aria-label="주요 메뉴">
        ${navButton('life', '생애')}
        ${navButton('guestbook', '방명록')}
        ${navButton('editor', '유족 편집')}
        ${navLink(memoryCreateUrl(), '새 추모관', false)}
      </nav>
      <div class="storage-status ${state.isApiBacked ? 'is-live' : 'is-local'}">
        ${state.isApiBacked ? 'DB 저장 중' : '임시 저장'}
      </div>
    </header>

    <main>
      ${state.apiError ? `<p class="status-note">${escapeHtml(state.apiError)}</p>` : ''}
      ${
        state.isPrivateBlocked
          ? renderPrivateMemorialNotice()
          : `
            ${renderHero()}
            ${renderActiveTab()}
          `
      }
    </main>
  `

  bindGlobalEvents()
}

function renderPrivateMemorialNotice() {
  return `
    <section class="private-notice panel">
      <div class="section-title">
        <p>비공개 추모관</p>
        <h1>가족만 볼 수 있는 페이지입니다</h1>
      </div>
      <p>이 추모관은 유족이 공개 범위를 가족만으로 설정했습니다. 유족이라면 편집 탭에서 유족 코드 또는 초대 토큰을 입력해 주세요.</p>
      <form class="private-token-form" data-private-token-form>
        <label>
          유족 코드 또는 초대 토큰
          <input name="editorToken" autocomplete="off" placeholder="유족에게 받은 코드를 입력하세요" />
        </label>
        <button type="submit" class="primary-button">가족 페이지 열기</button>
      </form>
      <div class="button-row">
        <a class="secondary-link-button" href="${escapeHtml(memoryCreateUrl())}">
          새 추모관 만들기
        </a>
      </div>
    </section>
  `
}

function navLink(href, label, current) {
  return `
    <a
      class="nav-button ${current ? 'is-active' : ''}"
      href="${escapeHtml(href)}"
      aria-current="${current ? 'page' : 'false'}"
    >
      ${escapeHtml(label)}
    </a>
  `
}

function navButton(tab, label) {
  const current = state.activeTab === tab
  return `
    <button
      type="button"
      class="nav-button ${current ? 'is-active' : ''}"
      data-tab="${tab}"
      aria-pressed="${current}"
    >
      ${label}
    </button>
  `
}

function renderCreateMemorial() {
  return `
    <section class="create-shell">
      <div class="create-copy">
        <p class="eyebrow">새 추모관</p>
        <h1>가족의 기억을 담을 페이지를 만듭니다</h1>
        <p>생성 후 바로 유족 편집기와 QR 카드를 사용할 수 있습니다. 처음 발급되는 유족 코드는 안전한 곳에 꼭 보관해 주세요.</p>
      </div>

      <form class="panel create-form" data-create-memorial-form>
        <div class="section-title">
          <p>기본 정보</p>
          <h2>처음에 보여줄 내용을 입력하세요</h2>
        </div>
        <label>
          이름
          <input name="displayName" placeholder="예: 김영수" required />
        </label>
        <label>
          생애 기간
          <input name="years" placeholder="예: 1942 - 2026" />
        </label>
        <label>
          한 줄 소개
          <input name="subtitle" placeholder="예: 바다와 가족을 사랑한 사람" />
        </label>
        <label>
          지역
          <input name="location" placeholder="예: 강원특별자치도 강릉" />
        </label>
        <label>
          키워드
          <input name="tags" placeholder="예: 가족, 강릉 바다, 노래" />
        </label>
        <div class="compact-grid">
          <label>
            기억 대상
            <select name="memorialKind">
              <option value="person">사람</option>
              <option value="pet">반려동물</option>
            </select>
          </label>
          <label>
            페이지 구성
            <select name="pageTemplate">
              ${PAGE_TEMPLATES.map(
                (template) =>
                  `<option value="${escapeHtml(template.id)}">${escapeHtml(template.label)}</option>`,
              ).join('')}
            </select>
          </label>
        </div>
        <label>
          분위기
          <select name="designTheme">
            ${DESIGN_THEMES.map((theme) => `<option value="${escapeHtml(theme.id)}">${escapeHtml(theme.label)}</option>`).join('')}
          </select>
        </label>
        <button type="submit" class="primary-button" data-create-submit>추모관 만들기</button>
      </form>
    </section>
  `
}

function renderHero() {
  const { profile } = state
  const photo = profile.heroImage
    ? `<img src="${profile.heroImage}" alt="${escapeHtml(profile.name)} 대표 사진" />`
    : `<div class="photo-placeholder" aria-hidden="true">${escapeHtml(profile.name.slice(0, 1))}</div>`

  return `
    <section class="hero-section">
      <div class="hero-photo">${photo}</div>
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(heroEyebrow())}</p>
        <h1>${escapeHtml(profile.name)}</h1>
        <p class="years">${escapeHtml(profile.years)}</p>
        <p class="subtitle">${escapeHtml(profile.subtitle)}</p>
        <div class="keyword-row" aria-label="${escapeHtml(tagFieldLabel())}">
          ${profile.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
        </div>
      </div>
      <aside class="hero-card">
        <p class="small-label">공개 범위</p>
        <strong>${visibilityLabel(profile.visibility)}</strong>
        <p>${escapeHtml(profile.location)}</p>
      </aside>
    </section>
  `
}

function visibilityLabel(visibility) {
  const labels = {
    private: '가족만',
    link: '링크 공개',
    public: '전체 공개',
  }

  return labels[visibility] ?? '링크 공개'
}

function renderActiveTab() {
  if (state.activeTab === 'guestbook') {
    return renderGuestbook()
  }

  if (state.activeTab === 'editor') {
    return renderEditor()
  }

  return renderLife()
}

function renderLife() {
  const template = currentPageTemplate().id

  if (template === 'album') {
    return `
      <section class="content-grid template-album">
        <aside class="panel story-panel">
          <div class="section-title">
            <p>${escapeHtml(memorySceneLabel())}</p>
            <h2>${escapeHtml(storySectionTitle())}</h2>
          </div>
          ${renderStoryCard()}
        </aside>
        ${renderTimelinePanel()}
      </section>
      ${renderGuestPreview()}
    `
  }

  if (template === 'letter') {
    return `
      ${renderGuestPreview()}
      <section class="content-grid template-letter">
        ${renderTimelinePanel()}
        <aside class="panel story-panel">
          <div class="section-title">
            <p>${escapeHtml(memorySceneLabel())}</p>
            <h2>${escapeHtml(storySectionTitle())}</h2>
          </div>
          ${renderStoryCard()}
        </aside>
      </section>
    `
  }

  if (template === 'gallery') {
    return `
      ${renderMomentGalleryPanel()}
      <section class="content-grid template-gallery">
        ${renderTimelinePanel()}
        <aside class="panel story-panel">
          <div class="section-title">
            <p>${escapeHtml(memorySceneLabel())}</p>
            <h2>${escapeHtml(storySectionTitle())}</h2>
          </div>
          ${renderStoryCard()}
        </aside>
      </section>
      ${renderGuestPreview()}
    `
  }

  if (template === 'story') {
    return `
      <section class="story-feature">
        <div class="panel story-panel">
          <div class="section-title">
            <p>${escapeHtml(memorySceneLabel())}</p>
            <h2>${escapeHtml(storySectionTitle())}</h2>
          </div>
          ${renderStoryCard()}
        </div>
      </section>
      <section class="content-grid template-story">
        ${renderTimelinePanel()}
        ${renderCompactGuestPreview()}
      </section>
    `
  }

  return `
    <section class="content-grid">
      ${renderTimelinePanel()}
      <aside class="panel story-panel">
        <div class="section-title">
          <p>${escapeHtml(memorySceneLabel())}</p>
          <h2>${escapeHtml(storySectionTitle())}</h2>
        </div>
        ${renderStoryCard()}
      </aside>
    </section>

    ${renderGuestPreview()}
  `
}

function renderMomentGalleryPanel() {
  return `
    <section class="guest-preview moment-gallery-section">
      <div class="section-title">
        <p>${escapeHtml(memorySceneLabel())}</p>
        <h2>가족이 고른 장면들</h2>
      </div>
      <div class="moment-gallery">
        ${state.moments.length ? state.moments.map(renderMomentGalleryCard).join('') : '<p class="empty-text">아직 등록된 기억 카드가 없습니다.</p>'}
      </div>
    </section>
  `
}

function renderMomentGalleryCard(item) {
  const mediaUrl = safeMediaUrl(item.mediaUrl)

  return `
    <article class="moment-gallery-card">
      <span class="chip">${escapeHtml(item.tag || '기억')}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
      ${
        mediaUrl
          ? `<a class="story-media-link" href="${escapeHtml(mediaUrl)}" target="_blank" rel="noreferrer">영상/사진 링크 열기</a>`
          : ''
      }
    </article>
  `
}

function renderCompactGuestPreview() {
  const entries = visibleGuestbookEntries().slice(0, 2)

  return `
    <aside class="panel">
      <div class="section-title">
        <p>방명록</p>
        <h2>${escapeHtml(guestbookTitle())}</h2>
      </div>
      <div class="guest-list">
        ${entries.length ? entries.map(renderGuestEntry).join('') : '<p class="empty-text">아직 공개된 방명록이 없습니다.</p>'}
      </div>
      <button type="button" class="secondary-button" data-tab="guestbook">
        방명록 남기기
      </button>
    </aside>
  `
}

function renderTimelinePanel() {
  return `
    <div class="panel">
      <div class="section-title">
        <p>${escapeHtml(timelineLabel())}</p>
        <h2>${escapeHtml(timelineTitle())}</h2>
      </div>
      <div class="timeline">
        ${state.timeline
          .map(
            (item) => `
              <article class="timeline-item">
                <strong>${escapeHtml(item.year)}</strong>
                <div>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.body)}</p>
                </div>
              </article>
            `,
          )
          .join('')}
      </div>
    </div>
  `
}

function renderGuestPreview() {
  return `
    <section class="guest-preview">
      <div class="section-title">
        <p>방명록</p>
        <h2>${escapeHtml(guestbookTitle())}</h2>
      </div>
      <div class="guest-list">
        ${visibleGuestbookEntries()
          .slice(0, 3)
          .map(renderGuestEntry)
          .join('')}
      </div>
      <button type="button" class="secondary-button" data-tab="guestbook">
        방명록 남기기
      </button>
    </section>
  `
}

function heroEyebrow() {
  return currentMemorialKind().id === 'pet' ? '함께한 시간을 보관하는 곳' : '가족의 기억 보관소'
}

function timelineLabel() {
  return currentMemorialKind().id === 'pet' ? '함께한 시간' : '생애 타임라인'
}

function timelineTitle() {
  return currentMemorialKind().id === 'pet'
    ? '처음 만난 날부터 함께 걸어온 시간'
    : '한 사람의 시간을 따라갑니다'
}

function memorySceneLabel() {
  return currentMemorialKind().id === 'pet' ? '함께한 장면' : '삶의 장면'
}

function storySectionTitle() {
  return currentMemorialKind().id === 'pet' ? '짧게 넘겨보는 일상' : '짧게 넘겨보는 기억'
}

function guestbookTitle() {
  return currentMemorialKind().id === 'pet' ? '함께 사랑한 마음' : '남겨진 마음'
}

function nameFieldLabel() {
  return currentMemorialKind().id === 'pet' ? '이름 또는 별명' : '이름'
}

function yearsFieldLabel() {
  return currentMemorialKind().id === 'pet' ? '함께한 기간' : '생몰연도'
}

function tagFieldLabel() {
  return currentMemorialKind().id === 'pet' ? '기억 키워드' : '삶의 키워드'
}

function renderStoryCard() {
  const item = state.moments[state.storyIndex] ?? state.moments[0]
  const mediaUrl = safeMediaUrl(item?.mediaUrl)

  if (!item) {
    return '<p class="empty-text">아직 등록된 기억 카드가 없습니다.</p>'
  }

  return `
    <article class="story-card">
      <p class="chip">${escapeHtml(item.tag)}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
      ${
        mediaUrl
          ? `<a class="story-media-link" href="${escapeHtml(mediaUrl)}" target="_blank" rel="noreferrer">영상/사진 링크 열기</a>`
          : ''
      }
      <div class="story-actions">
        <button type="button" class="icon-button" data-story-prev aria-label="이전 기억">‹</button>
        <span>${state.storyIndex + 1} / ${state.moments.length}</span>
        <button type="button" class="icon-button" data-story-next aria-label="다음 기억">›</button>
      </div>
    </article>
  `
}

function renderGuestbook() {
  const approvedEntries = visibleGuestbookEntries()
  const ownedEntries = ownedGuestbookEntries()

  return `
    <section class="guestbook-layout">
      <div class="panel">
        <div class="section-title">
          <p>방명록 남기기</p>
          <h2>기억나는 순간을 적어주세요</h2>
        </div>
        <form class="guest-form" data-guest-form>
          <label>
            이름
            <input name="author" required placeholder="성함 또는 별명" />
          </label>
          <label>
            관계
            <input name="relation" placeholder="친구, 제자, 이웃 등" />
          </label>
          <label>
            남기고 싶은 말
            <textarea name="message" required rows="5" placeholder="짧은 추억이나 위로의 말을 남겨주세요."></textarea>
          </label>
          <button type="submit" class="primary-button">방명록 남기기</button>
          <p class="form-note">남긴 글은 유족 승인 후 공개됩니다.</p>
        </form>
        ${
          ownedEntries.length
            ? `<div class="owned-guestbook-list">
                <div class="section-title compact-title">
                  <p>내가 남긴 방명록</p>
                  <h3>이 브라우저에서 작성한 글</h3>
                </div>
                ${ownedEntries.map(renderOwnedGuestEntry).join('')}
              </div>`
            : ''
        }
      </div>

      <div class="panel">
        <div class="section-title">
          <p>공개된 방명록</p>
          <h2>${approvedEntries.length.toLocaleString('ko-KR')}개의 마음</h2>
        </div>
        <div class="guest-list">
          ${approvedEntries.length ? approvedEntries.map(renderGuestEntry).join('') : '<p class="empty-text">아직 공개된 방명록이 없습니다.</p>'}
        </div>
      </div>
    </section>
  `
}

function renderGuestEntry(entry) {
  return `
    <article class="guest-entry ${entry.pinned ? 'is-pinned' : ''}">
      <div>
        <strong>${escapeHtml(entry.author)}</strong>
        <span>${escapeHtml(entry.relation || '방문자')}</span>
      </div>
      <p>${escapeHtml(entry.message)}</p>
      <small>${entry.pinned ? '고정된 글 · ' : ''}${escapeHtml(entry.createdAt)}</small>
    </article>
  `
}

function renderOwnedGuestEntry(entry) {
  return `
    <form class="owned-guest-entry" data-owned-guest-form="${escapeHtml(entry.id)}">
      <div class="owned-guest-heading">
        <strong>${escapeHtml(guestbookStatusLabel(entry.status))}</strong>
        <small>${escapeHtml(entry.updatedAt || entry.createdAt)}</small>
      </div>
      <label>
        이름
        <input name="author" required value="${escapeHtml(entry.author)}" />
      </label>
      <label>
        관계
        <input name="relation" value="${escapeHtml(entry.relation || '')}" />
      </label>
      <label>
        남긴 말
        <textarea name="message" required rows="4">${escapeHtml(entry.message)}</textarea>
      </label>
      <div class="button-row">
        <button type="submit" class="secondary-button">수정</button>
        <button type="button" class="danger-button" data-delete-owned-guest="${escapeHtml(entry.id)}">삭제</button>
      </div>
      <p class="form-note">수정한 글은 다시 유족 승인 후 공개됩니다.</p>
    </form>
  `
}

function renderEditor() {
  return `
    <section class="editor-layout">
      ${renderSetupChecklist()}
      ${renderDesignEditorPanel()}
      <form class="panel editor-form" data-profile-form>
        <div class="section-title">
          <p>유족 편집기</p>
          <h2>생애 페이지 수정</h2>
        </div>
        <label>
          편집자 이름
          <input
            name="editorName"
            value="${escapeHtml(state.editorName)}"
            data-editor-name
            placeholder="예: 장남 김민수"
          />
        </label>
        <label>
          유족 코드 또는 초대 토큰
          <input
            name="editorToken"
            value="${escapeHtml(state.editorToken)}"
            data-editor-token
            autocomplete="off"
            placeholder="샘플 코드: demo-family-token"
          />
        </label>
        ${renderEditorAccessNote()}
        ${
          state.lastIssuedEditorToken
            ? `
              ${renderCopyField({
                label: '처음 발급된 유족 코드',
                value: state.lastIssuedEditorToken,
                description:
                  '이 코드는 유족 편집과 가족 초대에 필요합니다. 지금 이 브라우저에만 표시되므로 안전한 곳에 따로 보관해 주세요.',
                buttonLabel: '코드 복사',
                extraClass: 'issued-token-box',
              })}
            `
            : ''
        }
        <label>
          ${escapeHtml(nameFieldLabel())}
          <input name="name" value="${escapeHtml(state.profile.name)}" required />
        </label>
        <label>
          ${escapeHtml(yearsFieldLabel())}
          <input name="years" value="${escapeHtml(state.profile.years)}" />
        </label>
        <label>
          한 줄 소개
          <input name="subtitle" value="${escapeHtml(state.profile.subtitle)}" />
        </label>
        <label>
          지역
          <input name="location" value="${escapeHtml(state.profile.location)}" />
        </label>
        <label>
          ${escapeHtml(tagFieldLabel())}
          <input name="tags" value="${escapeHtml(state.profile.tags.join(', '))}" />
        </label>
        ${renderTagAssistant()}
        <label>
          공개 범위
          <select name="visibility">
            ${selectOption('private', '가족만')}
            ${selectOption('link', '링크 공개')}
            ${selectOption('public', '전체 공개')}
          </select>
        </label>
        ${renderHeroImageEditor()}
        <div class="button-row">
          <button type="submit" class="primary-button">저장하기</button>
          <button type="button" class="secondary-button" data-download-qr>
            QR 카드 다운로드
          </button>
        </div>
      </form>

      ${renderQuickRecordPanel()}

      <div class="panel qr-panel">
        <div class="section-title">
          <p>묘비 QR</p>
          <h2>방문자가 바로 들어오는 링크</h2>
        </div>
        <div class="qr-preview" aria-label="추모 페이지 QR 코드">
          ${createQrSvg(memoryPageUrl(), {
            moduleSize: 7,
            quiet: 3,
            dark: currentDesignTheme().qrDark,
          })}
        </div>
        <p class="qr-url">${escapeHtml(memoryPageUrl())}</p>
        <div class="button-row qr-actions">
          <button type="button" class="secondary-button" data-copy-text="${escapeHtml(memoryPageUrl())}">
            링크 복사
          </button>
        </div>
      </div>

      ${renderBackupPanel()}

      <div class="panel">
        <div class="section-title">
          <p>가족 초대</p>
          <h2>함께 편집할 링크 만들기</h2>
        </div>
        <form class="invite-form" data-invite-form>
          <input name="inviteeLabel" placeholder="초대할 가족 이름 예: 장녀 김민지" />
          <input name="expiresInDays" type="number" min="1" max="90" value="14" />
          <button type="submit" class="secondary-button">초대 링크 만들기</button>
        </form>
        ${
          state.inviteLink
            ? `
              ${renderCopyField({
                label: '초대 링크',
                value: state.inviteLink,
                description: '이 링크로 들어온 가족은 초대받은 이름으로 편집 기록에 남습니다.',
                buttonLabel: '링크 복사',
                extraClass: 'invite-link-box',
              })}
            `
            : '<p class="form-note">초대 링크는 유족 코드가 있는 가족만 만들 수 있습니다.</p>'
        }
        <div class="invite-list">
          ${state.editorInvites.length ? state.editorInvites.map(renderEditorInvite).join('') : '<p class="empty-text">아직 만든 초대 링크가 없습니다.</p>'}
        </div>
      </div>

      <div class="panel">
        <div class="section-title">
          <p>타임라인</p>
          <h2>중요한 순간 추가</h2>
        </div>
        <form class="timeline-form" data-timeline-form>
          <input name="year" placeholder="연도" required />
          <input name="title" placeholder="제목" required />
          <textarea name="body" rows="3" placeholder="내용" required></textarea>
          <button type="submit" class="secondary-button">순간 추가</button>
        </form>
      </div>

      <div class="panel editor-wide">
        <div class="section-title">
          <p>타임라인 관리</p>
          <h2>기록 수정과 삭제</h2>
        </div>
        <div class="memory-edit-list">
          ${state.timeline.length ? state.timeline.map(renderTimelineEditorEntry).join('') : '<p class="empty-text">아직 타임라인이 없습니다.</p>'}
        </div>
      </div>

      <div class="panel">
        <div class="section-title">
          <p>${escapeHtml(memorySceneLabel())}</p>
          <h2>기억 카드 추가</h2>
        </div>
        <form class="moment-form" data-moment-form>
          <input name="title" placeholder="제목" required />
          <input name="tag" placeholder="분류 예: 좋아한 것, 가족 이야기" />
          <input name="mediaUrl" placeholder="영상/사진 링크 선택 입력" />
          <textarea name="body" rows="4" placeholder="짧은 이야기나 가족이 기억하는 장면" required></textarea>
          <button type="submit" class="secondary-button">기억 카드 추가</button>
        </form>
      </div>

      <div class="panel editor-wide">
        <div class="section-title">
          <p>${escapeHtml(memorySceneLabel())} 관리</p>
          <h2>기억 카드 수정과 삭제</h2>
        </div>
        <div class="memory-edit-list">
          ${state.moments.length ? state.moments.map(renderMomentEditorEntry).join('') : '<p class="empty-text">아직 기억 카드가 없습니다.</p>'}
        </div>
      </div>

      <div class="panel editor-wide">
        <div class="section-title">
          <p>방명록 관리</p>
          <h2>승인 대기 ${pendingGuestbookEntries().length.toLocaleString('ko-KR')}개</h2>
        </div>
        <div class="moderation-list">
          ${state.guestbook.map(renderModerationEntry).join('')}
        </div>
      </div>

      <div class="panel editor-wide">
        <div class="section-title">
          <p>편집 기록</p>
          <h2>유족이 바꾼 내용</h2>
        </div>
        <div class="edit-history-list">
          ${state.editHistory.length ? state.editHistory.map(renderEditHistoryEntry).join('') : '<p class="empty-text">아직 편집 기록이 없습니다.</p>'}
        </div>
      </div>
    </section>
  `
}

function renderHeroImageEditor() {
  const previewImage = state.pendingHeroPreview || state.profile.heroImage
  const previewLabel = state.pendingHeroPreview ? '저장 전 미리보기' : '현재 대표 사진'
  const fileName = state.pendingHeroFileName

  return `
    <div class="hero-image-editor">
      <span class="field-label">대표 사진</span>
      <div class="hero-image-preview" aria-label="대표 사진 미리보기">
        ${
          previewImage
            ? `<img src="${escapeHtml(previewImage)}" alt="${escapeHtml(state.profile.name)} 대표 사진 미리보기" />`
            : `<div class="hero-image-empty">${escapeHtml((state.profile.name || '기').slice(0, 1))}</div>`
        }
      </div>
      <p class="form-note">
        ${escapeHtml(previewLabel)}${fileName ? ` · ${escapeHtml(fileName)}` : ''}. JPG, PNG, WebP, GIF 파일을 5MB 이하로 올려주세요.
      </p>
      <label>
        사진 선택
        <input name="heroImage" type="file" accept="image/*" data-hero-image-input />
      </label>
      ${
        state.pendingHeroPreview
          ? '<p class="form-note">선택한 사진은 저장하기를 눌러야 방문자 화면에 반영됩니다.</p>'
          : ''
      }
    </div>
  `
}

function renderBackupPanel() {
  return `
    <div class="panel backup-panel">
      <div class="section-title">
        <p>가족 백업</p>
        <h2>추모관 데이터 내려받기</h2>
      </div>
      <p class="form-note">
        생애 정보, 타임라인, 기억 카드, 방명록, 편집 기록을 JSON 파일로 저장합니다. 유족 코드와 초대 토큰 원문은 보안상 백업 파일에 넣지 않습니다.
      </p>
      ${
        state.lastBackupDownloadedAt
          ? `<p class="form-note">마지막 백업: ${escapeHtml(state.lastBackupDownloadedAt)}</p>`
          : ''
      }
      <div class="button-row">
        <button type="button" class="secondary-button" data-download-backup>
          백업 파일 다운로드
        </button>
      </div>
      <div class="backup-import-box">
        <span class="field-label">백업 파일 가져오기</span>
        <label>
          JSON 백업 파일 선택
          <input type="file" accept="application/json,.json" data-backup-import-input />
        </label>
        <p class="form-note">
          선택한 파일은 먼저 내용만 확인합니다. 운영 DB에는 바로 쓰지 않고, 이 브라우저에서 임시로 열어볼 수 있습니다.
        </p>
        ${renderBackupImportPreview()}
      </div>
    </div>
  `
}

function renderBackupImportPreview() {
  const backup = state.pendingBackupImport

  if (state.backupImportMessage && !backup) {
    return `<p class="form-note">${escapeHtml(state.backupImportMessage)}</p>`
  }

  if (!backup) return ''

  return `
    <div class="backup-import-preview">
      <strong>${escapeHtml(backup.profile.name || '이름 없음')}</strong>
      <p>
        타임라인 ${backup.timeline.length.toLocaleString('ko-KR')}개 · 기억 카드 ${backup.moments.length.toLocaleString('ko-KR')}개 · 방명록 ${backup.guestbook.length.toLocaleString('ko-KR')}개
      </p>
      <p class="form-note">
        내보낸 시각: ${escapeHtml(formatDateTime(backup.exportedAt) || backup.exportedAt || '-')}
      </p>
      <div class="button-row">
        <button type="button" class="secondary-button" data-apply-backup-import>
          브라우저에 임시 복구
        </button>
      </div>
      ${
        state.backupImportMessage
          ? `<p class="form-note">${escapeHtml(state.backupImportMessage)}</p>`
          : ''
      }
    </div>
  `
}

function renderQuickRecordPanel() {
  return `
    <div class="panel editor-wide quick-record-panel">
      <div class="section-title">
        <p>빠른 기록 작성</p>
        <h2>중요한 순간과 기억 카드를 한 번에 추가</h2>
      </div>
      <form class="quick-record-form" data-quick-record-form>
        <div class="quick-record-grid">
          <fieldset>
            <legend>생애 타임라인</legend>
            <div class="compact-grid">
              <label>
                연도
                <input name="quickLifeYear" placeholder="예: 1981" />
              </label>
              <label>
                제목
                <input name="quickLifeTitle" placeholder="예: 가족과 함께한 집" />
              </label>
            </div>
            <label>
              내용
              <textarea name="quickLifeBody" rows="4" placeholder="그 순간을 가족이 기억하는 방식으로 적어주세요."></textarea>
            </label>
          </fieldset>
          <fieldset>
            <legend>${escapeHtml(memorySceneLabel())}</legend>
            <div class="compact-grid">
              <label>
                제목
                <input name="quickMomentTitle" placeholder="예: 손주에게 남긴 말" />
              </label>
              <label>
                분류
                <input name="quickMomentTag" placeholder="예: 가족의 말" />
              </label>
            </div>
            <label>
              영상/사진 링크
              <input name="quickMomentMediaUrl" placeholder="선택 입력" />
            </label>
            <label>
              내용
              <textarea name="quickMomentBody" rows="4" placeholder="짧은 이야기, 좋아했던 것, 남기고 싶은 말을 적어주세요."></textarea>
            </label>
          </fieldset>
        </div>
        <p class="form-note">타임라인 또는 기억 카드 중 하나만 채워도 추가할 수 있습니다. 제목과 내용은 함께 입력해 주세요.</p>
        <button type="submit" class="primary-button" data-quick-record-submit>
          기록 추가
        </button>
      </form>
    </div>
  `
}

function renderDesignEditorPanel() {
  return `
    <div class="panel editor-wide design-editor-panel">
      <div class="section-title">
        <p>디자인 설정</p>
        <h2>가족이 원하는 분위기로 바꾸기</h2>
      </div>
      <div class="design-summary">
        <strong>${escapeHtml(currentDesignTheme().label)}</strong>
        <span>${escapeHtml(currentPageTemplate().label)}</span>
        <span>${escapeHtml(currentMemorialKind().label)}</span>
      </div>
      <div class="design-editor-grid">
        ${renderThemePicker()}
        ${renderTemplatePicker()}
        ${renderKindPicker()}
      </div>
      <p class="form-note">선택하면 화면에 바로 미리보기로 반영됩니다. 운영 저장을 위해서는 디자인 저장을 눌러주세요.</p>
      <div class="button-row">
        <button type="button" class="primary-button" data-save-design>
          디자인 저장
        </button>
      </div>
    </div>
  `
}

function renderSetupChecklist() {
  const steps = setupChecklist()
  const completedCount = steps.filter((step) => step.done).length

  return `
    <div class="panel editor-wide setup-checklist-panel">
      <div class="section-title">
        <p>처음 설정</p>
        <h2>${completedCount} / ${steps.length} 준비됨</h2>
      </div>
      <div class="setup-progress" aria-label="처음 설정 진행률">
        <span style="width: ${(completedCount / steps.length) * 100}%"></span>
      </div>
      <div class="setup-step-list">
        ${steps
          .map(
            (step) => `
              <article class="setup-step ${step.done ? 'is-done' : ''}">
                <strong>${step.done ? '완료' : '대기'}</strong>
                <div>
                  <h3>${escapeHtml(step.title)}</h3>
                  <p>${escapeHtml(step.description)}</p>
                </div>
              </article>
            `,
          )
          .join('')}
      </div>
      <div class="button-row setup-actions">
        <button type="button" class="secondary-button" data-copy-text="${escapeHtml(memoryPageUrl())}">
          추모관 링크 복사
        </button>
        <button type="button" class="secondary-button" data-download-qr>
          QR 카드 다운로드
        </button>
        <button type="button" class="secondary-button" data-download-backup>
          백업 다운로드
        </button>
      </div>
    </div>
  `
}

function setupChecklist() {
  return [
    {
      title: '유족 코드 확인',
      description: '편집 권한을 잃지 않도록 유족 코드를 안전한 곳에 보관합니다.',
      done: Boolean(state.editorToken || state.lastIssuedEditorToken),
    },
    {
      title: '대표 사진 등록',
      description: '첫 화면에 보여줄 사진을 한 장 올리면 추모관의 인상이 살아납니다.',
      done: Boolean(state.profile.heroImage),
    },
    {
      title: '생애 타임라인 3개 이상',
      description: '태어난 곳, 중요한 일, 가족이 기억하는 시간을 차례로 남깁니다.',
      done: state.timeline.length >= 3,
    },
    {
      title: `${memorySceneLabel()} 2개 이상`,
      description: '좋아했던 것, 자주 하던 말, 가족이 간직한 장면을 짧게 적습니다.',
      done: state.moments.length >= 2,
    },
    {
      title: '방문자 링크와 QR 준비',
      description: '묘비, 추모 앨범, 문자 메시지에 넣을 링크와 QR 카드를 준비합니다.',
      done: Boolean(state.profile.slug),
    },
    {
      title: '가족 초대',
      description: '함께 관리할 가족에게 편집 링크를 보내 기록을 나눠 맡습니다.',
      done: state.editorInvites.some((invite) => invite.status === 'active'),
    },
    {
      title: '백업 파일 저장',
      description: '생애 기록과 방명록을 가족이 보관할 수 있는 파일로 내려받습니다.',
      done: Boolean(state.lastBackupDownloadedAt),
    },
  ]
}

function renderCopyField({ label, value, description, buttonLabel = '복사', extraClass = '' }) {
  return `
    <div class="copy-field ${extraClass}">
      <span class="field-label">${escapeHtml(label)}</span>
      <div class="copy-field-row">
        <input value="${escapeHtml(value)}" readonly aria-label="${escapeHtml(label)}" />
        <button type="button" class="secondary-button" data-copy-text="${escapeHtml(value)}">
          ${escapeHtml(buttonLabel)}
        </button>
      </div>
      <p>${escapeHtml(description)}</p>
    </div>
  `
}

function selectOption(value, label) {
  const selected = state.profile.visibility === value ? 'selected' : ''
  return `<option value="${value}" ${selected}>${label}</option>`
}

function renderThemePicker() {
  return `
    <div class="theme-field">
      <span class="field-label">분위기</span>
      <div class="theme-grid" role="radiogroup" aria-label="페이지 분위기">
        ${DESIGN_THEMES.map(renderThemeChoice).join('')}
      </div>
    </div>
  `
}

function renderTagAssistant() {
  return `
    <div class="tag-assistant">
      <div class="tag-assistant-header">
        <div>
          <span class="field-label">AI 태그 초안</span>
          <p>${escapeHtml(tagAssistantDescription())}</p>
        </div>
        <button type="button" class="secondary-button" data-generate-tags>
          추천 받기
        </button>
      </div>
      ${
        state.tagSuggestions.length
          ? `
            <div class="suggested-tags" aria-label="추천 태그">
              ${state.tagSuggestions
                .map(
                  (tag) => `
                    <button type="button" class="suggested-tag" data-accept-tag="${escapeHtml(tag)}">
                      #${escapeHtml(tag)}
                    </button>
                  `,
                )
                .join('')}
            </div>
            <button type="button" class="primary-button" data-accept-all-tags>
              모두 키워드에 추가
            </button>
          `
          : '<p class="empty-text">생애 글과 방명록을 바탕으로 어울리는 키워드를 추천합니다.</p>'
      }
    </div>
  `
}

function tagAssistantDescription() {
  return currentMemorialKind().id === 'pet'
    ? '함께한 일상에서 드러나는 성격과 추억을 태그로 정리합니다.'
    : '생애와 관계 속에서 반복되는 단어를 태그로 정리합니다.'
}

function renderKindPicker() {
  return `
    <div class="theme-field">
      <span class="field-label">기억 대상</span>
      <div class="choice-grid" role="radiogroup" aria-label="기억 대상">
        ${MEMORIAL_KINDS.map((kind) =>
          renderTextChoice({
            ...kind,
            selected: currentMemorialKind().id === kind.id,
            dataAttribute: 'data-kind-choice',
          }),
        ).join('')}
      </div>
    </div>
  `
}

function renderTemplatePicker() {
  return `
    <div class="theme-field">
      <span class="field-label">페이지 구성</span>
      <div class="choice-grid" role="radiogroup" aria-label="페이지 구성">
        ${PAGE_TEMPLATES.map((template) =>
          renderTextChoice({
            ...template,
            selected: currentPageTemplate().id === template.id,
            dataAttribute: 'data-template-choice',
          }),
        ).join('')}
      </div>
    </div>
  `
}

function renderTextChoice(choice) {
  return `
    <button
      type="button"
      class="text-choice ${choice.selected ? 'is-selected' : ''}"
      ${choice.dataAttribute}="${choice.id}"
      role="radio"
      aria-checked="${choice.selected}"
    >
      <strong>${escapeHtml(choice.label)}</strong>
      <small>${escapeHtml(choice.description)}</small>
    </button>
  `
}

function renderThemeChoice(theme) {
  const selected = currentDesignTheme().id === theme.id

  return `
    <button
      type="button"
      class="theme-choice ${selected ? 'is-selected' : ''}"
      data-theme-choice="${theme.id}"
      role="radio"
      aria-checked="${selected}"
    >
      <span class="theme-swatch-row" aria-hidden="true">
        ${theme.swatches
          .map((color) => `<span class="theme-swatch" style="background: ${color}"></span>`)
          .join('')}
      </span>
      <strong>${escapeHtml(theme.label)}</strong>
      <small>${escapeHtml(theme.description)}</small>
    </button>
  `
}

function renderModerationEntry(entry) {
  return `
    <article class="moderation-entry">
      <div>
        <strong>${escapeHtml(entry.author)}</strong>
        <span>${escapeHtml(guestbookStatusLabel(entry.status))}</span>
      </div>
      <p>${escapeHtml(entry.message)}</p>
      <div class="button-row">
        <button type="button" class="secondary-button" data-approve="${entry.id}">승인</button>
        <button type="button" class="secondary-button" data-hide="${entry.id}">숨김</button>
        <button type="button" class="secondary-button" data-pin="${entry.id}">
          ${entry.pinned ? '고정 해제' : '고정'}
        </button>
      </div>
    </article>
  `
}

function renderEditorAccessNote() {
  if (state.currentEditorLabel) {
    return `
      <p class="form-note access-note">
        현재 <strong>${escapeHtml(state.currentEditorLabel)}</strong> 권한으로 편집 중입니다. 저장한 변경은 이 이름으로 편집 기록에 남습니다.
      </p>
    `
  }

  if (state.editorToken && state.isApiBacked) {
    return '<p class="form-note access-note">유족 코드가 확인되면 편집, 초대, 방명록 관리가 가능합니다.</p>'
  }

  return ''
}

function renderEditorInvite(invite) {
  const active = invite.status === 'active'

  return `
    <article class="invite-entry ${active ? '' : 'is-muted'}">
      <div>
        <strong>${escapeHtml(invite.inviteeLabel)}</strong>
        <span>${escapeHtml(active ? '사용 가능' : '회수됨')}</span>
      </div>
      <p>만료일 ${escapeHtml(invite.expiresAt || '-')}</p>
      <small>${invite.lastUsedAt ? `최근 사용 ${escapeHtml(invite.lastUsedAt)}` : `생성 ${escapeHtml(invite.createdAt)}`}</small>
      ${
        active
          ? `
            <div class="button-row">
              <button type="button" class="secondary-button" data-revoke-invite="${escapeHtml(invite.id)}">
                초대 회수
              </button>
            </div>
          `
          : ''
      }
    </article>
  `
}

function renderTimelineEditorEntry(item) {
  return `
    <form class="memory-edit-entry" data-life-event-edit-form="${escapeHtml(item.id)}">
      <div class="memory-edit-heading">
        <strong>${escapeHtml(item.year)}</strong>
        <span>${escapeHtml(item.title)}</span>
      </div>
      <div class="compact-grid">
        <label>
          연도
          <input name="year" value="${escapeHtml(item.year)}" required />
        </label>
        <label>
          제목
          <input name="title" value="${escapeHtml(item.title)}" required />
        </label>
      </div>
      <label>
        내용
        <textarea name="body" rows="3" required>${escapeHtml(item.body)}</textarea>
      </label>
      <div class="button-row">
        <button type="submit" class="secondary-button">수정</button>
        <button type="button" class="danger-button" data-delete-life-event="${escapeHtml(item.id)}">삭제</button>
      </div>
    </form>
  `
}

function renderMomentEditorEntry(item) {
  return `
    <form class="memory-edit-entry" data-moment-edit-form="${escapeHtml(item.id)}">
      <div class="memory-edit-heading">
        <strong>${escapeHtml(item.tag || '기억')}</strong>
        <span>${escapeHtml(item.title)}</span>
      </div>
      <div class="compact-grid">
        <label>
          제목
          <input name="title" value="${escapeHtml(item.title)}" required />
        </label>
        <label>
          분류
          <input name="tag" value="${escapeHtml(item.tag || '')}" />
        </label>
      </div>
      <label>
        영상/사진 링크
        <input name="mediaUrl" value="${escapeHtml(item.mediaUrl || '')}" />
      </label>
      <label>
        내용
        <textarea name="body" rows="4" required>${escapeHtml(item.body)}</textarea>
      </label>
      <div class="button-row">
        <button type="submit" class="secondary-button">수정</button>
        <button type="button" class="danger-button" data-delete-moment="${escapeHtml(item.id)}">삭제</button>
      </div>
    </form>
  `
}

function renderEditHistoryEntry(event) {
  return `
    <article class="edit-history-entry">
      <div>
        <strong>${escapeHtml(event.editorName || '유족')}</strong>
        <span>${escapeHtml(editActionLabel(event.actionType))}</span>
      </div>
      <p>${escapeHtml(event.summary)}</p>
      <small>${escapeHtml(event.createdAt)}</small>
    </article>
  `
}

function editActionLabel(actionType) {
  const labels = {
    memorial_created: '생성',
    profile_updated: '프로필 수정',
    life_event_created: '타임라인 추가',
    life_event_updated: '타임라인 수정',
    life_event_deleted: '타임라인 삭제',
    moment_created: '기억 카드 추가',
    moment_updated: '기억 카드 수정',
    moment_deleted: '기억 카드 삭제',
    editor_invite_created: '가족 초대',
    editor_invite_revoked: '초대 회수',
    guestbook_moderated: '방명록 관리',
    guestbook_author_updated: '방명록 직접 수정',
    guestbook_author_deleted: '방명록 직접 삭제',
    backup_restored: '백업 복구',
  }

  return labels[actionType] ?? actionType ?? '편집'
}

function buildLocalEditEvent(actionType, summary) {
  return {
    id: `e${Date.now()}`,
    editorName: currentEditorName(),
    actionType,
    summary,
    createdAt: new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

function bindGlobalEvents() {
  app
    .querySelector('[data-create-memorial-form]')
    ?.addEventListener('submit', handleCreateMemorialForm)
  app.querySelector('[data-private-token-form]')?.addEventListener('submit', handlePrivateTokenForm)

  app.querySelectorAll('[data-tab]').forEach((element) => {
    element.addEventListener('click', () => {
      const nextTab = element.dataset.tab

      if (nextTab === 'editor' && state.isApiBacked) {
        loadFromApi({ includeModeration: true, activeTab: 'editor' })
        return
      }

      setState((current) => ({
        ...current,
        activeTab: nextTab,
        apiError: nextTab === 'editor' ? current.apiError : '',
      }))
    })
  })

  app.querySelector('[data-story-prev]')?.addEventListener('click', () => {
    setState((current) => ({
      ...current,
      storyIndex:
        (current.storyIndex - 1 + current.moments.length) % current.moments.length,
    }))
  })

  app.querySelector('[data-story-next]')?.addEventListener('click', () => {
    setState((current) => ({
      ...current,
      storyIndex: (current.storyIndex + 1) % current.moments.length,
    }))
  })

  app.querySelector('[data-guest-form]')?.addEventListener('submit', handleGuestForm)
  app.querySelectorAll('[data-owned-guest-form]').forEach((form) => {
    form.addEventListener('submit', handleOwnedGuestEditForm)
  })
  app.querySelector('[data-profile-form]')?.addEventListener('submit', handleProfileForm)
  app.querySelector('[data-hero-image-input]')?.addEventListener('change', handleHeroImagePreview)
  app.querySelector('[data-quick-record-form]')?.addEventListener('submit', handleQuickRecordForm)
  app.querySelector('[data-timeline-form]')?.addEventListener('submit', handleTimelineForm)
  app.querySelector('[data-moment-form]')?.addEventListener('submit', handleMomentForm)
  app.querySelector('[data-invite-form]')?.addEventListener('submit', handleInviteForm)
  app.querySelectorAll('[data-copy-text]').forEach((button) => {
    button.addEventListener('click', () => copyTextToClipboard(button.dataset.copyText ?? '', button))
  })
  app.querySelectorAll('[data-life-event-edit-form]').forEach((form) => {
    form.addEventListener('submit', handleTimelineEditForm)
  })
  app.querySelectorAll('[data-moment-edit-form]').forEach((form) => {
    form.addEventListener('submit', handleMomentEditForm)
  })
  app.querySelectorAll('[data-download-qr]').forEach((button) => {
    button.addEventListener('click', downloadQrCard)
  })
  app.querySelectorAll('[data-download-backup]').forEach((button) => {
    button.addEventListener('click', downloadMemoryBackup)
  })
  app
    .querySelector('[data-backup-import-input]')
    ?.addEventListener('change', handleBackupImportFile)
  app
    .querySelector('[data-apply-backup-import]')
    ?.addEventListener('click', applyBackupImport)
  app.querySelectorAll('[data-revoke-invite]').forEach((button) => {
    button.addEventListener('click', () => revokeEditorInvite(button.dataset.revokeInvite))
  })
  app.querySelectorAll('[data-delete-life-event]').forEach((button) => {
    button.addEventListener('click', () => deleteLifeEvent(button.dataset.deleteLifeEvent))
  })
  app.querySelectorAll('[data-delete-moment]').forEach((button) => {
    button.addEventListener('click', () => deleteMoment(button.dataset.deleteMoment))
  })
  app.querySelectorAll('[data-delete-owned-guest]').forEach((button) => {
    button.addEventListener('click', () => deleteOwnedGuestEntry(button.dataset.deleteOwnedGuest))
  })
  app.querySelector('[data-generate-tags]')?.addEventListener('click', () => {
    setState((current) => {
      const profile = mergeProfileDraft(current)

      return {
        ...current,
        profile,
        tagSuggestions: suggestTags(profile),
      }
    })
  })
  app.querySelector('[data-accept-all-tags]')?.addEventListener('click', () => {
    acceptSuggestedTags(state.tagSuggestions)
  })
  app.querySelectorAll('[data-accept-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      acceptSuggestedTags([button.dataset.acceptTag].filter(Boolean))
    })
  })
  app.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      setState((current) => ({
        ...current,
        profile: mergeProfileDraft(current),
        designTheme: button.dataset.themeChoice ?? DEFAULT_DESIGN_THEME,
      }))
    })
  })
  app.querySelectorAll('[data-kind-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      setState((current) => ({
        ...current,
        profile: mergeProfileDraft(current),
        memorialKind: button.dataset.kindChoice ?? DEFAULT_MEMORIAL_KIND,
      }))
    })
  })
  app.querySelectorAll('[data-template-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      setState((current) => ({
        ...current,
        profile: mergeProfileDraft(current),
        pageTemplate: button.dataset.templateChoice ?? DEFAULT_PAGE_TEMPLATE,
      }))
    })
  })
  app.querySelector('[data-save-design]')?.addEventListener('click', handleDesignSave)
  app.querySelector('[data-editor-name]')?.addEventListener('input', (event) => {
    state = {
      ...state,
      editorName: event.target.value.trim() || '유족',
    }
    saveState()
  })
  app.querySelector('[data-editor-token]')?.addEventListener('input', (event) => {
    state = {
      ...state,
      editorToken: event.target.value.trim(),
    }
    saveState()
  })

  app.querySelectorAll('[data-approve]').forEach((button) => {
    button.addEventListener('click', () => updateGuestStatus(button.dataset.approve, 'approved'))
  })

  app.querySelectorAll('[data-hide]').forEach((button) => {
    button.addEventListener('click', () => updateGuestStatus(button.dataset.hide, 'hidden'))
  })

  app.querySelectorAll('[data-pin]').forEach((button) => {
    button.addEventListener('click', () => toggleGuestPin(button.dataset.pin))
  })
}

async function handleCreateMemorialForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const formData = new FormData(form)
  const submitButton = form.querySelector('[data-create-submit]')
  const editorName = '유족'

  if (submitButton) {
    submitButton.disabled = true
    submitButton.textContent = '만드는 중'
  }

  try {
    const result = await apiRequest('/api/memory/memorials', {
      method: 'POST',
      body: JSON.stringify({
        displayName: formText(formData, 'displayName'),
        years: formText(formData, 'years') || null,
        subtitle: formText(formData, 'subtitle') || null,
        location: formText(formData, 'location') || null,
        visibility: 'link',
        tags: parseTags(String(formData.get('tags') ?? '')),
        memorialKind: String(formData.get('memorialKind') ?? DEFAULT_MEMORIAL_KIND),
        pageTemplate: String(formData.get('pageTemplate') ?? DEFAULT_PAGE_TEMPLATE),
        designTheme: String(formData.get('designTheme') ?? DEFAULT_DESIGN_THEME),
        editorName,
      }),
    })
    const nextState = {
      ...structuredClone(initialState),
      ...normalizeApiMemorial(result.memorial),
      activeTab: 'editor',
      editorName,
      editorToken: result.editorToken,
      lastIssuedEditorToken: result.editorToken,
      isApiBacked: true,
      isLoading: false,
      apiError: '',
    }

    window.history.pushState(null, '', memoryPageUrlForSlug(nextState.profile.slug))
    state = nextState
    saveState()
    render()
  } catch (error) {
    setState((current) => ({
      ...current,
      apiError:
        error.status === 409
          ? '이미 사용 중인 주소입니다. 다시 시도해주세요.'
          : error.status === 429
            ? '짧은 시간에 새 추모관을 너무 많이 만들었습니다. 잠시 후 다시 시도해주세요.'
            : '새 추모관을 만들려면 백엔드 연결이 필요합니다.',
    }))
  } finally {
    if (submitButton && document.body.contains(submitButton)) {
      submitButton.disabled = false
      submitButton.textContent = '추모관 만들기'
    }
  }
}

async function handlePrivateTokenForm(event) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  const token = formText(formData, 'editorToken')

  if (!token) {
    setState((current) => ({
      ...current,
      apiError: '유족 코드를 입력해 주세요.',
    }))
    return
  }

  state = {
    ...state,
    activeTab: 'editor',
    editorToken: token,
  }
  saveState()
  await loadFromApi({ includeModeration: true, activeTab: 'editor' })
}

async function copyTextToClipboard(text, button) {
  if (!text) return

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      fallbackCopyText(text)
    }

    showCopiedButtonState(button)
  } catch {
    window.prompt('아래 내용을 복사해 주세요.', text)
  }
}

function fallbackCopyText(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error('Copy failed')
  }
}

function showCopiedButtonState(button) {
  const originalText = button.textContent
  button.textContent = '복사됨'
  button.disabled = true

  window.setTimeout(() => {
    if (!document.body.contains(button)) return

    button.textContent = originalText
    button.disabled = false
  }, 1400)
}

async function handleGuestForm(event) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  const payload = {
    author: formData.get('author').trim(),
    relation: formData.get('relation').trim(),
    message: formData.get('message').trim(),
  }

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      const entry = await apiRequest(`/api/memory/memorials/${currentMemorySlug()}/guestbook`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const ownedEntry = normalizeGuestbookEntry(entry, entry.ownerToken)

      setState((current) => ({
        ...current,
        activeTab: 'guestbook',
        ownedGuestbookEntries: upsertOwnedGuestbookEntry(current.ownedGuestbookEntries, ownedEntry),
      }))
      event.currentTarget.reset()
    })
    if (!ok) return
    return
  }

  const entry = {
    id: `g${Date.now()}`,
    ...payload,
    status: 'pending',
    pinned: false,
    ownerToken: `local-${Date.now()}`,
    createdAt: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    updatedAt: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
  }

  setState((current) => ({
    ...current,
    activeTab: 'guestbook',
    guestbook: [entry, ...current.guestbook],
    ownedGuestbookEntries: upsertOwnedGuestbookEntry(current.ownedGuestbookEntries, entry),
  }))
  event.currentTarget.reset()
}

async function handleOwnedGuestEditForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const id = form.dataset.ownedGuestForm
  const ownedEntry = findOwnedGuestbookEntry(id)
  if (!ownedEntry) return

  const formData = new FormData(form)
  const payload = {
    author: formText(formData, 'author'),
    relation: formText(formData, 'relation'),
    message: formText(formData, 'message'),
  }

  if (state.isApiBacked) {
    const ok = await runGuestbookOwnerAction(async () => {
      const updated = await apiRequest(`/api/memory/guestbook/${id}/owner`, {
        method: 'PATCH',
        headers: guestbookOwnerHeader(ownedEntry.ownerToken),
        body: JSON.stringify(payload),
      })
      const updatedEntry = normalizeGuestbookEntry(updated, ownedEntry.ownerToken)

      setState((current) => ({
        ...current,
        guestbook: current.guestbook.map((entry) =>
          String(entry.id) === String(id) ? updatedEntry : entry,
        ),
        ownedGuestbookEntries: upsertOwnedGuestbookEntry(current.ownedGuestbookEntries, updatedEntry),
      }))
    })
    if (!ok) return
    return
  }

  const updatedEntry = {
    ...ownedEntry,
    ...payload,
    status: 'pending',
    pinned: false,
    updatedAt: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
  }

  setState((current) => ({
    ...current,
    guestbook: current.guestbook.map((entry) =>
      String(entry.id) === String(id) ? updatedEntry : entry,
    ),
    ownedGuestbookEntries: upsertOwnedGuestbookEntry(current.ownedGuestbookEntries, updatedEntry),
  }))
}

async function deleteOwnedGuestEntry(id) {
  const ownedEntry = findOwnedGuestbookEntry(id)
  if (!ownedEntry || !window.confirm('내가 남긴 방명록을 삭제할까요?')) return

  if (state.isApiBacked) {
    const ok = await runGuestbookOwnerAction(async () => {
      await apiRequest(`/api/memory/guestbook/${id}/owner`, {
        method: 'DELETE',
        headers: guestbookOwnerHeader(ownedEntry.ownerToken),
      })
      setState((current) => removeOwnedGuestbookEntry(current, id))
    })
    if (!ok) return
    return
  }

  setState((current) => removeOwnedGuestbookEntry(current, id))
}

function findOwnedGuestbookEntry(id) {
  return (state.ownedGuestbookEntries ?? []).find((entry) => String(entry.id) === String(id))
}

function upsertOwnedGuestbookEntry(entries = [], nextEntry) {
  const filtered = entries.filter((entry) => String(entry.id) !== String(nextEntry.id))

  return [nextEntry, ...filtered]
}

function removeOwnedGuestbookEntry(current, id) {
  return {
    ...current,
    guestbook: current.guestbook.filter((entry) => String(entry.id) !== String(id)),
    ownedGuestbookEntries: (current.ownedGuestbookEntries ?? []).filter(
      (entry) => String(entry.id) !== String(id),
    ),
  }
}

async function handleProfileForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const formData = new FormData(form)
  const file = formData.get('heroImage')
  const profile = {
    ...(readProfileDraftFromEditor(state.profile, form) ?? state.profile),
  }

  if (file?.size && !validateHeroImageFile(file)) {
    return
  }

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      const heroImage = file?.size ? await uploadMemoryImage(file) : state.profile.heroImage

      await apiRequest(`/api/memory/memorials/${currentMemorySlug()}`, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: profile.name,
          years: profile.years,
          subtitle: profile.subtitle,
          location: profile.location,
          visibility: profile.visibility,
          heroImageUrl: heroImage,
          tags: profile.tags,
          designTheme: currentDesignTheme().id,
          memorialKind: currentMemorialKind().id,
          pageTemplate: currentPageTemplate().id,
          editorName: currentEditorName(),
        }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })
    if (!ok) return
    return
  }

  const heroImage = file?.size ? await readFileAsDataUrl(file) : state.profile.heroImage

  setState((current) => ({
    ...current,
    profile: {
      ...current.profile,
      ...profile,
      heroImage,
    },
    pendingHeroPreview: '',
    pendingHeroFileName: '',
    memorialKind: currentMemorialKind().id,
    pageTemplate: currentPageTemplate().id,
    editHistory: [
      buildLocalEditEvent('profile_updated', '생애 페이지 기본 정보를 수정했습니다.'),
      ...current.editHistory,
    ],
    tagSuggestions: [],
  }))
}

async function handleHeroImagePreview(event) {
  const file = event.target.files?.[0]

  if (!file) {
    setState((current) => ({
      ...current,
      pendingHeroPreview: '',
      pendingHeroFileName: '',
      apiError: '',
    }))
    return
  }

  if (!validateHeroImageFile(file)) {
    event.target.value = ''
    return
  }

  const preview = await readFileAsDataUrl(file)

  setState((current) => ({
    ...current,
    pendingHeroPreview: preview,
    pendingHeroFileName: file.name,
    apiError: '',
  }))
}

function validateHeroImageFile(file) {
  if (!file.type.startsWith('image/')) {
    setState((current) => ({
      ...current,
      pendingHeroPreview: '',
      pendingHeroFileName: '',
      apiError: '대표 사진은 이미지 파일만 선택할 수 있습니다.',
    }))
    return false
  }

  if (file.size > MAX_HERO_IMAGE_BYTES) {
    setState((current) => ({
      ...current,
      pendingHeroPreview: '',
      pendingHeroFileName: '',
      apiError: '대표 사진은 5MB 이하 파일만 올릴 수 있습니다.',
    }))
    return false
  }

  return true
}

async function handleDesignSave(event) {
  const button = event.currentTarget
  const originalText = button.textContent

  button.disabled = true
  button.textContent = '저장 중'

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      await apiRequest(`/api/memory/memorials/${currentMemorySlug()}`, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: state.profile.name,
          years: state.profile.years,
          subtitle: state.profile.subtitle,
          location: state.profile.location,
          visibility: state.profile.visibility,
          heroImageUrl: state.profile.heroImage,
          tags: state.profile.tags,
          designTheme: currentDesignTheme().id,
          memorialKind: currentMemorialKind().id,
          pageTemplate: currentPageTemplate().id,
          editorName: currentEditorName(),
        }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })

    if (!ok && document.body.contains(button)) {
      button.disabled = false
      button.textContent = originalText
    }
    return
  }

  setState((current) => ({
    ...current,
    editHistory: [
      buildLocalEditEvent('profile_updated', '페이지 디자인을 수정했습니다.'),
      ...current.editHistory,
    ],
  }))

  if (document.body.contains(button)) {
    button.disabled = false
    button.textContent = originalText
  }
}

async function handleQuickRecordForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const formData = new FormData(form)
  const submitButton = form.querySelector('[data-quick-record-submit]')
  const lifeDraft = {
    id: `t${Date.now()}`,
    year: formText(formData, 'quickLifeYear') || '기억',
    title: formText(formData, 'quickLifeTitle'),
    body: formText(formData, 'quickLifeBody'),
  }
  const momentDraft = {
    id: `m${Date.now()}`,
    title: formText(formData, 'quickMomentTitle'),
    body: formText(formData, 'quickMomentBody'),
    tag: formText(formData, 'quickMomentTag') || '기억',
    mediaUrl: safeMediaUrl(formText(formData, 'quickMomentMediaUrl')),
  }
  const wantsLifeEvent = Boolean(lifeDraft.title || lifeDraft.body)
  const wantsMoment = Boolean(momentDraft.title || momentDraft.body || momentDraft.mediaUrl)
  const canCreateLifeEvent = Boolean(lifeDraft.title && lifeDraft.body)
  const canCreateMoment = Boolean(momentDraft.title && momentDraft.body)

  if ((!wantsLifeEvent && !wantsMoment) || (wantsLifeEvent && !canCreateLifeEvent) || (wantsMoment && !canCreateMoment)) {
    setState((current) => ({
      ...current,
      apiError: '빠른 기록은 제목과 내용을 함께 입력해야 추가할 수 있습니다.',
    }))
    return
  }

  if (submitButton) {
    submitButton.disabled = true
    submitButton.textContent = '추가 중'
  }

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      if (canCreateLifeEvent) {
        await apiRequest(`/api/memory/memorials/${currentMemorySlug()}/life-events`, {
          method: 'POST',
          body: JSON.stringify({
            eventYear: lifeDraft.year,
            title: lifeDraft.title,
            body: lifeDraft.body,
            editorName: currentEditorName(),
          }),
        })
      }

      if (canCreateMoment) {
        await apiRequest(`/api/memory/memorials/${currentMemorySlug()}/moments`, {
          method: 'POST',
          body: JSON.stringify({
            title: momentDraft.title,
            body: momentDraft.body,
            tag: momentDraft.tag,
            mediaUrl: momentDraft.mediaUrl || null,
            editorName: currentEditorName(),
          }),
        })
      }

      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })

    if (ok) {
      form.reset()
    } else if (submitButton && document.body.contains(submitButton)) {
      submitButton.disabled = false
      submitButton.textContent = '기록 추가'
    }
    return
  }

  setState((current) => {
    const editHistory = []

    if (canCreateLifeEvent) {
      editHistory.push(
        buildLocalEditEvent('life_event_created', `'${lifeDraft.title}' 타임라인을 추가했습니다.`),
      )
    }

    if (canCreateMoment) {
      editHistory.push(
        buildLocalEditEvent('moment_created', `'${momentDraft.title}' 기억 카드를 추가했습니다.`),
      )
    }

    return {
      ...current,
      apiError: '',
      storyIndex: canCreateMoment ? current.moments.length : current.storyIndex,
      timeline: canCreateLifeEvent ? [...current.timeline, lifeDraft] : current.timeline,
      moments: canCreateMoment ? [...current.moments, momentDraft] : current.moments,
      editHistory: [...editHistory, ...current.editHistory],
    }
  })

  form.reset()

  if (submitButton && document.body.contains(submitButton)) {
    submitButton.disabled = false
    submitButton.textContent = '기록 추가'
  }
}

async function uploadMemoryImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(apiUrl(`/api/memory/memorials/${currentMemorySlug()}/uploads`), {
    method: 'POST',
    headers: editorTokenHeader(),
    body: formData,
  })

  if (!response.ok) {
    const error = new Error(`API ${response.status}`)
    error.status = response.status
    throw error
  }

  const result = await response.json()

  return result.url?.startsWith('/') ? apiUrl(result.url) : result.url
}

async function handleInviteForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const formData = new FormData(form)
  const expiresInDays = Number(formData.get('expiresInDays') ?? 14)

  if (!state.isApiBacked) {
    setState((current) => ({
      ...current,
      apiError: '가족 초대 링크는 백엔드 연결 후 만들 수 있습니다.',
    }))
    return
  }

  const ok = await runApiAction(async () => {
    const invite = await apiRequest(`/api/memory/memorials/${currentMemorySlug()}/editor-invites`, {
      method: 'POST',
      body: JSON.stringify({
        inviteeLabel: formText(formData, 'inviteeLabel') || null,
        expiresInDays: Number.isFinite(expiresInDays) ? expiresInDays : 14,
        editorName: currentEditorName(),
      }),
    })

    setState((current) => ({
      ...current,
      inviteLink: memoryInviteUrl(invite.token),
      apiError: '',
    }))
    await loadFromApi({ includeModeration: true, activeTab: 'editor' })
  })

  if (ok) form.reset()
}

async function revokeEditorInvite(id) {
  if (!id) return

  if (!state.isApiBacked) {
    setState((current) => ({
      ...current,
      editorInvites: current.editorInvites.map((invite) =>
        invite.id === id ? { ...invite, status: 'revoked' } : invite,
      ),
      editHistory: [
        buildLocalEditEvent('editor_invite_revoked', '가족 초대 링크를 회수했습니다.'),
        ...current.editHistory,
      ],
    }))
    return
  }

  const ok = await runApiAction(async () => {
    await apiRequest(`/api/memory/editor-invites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        editorName: currentEditorName(),
      }),
    })
    await loadFromApi({ includeModeration: true, activeTab: 'editor' })
  })

  if (!ok) return
}

function acceptSuggestedTags(tags) {
  const acceptedTags = tags.map((tag) => tag.trim()).filter(Boolean)

  if (!acceptedTags.length) return

  setState((current) => {
    const profile = mergeProfileDraft(current)
    const mergedTags = mergeTags(profile.tags, acceptedTags)

    return {
      ...current,
      profile: {
        ...profile,
        tags: mergedTags,
      },
      tagSuggestions: current.tagSuggestions.filter((tag) => !acceptedTags.includes(tag)),
    }
  })
}

function mergeProfileDraft(current) {
  const profileDraft = readProfileDraftFromEditor(current.profile)

  if (!profileDraft) {
    return current.profile
  }

  return {
    ...current.profile,
    ...profileDraft,
  }
}

function readProfileDraftFromEditor(
  fallbackProfile = state.profile,
  form = app.querySelector('[data-profile-form]'),
) {
  if (!form) return null

  const formData = new FormData(form)

  return {
    name: formText(formData, 'name'),
    years: formText(formData, 'years'),
    subtitle: formText(formData, 'subtitle'),
    location: formText(formData, 'location'),
    visibility: String(formData.get('visibility') ?? fallbackProfile.visibility),
    heroImage: fallbackProfile.heroImage,
    tags: parseTags(String(formData.get('tags') ?? '')),
  }
}

function formText(formData, name) {
  return String(formData.get(name) ?? '').trim()
}

function suggestTags(profile = state.profile) {
  const currentTags = profile.tags
  const availableSlots = Math.max(0, MAX_PROFILE_TAGS - currentTags.length)

  if (!availableSlots) {
    return []
  }

  const existing = new Set(currentTags.map(normalizeTag))
  const text = collectMemoryText(profile).join(' ')
  const candidates = []

  TAG_RULES.forEach((rule) => {
    if (rule.kind && rule.kind !== currentMemorialKind().id) return

    const matched = rule.words.some((word) => text.includes(word))
    if (matched) {
      candidates.push(rule.tag)
    }
  })

  extractFrequentWords(text, profile).forEach((word) => candidates.push(word))

  if (currentMemorialKind().id === 'pet') {
    candidates.push('함께한 일상', '작은 가족')
  } else {
    candidates.push('가족의 기억', '삶의 태도')
  }

  return mergeTags([], candidates)
    .filter((tag) => !existing.has(normalizeTag(tag)))
    .slice(0, Math.min(8, availableSlots))
}

function parseTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function mergeTags(currentTags, nextTags) {
  const seen = new Set()

  return [...currentTags, ...nextTags]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const normalized = normalizeTag(tag)
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
    .slice(0, MAX_PROFILE_TAGS)
}

function normalizeTag(tag) {
  return tag.replaceAll(/\s+/g, '').toLowerCase()
}

function collectMemoryText(profile = state.profile) {
  return [
    profile.name,
    profile.subtitle,
    profile.location,
    ...profile.tags,
    ...state.timeline.flatMap((item) => [item.year, item.title, item.body]),
    ...state.moments.flatMap((item) => [item.title, item.body, item.tag]),
    ...visibleGuestbookEntries().flatMap((entry) => [entry.author, entry.relation, entry.message]),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
}

function extractFrequentWords(text, profile = state.profile) {
  const stopwords = new Set([
    '그리고',
    '하지만',
    '그는',
    '그의',
    '있는',
    '없는',
    '합니다',
    '했습니다',
    '됩니다',
    '기억',
    '가족',
    '사람',
    '함께',
    '매일',
    '아직도',
    '모습',
  ])
  ;[profile.name, profile.years, profile.location]
    .filter(Boolean)
    .flatMap((value) => String(value).toLowerCase().split(/\s+/))
    .filter(Boolean)
    .forEach((word) => stopwords.add(cleanFrequentWord(word)))

  const counts = new Map()

  text
    .replaceAll(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => cleanFrequentWord(word.trim()))
    .filter((word) => word.length >= 2 && word.length <= 8)
    .filter((word) => !stopwords.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1))

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([word]) => word)
    .slice(0, 4)
}

function cleanFrequentWord(word) {
  return word.replace(/(으로|에게|에서|처럼|마다|까지|부터|와|과|은|는|이|가|을|를|의)$/u, '')
}

const TAG_RULES = [
  { tag: '강릉 바다', words: ['강릉', '주문진', '바다', '항구'] },
  { tag: '가족 사랑', words: ['가족', '손주', '아들', '딸'] },
  { tag: '교직의 삶', words: ['교직', '교단', '선생님', '제자'] },
  { tag: '성실함', words: ['성실', '약속', '먼저', '정직'] },
  { tag: '노래와 추억', words: ['노래', '음악', '합창'] },
  { tag: '다정한 인사', words: ['인사', '다정', '따뜻'] },
  { tag: '기록하는 습관', words: ['수첩', '기록', '적었습니다'] },
  { tag: '산책 친구', kind: 'pet', words: ['산책', '공원', '길'] },
  { tag: '장난꾸러기', kind: 'pet', words: ['장난', '뛰', '놀이', '공'] },
  { tag: '포근한 동반자', kind: 'pet', words: ['품', '잠', '곁', '따뜻'] },
]

async function handleTimelineForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const formData = new FormData(form)
  const item = {
    id: `t${Date.now()}`,
    year: formData.get('year').trim(),
    title: formData.get('title').trim(),
    body: formData.get('body').trim(),
  }

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      await apiRequest(`/api/memory/memorials/${currentMemorySlug()}/life-events`, {
        method: 'POST',
        body: JSON.stringify({
          eventYear: item.year,
          title: item.title,
          body: item.body,
          editorName: currentEditorName(),
        }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })
    if (!ok) return
    return
  }

  setState((current) => ({
    ...current,
    timeline: [...current.timeline, item],
    editHistory: [
      buildLocalEditEvent('life_event_created', `'${item.title}' 타임라인을 추가했습니다.`),
      ...current.editHistory,
    ],
  }))
}

async function handleMomentForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const formData = new FormData(form)
  const item = {
    id: `m${Date.now()}`,
    title: formText(formData, 'title'),
    body: formText(formData, 'body'),
    tag: formText(formData, 'tag') || '기억',
    mediaUrl: safeMediaUrl(formText(formData, 'mediaUrl')),
  }

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      await apiRequest(`/api/memory/memorials/${currentMemorySlug()}/moments`, {
        method: 'POST',
        body: JSON.stringify({
          title: item.title,
          body: item.body,
          tag: item.tag,
          mediaUrl: item.mediaUrl || null,
          editorName: currentEditorName(),
        }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })
    if (!ok) return
    return
  }

  setState((current) => ({
    ...current,
    storyIndex: current.moments.length,
    moments: [...current.moments, item],
    editHistory: [
      buildLocalEditEvent('moment_created', `'${item.title}' 기억 카드를 추가했습니다.`),
      ...current.editHistory,
    ],
  }))

  form.reset()
}

async function handleTimelineEditForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const id = form.dataset.lifeEventEditForm
  const formData = new FormData(form)
  const item = {
    year: formText(formData, 'year'),
    title: formText(formData, 'title'),
    body: formText(formData, 'body'),
  }

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      await apiRequest(`/api/memory/life-events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          eventYear: item.year,
          title: item.title,
          body: item.body,
          editorName: currentEditorName(),
        }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })
    if (!ok) return
    return
  }

  setState((current) => ({
    ...current,
    timeline: current.timeline.map((eventItem) =>
      String(eventItem.id) === String(id) ? { ...eventItem, ...item } : eventItem,
    ),
    editHistory: [
      buildLocalEditEvent('life_event_updated', `'${item.title}' 타임라인을 수정했습니다.`),
      ...current.editHistory,
    ],
  }))
}

async function deleteLifeEvent(id) {
  if (!id || !window.confirm('이 타임라인 기록을 삭제할까요?')) return

  const currentItem = state.timeline.find((item) => String(item.id) === String(id))

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      await apiRequest(`/api/memory/life-events/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({
          editorName: currentEditorName(),
        }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })
    if (!ok) return
    return
  }

  setState((current) => ({
    ...current,
    timeline: current.timeline.filter((item) => String(item.id) !== String(id)),
    editHistory: [
      buildLocalEditEvent(
        'life_event_deleted',
        `'${currentItem?.title ?? '타임라인'}' 타임라인을 삭제했습니다.`,
      ),
      ...current.editHistory,
    ],
  }))
}

async function handleMomentEditForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const id = form.dataset.momentEditForm
  const formData = new FormData(form)
  const item = {
    title: formText(formData, 'title'),
    body: formText(formData, 'body'),
    tag: formText(formData, 'tag') || '기억',
    mediaUrl: safeMediaUrl(formText(formData, 'mediaUrl')),
  }

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      await apiRequest(`/api/memory/moments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: item.title,
          body: item.body,
          tag: item.tag,
          mediaUrl: item.mediaUrl || null,
          editorName: currentEditorName(),
        }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })
    if (!ok) return
    return
  }

  setState((current) => ({
    ...current,
    moments: current.moments.map((moment) =>
      String(moment.id) === String(id) ? { ...moment, ...item } : moment,
    ),
    editHistory: [
      buildLocalEditEvent('moment_updated', `'${item.title}' 기억 카드를 수정했습니다.`),
      ...current.editHistory,
    ],
  }))
}

async function deleteMoment(id) {
  if (!id || !window.confirm('이 기억 카드를 삭제할까요?')) return

  const currentItem = state.moments.find((item) => String(item.id) === String(id))

  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      await apiRequest(`/api/memory/moments/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({
          editorName: currentEditorName(),
        }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })
    if (!ok) return
    return
  }

  setState((current) => {
    const nextMoments = current.moments.filter((item) => String(item.id) !== String(id))

    return {
      ...current,
      storyIndex: Math.min(current.storyIndex, Math.max(0, nextMoments.length - 1)),
      moments: nextMoments,
      editHistory: [
        buildLocalEditEvent(
          'moment_deleted',
          `'${currentItem?.title ?? '기억 카드'}' 기억 카드를 삭제했습니다.`,
        ),
        ...current.editHistory,
      ],
    }
  })
}

function safeMediaUrl(value) {
  const trimmed = String(value ?? '').trim()

  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)

    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result))
    reader.addEventListener('error', reject)
    reader.readAsDataURL(file)
  })
}

async function updateGuestStatus(id, status) {
  if (state.isApiBacked) {
    const ok = await runApiAction(async () => {
      await apiRequest(`/api/memory/guestbook/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, editorName: currentEditorName() }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })
    if (!ok) return
    return
  }

  setState((current) => ({
    ...current,
    guestbook: current.guestbook.map((entry) =>
      entry.id === id ? { ...entry, status } : entry,
    ),
    editHistory: [
      buildLocalEditEvent('guestbook_moderated', '방명록 상태를 수정했습니다.'),
      ...current.editHistory,
    ],
  }))
}

async function toggleGuestPin(id) {
  if (state.isApiBacked) {
    const entry = state.guestbook.find((item) => String(item.id) === String(id))
    const ok = await runApiAction(async () => {
      await apiRequest(`/api/memory/guestbook/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          pinned: !entry?.pinned,
          editorName: currentEditorName(),
        }),
      })
      await loadFromApi({ includeModeration: true, activeTab: 'editor' })
    })
    if (!ok) return
    return
  }

  setState((current) => ({
    ...current,
    guestbook: current.guestbook.map((entry) =>
      entry.id === id ? { ...entry, pinned: !entry.pinned } : entry,
    ),
    editHistory: [
      buildLocalEditEvent('guestbook_moderated', '방명록 고정 상태를 수정했습니다.'),
      ...current.editHistory,
    ],
  }))
}

function createQrSvg(text, options = {}) {
  const matrix = createQrMatrix(text)
  const moduleSize = options.moduleSize ?? 6
  const quiet = options.quiet ?? 4
  const size = (matrix.length + quiet * 2) * moduleSize

  return `
    <svg class="qr-code" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR 코드">
      <rect width="${size}" height="${size}" fill="${options.light ?? '#ffffff'}"/>
      ${renderQrModuleRects(matrix, {
        moduleSize,
        quiet,
        dark: options.dark ?? '#172033',
      })}
    </svg>
  `
}

function renderQrModuleRects(matrix, options = {}) {
  const moduleSize = options.moduleSize ?? 6
  const quiet = options.quiet ?? 4
  const offsetX = options.offsetX ?? 0
  const offsetY = options.offsetY ?? 0
  const dark = options.dark ?? '#172033'
  const rects = []

  matrix.forEach((row, y) => {
    row.forEach((module, x) => {
      if (!module) return

      rects.push(
        `<rect x="${offsetX + (x + quiet) * moduleSize}" y="${offsetY + (y + quiet) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${dark}"/>`,
      )
    })
  })

  return rects.join('')
}

function createQrMatrix(text) {
  const version = 4
  const size = 21 + (version - 1) * 4
  const dataCodewordCount = 64
  const blockDataCodewordCount = 32
  const errorCodewordCount = 18
  const bytes = Array.from(new TextEncoder().encode(text))
  const maxPayloadBytes = dataCodewordCount - 2

  if (bytes.length > maxPayloadBytes) {
    throw new Error(`QR payload is too long: ${bytes.length} bytes`)
  }

  const dataCodewords = createQrDataCodewords(bytes, dataCodewordCount)
  const blocks = [
    dataCodewords.slice(0, blockDataCodewordCount),
    dataCodewords.slice(blockDataCodewordCount),
  ]
  const errorBlocks = blocks.map((block) => reedSolomonRemainder(block, errorCodewordCount))
  const codewords = interleaveQrCodewords(blocks, errorBlocks)
  let bestMatrix = null
  let bestPenalty = Number.POSITIVE_INFINITY

  for (let mask = 0; mask < 8; mask += 1) {
    const qr = createEmptyQr(version)
    drawQrCodewords(qr, codewords)
    applyQrMask(qr, mask)
    drawQrFormatBits(qr, mask)

    const penalty = calculateQrPenalty(qr.modules)
    if (penalty < bestPenalty) {
      bestPenalty = penalty
      bestMatrix = qr.modules.map((row) => [...row])
    }
  }

  return bestMatrix
}

function createQrDataCodewords(bytes, dataCodewordCount) {
  const bits = []
  appendQrBits(bits, 0b0100, 4)
  appendQrBits(bits, bytes.length, 8)
  bytes.forEach((byte) => appendQrBits(bits, byte, 8))

  const maxBits = dataCodewordCount * 8
  appendQrBits(bits, 0, Math.min(4, maxBits - bits.length))

  while (bits.length % 8 !== 0) {
    bits.push(0)
  }

  const codewords = []
  for (let i = 0; i < bits.length; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0))
  }

  const padBytes = [0xec, 0x11]
  let padIndex = 0
  while (codewords.length < dataCodewordCount) {
    codewords.push(padBytes[padIndex % padBytes.length])
    padIndex += 1
  }

  return codewords
}

function appendQrBits(bits, value, length) {
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push((value >>> i) & 1)
  }
}

function interleaveQrCodewords(dataBlocks, errorBlocks) {
  const result = []

  for (let i = 0; i < dataBlocks[0].length; i += 1) {
    dataBlocks.forEach((block) => result.push(block[i]))
  }

  for (let i = 0; i < errorBlocks[0].length; i += 1) {
    errorBlocks.forEach((block) => result.push(block[i]))
  }

  return result
}

function createEmptyQr(version) {
  const size = 21 + (version - 1) * 4
  const modules = Array.from({ length: size }, () => Array(size).fill(false))
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false))
  const qr = { version, size, modules, isFunction }

  drawFinderPattern(qr, 3, 3)
  drawFinderPattern(qr, size - 4, 3)
  drawFinderPattern(qr, 3, size - 4)
  drawAlignmentPattern(qr, 26, 26)
  drawTimingPatterns(qr)
  drawQrFormatBits(qr, 0)
  setQrFunctionModule(qr, 8, size - 8, true)

  return qr
}

function drawFinderPattern(qr, centerX, centerY) {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const x = centerX + dx
      const y = centerY + dy

      if (!isInsideQr(qr, x, y)) continue

      const distance = Math.max(Math.abs(dx), Math.abs(dy))
      setQrFunctionModule(qr, x, y, distance !== 2 && distance !== 4)
    }
  }
}

function drawAlignmentPattern(qr, centerX, centerY) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy))
      setQrFunctionModule(qr, centerX + dx, centerY + dy, distance !== 1)
    }
  }
}

function drawTimingPatterns(qr) {
  for (let i = 8; i < qr.size - 8; i += 1) {
    const dark = i % 2 === 0
    setQrFunctionModule(qr, i, 6, dark)
    setQrFunctionModule(qr, 6, i, dark)
  }
}

function drawQrCodewords(qr, codewords) {
  const bits = codewords.flatMap((codeword) =>
    Array.from({ length: 8 }, (_, index) => (codeword >>> (7 - index)) & 1),
  )
  let bitIndex = 0
  let upward = true

  for (let right = qr.size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right -= 1
    }

    for (let vert = 0; vert < qr.size; vert += 1) {
      const y = upward ? qr.size - 1 - vert : vert

      for (let column = 0; column < 2; column += 1) {
        const x = right - column

        if (qr.isFunction[y][x]) continue

        qr.modules[y][x] = bitIndex < bits.length ? bits[bitIndex] === 1 : false
        bitIndex += 1
      }
    }

    upward = !upward
  }
}

function applyQrMask(qr, mask) {
  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (!qr.isFunction[y][x] && qrMaskMatches(mask, x, y)) {
        qr.modules[y][x] = !qr.modules[y][x]
      }
    }
  }
}

function qrMaskMatches(mask, x, y) {
  const product = x * y

  switch (mask) {
    case 0:
      return (x + y) % 2 === 0
    case 1:
      return y % 2 === 0
    case 2:
      return x % 3 === 0
    case 3:
      return (x + y) % 3 === 0
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0
    case 5:
      return ((product % 2) + (product % 3)) === 0
    case 6:
      return (((product % 2) + (product % 3)) % 2) === 0
    case 7:
      return ((((x + y) % 2) + (product % 3)) % 2) === 0
    default:
      return false
  }
}

function drawQrFormatBits(qr, mask) {
  const bits = getQrFormatBits(mask)

  for (let i = 0; i <= 5; i += 1) setQrFunctionModule(qr, 8, i, getQrBit(bits, i))
  setQrFunctionModule(qr, 8, 7, getQrBit(bits, 6))
  setQrFunctionModule(qr, 8, 8, getQrBit(bits, 7))
  setQrFunctionModule(qr, 7, 8, getQrBit(bits, 8))
  for (let i = 9; i < 15; i += 1) setQrFunctionModule(qr, 14 - i, 8, getQrBit(bits, i))

  for (let i = 0; i < 8; i += 1) {
    setQrFunctionModule(qr, qr.size - 1 - i, 8, getQrBit(bits, i))
  }

  for (let i = 8; i < 15; i += 1) {
    setQrFunctionModule(qr, 8, qr.size - 15 + i, getQrBit(bits, i))
  }

  setQrFunctionModule(qr, 8, qr.size - 8, true)
}

function getQrFormatBits(mask) {
  const errorCorrectionLevelM = 0b00
  let data = (errorCorrectionLevelM << 3) | mask
  let bits = data << 10
  const generator = 0b10100110111

  for (let i = 14; i >= 10; i -= 1) {
    if (((bits >>> i) & 1) !== 0) {
      bits ^= generator << (i - 10)
    }
  }

  return ((data << 10) | bits) ^ 0b101010000010010
}

function getQrBit(value, index) {
  return ((value >>> index) & 1) !== 0
}

function setQrFunctionModule(qr, x, y, dark) {
  if (!isInsideQr(qr, x, y)) return

  qr.modules[y][x] = dark
  qr.isFunction[y][x] = true
}

function isInsideQr(qr, x, y) {
  return x >= 0 && x < qr.size && y >= 0 && y < qr.size
}

function reedSolomonRemainder(data, degree) {
  const generator = reedSolomonGenerator(degree)
  const result = Array(degree).fill(0)

  data.forEach((byte) => {
    const factor = byte ^ result.shift()
    result.push(0)

    generator.slice(1).forEach((coefficient, index) => {
      result[index] ^= gfMultiply(coefficient, factor)
    })
  })

  return result
}

function reedSolomonGenerator(degree) {
  let result = [1]

  for (let i = 0; i < degree; i += 1) {
    result = multiplyPolynomials(result, [1, gfExp(i)])
  }

  return result
}

function multiplyPolynomials(left, right) {
  const result = Array(left.length + right.length - 1).fill(0)

  left.forEach((leftValue, leftIndex) => {
    right.forEach((rightValue, rightIndex) => {
      result[leftIndex + rightIndex] ^= gfMultiply(leftValue, rightValue)
    })
  })

  return result
}

const QR_GF_EXP = (() => {
  const exp = Array(512).fill(0)
  let value = 1

  for (let i = 0; i < 255; i += 1) {
    exp[i] = value
    value <<= 1
    if (value & 0x100) {
      value ^= 0x11d
    }
  }

  for (let i = 255; i < exp.length; i += 1) {
    exp[i] = exp[i - 255]
  }

  return exp
})()

const QR_GF_LOG = (() => {
  const log = Array(256).fill(0)

  for (let i = 0; i < 255; i += 1) {
    log[QR_GF_EXP[i]] = i
  }

  return log
})()

function gfExp(power) {
  return QR_GF_EXP[power]
}

function gfMultiply(left, right) {
  if (left === 0 || right === 0) {
    return 0
  }

  return QR_GF_EXP[QR_GF_LOG[left] + QR_GF_LOG[right]]
}

function calculateQrPenalty(matrix) {
  return (
    calculateQrRunPenalty(matrix) +
    calculateQrBlockPenalty(matrix) +
    calculateQrFinderLikePenalty(matrix) +
    calculateQrBalancePenalty(matrix)
  )
}

function calculateQrRunPenalty(matrix) {
  let penalty = 0

  const scanLine = (line) => {
    let runColor = line[0]
    let runLength = 1

    for (let i = 1; i <= line.length; i += 1) {
      if (line[i] === runColor) {
        runLength += 1
      } else {
        if (runLength >= 5) {
          penalty += 3 + (runLength - 5)
        }
        runColor = line[i]
        runLength = 1
      }
    }
  }

  matrix.forEach(scanLine)
  for (let x = 0; x < matrix.length; x += 1) {
    scanLine(matrix.map((row) => row[x]))
  }

  return penalty
}

function calculateQrBlockPenalty(matrix) {
  let penalty = 0

  for (let y = 0; y < matrix.length - 1; y += 1) {
    for (let x = 0; x < matrix.length - 1; x += 1) {
      const color = matrix[y][x]
      if (
        color === matrix[y][x + 1] &&
        color === matrix[y + 1][x] &&
        color === matrix[y + 1][x + 1]
      ) {
        penalty += 3
      }
    }
  }

  return penalty
}

function calculateQrFinderLikePenalty(matrix) {
  const patterns = ['10111010000', '00001011101']
  let penalty = 0

  const scanLine = (line) => {
    const value = line.map((module) => (module ? '1' : '0')).join('')

    patterns.forEach((pattern) => {
      let index = value.indexOf(pattern)
      while (index !== -1) {
        penalty += 40
        index = value.indexOf(pattern, index + 1)
      }
    })
  }

  matrix.forEach(scanLine)
  for (let x = 0; x < matrix.length; x += 1) {
    scanLine(matrix.map((row) => row[x]))
  }

  return penalty
}

function calculateQrBalancePenalty(matrix) {
  const total = matrix.length * matrix.length
  const dark = matrix.flat().filter(Boolean).length
  const percent = (dark * 100) / total

  return Math.floor(Math.abs(percent - 50) / 5) * 10
}

function downloadMemoryBackup() {
  const exportedAt = new Date()
  const backup = {
    schema: 'silver-memory-backup.v1',
    exportedAt: exportedAt.toISOString(),
    source: state.isApiBacked ? 'api' : 'browser-local',
    memorialUrl: memoryPageUrl(),
    profile: {
      slug: state.profile.slug,
      name: state.profile.name,
      years: state.profile.years,
      subtitle: state.profile.subtitle,
      location: state.profile.location,
      visibility: state.profile.visibility,
      heroImage: state.profile.heroImage,
      tags: state.profile.tags,
      designTheme: state.designTheme,
      memorialKind: state.memorialKind,
      pageTemplate: state.pageTemplate,
    },
    timeline: state.timeline,
    moments: state.moments,
    guestbook: state.guestbook,
    editorInvites: state.editorInvites.map((invite) => ({
      id: invite.id,
      inviteeLabel: invite.inviteeLabel,
      status: invite.status,
      expiresAt: invite.expiresAt,
      lastUsedAt: invite.lastUsedAt,
      createdAt: invite.createdAt,
    })),
    editHistory: state.editHistory,
    securityNote:
      '유족 코드와 초대 토큰 원문은 보안상 이 백업 파일에 포함하지 않습니다.',
  }
  const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], {
    type: 'application/json',
  })
  const link = document.createElement('a')
  const datePart = exportedAt.toISOString().slice(0, 10)

  link.href = URL.createObjectURL(blob)
  link.download = `silver-memory-backup-${safeFilenamePart(state.profile.slug || state.profile.name)}-${datePart}.json`
  link.click()
  URL.revokeObjectURL(link.href)

  setState((current) => ({
    ...current,
    lastBackupDownloadedAt: exportedAt.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))
}

async function handleBackupImportFile(event) {
  const file = event.target.files?.[0]

  if (!file) {
    setState((current) => ({
      ...current,
      pendingBackupImport: null,
      backupImportMessage: '',
    }))
    return
  }

  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const backup = normalizeMemoryBackup(parsed)

    setState((current) => ({
      ...current,
      pendingBackupImport: backup,
      backupImportMessage: `${file.name} 파일을 확인했습니다. 내용을 보고 임시 복구를 선택해 주세요.`,
      apiError: '',
    }))
  } catch (error) {
    event.target.value = ''
    setState((current) => ({
      ...current,
      pendingBackupImport: null,
      backupImportMessage: 'Silver Memory 백업 파일을 읽지 못했습니다. JSON 파일과 백업 형식을 확인해 주세요.',
    }))
  }
}

function applyBackupImport() {
  const backup = state.pendingBackupImport

  if (!backup) return

  const restoredAt = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const restoreMessage = `백업을 이 브라우저에 임시 복구했습니다. 운영 DB에는 아직 반영되지 않았습니다. (${restoredAt})`

  setState((current) => ({
    ...current,
    isApiBacked: false,
    activeTab: 'life',
    storyIndex: 0,
    profile: backup.profile,
    timeline: backup.timeline,
    moments: backup.moments,
    guestbook: backup.guestbook,
    editorInvites: backup.editorInvites,
    editHistory: [
      buildLocalEditEvent('backup_restored', '백업 파일을 이 브라우저에 임시 복구했습니다.'),
      ...backup.editHistory,
    ],
    designTheme: backup.designTheme,
    memorialKind: backup.memorialKind,
    pageTemplate: backup.pageTemplate,
    tagSuggestions: [],
    pendingHeroPreview: '',
    pendingHeroFileName: '',
    pendingBackupImport: null,
    backupImportMessage: restoreMessage,
    apiError: restoreMessage,
  }))
}

function normalizeMemoryBackup(value) {
  if (!value || typeof value !== 'object' || value.schema !== 'silver-memory-backup.v1') {
    throw new Error('Unsupported backup schema')
  }

  const profile = value.profile && typeof value.profile === 'object' ? value.profile : {}
  const normalizedProfile = {
    slug: stringOr(profile.slug, state.profile.slug || DEFAULT_MEMORY_SLUG),
    name: stringOr(profile.name, '이름 없음'),
    years: stringOr(profile.years, ''),
    subtitle: stringOr(profile.subtitle, ''),
    location: stringOr(profile.location, ''),
    visibility: allowedValue(profile.visibility, ['private', 'link', 'public'], 'link'),
    heroImage: stringOr(profile.heroImage, ''),
    tags: normalizeStringList(profile.tags).slice(0, MAX_PROFILE_TAGS),
  }

  return {
    exportedAt: stringOr(value.exportedAt, ''),
    profile: normalizedProfile,
    designTheme: allowedValue(profile.designTheme, DESIGN_THEMES.map((theme) => theme.id), DEFAULT_DESIGN_THEME),
    memorialKind: allowedValue(profile.memorialKind, MEMORIAL_KINDS.map((kind) => kind.id), DEFAULT_MEMORIAL_KIND),
    pageTemplate: allowedValue(profile.pageTemplate, PAGE_TEMPLATES.map((template) => template.id), DEFAULT_PAGE_TEMPLATE),
    timeline: normalizeBackupTimeline(value.timeline),
    moments: normalizeBackupMoments(value.moments),
    guestbook: normalizeBackupGuestbook(value.guestbook),
    editorInvites: normalizeBackupInvites(value.editorInvites),
    editHistory: normalizeBackupEditHistory(value.editHistory),
  }
}

function normalizeBackupTimeline(value) {
  return arrayOrEmpty(value).map((rawItem, index) => {
    const item = objectOrEmpty(rawItem)

    return {
      id: stringOr(item.id, `restore-t${index + 1}`),
      year: stringOr(item.year, ''),
      title: stringOr(item.title, '제목 없음'),
      body: stringOr(item.body, ''),
    }
  })
}

function normalizeBackupMoments(value) {
  return arrayOrEmpty(value).map((rawItem, index) => {
    const item = objectOrEmpty(rawItem)

    return {
      id: stringOr(item.id, `restore-m${index + 1}`),
      title: stringOr(item.title, '제목 없음'),
      body: stringOr(item.body, ''),
      tag: stringOr(item.tag, '기억'),
      mediaUrl: safeMediaUrl(stringOr(item.mediaUrl, '')),
    }
  })
}

function normalizeBackupGuestbook(value) {
  return arrayOrEmpty(value).map((rawEntry, index) => {
    const entry = objectOrEmpty(rawEntry)

    return {
      id: stringOr(entry.id, `restore-g${index + 1}`),
      author: stringOr(entry.author, '방문자'),
      relation: stringOr(entry.relation, ''),
      message: stringOr(entry.message, ''),
      status: allowedValue(entry.status, ['pending', 'approved', 'hidden'], 'pending'),
      pinned: Boolean(entry.pinned),
      createdAt: stringOr(entry.createdAt, ''),
    }
  })
}

function normalizeBackupInvites(value) {
  return arrayOrEmpty(value).map((rawInvite, index) => {
    const invite = objectOrEmpty(rawInvite)

    return {
      id: stringOr(invite.id, `restore-i${index + 1}`),
      inviteeLabel: stringOr(invite.inviteeLabel, '가족'),
      status: allowedValue(invite.status, ['active', 'revoked'], 'revoked'),
      expiresAt: stringOr(invite.expiresAt, ''),
      lastUsedAt: stringOr(invite.lastUsedAt, ''),
      createdAt: stringOr(invite.createdAt, ''),
    }
  })
}

function normalizeBackupEditHistory(value) {
  return arrayOrEmpty(value).map((rawEvent, index) => {
    const event = objectOrEmpty(rawEvent)

    return {
      id: stringOr(event.id, `restore-e${index + 1}`),
      editorName: stringOr(event.editorName, '유족'),
      actionType: stringOr(event.actionType, 'backup_imported'),
      targetType: stringOr(event.targetType, ''),
      targetId: event.targetId ?? null,
      summary: stringOr(event.summary, '백업에 포함된 편집 기록입니다.'),
      createdAt: stringOr(event.createdAt, ''),
    }
  })
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : []
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' ? value : {}
}

function normalizeStringList(value) {
  return arrayOrEmpty(value)
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
}

function stringOr(value, fallback) {
  const normalized = String(value ?? '').trim()

  return normalized || fallback
}

function allowedValue(value, allowedValues, fallback) {
  const normalized = String(value ?? '').trim()

  return allowedValues.includes(normalized) ? normalized : fallback
}

function safeFilenamePart(value) {
  return String(value || 'memorial')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'memorial'
}

function downloadQrCard() {
  const pageUrl = memoryPageUrl()
  const theme = currentDesignTheme()
  const qrMatrix = createQrMatrix(pageUrl)
  const qrModuleSize = 5
  const qrQuiet = 4
  const qrOffsetX = 612
  const qrOffsetY = 96
  const qrSize = (qrMatrix.length + qrQuiet * 2) * qrModuleSize
  const qrRects = renderQrModuleRects(qrMatrix, {
    moduleSize: qrModuleSize,
    quiet: qrQuiet,
    offsetX: qrOffsetX,
    offsetY: qrOffsetY,
    dark: theme.qrDark,
  })
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
      <rect width="900" height="520" fill="${theme.swatches[0]}"/>
      <rect x="42" y="42" width="816" height="436" rx="24" fill="#ffffff" stroke="${theme.qrDark}" stroke-width="8"/>
      <text x="82" y="116" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="${theme.qrDark}">Silver Memory</text>
      <text x="82" y="174" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="${theme.qrDark}">${escapeHtml(
        state.profile.name,
      )}</text>
      <text x="82" y="228" font-family="Arial, sans-serif" font-size="28" fill="#475569">${escapeHtml(
        state.profile.years,
      )}</text>
      <rect x="${qrOffsetX}" y="${qrOffsetY}" width="${qrSize}" height="${qrSize}" fill="#ffffff" stroke="#d7dee8" stroke-width="2"/>
      ${qrRects}
      <text x="82" y="322" font-family="Arial, sans-serif" font-size="24" fill="${theme.qrDark}">휴대폰 카메라로 QR을 비추면 생애 페이지가 열립니다.</text>
      <text x="82" y="368" font-family="Arial, sans-serif" font-size="22" fill="#475569">${escapeHtml(
        pageUrl,
      )}</text>
    </svg>
  `
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `silver-memory-${state.profile.name}.svg`
  link.click()
  URL.revokeObjectURL(link.href)
}

function reloadCurrentRoute() {
  state = {
    ...loadState(),
    isApiBacked: false,
    isLoading: false,
    apiError: '',
    isPrivateBlocked: false,
  }

  const token = inviteTokenFromUrl()
  if (token) {
    state = {
      ...state,
      activeTab: 'editor',
      editorToken: token,
    }
    window.history.replaceState(null, '', memoryPageUrl())
    saveState()
  }

  render()

  if (!isCreateRoute()) {
    loadFromApi({
      includeModeration: state.activeTab === 'editor' && Boolean(state.editorToken),
      activeTab: state.activeTab,
    })
  }
}

window.addEventListener('hashchange', reloadCurrentRoute)

render()
if (!isCreateRoute()) {
  loadFromApi({
    includeModeration: state.activeTab === 'editor' && Boolean(state.editorToken),
    activeTab: state.activeTab,
  })
}
