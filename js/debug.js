/**
 * Debug & Inicialización - Marali Comunicaciones
 * 
 * Este archivo está diseñado para ayudarte a debuggear problemas de autenticación
 * Cópialo y pégalo en la consola del navegador (F12) para usarlo
 */

// ============================================
// HELPERS DE DEBUG
// ============================================

const DEBUG = {
    // Verificar conexión a Firebase
    async checkFirebase() {
        try {
            const { auth, db } = await import('./js/firebase-config.js');
            console.log('✓ Firebase conectado');
            console.log('  Auth:', auth);
            console.log('  DB:', db);
            return { auth, db };
        } catch (error) {
            console.error('✗ Error conectando Firebase:', error);
        }
    },

    // Listar todos los usuarios
    async listUsers() {
        try {
            const { db } = await import('./js/firebase-config.js');
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js');
            
            const usuarios = await getDocs(collection(db, 'usuarios'));
            console.log(`✓ Total usuarios: ${usuarios.size}`);
            usuarios.forEach(doc => {
                console.log('  -', doc.data().usuario, '(' + doc.data().email + ')');
            });
        } catch (error) {
            console.error('✗ Error listando usuarios:', error);
        }
    },

    // Crear usuario demo
    async createDemoUser() {
        try {
            const { createDemoUsers } = await import('./js/auth.js');
            await createDemoUsers();
            console.log('✓ Proceso completado. Abre la consola para ver detalles.');
        } catch (error) {
            console.error('✗ Error creando usuario demo:', error);
        }
    },

    // Verificar usuario actual
    async checkCurrentUser() {
        try {
            const { auth } = await import('./js/firebase-config.js');
            const user = auth.currentUser;
            if (user) {
                console.log('✓ Usuario actual:', user.email, '(' + user.uid + ')');
            } else {
                console.log('ℹ️ No hay usuario autenticado');
            }
        } catch (error) {
            console.error('✗ Error:', error);
        }
    },

    // Probar login
    async testLogin(usuario = 'admin', password = 'admin123') {
        try {
            const { loginUser } = await import('./js/auth.js');
            const result = await loginUser(usuario, password);
            console.log('✓ Login exitoso');
            console.log('  Usuario:', result.email);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('✗ Error en login:', error.message);
        }
    },

    // Logout
    async logout() {
        try {
            const { logoutUser } = await import('./js/auth.js');
            await logoutUser();
            console.log('✓ Logout exitoso');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('✗ Error en logout:', error);
        }
    },

    // Limpiar datos locales
    clearLocalStorage() {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✓ Almacenamiento local limpiado');
        window.location.reload();
    }
};

// Exportar para consola
window.DEBUG = DEBUG;

console.log('🔧 Debug Tools Cargados - Usa window.DEBUG.help() para ver opciones');

// Función de ayuda
DEBUG.help = function() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          HERRAMIENTAS DE DEBUG - MARALI COMUNICACIONES     ║
╚════════════════════════════════════════════════════════════╝

Disponibles en window.DEBUG:

  ✓ checkFirebase()          - Verifica conexión a Firebase
  ✓ listUsers()              - Lista todos los usuarios
  ✓ checkCurrentUser()       - Muestra usuario autenticado
  ✓ createDemoUser()         - Crea usuario demo
  ✓ testLogin(user, pass)    - Prueba login (default: admin/admin123)
  ✓ logout()                 - Cierra sesión
  ✓ clearLocalStorage()      - Limpia datos locales y recarga

EJEMPLOS:
  DEBUG.checkFirebase()      
  DEBUG.listUsers()
  DEBUG.createDemoUser()
  DEBUG.testLogin('admin', 'admin123')

    `);
};
