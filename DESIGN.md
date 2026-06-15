# Choreo — Sistema de disseny

Document de referència del llenguatge visual unificat. Mantenir-lo actualitzat
a mesura que es migren pàgines. L'ús principal de l'app és **tauleta** (edició
de posicions, llums, assistència) i **mòbil** (assistència, italianes).

## Principis

1. **App-shell d'alçada fixa, sense scroll de body.** Tota l'app ocupa `100dvh`.
   Només les subfinestres (llistes, panells, canvas) tenen scroll intern.
   Capçaleres i toolbars sempre visibles.
2. **Un sol primitiu per problema.** Una llista, un modal, una capçalera, una
   representació de persona — reutilitzats arreu, no reinventats per pàgina.
3. **Jerarquia per tipografia i espaiat**, no per capses. Les llistes no porten
   `border + rounded` per element; se separen amb `divide-y divide-rim`.
4. **Tàctil primer.** Objectius ≥44px. Botons d'acció poden portar etiqueta sota
   la icona (`Button stacked`).

## Tokens de color (semàntics)

Definits com a variables CSS a `src/index.css` i mapejats a Tailwind a
`tailwind.config.js`. **Sempre** usar els noms semàntics, mai `gray-*`/`white`
directes per a xrome d'UI.

| Token | Ús |
|-------|----|
| `page` | Fons de l'aplicació (el més fosc/clar) |
| `pane` | Fons de targetes, panells, capçaleres, rail |
| `fill` | Fons d'inputs, botons secundaris, hover suau |
| `raised` | Element elevat sobre `fill` |
| `rim` | Vora subtil (separadors, divisors) |
| `line` | Vora per defecte (inputs, contenidors) |
| `wire` | Vora forta (èmfasi, hover de vora) |
| `body` | Text primari |
| `soft` | Text secundari |
| `muted` | Text terciari |
| `faint` | Text quaternari / metadades |
| `ghost` | Text mínim / icones d'estat buit (no per a text llarg) |

**Contrast:** `faint` és distint de `muted` en mode clar; `ghost` s'ha pujat a
gray-500 en mode fosc per llegibilitat AA. Verificar nous usos en tots dos temes.

## Lògica d'accent (escrita — no improvisar)

| Color | Significat | Exemples |
|-------|-----------|----------|
| **Cian** | Selecció · acció primària · element actiu de navegació | Botó primari, ítem de nav actiu, fila seleccionada |
| **Ambre/groc** | Estat especial | Soloista, simulació de permisos, avís |
| **Vermell** | Destructiu · error | Botó `danger`, missatges d'error |
| **Violeta** | Context d'**editor / espacial** (reservat) | Mode trajectòries, eixos d'`ArrangePanel`, enllaços de notes a l'editor de posicions |
| **Maragda** | Indicacions de **parla / speaker** | Selecció i etiquetes de speaker a la `Setlist` |
| **Colors de veu** | Identitat de membre **només** | Avatar, badges de veu (`VOICE_COLORS` a `src/lib/constants.js`) |

Els colors de veu **mai** s'usen com a accent d'UI. **Violeta** i **maragda**
són accents de domini reservats (editor espacial / speaker) — no usar-los per a
xrome d'UI genèric. Tota la resta de selecció/acció és **cian**, en un sol to
(focus d'inputs i hovers de botó: `cyan-500`, mai `cyan-300`).

Helpers a `src/lib/ui.js`:
- `ACCENT.active` — element actiu (dark-first, `bg-cyan-700/40 text-cyan-300`).
- `ACCENT.activeNav` — nav/tabs amb variant light-mode correcta. **Usar a tot
  menú/pestanya/segmented control** (SideNav, ShowToolbar) perquè light i dark
  llegeixin igual com a "seleccionat".
- `ACCENT.special`, `ACCENT.danger`.

Menús/popovers: tancar amb clic-fora via `useClickOutside` (`src/hooks/useClickOutside.js`),
no reimplementar el patró `ref + useEffect + mousedown` per component.

## Escala d'icones (`ICON` a `src/lib/ui.js`)

`xs:12 · sm:14 · md:16 · lg:18 · xl:20 · hero:40`

- `sm` → botons i files de llista
- `md` → capçaleres de panell, accions de modal
- `lg` → marca, toggles, nav
- `hero` → estats buits

Llibreria única: **lucide-react**.

## Espaiat

- Files de llista / ítems de nav: `px-3 py-2.5` (`ROW_PAD`)
- Stacks de formulari: `space-y-3` (`FORM_GAP`)
- Cos de pàgina: `p-4 md:p-6`
- Inputs: `inputCls`/`labelCls` de `src/components/ui/Input.jsx` (font única)

## Primitius (`src/components/ui/` i `src/components/`)

| Component | Què és |
|-----------|--------|
| `AppShell` | Shell `100dvh`, sense scroll de body. Rail (desktop) / barra inferior (mòbil) + columna de contingut. |
| `SideNav` | Navegació principal. Rail esquerre col·lapsable (estat a `localStorage.navExpanded`); barra inferior en mòbil. Inclou selector de cor, tema, perfil. |
| `PageContainer` | Wrapper de pàgina: capçalera fixa (`shrink-0`) + cos amb scroll intern. |
| `PageHeader` | Capçalera unificada: `title`, `icon?`, `subtitle?`, `actions?`, `tabs?`. |
| `Modal` | Modal responsiu: panell lateral dret (tauleta/desktop) · bottom-sheet (mòbil). `Sheet` n'és un àlies retrocompatible. |
| `ListRow` | Fila de llista sense capsa; slots `leading/title/meta/trailing`. Embolcallar en `divide-y divide-rim`. |
| `EmptyState` | Icona + text centrat + acció opcional. |
| `Avatar` | Cercle amb inicials, tintat pel color de veu. `memberInitials()` exportat. |
| `PersonItem` | Representació unificada de persona: `Avatar` + nom + meta. Usar arreu (rosters, cast, soloistes, assistència). |
| `Button` | Variants `primary/secondary/danger/ghost`; layout `stacked` (icona+etiqueta) per a barres tàctils. |

## Regles de modal

- Tauleta/desktop: panell lateral dret.
- Mòbil: bottom-sheet.
- Tancar amb Escape i amb clic al backdrop. Cos amb scroll intern; footer enganxat opcional.
- Migrar usos ad-hoc (`PersonProfileOverlay`, context menus) a `Modal` quan es toqui la pàgina.

## Representació de persones

Sempre `Avatar` (sol) o `PersonItem` (amb nom/meta). No reimplementar inicials
ni badges de veu a mà. Inicials via `memberInitials(member)`.

## Estat de migració (Fase 2)

- [ ] Shows · [ ] Songs · [ ] Members · [ ] Admin · [ ] Setlist
- [ ] Vistes de treball: Editor · Lights · Rehearsal · Mics · Rider · Poster
- [ ] Eliminar `Layout.jsx` quan totes les pàgines usin `AppShell`+`PageContainer` directament
