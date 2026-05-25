# 🔧 Guía de Solución de Problemas - Marali Comunicaciones Web

## Problema: "Error de autenticación: undefined"

### Causas Comunes y Soluciones

#### 1. **Usuario no existe en la base de datos**
- **Síntoma:** El login falla aunque ingresas credenciales
- **Solución:**
  - Asegúrate de que el usuario `admin` existe
  - Verifica en Firebase Console → Firestore → Colección `usuarios`
  - Si no existe, ejecuta: `createDemoUsers()` en la consola del navegador

#### 2. **Firebase no está configurado correctamente**
- **Síntoma:** Error de conexión o "permission-denied"
- **Solución:**
  - Abre `js/firebase-config.js`
  - Verifica que `firebaseConfig` tenga todas las claves correctas
  - Valida que el `projectId` coincida con tu proyecto en Firebase
  - Comprueba que la URL de la app sea accesible

#### 3. **Firestore no tiene las reglas de seguridad correctas**
- **Síntoma:** Login funciona pero no carga datos
- **Solución:**
  - Ve a Firebase Console → Firestore → Rules
  - Asegúrate de permitir lectura/escritura a usuarios autenticados:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

#### 4. **Credenciales demo incorrecto**
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Correo:** `admin@maralicomunicaciones.demo`

---

## Cómo Debuggear

### En la Consola del Navegador (F12)

1. **Verificar si Firebase está inicializado:**
   ```javascript
   import { auth, db } from './js/firebase-config.js';
   console.log(auth);  // Debe mostrar Auth object
   console.log(db);    // Debe mostrar Firestore object
   ```

2. **Crear usuario demo manualmente:**
   ```javascript
   import { createDemoUsers } from './js/auth.js';
   createDemoUsers();
   ```

3. **Listar todos los usuarios:**
   ```javascript
   import { db } from './js/firebase-config.js';
   import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
   
   const usuarios = await getDocs(collection(db, 'usuarios'));
   usuarios.forEach(doc => console.log(doc.data()));
   ```

4. **Probar login manualmente:**
   ```javascript
   import { loginUser } from './js/auth.js';
   
   try {
       await loginUser('admin', 'admin123');
       console.log('Login exitoso');
   } catch (error) {
       console.error('Error:', error.message);
   }
   ```

---

## Mensajes de Error Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Usuario o contraseña incorrectos" | Credenciales inválidas | Verifica usuario y contraseña |
| "Error de conexión" | Red o Firebase caído | Verifica conexión a internet |
| "No tienes permisos para esta acción" | Reglas de Firestore | Actualiza reglas de seguridad |
| "Ocurrió un error desconocido" | Error inesperado | Revisa consola para más detalles |

---

## Pasos para Resetear Todo

Si algo no funciona:

1. **Abre Firebase Console**
2. **Ve a Firestore → Colección `usuarios`**
3. **Elimina todos los documentos**
4. **Recarga la página** - se crearán usuarios demo automáticamente
5. **Intenta login con `admin` / `admin123`**

---

## Verificar Consola del Servidor

En el navegador (F12 → Console) deberías ver:
```
✓ "Usuario demo creado correctamente"
✓ "Auth state changed"
✓ Sin errores de módulos
```

Si ves errores en rojo, cópalos completos y busca en las secciones anteriores.

---

## Contacto / Más Ayuda

Si el problema persiste:
1. Verifica que todas las dependencias de Firebase estén correctas
2. Limpia el caché del navegador (Ctrl+Shift+Delete)
3. Intenta en una ventana privada/incógnita
4. Revisa los logs en Firebase Console → Logs

