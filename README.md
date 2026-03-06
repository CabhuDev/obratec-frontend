# OBRATEC Frontend v2.5

> React SPA for construction site report management with AI features

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](../LICENSE)

---

## Descripción

Frontend construido con React 18 y Vite 5:
- Landing page estilo SaaS
- Mobile-first con bottom navigation
- Skeleton loading (nunca spinners)
- Animaciones Framer Motion
- CSS variables y grid utilities

---

## Características

### Autenticación
- JWT con refresh tokens (auto-refresh en 401 vía Axios interceptor)
- Login/Register con validación
- Protected routes (`/app/*`)
- AuthContext global

### Dashboard
- Hero card con saludo personalizado (buenos días/tardes/noches) y blueprint pattern SVG
- Strip de estadísticas (informes, fotos, audios, almacenamiento)
- Barras de uso de recursos (almacenamiento, informes/mes, usuarios) — rojas al superar 80%
- Trial countdown banner
- Navegación por roles (admin/editor/viewer)

### Informes
- Vista galería con tarjetas proporción A4 (estilo estantería de planos)
- Portada dinámica: primera foto del informe o initiales del proyecto
- Tipos dinámicos desde `reportsAPI.getTypes()` — sin config hardcodeada
- Campos: `text`, `textarea`, `number`, `date`, `time`, `email`, `select`, `array` (chips)
- Fotos: `ai_description` colapsible, `tags_ai` badges, safety risks. Polling silencioso si pendiente.
- Audio: resumen IA destacado, transcripción expandible, `palabras_clave` badges, sentimiento coloreado
- Workflow de publicación: barra de progreso de 6 pasos con estado por paso

### Chatbot IA
- Patricia (experta construcción), Profesional, Amigable — selector de personalidad
- RAG con informes del usuario (Patricia conoce los proyectos reales)
- Búsqueda de conversaciones
- Selector de proveedor si hay más de uno
- Historial de conversaciones persistente

### Knowledge Base
- Modal de edición por documento
- Modal de previsualización
- Reindexado individual por documento
- Vista responsive: tabla en desktop, tarjetas en mobile

### Billing & Suscripciones
- Pricing cards (Founders, Básico, Profesional, Enterprise) desde API
- Toggle mensual/anual en Settings
- Upgrade a anual desde Settings
- Nombre del plan activo en suscripción

