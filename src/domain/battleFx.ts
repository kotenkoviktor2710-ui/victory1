export const BATTLE_HIT_WORDS = [
  'WHAM!',
  'POW!',
  'BAM!',
  'BOOM!',
  'ZAP!',
  'SLAM!',
  'KAPOW!',
  'CRASH!',
  'BANG!',
  'WHACK!',
] as const

export function pickBattleHitWord(): string {
  const index = Math.floor(Math.random() * BATTLE_HIT_WORDS.length)
  return BATTLE_HIT_WORDS[index] ?? 'BAM!'
}
