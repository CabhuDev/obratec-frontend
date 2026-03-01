# 🎨 OBRATEC Frontend v2.0

> Modern React SPA with professional landing page and AI-powered construction management

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](../LICENSE)

---

## 📋 Descripción

Frontend moderno para OBRATEC construido con React 18 y Vite 5. Incluye:
- 🌐 **Landing page** estilo SaaS moderno
- 📱 **Mobile-first** con bottom navigation
- ⚡ **Skeleton loading** para UX elegante
- 🎭 **Animaciones** con Framer Motion
- 🎨 **Sistema de diseño** consistente

---

## ✨ Características v2.0

### 🆕 Nuevo Diseño
- ✅ Landing page moderna con hero, features, pricing, testimonials
- ✅ Navegación móvil bottom nav (inspirada en apps nativas)
- ✅ Skeleton loaders (en lugar de spinners)
- ✅ Animaciones Framer Motion fluidas
- ✅ 100% responsive (desktop, tablet, mobile)

### 🔐 Autenticación
- JWT con refresh tokens
- Login/Register con validación
- Protected routes
- AuthContext global

### 📊 Dashboard
- Estadísticas de usuario/admin
- Charts con Chart.js
- Vista de informes recientes
- Navegación por roles

### 💬 Chatbot IA
- Chat con Patricia (experta construcción)
- Integración OpenAI + Gemini
- Historial de conversaciones
- Markdown rendering

### 📄 Gestión de Informes
- Crear/editar informes
- Upload multimedia (fotos + audio)
- Transcripción automática de voz
- Generación de PDFs

### 💳 Billing & Suscripciones
- Planes con pricing cards (Founders, Básico, Profesional, Enterprise)
- Toggle mensual/anual en Settings
- Trial countdown banner en Dashboard
- Página de facturación con facturas y métodos de pago
- Nombre del plan activo en suscripción

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

## 🎨 Paleta de Colores

OBRATEC usa una paleta moderna y profesional:

```css
:root {
  /* Primarios */
  --primary: #F79B72;      /* Naranja cálido - CTAs */
  --secondary: #2A4759;    /* Azul oscuro - Headers */
  --tertiary: #3B8C88;     /* Verde - Success */

  /* Neutrales */
  --bg-light: #F8F9FA;
  --bg-dark: #1A1A1A;
  --text-dark: #2C3E50;
  --text-light: #6C757D;

  /* Estados */
  --success: #28A745;
  --warning: #FFC107;
  --danger: #DC3545;
  --info: #17A2B8;
}
```

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

## 🎭 Animaciones

Usando Framer Motion:

```jsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Contenido
</motion.div>
```

**Variantes implementadas:**
- Fade in/out
- Slide up/down
- Stagger children
- Scale hover

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

## 📝 Changelog

### v2.4.0 (2026-03-01)
- 🐛 Fix nombre del plan en Settings > Suscripción (mostraba UUID en vez del nombre)
- 🐛 Fix nombre del plan en pestaña de facturación

### v2.3.0 (2026-02-27)
- ✨ Plan Founders en Landing (badge púrpura, invite-only)
- ✨ Toggle mensual/anual en Settings
- ✨ Trial countdown banner en Dashboard
- ✨ Plan cards con features y trial_days en Settings

### v2.0.0 (2024-02-16)
- ✨ Nueva landing page moderna
- ✨ Bottom navigation móvil
- ✨ Skeleton loading system
- ✨ Animaciones Framer Motion
- ✨ Sistema de diseño completo
- ♻️ Refactor de rutas (`/` → Landing, `/app/*` → App)
- 🎨 CSS mejorado con variables y utilidades

---

## 📞 Soporte

- **Docs Principal**: [README.md](../README.md)
- **Arquitectura**: [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)

---

**Desarrollado con ❤️ por el equipo OBRATEC**

v2.0.0 | 2024-02-16
