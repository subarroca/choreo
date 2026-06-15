// ─── Semantic icon registry ──────────────────────────────────────────────────
// Maps app concepts → lucide-react icons.
// Import `Icons` and use `Icons.close`, `Icons.add`, etc.
// Swapping an icon for a concept is a one-line change here, not a grep hunt.
//
// Usage:
//   import { Icons } from '../lib/icons'
//   <Icons.close size={16} />
//
// Convention: keys are camelCase English concept names, never lucide icon names.
// ─────────────────────────────────────────────────────────────────────────────
import * as _l from 'lucide-react'

export const Icons = {
  // ── CRUD / UI actions ────────────────────────────────────────────────────
  close:           _l.X,
  add:             _l.Plus,
  edit:            _l.Pencil,
  delete:          _l.Trash2,
  save:            _l.Save,
  copy:            _l.Copy,
  download:        _l.Download,
  upload:          _l.Upload,
  search:          _l.Search,
  filter:          _l.Filter,
  send:            _l.Send,
  print:           _l.Printer,
  drag:            _l.GripVertical,
  more:            _l.MoreHorizontal,
  undo:            _l.Undo2,
  redo:            _l.Redo2,

  // ── Status / Feedback ────────────────────────────────────────────────────
  check:           _l.Check,
  checkCircle:     _l.CheckCircle,
  emptyCircle:     _l.Circle,
  warning:         _l.AlertTriangle,
  error:           _l.AlertCircle,
  info:            _l.Info,
  loading:         _l.Loader2,
  visible:         _l.Eye,
  hidden:          _l.EyeOff,

  // ── Navigation ───────────────────────────────────────────────────────────
  back:            _l.ChevronLeft,
  forward:         _l.ChevronRight,
  up:              _l.ChevronUp,
  down:            _l.ChevronDown,
  expandAll:       _l.ChevronsUp,
  collapseAll:     _l.ChevronsDown,
  arrowLeft:       _l.ArrowLeft,
  arrowRight:      _l.ArrowRight,
  arrowUp:         _l.ArrowUp,
  arrowDown:       _l.ArrowDown,
  expandSidebar:   _l.PanelLeftOpen,
  collapseSidebar: _l.PanelLeftClose,
  home:            _l.Home,
  externalLink:    _l.ExternalLink,

  // ── App entities ─────────────────────────────────────────────────────────
  performance:     _l.Clapperboard,    // espectacle
  song:            _l.Music,
  songVariant:     _l.Music2,          // used in nav when Music is taken by brand
  members:         _l.Users,
  person:          _l.UserRound,
  addPerson:       _l.UserPlus,
  admin:           _l.Shield,
  analytics:       _l.BarChart3,
  calendar:        _l.CalendarDays,
  calendarClock:   _l.CalendarClock,
  image:           _l.ImageIcon,
  lyrics:          _l.AlignLeft,
  notes:           _l.BookOpen,
  attachment:      _l.FileText,
  setlist:         _l.ListOrdered,
  feedback:        _l.MessageSquarePlus,
  comment:         _l.MessageSquare,
  dashboard:       _l.LayoutDashboard,

  // ── Stage / Music ────────────────────────────────────────────────────────
  mic:             _l.MicVocal,
  light:           _l.Lightbulb,
  spotlight:       _l.Spotlight,
  play:            _l.Play,
  pause:           _l.Pause,
  rewind:          _l.SkipBack,
  playCircle:      _l.PlayCircle,
  cueNumber:       _l.Hash,
  positionTarget:  _l.Crosshair,
  positionMap:     _l.Waypoints,
  moveHandle:      _l.Move,
  reset:           _l.RotateCcw,
  zoomIn:          _l.ZoomIn,
  zoomOut:         _l.ZoomOut,

  // ── Layout / Editor ──────────────────────────────────────────────────────
  gridSquare:      _l.Grid2x2,
  gridFull:        _l.LayoutGrid,
  template:        _l.LayoutTemplate,
  menu:            _l.Menu,
  list:            _l.List,
  map:             _l.Map,

  // ── Theme / Account ──────────────────────────────────────────────────────
  themeLight:      _l.Sun,
  themeDark:       _l.Moon,
  themeSystem:     _l.Monitor,
  signOut:         _l.LogOut,

  // ── Clipboard ────────────────────────────────────────────────────────────
  clipboardCopy:   _l.ClipboardCopy,
  clipboardDone:   _l.ClipboardCheck,

  // ── Status ───────────────────────────────────────────────────────────────
  offline:         _l.WifiOff,
  bell:            _l.Bell,
  trend:           _l.TrendingUp,
  shuffle:         _l.Shuffle,

  // ── Contact / Profile ────────────────────────────────────────────────────
  email:           _l.Mail,
  atSign:          _l.AtSign,
  phone:           _l.Phone,
  height:          _l.Ruler,
  birthday:        _l.Calendar,

  // ── Lighting effects ─────────────────────────────────────────────────────
  fxWind:          _l.Wind,
  fxSparkles:      _l.Sparkles,
  fxTheater:       _l.Theater,
  fxScan:          _l.ScanFace,
  fxMoon:          _l.MoonStar,

  // ── Attendance absence reasons ───────────────────────────────────────────
  absenceFlight:   _l.Plane,
  absenceWork:     _l.Briefcase,
  absenceHealth:   _l.HeartPulse,
  absenceNote:     _l.StickyNote,
  absencePin:      _l.Pin,
  absenceClock:    _l.AlarmClock,

  // ── Repertoire song types ────────────────────────────────────────────────
  typeMegaphone:   _l.Megaphone,
  typeSwap:        _l.ArrowRightLeft,
  typeCoffee:      _l.Coffee,
  typeFlag:        _l.Flag,

  // ── Miscellaneous ────────────────────────────────────────────────────────
  globe:           _l.Globe,
  lock:            _l.Lock,
  archive:         _l.Archive,
  disc:            _l.Disc,
  hexagon:         _l.Hexagon,
  target:          _l.Target,
  clipboard:       _l.Clipboard,
  mapPin:          _l.MapPin,
  clock:           _l.Clock,
}

