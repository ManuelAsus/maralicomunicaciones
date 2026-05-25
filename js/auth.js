/**
 * Sistema de Autenticación con Firebase
 */

import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';

// Configurar persistencia
await setPersistence(auth, browserLocalPersistence)
    .catch(err => console.log('Persistencia error:', err));

/**
 * Crear cuenta de usuario
 */
export async function registerUser(email, password, nombre) {
    try {
        if (!email || !password || !nombre) {
            throw new Error('Todos los campos son requeridos');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar datos adicionales en Firestore
        await setDoc(doc(db, 'usuarios', user.uid), {
            uid: user.uid,
            email: email,
            nombre_completo: nombre,
            usuario: email.split('@')[0], // usar parte del email como usuario
            fecha_creacion: new Date(),
            estado: 'activo'
        });

        // Actualizar perfil en Firebase Auth
        await updateProfile(user, {
            displayName: nombre
        });

        return user;
    } catch (error) {
        const message = parseFirebaseError(error.code) || error.message || 'Error al crear cuenta';
        throw new Error(message);
    }
}

/**
 * Login de usuario
 */
export async function loginUser(usuario, contraseña) {
    try {
        console.log('🔐 Iniciando login para usuario:', usuario);
        
        if (!usuario || !contraseña) {
            throw new Error('Usuario y contraseña son requeridos');
        }

        // Buscar usuario por nombre de usuario en Firestore
        const usersRef = collection(db, 'usuarios');
        const q = query(usersRef, where('usuario', '==', usuario));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn('⚠️ Usuario no encontrado:', usuario);
            throw new Error('Usuario o contraseña incorrectos');
        }

        const userData = querySnapshot.docs[0].data();
        const email = userData.email;
        console.log('✓ Usuario encontrado:', email);

        // Login con email y contraseña
        try {
            console.log('🔑 Intentando autenticación con Firebase...');
            await signInWithEmailAndPassword(auth, email, contraseña);
            console.log('✓ Autenticación exitosa');
            return auth.currentUser;
        } catch (authError) {
            console.error('✗ Error de autenticación:', authError.code, authError.message);
            if (authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found') {
                throw new Error('Usuario o contraseña incorrectos');
            }
            throw new Error(parseFirebaseError(authError.code) || authError.message || 'Error en autenticación');
        }
    } catch (error) {
        console.error('❌ Error de login:', error.message);
        // Asegurar que siempre retornamos un mensaje significativo
        if (error instanceof Error) {
            throw error;
        } else if (typeof error === 'string') {
            throw new Error(error);
        } else {
            throw new Error('Error desconocido al iniciar sesión');
        }
    }
}

/**
 * Logout
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        localStorage.removeItem('currentUser');
    } catch (error) {
        throw new Error(parseFirebaseError(error.code));
    }
}

/**
 * Obtener usuario actual
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Obtener datos del usuario desde Firestore
 */
export async function getUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'usuarios', uid));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo datos del usuario:', error);
        return null;
    }
}

/**
 * Recuperar contraseña
 */
export async function resetPassword(email) {
    try {
        if (!email) {
            throw new Error('El correo es requerido');
        }
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: 'Se envió un enlace de recuperación a tu correo' };
    } catch (error) {
        const message = parseFirebaseError(error.code) || error.message || 'Error al enviar correo de recuperación';
        throw new Error(message);
    }
}

/**
 * Crear usuarios demo (solo si no existen)
 */
