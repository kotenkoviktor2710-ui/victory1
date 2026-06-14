/** Публичные ассеты с учётом Vite base (`./` на Яндекс Играх). */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\//, '')
  const base = import.meta.env.BASE_URL || './'

  if (typeof window !== 'undefined') {
    return new URL(clean, new URL(base, window.location.href)).href
  }

  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${clean}`
}
