# Icones per entitat — Choir Positions

Totes les icones venen de la llibreria **lucide-react**.

## Entitats principals

| Entitat | Icona | Import | Notes |
|---|---|---|---|
| Espectacle | `Clapperboard` | `lucide-react` | Pantalla de cinema = actuació escènica |
| Cançó (al setlist d'un espectacle) | `Music` | `lucide-react` | Nota musical |
| Cançó (al repertori global) | `BookOpen` | `lucide-react` | Llibre obert = arxiu de repertori |
| Moment (d'una cançó) | `LayoutGrid` | `lucide-react` | Graella de posicions |
| Persona / Membre | `UserRound` | `lucide-react` | Persona individual |
| Grup / Cor | `Users` | `lucide-react` | Múltiples persones |
| Micròfon | `Mic` | `lucide-react` | Micròfon de mà o headset |
| Partitura | `FileText` | `lucide-react` | Document amb text musical |
| Àudio | `Music` | `lucide-react` | Nota musical (àudio de referència) |
| Referència / Link | `ExternalLink` | `lucide-react` | Fletxa cap a l'exterior |
| Director | `Wand2` o `Star` | `lucide-react` | Batuta / protagonisme |
| Part (d'un espectacle) | `Layers` | `lucide-react` | Capes = actes o parts |
| Editor de posicions | `LayoutGrid` | `lucide-react` | Graella = posicions |
| Focus / "Soc jo" | `Crosshair` | `lucide-react` | Target = destacar la posició pròpia |
| Trajectòria | `Waypoints` | `lucide-react` | Punts connectats = recorregut |
| Alçada / perfil | `BarChart2` | `lucide-react` | Bars = alçada relativa |
| Localització | `MapPin` | `lucide-react` | Pins de mapa |
| Poster / Imatge | `Image` | `lucide-react` | Marc d'imatge |
| Administrador | `Shield` | `lucide-react` | Escut = rol privilegiat |

## Accions globals

| Acció | Icona |
|---|---|
| Afegir / Crear | `Plus` |
| Editar | `Pencil` |
| Eliminar | `Trash2` |
| Cercar | `Search` |
| Tancar / Descartar | `X` |
| Guardar / Confirmar | (botó de text, sense icona) |
| Ordenar (drag) | `GripVertical` |
| Expandir / Col·lapsar | `ChevronDown` / `ChevronUp` |
| Anterior | `ChevronLeft` |
| Següent | `ChevronRight` |
| Menú mòbil | `Menu` |
| Sortir (logout) | (text "Sortir", sense icona) |

## Notes de consistència
- Una mateixa entitat **sempre** usa la mateixa icona en tots els contextos (nav, llista, buit, breadcrumb).
- Les icones decoratives (estat buit, breadcrumb) usen `opacity-30` i mida 32-40px.
- Les icones en botons d'acció usen mida 14-18px.
- Les icones en nav usen mida 14-16px.
