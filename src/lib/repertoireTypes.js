import { Music, Megaphone, ArrowRightLeft, Coffee, Flag } from 'lucide-react'

export const REPERTOIRE_TYPES = [
  { value: 'song',       label: 'Cançó',      icon: Music,          color: 'text-cyan-400' },
  { value: 'section',    label: 'Secció',      icon: Flag,           color: 'text-purple-400' },
  { value: 'transition', label: 'Transició',   icon: ArrowRightLeft, color: 'text-amber-400' },
  { value: 'intermission', label: 'Intermedi', icon: Coffee,         color: 'text-green-400' },
  { value: 'announcement', label: 'Indicació', icon: Megaphone,      color: 'text-rose-400' },
]

export const repertoireType = (type) =>
  REPERTOIRE_TYPES.find(t => t.value === type) ?? REPERTOIRE_TYPES[0]

export const isSongType = (type) => type === 'song' || !type
