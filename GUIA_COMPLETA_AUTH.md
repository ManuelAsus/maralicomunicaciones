# 🆘 Error: auth/operation-not-allowed - SOLUCIÓN COMPLETA

## 🔴 El Problema
Ves este error cuando intentas crear usuario:
```
Firebase: Error (auth/operation-not-allowed)
```

**Causa:** La autenticación por Email/Contraseña NO está habilitada en Firebase Console

---

## 🟢 SOLUCIÓN A (La Más Rápida - 2 minutos)

### Paso 1: Abre Firebase Console
1. Ve a: https://console.firebase.google.com
2. Busca tu proyecto: **maralicomunicaciones-d8d30**
3. Click para abrirlo

### Paso 2: Ve a Authentication
```
Menú izquierdo 
  ↓
Construir
  ↓
Authentication (es la segunda opción)
```

### Paso 3: Click en "Sign-in method"
```
Pestaña "Sign-in method" (es la segunda pestaña arriba)
```

### Paso 4: Habilita Email/Password
Busca en la lista:
- **Email/Password** (es el primero)
- Click en el interruptor (toggle)
- Si aparece popup: Click "ENABLE"
- Click "SAVE" abajo

### Paso 5: ¡Listo!
Regresa aquí e intenta:
1. Abre: `crear-usuario-demo.html`
2. Click: "🤖 Crear Automáticamente"
3. Deberías ver: ✅ Usuario creado

---

## 🟢 SOLUCIÓN B (Alternativa - Sin pasar por código)

Si prefieres, crea el usuario directamente en Firebase Console:

### Paso 1: Ve a Authentication
```
Firebase Console
  → Tu proyecto
  → Authentication
```

### Paso 2: Tab "Users"
```
Click en "Users" (primera pestaña)
```

### Paso 3: Agregar usuario
```
Click botón "Add user" o "➕ Crear usuario"
```

### Paso 4: Llena los datos
- Email: **admin@maralicomunicaciones.demo**
- Contraseña: **admin123**
- Click "Create user"

### Paso 5: Copia el UID
Cuando se cree, aparecerá un UID (User ID) como:
```
abc123def456ghi789...
```
**COPIA ESTE UID**

### Paso 6: Ve a Firestore
```
Firebase Console
  → Tu proyecto
  → Firestore Database
```

### Paso 7: Colección "usuarios"
```
Click en colección "usuarios"
```

### Paso 8: Agregar documento
```
Click "➕ Agregar documento"
```

### Paso 9: Configura el ID del documento
```
En "ID del documento" 
  ↓
Elige "Personalizado"
  ↓
Pega el UID que copiaste en Paso 5
```

### Paso 10: Agrega los campos
```
Nombre         | Valor
───────────────|─────────────────────────────────
uid            | [el UID que copiaste]
email          | admin@maralicomunicaciones.demo
usuario        | admin
nombre_completo| Administrador Demo
estado         | activo
fecha_creacion | (fecha actual)
telefono       | +52 1 746 102 3929
```

### Paso 11: Guarda
```
Click "Guardar"
```

### Paso 12: Intenta login
```
Ve a: index.html
Usuario: admin
Contraseña: admin123
```

---

## 🟢 SOLUCIÓN C (Automática desde el navegador)

Una vez que hayas hecho la **Solución A** (Paso 4 - habilitar Email/Password):

1. Abre: `crear-usuario-demo.html`
2. Click: "🤖 Crear Automáticamente"
3. Espera 2-3 segundos
4. Deberías ver: ✅ Usuario creado exitosamente
5. Ve a: `index.html`
6. Login con: `admin` / `admin123`

---

## ✅ VERIFICACIÓN

Cuando hayas completado una de las 3 soluciones, intenta esto:

1. Abre: `index.html`
2. Ingresa:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Click: "Iniciar Sesión"

**Si ves el dashboard → ¡FUNCIONA!** 🎉

---

## ❓ Si AÚN hay problemas

1. Abre `diagnostico.html`
2. Click: "🔨 Crear Usuario Demo"
3. **Copia TODO lo que dice en la consola VERDE abajo**
4. Envía el resultado

---

## 📋 Resumen de Archivos

| Archivo | Para qué |
|---------|----------|
| `HABILITAR_EMAIL_PASSWORD.txt` | Instrucciones rápidas (este archivo) |
| `crear-usuario-demo.html` | Crear usuario automáticamente |
| `index.html` | Login (usar después de crear usuario) |
| `diagnostico.html` | Diagnosticar problemas |

---

**¿Ya habilitaste Email/Password? Intenta de nuevo ahora.** ↪️

Si sigue sin funcionar, copia los logs de `crear-usuario-demo.html` y envíamelos.
