# TrendPulse YT 📈 - Monitor de Tendencias & Analizador de Videos de YouTube

**TrendPulse YT** es una extensión de navegador para **Chrome** y **Microsoft Edge** (Manifest V3) diseñada para creadores de contenido de YouTube. Permite monitorear la velocidad de crecimiento en tiempo real (vistas/hora) de cualquier video público, comparar métricas clave con la competencia, detectar patrones de alto rendimiento (duración óptima, mejores horarios de publicación, estructura de títulos y tags) y aplicar recomendaciones optimizadas para replicar modelos exitosos y monetizar.

---

## 🚀 Funcionalidades Clave

1. **Widget Flotante Overlay (en cualquier `youtube.com/watch`):**
   - Panel interactivo con estética *Glassmorphism*.
   - Vistas totales, likes, comentarios, velocidad (vistas/hora) y delta estimado en 24h.
   - Indicador dinámico **"🔥 En tendencia"** cuando la velocidad supera el umbral configurado.
   - Botón directo **"➕ Trackear este video"** para agregarlo al seguimiento con 1 clic.

2. **Dashboard Comparativo de Tendencias:**
   - Tabla interactiva para ordenar y comparar videos propios y de la competencia por vistas totales, velocidad (vistas/hora), engagement rate `((likes + comentarios) / vistas)` y antigüedad.
   - Filtros rápidos por *"Todos"*, *"Mis Videos"* y *"Competencia"*.
   - **Buscador de Nicho:** Permite ingresar palabras clave para descubrir videos recientes con mayor tracción e incorporarlos directamente al benchmark.

3. **Módulo de Análisis de Patrones ("¿Por qué funciona?"):**
   - Comparación agrupada de los *Top Performers* (videos con mayor vistas/hora) vs *Videos de rendimiento promedio*.
   - **Rango de Duración:** Gráfico comparativo e identificación del rango de duración óptimo (ej. 8–15 min).
   - **Horarios & Días de Publicación:** Distribución de publicación por día de la semana y franja horaria.
   - **Estructura de Títulos:** Análisis de longitud promedio en caracteres/palabras, uso de cifras, preguntas y extracción de palabras clave virales.
   - **Nube de Tags:** Frecuencia de etiquetas más utilizadas en videos virales del nicho.
   - **Diagnóstico Benchmark ("Mis Videos" vs Nicho):** Sugerencias personalizadas (ej. *"Tus videos duran 7 min en promedio; el top de tu nicho promedia 13 min. Te sugerimos extender la duración para mejorar la retención y monetización"*).

4. **Alertas & Notificaciones:**
   - Notificaciones nativas del navegador cuando cualquier video en seguimiento entra en estado de tendencia.

5. **Control Inteligente de Cuotas de API:**
   - Visualizador de cuota diaria consumida y optimización mediante consultas en lote (*batching*).

---

## 🛠️ Instalación en Modo Desarrollador

1. Clona o descarga esta carpeta en tu equipo.
2. Abre Google Chrome o Microsoft Edge y navega a:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Activa el **"Modo de desarrollador"** (interruptor en la esquina superior derecha).
4. Haz clic en el botón **"Cargar descomprimida"** (o *Load unpacked*).
5. Selecciona la carpeta raíz del proyecto (`02. VQI RZ`).
6. La extensión se instalará inmediatamente y verás el icono 📈 de TrendPulse YT en la barra de herramientas de extensiones.

---

## 🔑 Cómo Obtener tu YouTube Data API v3 Key (Gratis)

La extensión utiliza la API oficial de YouTube. Cada cuenta de Google obtiene **10,000 unidades de cuota gratuita diaria**, más que suficiente para monitorear decenas de videos diariamente.

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto o selecciona uno existente.
3. En el menú de navegación, ve a **APIs y servicios > Biblioteca**.
4. Busca **"YouTube Data API v3"** y haz clic en **Habilitar**.
5. Ve a **APIs y servicios > Credenciales**.
6. Haz clic en **+ Crear credenciales > Clave de API**.
7. Copia la clave de API generada.
8. Abre el Dashboard de TrendPulse YT (o haz clic en el icono de la extensión), ve a la pestaña **Configuración** y pega tu API Key en el campo correspondiente.

---

## 🔐 Configuración del Modo "Mis Videos" (Canal Propio)

Para comparar automáticamente tu catálogo contra el benchmark de tu nicho, TrendPulse YT ofrece dos modos:

### Opción A: Mediante ID de Canal (Recomendada y más rápida)
1. Ve a la pestaña **Configuración** en el Dashboard.
2. Ingresa el **ID de tu Canal de YouTube** (ejemplo: `UCxxxxxxxxxxxxxxxxx`). Puedes encontrar tu ID en la configuración avanzada de tu cuenta de YouTube.
3. Haz clic en **Guardar Configuración** y luego en **Sincronizar Mis Videos**. La extensión obtendrá tus videos subidos utilizando solo 2 unidades de cuota.

### Opción B: Mediante OAuth2 (Avanzado)
1. En Google Cloud Console (mismo proyecto), ve a **APIs y servicios > Pantalla de consentimiento de OAuth**.
2. Configura la pantalla de consentimiento y agrega el alcance (`scope`): `https://www.googleapis.com/auth/youtube.readonly`.
3. Ve a **Credenciales > Crear credenciales > ID de cliente OAuth**.
4. Selecciona tipo de aplicación: **Aplicación de Chrome**.
5. Ingresa el ID de la extensión asignado por `chrome://extensions`.
6. Copia el `client_id` generado y pégalo en la configuración de la extensión.

---

## 📊 Gestión de Cuotas & Buenas Prácticas

YouTube Data API v3 otorga 10,000 unidades de cuota al día por clave de API. El costo de cada operación es el siguiente:

| Operación API | Endpoint | Costo de Cuota | Notas de Optimización |
| :--- | :--- | :--- | :--- |
| **Actualizar Estadísticas de Videos** | `videos.list` | **1 unidad** | Se agrupan hasta 50 videos por consulta (*batching*). Polling cada 30 min consume <50u al día. |
| **Obtener Subidas de Canal** | `playlistItems.list` | **1 unidad** | Utilizado para sincronizar canal propio eficientemente. |
| **Búsqueda por Nicho** | `search.list` | **100 unidades** | Operación de mayor costo. Usar con moderación. |

### Consejos para no agotar la cuota:
- Mantén el intervalo de polling entre **30 y 60 minutos**.
- Mantén la lista de videos trackeados por debajo de 30-50 videos simultáneos.
- Realiza búsquedas por nicho solo cuando desees descubrir nuevos competidores.

---

## 🛡️ Privacidad y Cumplimiento de Políticas

- **Uso exclusivo de datos públicos:** Todo el análisis de velocidad, engagement, duraciones, títulos y tags se basa **únicamente en información pública** accesible a través de la API oficial de YouTube Data API v3.
- **Sin Web Scraping:** La extensión NO realiza scraping de código HTML de perfiles ni accede a métricas privadas de otros canales (como ingresos, fuentes de tráfico privadas o retención interna).
- **Almacenamiento Local:** Todas las credenciales, API Keys y snapshots de videos se almacenan localmente en tu navegador (`chrome.storage.local`) y **nunca** se envían a servidores de terceros.

---

## 📄 Licencia

Desarrollado para creadores de contenido. Distribución y modificación libre bajo licencia MIT.