export async function createDemoUsers() {
    try {
        console.log('\n========== INICIANDO CREACIÓN DE USUARIO DEMO ==========');
        
        const demoEmail = 'admin@maralicomunicaciones.demo';
        const demoPassword = 'admin123';
        
        // PASO 1: Verificar si el usuario ya existe en Firestore
        console.log('PASO 1: Verificando si usuario "admin" existe en Firestore...');
        const usersRef = collection(db, 'usuarios');
        const q = query(usersRef, where('usuario', '==', 'admin'));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            console.log('✅ USUARIO YA EXISTE - No hay nada que hacer');
            console.log('   Email:', querySnapshot.docs[0].data().email);
            return;
        }

        console.log('⏳ Usuario "admin" NO EXISTE - Procediendo a crear...\n');
        
        // PASO 2: Crear usuario en Firebase Auth
        console.log('PASO 2: Creando usuario en Firebase Authentication...');
        let uid = null;
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
            uid = userCredential.user.uid;
            console.log('✅ Usuario autenticación creado');
            console.log('   UID:', uid);
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                console.log('⚠️  Email ya existe en Authentication - Intentando obtener UID...');
                
                // Intentar encontrar el UID usando el email
                try {
                    // Buscar en Firestore por email
                    const emailQuery = query(usersRef, where('email', '==', demoEmail));
                    const emailSnapshot = await getDocs(emailQuery);
                    
                    if (!emailSnapshot.empty) {
                        uid = emailSnapshot.docs[0].id;
                        console.log('✅ UID encontrado en Firestore:', uid);
                    } else {
                        console.error('❌ No se pudo encontrar el UID');
                        console.log('   Posible solución: Elimina el usuario desde Firebase Console');
                        return;
                    }
                } catch (err) {
                    console.error('❌ Error buscando UID:', err.message);
                    return;
                }
            } else {
                console.error('❌ Error en autenticación:', authError.code, authError.message);
                throw authError;
            }
        }

        if (!uid) {
            console.error('❌ No se pudo obtener UID');
            return;
        }

        // PASO 3: Verificar si ya existe en Firestore
        console.log('\nPASO 3: Verificando si datos existen en Firestore...');
        const existingDoc = await getDoc(doc(db, 'usuarios', uid));
        if (existingDoc.exists()) {
            console.log('✅ Datos ya existen - Verificando contenido...');
            console.log('   Usuario:', existingDoc.data().usuario);
            console.log('   Email:', existingDoc.data().email);
            return;
        }

        console.log('⏳ Datos NO EXISTEN en Firestore - Creando...');

        // PASO 4: Crear documento en Firestore
        console.log('\nPASO 4: Creando documento en Firestore...');
        await setDoc(doc(db, 'usuarios', uid), {
            uid: uid,
            email: demoEmail,
            nombre_completo: 'Administrador Demo',
            usuario: 'admin',
            telefono: '+52 1 746 102 3929',
            fecha_creacion: new Date(),
            estado: 'activo'
        });
        
        console.log('✅ Documento creado en Firestore');

        // PASO 5: Verificación final
        console.log('\nPASO 5: Verificación final...');
        const finalDoc = await getDoc(doc(db, 'usuarios', uid));
        if (finalDoc.exists()) {
            console.log('✅ ¡ÉXITO! Usuario demo creado correctamente');
            console.log('   Usuario:', finalDoc.data().usuario);
            console.log('   Email:', finalDoc.data().email);
            console.log('   UID:', uid);
        } else {
            console.error('❌ Error: El documento no se guardó correctamente');
        }

        console.log('========== FIN CREACIÓN DE USUARIO DEMO ==========\n');

    } catch (error) {
        console.error('❌ Error general:', error.message);
        console.error('Stack:', error.stack);
    }
}

/**
 * Parsear errores de Firebase a mensajes legibles
 */
function parseFirebaseError(code) {
    const errors = {
        'auth/invalid-email': 'El correo no es válido',
        'auth/user-disabled': 'El usuario ha sido desactivado',
        'auth/user-not-found': 'Usuario o contraseña incorrectos',
        'auth/wrong-password': 'Usuario o contraseña incorrectos',
        'auth/email-already-in-use': 'El correo ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/operation-not-allowed': 'Esta operación no está permitida',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'permission-denied': 'No tienes permisos para esta acción',
        'not-found': 'Registro no encontrado'
    };
    
    if (!code) {
        return 'Ocurrió un error desconocido';
    }
    
    return errors[code] || `Error: ${code}`;
}

/**
 * Observador de cambios de autenticación
 */
export function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}