// ─── Migration aliases ────────────────────────────────────────────────────────
// Existing files import icons by lucide name (e.g. `import { X, Plus }`).
// These aliases derive from the semantic map, so renaming an icon in Icons
// above automatically propagates to all usages — even unmigrated files.
// Migrate files to `Icons.xxx` over time and remove entries here as you go.
// ─────────────────────────────────────────────────────────────────────────────
export const X              = Icons.close
export const Plus           = Icons.add
export const Pencil         = Icons.edit
export const Trash2         = Icons.delete
export const Save           = Icons.save
export const Copy           = Icons.copy
export const Download       = Icons.download
export const Upload         = Icons.upload
export const Search         = Icons.search
export const Filter         = Icons.filter
export const Send           = Icons.send
export const Printer        = Icons.print
export const GripVertical   = Icons.drag
export const MoreHorizontal = Icons.more
export const Undo2          = Icons.undo
export const Redo2          = Icons.redo
export const Check          = Icons.check
export const CheckCircle    = Icons.checkCircle
export const Circle         = Icons.emptyCircle
export const AlertTriangle  = Icons.warning
export const AlertCircle    = Icons.error
export const Info           = Icons.info
export const Loader2        = Icons.loading
export const Eye            = Icons.visible
export const EyeOff         = Icons.hidden
export const ChevronLeft    = Icons.back
export const ChevronRight   = Icons.forward
export const ChevronUp      = Icons.up
export const ChevronDown    = Icons.down
export const ChevronsUp     = Icons.expandAll
export const ChevronsDown   = Icons.collapseAll
export const ArrowLeft      = Icons.arrowLeft
export const ArrowRight     = Icons.arrowRight
export const ArrowUp        = Icons.arrowUp
export const ArrowDown      = Icons.arrowDown
export const PanelLeftOpen  = Icons.expandSidebar
export const PanelLeftClose = Icons.collapseSidebar
export const Home           = Icons.home
export const ExternalLink   = Icons.externalLink
export const Clapperboard   = Icons.performance
export const Music          = Icons.song
export const Music2         = Icons.songVariant
export const Users          = Icons.members
export const UserRound      = Icons.person
export const UserPlus       = Icons.addPerson
export const Shield         = Icons.admin
export const BarChart3      = Icons.analytics
export const CalendarDays   = Icons.calendar
export const CalendarClock  = Icons.calendarClock
export const ImageIcon      = Icons.image
export const AlignLeft      = Icons.lyrics
export const BookOpen       = Icons.notes
export const FileText       = Icons.attachment
export const ListOrdered    = Icons.setlist
export const MessageSquarePlus = Icons.feedback
export const MessageSquare  = Icons.comment
export const LayoutDashboard = Icons.dashboard
export const MicVocal       = Icons.mic
export const Lightbulb      = Icons.light
export const Spotlight      = Icons.spotlight
export const Play           = Icons.play
export const Pause          = Icons.pause
export const SkipBack       = Icons.rewind
export const PlayCircle     = Icons.playCircle
export const Hash           = Icons.cueNumber
export const Crosshair      = Icons.positionTarget
export const Waypoints      = Icons.positionMap
export const Move           = Icons.moveHandle
export const RotateCcw      = Icons.reset
export const ZoomIn         = Icons.zoomIn
export const ZoomOut        = Icons.zoomOut
export const Grid2x2        = Icons.gridSquare
export const LayoutGrid     = Icons.gridFull
export const LayoutTemplate = Icons.template
export const Menu           = Icons.menu
export const List           = Icons.list
export const Map            = Icons.map
export const Sun            = Icons.themeLight
export const Moon           = Icons.themeDark
export const Monitor        = Icons.themeSystem
export const LogOut         = Icons.signOut
export const ClipboardCopy  = Icons.clipboardCopy
export const ClipboardCheck = Icons.clipboardDone
export const WifiOff        = Icons.offline
export const Bell           = Icons.bell
export const TrendingUp     = Icons.trend
export const Shuffle        = Icons.shuffle
export const Mail           = Icons.email
export const AtSign         = Icons.atSign
export const Phone          = Icons.phone
export const Ruler          = Icons.height
export const Calendar       = Icons.birthday
export const Wind           = Icons.fxWind
export const Sparkles       = Icons.fxSparkles
export const Theater        = Icons.fxTheater
export const ScanFace       = Icons.fxScan
export const Plane          = Icons.absenceFlight
export const Briefcase      = Icons.absenceWork
export const HeartPulse     = Icons.absenceHealth
export const Megaphone      = Icons.typeMegaphone
export const ArrowRightLeft = Icons.typeSwap
export const Coffee         = Icons.typeCoffee
export const Flag           = Icons.typeFlag
export const Globe          = Icons.globe
export const Lock           = Icons.lock
export const Archive        = Icons.archive
export const Disc           = Icons.disc
export const Hexagon        = Icons.hexagon
export const Target         = Icons.target
export const Clipboard      = Icons.clipboard
export const MapPin         = Icons.mapPin
export const Clock          = Icons.clock
