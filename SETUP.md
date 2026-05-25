# Setup Inicial - Marali Comunicaciones Web

## 🔥 Firebase Setup

### 1. Crear proyecto Firebase
1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Nombre: `maralicomunicaciones`
4. Desabilitar Google Analytics (opcional)
5. Click "Create"

### 2. Configurar Authentication
1. En Firebase Console → Authentication
2. Click "Get Started"
3. Enable "Email/Password"
   - Habilitar "Email/Password"
   - Click "Save"

### 3. Crear Firestore Database
1. En Firebase Console → Firestore Database
2. Click "Create database"
3. Seleccionar ubicación: `us-central1`
4. Security rules: `Production mode` (después cambiaremos)
5. Click "Create"

### 4. Configurar Cloud Storage
1. En Firebase Console → Storage
2. Click "Get Started"
3. Ubicación: `us-central1`
4. Click "Done"

### 5. Obtener credenciales
1. En Firebase Console → Project Settings (⚙️)
2. Ir a "Your apps" → Web app `</>` 
3. Si no existe, click "Add app"
4. Copiar la configuración
5. Pegar en `js/firebase-config.js`

## 📝 Security Rules

### Firestore (Temporary - Development)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Pasos:
1. Firebase Console → Firestore → Rules
2. Reemplazar con el código arriba
3. Click "Publish"

### Storage (Temporary - Development)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Pasos:
1. Firebase Console → Storage → Rules
2. Reemplazar con el código arriba
3. Click "Publish"

## 🚀 GitHub Pages Setup

### 1. Crear repositorio
1. Ir a [GitHub](https://github.com)
2. Click "New" (new repository)
3. Nombre: `maralicomunicaciones-web`
4. Descripción: "Marali Comunicaciones - Sistema de Gestión Web"
5. Visibilidad: Public
6. Click "Create repository"

### 2. Clonar y subir archivos
```bash
git clone https://github.com/tuusuario/maralicomunicaciones-web.git
cd maralicomunicaciones-web

# Copiar todos los archivos del proyecto aquí

git add .
git commit -m "Initial commit - Web app with Firebase"
git push origin main
```

### 3. Habilitar GitHub Pages
1. Repository → Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / folder: / (root)
4. Click "Save"
5. Esperar 1-2 minutos
6. Tu sitio estará en: `https://tuusuario.github.io/maralicomunicaciones-web/`

## 📱 Desarrollo Local

### Option 1: Python (Windows)
```bash
python -m http.server 8000
# Ir a http://localhost:8000
```

### Option 2: Node.js
```bash
npm install -g http-server
http-server
# Ir a http://localhost:8080
```

### Option 3: VS Code Live Server
1. Instalar extensión "Live Server"
2. Click derecho en `index.html` → "Open with Live Server"

**Nota:** Necesitas servidor local porque Firebase requiere HTTPS/localhost.

## 🗄️ Crear Collections en Firestore

Ir a Firebase Console → Firestore → Start collection

### 1. usuarios
- Document ID: uid (auto)
- Campos:
  - uid (string)
  - email (string)
  - nombre_completo (string)
  - usuario (string)
  - telefono (string)
  - fecha_creacion (timestamp)
  - estado (string: "activo"/"inactivo")

### 2. productos
- Document ID: (auto)
- Campos:
  - nombre (string)
  - codigo (string)
  - categoria (string)
  - precio (number)
  - stock (number)
  - descripcion (string)
  - imagen (string: URL)
  - usuario_id (string)
  - fecha_creacion (timestamp)
  - estado (string)

### 3. clientes
- Document ID: (auto)
- Campos:
  - nombre (string)
  - telefono (string)
  - direccion (string)
  - descripcion_necesidad (string)
  - usuario_id (string)
  - fecha_registro (timestamp)

### 4. ventas
- Document ID: (auto)
- Campos:
  - cliente_id (string)
  - usuario_id (string)
  - fecha_venta (timestamp)
  - compro_algo (string: "si"/"no")
  - total (number)
  - nombre_cliente (string)
  - telefono_cliente (string)
  - estado (string)

### 5. trabajadores
- Document ID: (auto)
- Campos:
  - nombre (string)
  - cargo (string)
  - foto (string: URL o BLOB URL)
  - rfc (string)
  - salario (number)
  - periodo_cobro (string)
  - forma_pago (string)
  - usuario_id (string)
  - fecha_registro (timestamp)

### 6. trabajadores_documentos
- Document ID: (auto)
- Campos:
  - trabajador_id (string)
  - usuario_id (string)
  - archivo (string: URL)
  - nombre_original (string)
  - tipo_archivo (string)
  - tamaño (number)
  - fecha_subida (timestamp)

### 7-10. impuestos (IMMS, SAT, INFONAVIT, TABASCO)
- Document ID: (auto)
- Campos:
  - usuario_id (string)
  - mes (number)
  - ano (number)
  - estado (string: "pendiente"/"completado")
  - documento (string: URL)
  - fecha_creacion (timestamp)

### 11. tickets
- Document ID: (auto)
- Campos:
  - numero_ticket (string: #000001)
  - usuario_id (string)
  - cliente_id (string)
  - venta_id (string)
  - total (number)
  - fecha_creacion (timestamp)
  - estado (string)

## ✅ Checklist de Setup

- [ ] Firebase project creado
- [ ] Authentication habilitada
- [ ] Firestore Database creada
- [ ] Cloud Storage habilitado
- [ ] Config obtenida y copiada a `js/firebase-config.js`
- [ ] Security Rules configuradas
- [ ] GitHub repository creado
- [ ] Archivos subidos a GitHub
- [ ] GitHub Pages habilitado
- [ ] Collections creadas en Firestore
- [ ] Usuario demo creado (se hace automático en primera visita)
- [ ] Probar login con demo credentials

## 🚀 Primeros Pasos

1. Acceder a tu URL de GitHub Pages
2. Login con: admin / admin123
3. Crear un producto de prueba
4. Crear una venta de prueba
5. Verificar que todo funciona

## 📞 Troubleshooting

### Firebase dice "authentication not enabled"
→ Ver Security Rules
→ Verificar que user está autenticado

### Archivos no se suben a Storage
→ Revisar Storage Rules
→ Verificar tamaño del archivo
→ Revisar console del navegador

### GitHub Pages no actualiza
→ Esperar 1-2 minutos
→ Limpiar caché del navegador (Ctrl+Shift+R)
→ Verificar que rama `main` está seleccionada

### "Cannot read properties of undefined"
→ Verificar que Firebase está inicializado
→ Ver console del navegador (F12)
→ Verificar que todas las funciones existen

## 📚 Próximos Pasos

1. [ ] Crear más módulos (Ventas, Historial, etc.)
2. [ ] Configurar Cloud Functions si necesitas lógica server
3. [ ] Migrar datos existentes de versión PHP
4. [ ] Mejorar Security Rules para producción
5. [ ] Agregar más validaciones en frontend
6. [ ] Implementar PWA (Progressive Web App)
7. [ ] Añadir analytics

## 🎓 Referencias

- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [GitHub Pages Guide](https://docs.github.com/en/pages)
- [Web Development MDN](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web)

---

¡Listo para empezar! Si tienes dudas, revisa la console del navegador (F12) para mensajes de error.
