// D&D 5e CR → XP table
const CR_XP: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000,
}

// D&D 5e XP thresholds by character level [easy, medium, hard, deadly]
const LEVEL_THRESHOLDS: Record<number, [number, number, number, number]> = {
  1:  [25,   50,   75,   100],
  2:  [50,   100,  150,  200],
  3:  [75,   150,  225,  400],
  4:  [125,  250,  375,  500],
  5:  [250,  500,  750,  1100],
  6:  [300,  600,  900,  1400],
  7:  [350,  750,  1100, 1700],
  8:  [450,  900,  1400, 2100],
  9:  [550,  1100, 1600, 2400],
  10: [600,  1200, 1900, 2800],
  11: [800,  1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100],
  14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200],
  17: [2000, 3900, 5900, 8800],
  18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900],
  20: [2800, 5700, 8500, 12700],
}

// Multipliers for number of monsters vs party size
function getMultiplier(monsterCount: number, partySize: number): number {
  let m: number
  if (monsterCount === 1) m = 1
  else if (monsterCount === 2) m = 1.5
  else if (monsterCount <= 6) m = 2
  else if (monsterCount <= 10) m = 2.5
  else if (monsterCount <= 14) m = 3
  else m = 4

  // Adjust for small/large parties
  if (partySize < 3) {
    if (m < 4) m = m === 1 ? 1.5 : m === 1.5 ? 2 : m === 2 ? 2.5 : m === 2.5 ? 3 : 4
  } else if (partySize > 5) {
    if (m > 1) m = m === 1.5 ? 1 : m === 2 ? 1.5 : m === 2.5 ? 2 : m === 3 ? 2.5 : 3
  }

  return m
}

export function crToXp(cr: string): number {
  return CR_XP[cr.trim()] ?? 0
}

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly'

export interface EncounterDifficulty {
  totalXp: number
  adjustedXp: number
  difficulty: Difficulty
  multiplier: number
  thresholds: { easy: number; medium: number; hard: number; deadly: number } | null
}

export function calcDifficulty(
  entries: { cr: string; count: number }[],
  partyLevel: number,
  partySize: number,
): EncounterDifficulty {
  const totalMonsters = entries.reduce((s, e) => s + e.count, 0)
  const totalXp = entries.reduce((s, e) => s + crToXp(e.cr) * e.count, 0)
  const multiplier = getMultiplier(totalMonsters, partySize)
  const adjustedXp = Math.round(totalXp * multiplier)

  const level = Math.max(1, Math.min(20, partyLevel))
  const thr = LEVEL_THRESHOLDS[level]

  if (!thr) return { totalXp, adjustedXp, difficulty: 'trivial', multiplier, thresholds: null }

  const thresholds = { easy: thr[0] * partySize, medium: thr[1] * partySize, hard: thr[2] * partySize, deadly: thr[3] * partySize }

  let difficulty: Difficulty = 'trivial'
  if (adjustedXp >= thresholds.deadly) difficulty = 'deadly'
  else if (adjustedXp >= thresholds.hard) difficulty = 'hard'
  else if (adjustedXp >= thresholds.medium) difficulty = 'medium'
  else if (adjustedXp >= thresholds.easy) difficulty = 'easy'

  return { totalXp, adjustedXp, difficulty, multiplier, thresholds }
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  trivial: 'var(--text-muted)',
  easy:    '#4ade80',
  medium:  '#fbbf24',
  hard:    '#fb923c',
  deadly:  '#f87171',
}

export const VALID_CRS = [
  '0', '1/8', '1/4', '1/2',
  '1','2','3','4','5','6','7','8','9','10',
  '11','12','13','14','15','16','17','18','19','20',
  '21','22','23','24','25','26','27','28','29','30',
]
