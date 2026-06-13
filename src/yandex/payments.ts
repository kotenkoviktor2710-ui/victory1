import { getYsdk } from '@/yandex/sdk'
import type { PurchaseGrantHandler, YsdkPayments, YsdkProduct, YsdkPurchase } from '@/yandex/types'

let paymentsPromise: Promise<YsdkPayments | null> | null = null

async function resolvePayments(): Promise<YsdkPayments | null> {
  if (paymentsPromise) return paymentsPromise

  paymentsPromise = (async () => {
    const sdk = getYsdk()
    if (!sdk) return null

    if (sdk.payments) return sdk.payments

    if (!sdk.getPayments) return null
    try {
      return await sdk.getPayments({ signed: false })
    } catch {
      return null
    }
  })()

  return paymentsPromise
}

export async function fetchProductCatalog(): Promise<YsdkProduct[]> {
  const payments = await resolvePayments()
  if (!payments?.getCatalog) return []
  try {
    return await payments.getCatalog()
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[payments] getCatalog failed', err)
    return []
  }
}

export async function fetchPurchases(): Promise<YsdkPurchase[]> {
  const payments = await resolvePayments()
  if (!payments?.getPurchases) return []
  try {
    return await payments.getPurchases()
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[payments] getPurchases failed', err)
    return []
  }
}

export async function hasPermanentPurchase(productId: string): Promise<boolean> {
  const purchases = await fetchPurchases()
  return purchases.some((p) => p.productID === productId)
}

/**
 * Обязательная проверка необработанных покупок при старте (модерация п. 1.13.1).
 * grant → consumePurchase в правильном порядке.
 */
export async function processPendingPurchases(grant: PurchaseGrantHandler): Promise<number> {
  const payments = await resolvePayments()
  if (!payments) return 0

  const purchases = await fetchPurchases()
  let processed = 0

  for (const purchase of purchases) {
    try {
      await grant(purchase)
      await payments.consumePurchase(purchase.purchaseToken)
      processed++
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[payments] pending purchase failed', purchase.productID, err)
    }
  }

  return processed
}

export async function purchaseProduct(
  productId: string,
  grant: PurchaseGrantHandler,
  developerPayload?: string,
): Promise<boolean> {
  const payments = await resolvePayments()
  if (!payments?.purchase) {
    if (import.meta.env.DEV) {
      console.info('[payments] dev stub purchase', productId)
      await grant({ productID: productId, purchaseToken: 'dev-token' })
      return true
    }
    return false
  }

  try {
    const purchase = await payments.purchase({ id: productId, developerPayload })
    await grant(purchase)
    await payments.consumePurchase(purchase.purchaseToken)
    return true
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[payments] purchase failed', productId, err)
    return false
  }
}
