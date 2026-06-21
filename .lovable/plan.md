
# Plan: Prompt Generator — réplica visual

Construir una UI estática (sin backend) que replique la imagen de referencia con la máxima fidelidad posible. Solo frontend, mock data.

## Stack
- TanStack Start (ya configurado) + React + TypeScript
- Tailwind v4 (tokens en `src/styles.css`)
- shadcn/ui (Button, Switch, Tabs, Tooltip, etc.)
- Framer Motion para microanimaciones
- lucide-react para iconografía

## Design tokens (en `src/styles.css`)
Añadir paleta exacta como tokens semánticos OKLCH equivalentes a:
- `--background: #040816`
- `--panel-1: #08101F`, `--panel-2: #0D162B`, `--panel-3: #101A34`
- `--brand-indigo: #5B5EFF`, `--brand-violet: #7C4DFF`, `--brand-cyan: #00C2FF`, `--brand-blue: #3B82F6`
- `--foreground: #FFFFFF`, `--muted-foreground: #94A3B8`
- `--border: rgba(255,255,255,0.08)`
- Gradientes: `--gradient-primary` (violeta→azul), `--gradient-glow` (radial ambiental)
- Sombras: `--shadow-glow-violet`, `--shadow-glow-blue`, `--shadow-panel`
- Fondo global con dos radiales (violeta arriba-izq, azul arriba-der) sobre `#040816`

## Estructura de archivos
```
src/routes/index.tsx                  → monta el dashboard
src/components/layout/AppShell.tsx    → grid sidebar + main
src/components/layout/Sidebar.tsx     → nav + user card + switch
src/components/layout/TopHeader.tsx   → saludo + acciones derecha
src/components/dashboard/UploadCard.tsx       → Sección 1
src/components/dashboard/AnalysisOptions.tsx  → Sección 2
src/components/dashboard/ContentAnalysis.tsx  → Sección 3 (tabla 2 cols)
src/components/dashboard/PromptOutput.tsx     → Sección 4 (tabs + editor)
src/components/dashboard/HistoryStrip.tsx     → Historial reciente
src/components/ui/GlassPanel.tsx              → wrapper panel con borde + glow
src/assets/                                   → 4 miniaturas generadas + preview templo
```

## Layout
Grid principal: `sidebar 260px | main 1fr`. Main usa grid de 2 columnas (`1fr 1.15fr`), gap 24px:
- Columna izquierda apilada: UploadCard → AnalysisOptions
- Columna derecha apilada: ContentAnalysis → PromptOutput → HistoryStrip (full-width bajo ambas columnas)

Replica exacta de jerarquía, paddings (~24px), radios (rounded-2xl/3xl), bordes sutiles, glows.

## Detalles por sección

**Sidebar**: logo cuadrado con gradiente violeta + texto "Prompt / Generator" (violeta). Menú con 8 items (lucide icons). Item activo "Dashboard" con fondo gradiente azul→violeta y glow. Abajo: tarjeta usuario (avatar generado, "Creator", "creador.ai", chevron), fila "Modo Oscuro" + Switch shadcn (on), footer copyright.

**TopHeader**: H1 "¡Hola, Creator! 👋" + subtítulo. Derecha: toggle sol/luna (pill), botón "🎁 100% Gratis" (panel con borde), botón campana con dot verde.

**Sección 1 — Upload**: GlassPanel; zona drag con icono nube gradiente, "Arrastra tu imagen o video", subtexto, chips de formatos (JPG/PNG/WEBP/MP4/MOV). Debajo: preview del templo japonés (imagen generada) con badge "Imagen JPG" y botón eliminar.

**Sección 2 — Opciones**: 4 botones cuadrados con icono+label (Detalle Máximo activo con borde violeta y glow). Label "Modelo IA" + 3 pills (GPT Vision seleccionado con chevron, Gemini Vision, Claude Vision). Botón "✨ Generar Prompt" full-width, gradiente azul→violeta, glow.

**Sección 3 — Análisis**: panel con dot luminoso decorativo arriba-der. Dos columnas de filas: icono + label gris + valor blanco. 16 campos divididos 8/8. Fila "Colores dominantes" muestra 4 swatches.

**Sección 4 — Prompt generado**: header con título + 4 botones (Copiar, Mejorar Prompt ✨, Traducir, Exportar TXT). Tabs fila 1: Prompt Principal (activo, gradiente), Negativo, Cinematográfico, para Video, para Imagen. Fila 2 (sub-tabs): Para Midjourney/Flux/Veo/Kling/Whisk. Editor monoespaciado con texto del templo, palabras clave coloreadas (violeta/cyan/amarillo), contador "218 / 4000".

**Historial**: header "🕘 Historial reciente" + link "Ver todo el historial". 4 tarjetas horizontales: thumbnail (imagen generada), título, fecha, fila de 4 iconos (copiar/editar/duplicar/eliminar rojo).

## Assets a generar (imagegen, src/assets/*.jpg)
1. Templo japonés nocturno con cerezos y luna (preview principal)
2. Castillo medieval nocturno
3. Amanecer en montaña con lago
4. Ciudad futurista cyberpunk
5. Avatar masculino estilo creator
(El primero reutilizado como miniatura "Templo japonés de noche".)

## Animaciones (Framer Motion)
- Fade/slide-up al montar cada panel (stagger)
- Hover lift sutil en tarjetas de historial y botones de opciones
- Glow pulse muy lento en botón principal

## Fuera de alcance
Sin lógica real de upload/IA/persistencia. Todo mock visual. Sin rutas adicionales (solo `/`). Sin Lovable Cloud.
