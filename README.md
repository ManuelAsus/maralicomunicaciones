# Marali Comunicaciones - Web Version (Firebase + GitHub Pages)

**Sistema de Gestión Integral migrado a Firebase + GitHub Pages**

## 🚀 Quick Start

### 1. Clonar el repositorio
```bash
git clone https://github.com/tuusuario/maralicomunicaciones-web.git
cd maralicomunicaciones-web
```

### 2. Desplegar en GitHub Pages
1. Ir a Configuración del repositorio → Pages
2. Seleccionar rama `main` / folder `/ (root)`
3. Click en "Save"
4. Tu sitio estará disponible en: `https://tuusuario.github.io/maralicomunicaciones-web/`

### 3. Credenciales de prueba
- **Usuario:** admin
- **Contraseña:** admin123

## 📋 Características

✅ **Autenticación con Firebase Auth**
- Login/Logout
- Recuperación de contraseña por email
- Sesiones persistentes

✅ **Módulos Principales**
- Dashboard (estadísticas)
- Inventario (CRUD productos)
- Ventas (registro)
- Historial (visualización)
- Trabajadores (gestión)
- Impuestos (control)
- Tickets
- Facturación

✅ **Backend Firebase**
- Firestore (base de datos NoSQL)
- Cloud Storage (archivos)
- Cloud Functions (si necesitas lógica server-side)

✅ **Frontend**
- SPA (Single Page Application)
- Diseño responsivo
- UI moderna con gradientes
- Módulos cargados dinámicamente

## 🏗️ Estructura del Proyecto

```
maralicomunicaciones-web/
├── index.html              → Página de login
├── dashboard.html          → Shell del dashboard
├── js/
│   ├── firebase-config.js  → Config de Firebase + inicialización
│   ├── auth.js             → Sistema de autenticación
│   ├── api.js              → Funciones de Firestore
│   └── modules/            → Módulos SPA
│       ├── home.js
│       ├── inventario.js
│       ├── ventas.js
│       ├── historial.js
│       ├── trabajadores.js
│       ├── impuestos.js
│       ├── tickets.js
│       └── facturacion.js
├── css/
│   ├── style.css           → Estilos globales
│   └── dashboard.css       → Estilos dashboard
├── assets/                 → Imágenes y recursos
└── README.md              → Este archivo
```

## 🔧 Configuración

### Variables de Entorno
Las configuraciones de Firebase están en `js/firebase-config.js` (actualmente hardcodeadas).

Para producción, considera usar variables de entorno:
```javascript
// En firebase-config.js
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // ...
};
```

## 📚 Documentación API Firestore

### Collections
- `usuarios` - Datos de usuarios
- `productos` - Inventario
- `clientes` - Base de clientes
- `ventas` - Historial de ventas
- `trabajadores` - Información de empleados
- `trabajadores_documentos` - Documentos de trabajadores
- `tickets` - Tickets generados
- `impuestos_imms`, `impuestos_sat`, etc. - Control de impuestos
- `facturacion_datos` - Datos fiscales

### Funciones API (en `js/api.js`)

#### Productos
```javascript
await createProducto(productoData, userId)
await getProductos(userId)
await updateProducto(productoId, updatedData)
await deleteProducto(productoId)
```

#### Clientes
```javascript
await createCliente(clienteData, userId)
await getClientes(userId)
```

#### Ventas
```javascript
await createVenta(ventaData, userId)
await getVentas(userId)
```

#### Trabajadores
```javascript
await createTrabajador(trabajadorData, userId)
await getTrabajadores(userId)
await updateTrabajador(trabajadorId, updatedData)
await deleteTrabajador(trabajadorId)
```

#### Storage (Archivos)
```javascript
await uploadFile(file, path)  // Sube archivo y retorna URL
await deleteFile(path)         // Elimina archivo
```

## 🛠️ Desarrollo Local

### Usando Python (recomendado)
```bash
python -m http.server 8000
# Ir a http://localhost:8000
```

### Usando Node.js (http-server)
```bash
npm install -g http-server
http-server
```

### Usando Live Server (VS Code)
1. Instalar extensión "Live Server"
2. Click derecho en `index.html` → "Open with Live Server"

## 📱 Colores del Tema

```css
--primary: #fcc30b (Amarillo)
--secondary: #f3992c (Naranja)
--accent-1: #ec6534 (Rojo naranja)
--dark-1: #2c245c (Morado oscuro principal)
--dark-3: #343c54 (Azul gris)
```

## 🔐 Seguridad

### Implementado
✅ Validación de sesión
✅ Escapado de datos
✅ Firestore Security Rules
✅ Autenticación con email/contraseña

### Para Producción
- [ ] Implementar JWT tokens
- [ ] Rate limiting en APIs
- [ ] Validación de tipos MIME
- [ ] CORS configuration
- [ ] HTTPS forced

## 🚀 Deploy

### A GitHub Pages
```bash
git add .
git commit -m "Deploy changes"
git push origin main
```

La actualización estará disponible en 1-2 minutos.

### A un servidor personal
1. Build (si usas bundler):
   ```bash
   npm run build
   ```
2. Upload carpeta `dist/` por FTP/SFTP
3. Configurar HTTPS

## 📊 Migrando datos de la versión PHP

### Opción 1: Export/Import Manual
1. En la versión PHP: Exportar datos como JSON
2. Crear script que importe a Firestore
3. Ejecutar en la consola del navegador

### Opción 2: Cloud Functions
Crear función que procese batch de datos:
```javascript
// firebase/functions/migrateData.js
exports.migrateFromMySQL = functions.https.onCall(async (data, context) => {
  // Validar usuario
  // Procesar datos
  // Insertar en Firestore
});
```

## 🐛 Troubleshooting

### "Firebase not initialized"
→ Revisar `firebase-config.js`
→ Verificar que Firebase está en `<script type="module">`

### "El módulo no carga"
→ Verificar console (F12)
→ Revisar que archivo existe en `js/modules/nombre.js`
→ Revisar CORS headers

### "Autenticación no funciona"
→ Revisar Firebase Console → Authentication
→ Verificar que método Email/Password está habilitado
→ Revisar Firestore Security Rules

### "Archivos no se suben"
→ Verificar Cloud Storage está habilitado
→ Revisar Storage Security Rules
→ Revisar tamaño máximo del archivo

## 📝 Notas de Desarrollo

### Agregar nuevo módulo

1. Crear archivo `js/modules/nombre.js`:
```javascript
export async function render(container, user) {
    container.innerHTML = `<h2>Mi Módulo</h2>`;
    // Tu código aquí
}
```

2. Agregar a menu en `dashboard.html`:
```html
<li>
    <a href="#" onclick="loadModule('nombre')" class="nav-item">
        <span class="icon">🎯</span>
        <span>Mi Módulo</span>
    </a>
</li>
```

3. Crear Collection en Firestore si es necesario

4. Agregar funciones en `js/api.js`

## 🎓 Recursos

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Web API MDN](https://developer.mozilla.org/en-US/docs/Web/API)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

## 📞 Soporte

Para reportar bugs o sugerir features, abre un Issue en GitHub.

## 📄 Licencia

Proyecto privado - Marali Comunicaciones

---

**Última actualización:** Mayo 2026  
**Versión:** 3.0 Web  
**Estado:** Producción  
