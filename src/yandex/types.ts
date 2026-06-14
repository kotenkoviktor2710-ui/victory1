/** Типы Yandex Games SDK — сверяйте с https://yandex.ru/dev/games/doc/ru/sdk/ */

export type SdkPauseEvent = 'game_api_pause' | 'game_api_resume'

export type SdkEventName =
  | SdkPauseEvent
  | 'EXIT'
  | 'HISTORY_BACK'
  | 'ACCOUNT_SELECTION_DIALOG_OPENED'
  | 'ACCOUNT_SELECTION_DIALOG_CLOSED'

export interface YsdkFullscreenCallbacks {
  onOpen?: () => void
  onClose?: (wasShown: boolean) => void
  onError?: (err: unknown) => void
  onOffline?: () => void
}

export interface YsdkRewardedCallbacks {
  onOpen?: () => void
  onRewarded?: () => void
  onClose?: () => void
  onError?: (err: unknown) => void
}

export interface YsdkAdv {
  showFullscreenAdv(opts: { callbacks?: YsdkFullscreenCallbacks }): void
  showRewardedVideo(opts: { callbacks?: YsdkRewardedCallbacks }): void
  getBannerAdvStatus?(): Promise<{ stickyAdvIsShowing: boolean; reason?: string }>
  showBannerAdv?(): Promise<{ stickyAdvIsShowing: boolean; reason?: string }>
  hideBannerAdv?(): Promise<{ stickyAdvIsShowing: boolean }>
}

export interface YsdkPromoReferrer {
  type: 'promo'
  promoId: string
  intent?: string
  inappId?: string
}

export interface YsdkEnvironment {
  app?: { id?: string }
  browser?: { lang?: string }
  i18n: { lang: string; tld?: string }
  payload?: string
  referrer?: YsdkPromoReferrer
}

export interface YsdkFeedback {
  canReview(): Promise<{ value: boolean; reason?: string }>
  requestReview(): Promise<{ feedbackSent: boolean }>
}

export interface YsdkPlayer {
  getUniqueID(): string
  getName(): string
  isAuthorized?(): boolean
  getData(keys?: string[]): Promise<Record<string, unknown>>
  setData(data: Record<string, unknown>, flush?: boolean): Promise<void>
  getStats?(keys?: string[]): Promise<Record<string, number>>
  setStats?(stats: Record<string, number>): Promise<void>
  incrementStats?(increments: Record<string, number>): Promise<Record<string, number>>
}

export interface YsdkPurchase {
  productID: string
  purchaseToken: string
  developerPayload?: string
}

export interface YsdkProduct {
  id: string
  title: string
  description: string
  imageURI: string
  price: string
  priceValue: string
  priceCurrencyCode: string
}

export interface YsdkPayments {
  purchase(opts: { id: string; developerPayload?: string }): Promise<YsdkPurchase>
  getPurchases(): Promise<YsdkPurchase[]>
  getCatalog(): Promise<YsdkProduct[]>
  consumePurchase(purchaseToken: string): Promise<void>
}

export interface YsdkLeaderboardEntry {
  rank: number
  score: number
  extraData?: string
  player?: {
    publicName?: string
    uniqueID?: string
  }
}

export interface YsdkMultiplayerSessionTimelineEntry {
  id: string
  payload?: unknown
  time: number
}

export interface YsdkMultiplayerSession {
  id: string
  meta?: {
    meta1?: number
    meta2?: number
    meta3?: number
  }
  player?: {
    avatar?: string
    name?: string
  }
  timeline?: YsdkMultiplayerSessionTimelineEntry[]
}

export interface YsdkMultiplayerSessionsInitOptions {
  count?: number
  isEventBased?: boolean
  maxOpponentTurnTime?: number
  meta?: {
    meta1?: { min: number; max: number }
    meta2?: { min: number; max: number }
    meta3?: { min: number; max: number }
  }
}

export interface YsdkMultiplayerSessions {
  init(options?: YsdkMultiplayerSessionsInitOptions): Promise<YsdkMultiplayerSession[]>
  commit(payload: Record<string, unknown>): void
  push(meta: { meta1?: number; meta2?: number; meta3?: number }): Promise<void>
}

export interface YsdkMultiplayer {
  sessions: YsdkMultiplayerSessions
}

export interface YsdkLeaderboards {
  setScore(leaderboardName: string, score: number, extraData?: string): Promise<void>
  getEntries(
    leaderboardName: string,
    options?: {
      includeUser?: boolean
      quantityAround?: number
      quantityTop?: number
    },
  ): Promise<{
    entries?: YsdkLeaderboardEntry[]
    userRank?: number
  }>
  getPlayerEntry?(leaderboardName: string): Promise<YsdkLeaderboardEntry>
  getDescription?(leaderboardName: string): Promise<unknown>
}

export interface YsdkDeviceInfo {
  type?: 'desktop' | 'mobile' | 'tablet' | 'tv'
  isMobile(): boolean
  isDesktop(): boolean
  isTablet(): boolean
  isTV(): boolean
}

export interface YsdkFlagsParams {
  defaultFlags?: Record<string, string>
  clientFeatures?: Array<{ name: string; value: string }>
}

export interface YsdkAuth {
  openAuthDialog(): Promise<void>
}

export interface Ysdk {
  adv: YsdkAdv
  environment: YsdkEnvironment
  feedback?: YsdkFeedback
  auth?: YsdkAuth
  payments?: YsdkPayments
  leaderboards?: YsdkLeaderboards
  multiplayer?: YsdkMultiplayer
  deviceInfo?: YsdkDeviceInfo
  features?: {
    LoadingAPI?: { ready: () => void }
    GameplayAPI?: { start: () => void; stop: () => void }
  }
  getPlayer?(opts?: { scopes?: boolean; signed?: boolean }): Promise<YsdkPlayer>
  getPayments?(opts?: { signed?: boolean }): Promise<YsdkPayments>
  /** @deprecated Используйте ysdk.leaderboards */
  getLeaderboards?(): Promise<{
    setLeaderboardScore(name: string, score: number): Promise<void>
    getLeaderboardEntries(
      name: string,
      opts?: { quantityTop?: number; includeUser?: boolean; quantityAround?: number },
    ): Promise<{ entries?: YsdkLeaderboardEntry[]; userRank?: number }>
  }>
  getFlags?(params?: YsdkFlagsParams): Promise<Record<string, string>>
  getStorage?(): Promise<Storage>
  isAvailableMethod?(method: string): Promise<boolean>
  on?(event: SdkEventName, callback: (...args: unknown[]) => void): void
  off?(event: SdkEventName, callback: (...args: unknown[]) => void): void
  serverTime(): number
  EVENTS?: Record<string, SdkEventName>
  dispatchEvent?(event: SdkEventName, detail?: object): Promise<unknown>
}

export type PurchaseGrantHandler = (purchase: YsdkPurchase) => Promise<void>