### Admin
- Toggle activar/desactivar usuario por fila
- SkeletonLoader en carga inicial

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+ ([Descargar](https://nodejs.org))
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo (puerto 5173)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Acceso
- Landing: http://localhost:5173
- Login: http://localhost:5173/login
- App: http://localhost:5173/app/dashboard

---

## 📁 Estructura

```
frontend/
├── src/
│   ├── pages/              # Páginas completas
│   │   ├── Landing.jsx    # Landing page pública
│   │   ├── Login.jsx      # Autenticación
│   │   ├── Register.jsx   # Registro usuario
│   │   ├── Dashboard.jsx  # Dashboard principal
│   │   ├── AdminDashboard.jsx  # Panel admin
│   │   ├── Reports.jsx    # Lista de informes
│   │   ├── CreateReport.jsx    # Crear informe
│   │   ├── ReportDetail.jsx    # Detalle informe
│   │   ├── Chatbot.jsx    # Chat IA
│   │   ├── KnowledgeBase.jsx   # Base conocimiento
│   │   └── Settings.jsx   # Configuración
│   │
│   ├── components/         # Componentes reutilizables
│   │   ├── Sidebar.jsx    # Navegación lateral (desktop)
│   │   ├── MobileNav.jsx  # Bottom nav (mobile)
│   │   └── SkeletonLoader.jsx  # Loading states
│   │
│   ├── services/           # Lógica de negocio
│   │   └── api.js         # Axios client + interceptors
│   │
│   ├── styles/             # Estilos
│   │   ├── index.css      # Global + sistema diseño
│   │   └── landing.css    # Landing específico
│   │
│   ├── App.jsx             # Router principal
│   └── main.jsx            # Entry point
│
├── public/                 # Assets estáticos
│   └── logo.png
│
├── Dockerfile              # Multi-stage build
├── nginx.conf              # Nginx para producción
├── vite.config.js          # Configuración Vite
└── README.md               # Este archivo
```

---

## Paleta de Colores

Nunca usar colores hardcodeados — siempre CSS variables:

```css
:root {
  --primary: #F79B72;      /* Naranja cálido - CTAs */
  --secondary: #2A4759;    /* Azul oscuro - Headers */
  --tertiary: #3B8C88;     /* Verde - Success */

  --bg-light: #F8F9FA;
  --bg-dark: #1A1A1A;
  --text-dark: #2C3E50;
  --text-light: #6C757D;

  --success: #28A745;
  --warning: #FFC107;
  --danger: #DC3545;
  --info: #17A2B8;
}
```

## CSS Grid Utilities

Definidas en `src/index.css` — usar en lugar de estilos inline:

| Clase | Grid | Colapsa en mobile |
|-------|------|-------------------|
| `.grid-2col` | `1fr 1fr` | Sí (≤768px) |
| `.grid-sidebar` | `240px 1fr` | Sí (≤768px) |
| `.grid-main` | `2fr 1fr` | Sí (≤768px) |
| `.kb-desktop-table` | visible en desktop | oculto en mobile |
| `.kb-mobile-list` | oculto en desktop | visible en mobile |

`@keyframes pulse` disponible para indicadores "Analizando..." / "Transcribiendo...".

---

## 🗺️ Rutas

### Públicas
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | Landing.jsx | Landing page |
| `/login` | Login.jsx | Autenticación |
| `/register` | Register.jsx | Registro |

### Protegidas (`/app/*`)
| Ruta | Componente | Rol |
|------|-----------|-----|
| `/app/dashboard` | Dashboard.jsx | Usuario |
| `/app/admin` | AdminDashboard.jsx | Admin |
| `/app/reports` | Reports.jsx | Usuario |
| `/app/reports/new` | CreateReport.jsx | Usuario |
| `/app/reports/:id` | ReportDetail.jsx | Usuario |
| `/app/chatbot` | Chatbot.jsx | Usuario |
| `/app/knowledge` | KnowledgeBase.jsx | Usuario |
| `/app/settings` | Settings.jsx | Usuario |

---

## 🎨 Componentes Clave

### Landing.jsx
Landing page moderna con:
- Hero section con CTA
- Features grid (6 características)
- Pricing cards (4 planes: Founders, Básico, Profesional, Enterprise)
- Testimonials
- FAQ accordion

### MobileNav.jsx
Bottom navigation para móviles:
```jsx
<MobileNav />
// Muestra 5 iconos: Home, Reports, Plus, Chatbot, Settings
// Visible solo en < 768px
```

### SkeletonLoader.jsx
Loading states elegantes:
```jsx
<SkeletonLoader variant="card" count={3} />
// Tipos: card, table-row, stat, list-item, dashboard
```

### Sidebar.jsx
Navegación lateral desktop:
- Colapsable en tablet
- Iconos + etiquetas
- Indicador de ruta activa

---

## 📱 Responsive Design

### Desktop (> 1024px)
- Sidebar completo con iconos + texto
- Layout two-column
- Hover effects

### Tablet (768-1024px)
- Sidebar colapsado (solo iconos)
- Layout optimizado
- Touch-friendly

### Mobile (< 768px)
- Bottom navigation
- Stack layout
- Gestures habilitados
- Menú hamburguesa

---

## 🔌 API Integration

### Configuración
```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});
```

### Interceptors
- **Request**: Agrega token JWT automáticamente
- **Response**: Maneja refresh token si expira 401
- **Error**: Sanitiza errores para UI

### Endpoints
```javascript
// Autenticación
await api.post("/auth/login", { username, password });
await api.post("/auth/register", userData);
await api.get("/auth/me");

// Informes
await api.get("/reports");
await api.post("/reports", reportData);
await api.get(`/reports/${id}`);

// Chatbot
await api.post("/chatbot/chat", { message });
```

---

## Animaciones

Entrada estándar (obligatoria en todos los componentes):

```jsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Contenido
</motion.div>
```

---

## 🧪 Testing

```bash
# Tests (pendiente configurar)
npm test

# Lint
npm run lint
```

---

## 🏗️ Build & Deploy

### Build Local
```bash
npm run build
# Output: /dist
```

### Docker
```bash
# Build imagen
docker build -t obratec-frontend .

# Run
docker run -p 80:80 obratec-frontend
```

### Deploy
- **Vercel/Netlify**: Conectar GitHub, auto-deploy
- **Nginx**: Servir `/dist` con `try_files` para SPA
- **Railway**: Build command: `npm run build`, start: `npx serve dist`

> 📖 Ver [DEPLOYMENT.md](../docs/DEPLOYMENT.md) para guías detalladas

---

## 🔧 Configuración

### Variables de Entorno
```env
# .env
VITE_API_URL=http://localhost:8000/api/v1
```

**Nota**: Vite requiere el prefijo `VITE_` para exponer variables al client.

### Proxy (desarrollo)
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
```

---

## 💡 Tips de Desarrollo

### Hot Module Replacement
Vite usa HMR nativo para actualizaciones instantáneas sin perder estado.

### React DevTools
Instala la extensión de navegador para debugging avanzado.

### Estado Global
Actualmente usa Context API. Para estado más complejo, considera Zustand o Redux Toolkit.

### Code Splitting
Usa `React.lazy()` para lazy loading de rutas:
```jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

---

## 📚 Recursos

### Librerías Principales
- [React 18 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Chart.js](https://www.chartjs.org)

### Iconos
- [React Icons](https://react-icons.github.io/react-icons/)

---

## 🤝 Contribuir

Ver [CONTRIBUTING.md](../CONTRIBUTING.md) para guías de contribución.

### Code Style
- ESLint configurado
- Prettier para formato
- 2 espacios indentación
- Comillas dobles

---

## Changelog

### v2.5.0 (2026-03-05)
- Dashboard.jsx: hero card con saludo + blueprint pattern + strip estadísticas
- Reports.jsx: galería A4 con portada dinámica
- CreateReport.jsx: tipos dinámicos desde `reportsAPI.getTypes()`, campos array/select/etc.
- ReportDetail.jsx: AI photo analysis, audio transcription, dynamic fields editables, polling silencioso
- KnowledgeBase.jsx: modal edición, previsualización, reindexado individual, responsive
- Chatbot.jsx: selector de personalidad, Patricia conoce informes reales del usuario
- AdminDashboard.jsx: toggle activar/desactivar usuario
- CSS utilities: `.grid-2col`, `.grid-sidebar`, `.grid-main`, `.kb-desktop-table/mobile-list`, `@keyframes pulse`
- api.js: `chatbotAPI.createConversation({ personality })`

### v2.4.0 (2026-03-01)
- Fix nombre del plan en Settings > Suscripción (mostraba UUID)
- Upgrade a facturación anual conectado

### v2.3.0 (2026-02-27)
- Plan Founders en Landing
- Toggle mensual/anual en Settings
- Trial countdown banner en Dashboard

### v2.0.0 (2024-02-16)
- Landing page moderna, bottom nav, skeleton loaders, Framer Motion
- Rutas `/` → Landing, `/app/*` → App protegida

---

## 📞 Soporte

- **Docs Principal**: [README.md](../README.md)
- **Arquitectura**: [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)

---

**Desarrollado con ❤️ por el equipo OBRATEC**

v2.5.0 | 2026-03-05
