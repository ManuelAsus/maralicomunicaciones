/**
 * API Firestore - Replicación exacta del sistema PHP
 * Mantiene la misma lógica de negocio, solo cambia el backend
 */

import { db, storage, Timestamp } from './firebase-config.js';
import {
    collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy,
    increment, serverTimestamp, onSnapshot, writeBatch, setDoc
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js';


// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                    FUNCIONES GLOBALES / HELPERS                               ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export function formatDate(timestamp) {
    if (!timestamp) return '-';
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return '-';
    }
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatMoney(amount) {
    if (!amount) return '$0.00';
    const num = parseFloat(amount);
    return `$${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function parseFirebaseError(code) {
    const errorMap = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'permission-denied': 'No tienes permiso para esta acción',
        'not-found': 'Registro no encontrado'
    };
    return errorMap[code] || `Error: ${code}`;
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                         AUTENTICACIÓN / USUARIOS                              ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export async function getUserData(userId) {
    try {
        const docSnap = await getDoc(doc(db, 'usuarios', userId));
        if (!docSnap.exists()) throw new Error('Usuario no encontrado');
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function getUserIdByUsername(username) {
    try {
        const q = query(collection(db, 'usuarios'), where('usuario', '==', username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        return querySnapshot.docs[0].id;
    } catch (error) {
        console.error('Error buscando usuario:', error);
        return null;
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                          PRODUCTOS / INVENTARIO                               ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export async function createProducto(productoData, userId) {
    try {
        if (!productoData.nombre || !productoData.precio) {
            throw new Error('Nombre y precio son requeridos');
        }

        const docRef = await addDoc(collection(db, 'productos'), {
            nombre: productoData.nombre,
            codigo: productoData.codigo || '',
            categoria: productoData.categoria || '',
            precio: parseFloat(productoData.precio),
            stock: parseInt(productoData.stock) || 0,
            imagen: productoData.imagen || '',
            descripcion: productoData.descripcion || '',
            usuario_id: userId,
            estado: 'activo',
            fecha_creacion: Timestamp.now(),
            fecha_actualizacion: Timestamp.now()
        });

        return { id: docRef.id, ...productoData };
    } catch (error) {
        console.error('Error al crear producto:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function getProductos(userId) {
    try {
        const q = query(
            collection(db, 'productos'),
            where('usuario_id', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const productos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Ordenar por fecha_creacion en JavaScript (descendente)
        return productos.sort((a, b) => {
            const timeA = a.fecha_creacion?.toMillis?.() || 0;
            const timeB = b.fecha_creacion?.toMillis?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function getProducto(productoId) {
    try {
        const docSnap = await getDoc(doc(db, 'productos', productoId));
        if (!docSnap.exists()) throw new Error('Producto no encontrado');
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error al obtener producto:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function updateProducto(productoId, productoData, userId) {
    try {
        const producto = await getProducto(productoId);
        if (producto.usuario_id !== userId) {
            throw new Error('No tienes permiso para editar este producto');
        }

        const updateData = {
            nombre: productoData.nombre || producto.nombre,
            codigo: productoData.codigo || producto.codigo,
            categoria: productoData.categoria || producto.categoria,
            precio: productoData.precio ? parseFloat(productoData.precio) : producto.precio,
            stock: productoData.stock !== undefined ? parseInt(productoData.stock) : producto.stock,
            imagen: productoData.imagen || producto.imagen,
            descripcion: productoData.descripcion || producto.descripcion,
            fecha_actualizacion: Timestamp.now()
        };

        await updateDoc(doc(db, 'productos', productoId), updateData);
        return { id: productoId, ...updateData };
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function deleteProducto(productoId, userId) {
    try {
        const producto = await getProducto(productoId);
        if (producto.usuario_id !== userId) {
            throw new Error('No tienes permiso para eliminar este producto');
        }

        // Las imágenes se guardan como base64, no necesita eliminar de Firebase Storage
        await deleteDoc(doc(db, 'productos', productoId));
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                            CLIENTES                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export async function createCliente(clienteData, userId) {
    try {
        if (!clienteData.nombre || !clienteData.telefono) {
            throw new Error('Nombre y teléfono son requeridos');
        }

        const docRef = await addDoc(collection(db, 'clientes'), {
            nombre: clienteData.nombre,
            telefono: clienteData.telefono,
            direccion: clienteData.direccion || '',
            descripcion_necesidad: clienteData.descripcion_necesidad || '',
            usuario_id: userId,
            fecha_registro: Timestamp.now()
        });

        return { id: docRef.id, ...clienteData };
    } catch (error) {
        console.error('Error al crear cliente:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function getClientes(userId) {
    try {
        const q = query(
            collection(db, 'clientes'),
            where('usuario_id', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const clientes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return clientes.sort((a, b) => {
            const timeA = a.fecha_registro?.toMillis?.() || 0;
            const timeB = b.fecha_registro?.toMillis?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function getClienteByPhone(telefono, userId) {
    try {
        const q = query(
            collection(db, 'clientes'),
            where('usuario_id', '==', userId),
            where('telefono', '==', telefono)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        return null;
    }
}

export async function updateCliente(clienteId, clienteData, userId) {
    try {
        const cliente = await getDoc(doc(db, 'clientes', clienteId));
        if (cliente.data().usuario_id !== userId) {
            throw new Error('No tienes permiso para editar este cliente');
        }

        await updateDoc(doc(db, 'clientes', clienteId), clienteData);
        return { id: clienteId, ...clienteData };
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function deleteCliente(clienteId, userId) {
    try {
        const cliente = await getDoc(doc(db, 'clientes', clienteId));
        if (cliente.data().usuario_id !== userId) {
            throw new Error('No tienes permiso para eliminar este cliente');
        }

        await deleteDoc(doc(db, 'clientes', clienteId));
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                            VENTAS / COTIZACIONES                              ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export async function createVenta(ventaData, userId) {
    try {
        if (!ventaData.nombre_cliente || !ventaData.telefono_cliente) {
            throw new Error('Nombre y teléfono del cliente son requeridos');
        }

        const ventaDoc = {
            usuario_id: userId,
            nombre_cliente: ventaData.nombre_cliente,
            telefono_cliente: ventaData.telefono_cliente,
            direccion_cliente: ventaData.direccion_cliente || '',
            descripcion_necesidad: ventaData.descripcion_necesidad || '',
            compro_algo: ventaData.compro_algo || 'no',
            nota: ventaData.nota || '',
            estado: 'completada',
            fecha_venta: Timestamp.now(),
            hora_venta: new Date().toLocaleTimeString('es-MX'),
            total: parseFloat(ventaData.total) || 0
        };

        const docRef = await addDoc(collection(db, 'ventas'), ventaDoc);

        if (ventaData.compro_algo === 'si' && ventaData.producto_id) {
            await addDoc(collection(db, 'detalle_venta'), {
                venta_id: docRef.id,
                producto_id: ventaData.producto_id,
                cantidad: parseInt(ventaData.cantidad) || 1,
                precio_unitario: ventaData.precio_unitario || 0,
                subtotal: parseFloat(ventaData.total) || 0
            });

            const producto = await getProducto(ventaData.producto_id);
            const nuevoStock = (producto.stock || 0) - (parseInt(ventaData.cantidad) || 1);
            await updateDoc(doc(db, 'productos', ventaData.producto_id), {
                stock: Math.max(0, nuevoStock)
            });
        }

        const numeroTicket = await generarNumeroTicket(userId);
        await createTicket({
            venta_id: docRef.id,
            numero_ticket: numeroTicket,
            cliente_nombre: ventaData.nombre_cliente,
            cliente_telefono: ventaData.telefono_cliente,
            cliente_direccion: ventaData.direccion_cliente,
            fecha_venta: new Date().toLocaleDateString('es-MX'),
            hora_venta: new Date().toLocaleTimeString('es-MX'),
            detalles: ventaData.descripcion_necesidad,
            total: ventaData.total,
            metodo_pago: ventaData.metodo_pago || 'No especificado'
        }, userId);

        await createHistorialVenta({
            venta_id: docRef.id,
            cliente_nombre: ventaData.nombre_cliente,
            cliente_telefono: ventaData.telefono_cliente,
            cliente_direccion: ventaData.direccion_cliente,
            cliente_necesidad: ventaData.descripcion_necesidad,
            total: ventaData.total,
            fecha_compra: new Date().toLocaleDateString('es-MX'),
            hora_compra: new Date().toLocaleTimeString('es-MX')
        }, userId);

        return { id: docRef.id, ...ventaDoc };
    } catch (error) {
        console.error('Error al crear venta:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function getVentas(userId) {
    try {
        const q = query(
            collection(db, 'ventas'),
            where('usuario_id', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const ventas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return ventas.sort((a, b) => {
            const timeA = a.fecha_venta?.toMillis?.() || 0;
            const timeB = b.fecha_venta?.toMillis?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function getVenta(ventaId) {
    try {
        const docSnap = await getDoc(doc(db, 'ventas', ventaId));
        if (!docSnap.exists()) throw new Error('Venta no encontrada');
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error al obtener venta:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function deleteVenta(ventaId, userId) {
    try {
        const venta = await getVenta(ventaId);
        if (venta.usuario_id !== userId) {
            throw new Error('No tienes permiso para eliminar esta venta');
        }

        await deleteDoc(doc(db, 'ventas', ventaId));
    } catch (error) {
        console.error('Error al eliminar venta:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                            HISTORIAL DE VENTAS                                ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export async function createHistorialVenta(historialData, userId) {
    try {
        await addDoc(collection(db, 'historial_ventas'), {
            venta_id: historialData.venta_id,
            cliente_nombre: historialData.cliente_nombre,
            cliente_telefono: historialData.cliente_telefono,
            cliente_direccion: historialData.cliente_direccion || '',
            cliente_necesidad: historialData.cliente_necesidad || '',
            producto_nombre: historialData.producto_nombre || '',
            producto_cantidad: historialData.producto_cantidad || 0,
            producto_precio: parseFloat(historialData.producto_precio) || 0,
            total: parseFloat(historialData.total) || 0,
            fecha_compra: historialData.fecha_compra,
            hora_compra: historialData.hora_compra,
            usuario_id: userId,
            fecha_registro: Timestamp.now(),
            enviado_whatsapp: 'no',
            enviado_formspree: 'no'
        });
    } catch (error) {
        console.error('Error al crear historial:', error);
    }
}

export async function getHistorialVentas(userId) {
    try {
        const q = query(
            collection(db, 'historial_ventas'),
            where('usuario_id', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const historial = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return historial.sort((a, b) => {
            const timeA = a.fecha_registro?.toMillis?.() || 0;
            const timeB = b.fecha_registro?.toMillis?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function marcarWhatsApp(historialId) {
    try {
        await updateDoc(doc(db, 'historial_ventas', historialId), {
            enviado_whatsapp: 'si'
        });
    } catch (error) {
        console.error('Error al marcar WhatsApp:', error);
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                            TICKETS / RECIBOS                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

async function generarNumeroTicket(userId) {
    try {
        const q = query(collection(db, 'tickets'), where('usuario_id', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.size + 1;
    } catch (error) {
        console.error('Error al generar número de ticket:', error);
        return 1;
    }
}

export async function createTicket(ticketData, userId) {
    try {
        const numeroTicket = ticketData.numero_ticket || await generarNumeroTicket(userId);

        await addDoc(collection(db, 'tickets'), {
            venta_id: ticketData.venta_id || '',
            numero_ticket: numeroTicket,
            empresa_nombre: 'Marali Comunicaciones',
            rfc: 'SASM9507113H3',
            cliente_nombre: ticketData.cliente_nombre,
            cliente_telefono: ticketData.cliente_telefono,
            cliente_direccion: ticketData.cliente_direccion || '',
            fecha_venta: ticketData.fecha_venta,
            hora_venta: ticketData.hora_venta,
            detalles: ticketData.detalles || '',
            total: parseFloat(ticketData.total) || 0,
            metodo_pago: ticketData.metodo_pago || '',
            usuario_id: userId,
            archivo_ticket: ticketData.archivo_ticket || '',
            fecha_creacion: Timestamp.now(),
            fecha_actualizacion: Timestamp.now()
        });

        return { numero_ticket: numeroTicket };
    } catch (error) {
        console.error('Error al crear ticket:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function getTickets(userId) {
    try {
        const q = query(
            collection(db, 'tickets'),
            where('usuario_id', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return tickets.sort((a, b) => {
            const timeA = a.fecha_creacion?.toMillis?.() || 0;
            const timeB = b.fecha_creacion?.toMillis?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function deleteTicket(ticketId, userId) {
    try {
        const ticket = await getDoc(doc(db, 'tickets', ticketId));
        if (ticket.data().usuario_id !== userId) {
            throw new Error('No tienes permiso para eliminar este ticket');
        }

        await deleteDoc(doc(db, 'tickets', ticketId));
    } catch (error) {
        console.error('Error al eliminar ticket:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                            TRABAJADORES                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export async function createTrabajador(trabajadorData, userId) {
    try {
        if (!trabajadorData.nombre || !trabajadorData.cargo) {
            throw new Error('Nombre y cargo son requeridos');
        }

        const docRef = await addDoc(collection(db, 'trabajadores'), {
            usuario_id: userId,
            nombre: trabajadorData.nombre,
            cargo: trabajadorData.cargo,
            rfc: trabajadorData.rfc || '',
            salario: parseFloat(trabajadorData.salario) || 0,
            periodo_cobro: trabajadorData.periodo_cobro || 'mensual',
            forma_pago: trabajadorData.forma_pago || 'transferencia',
            foto_url: trabajadorData.foto_url || '',
            fecha_registro: Timestamp.now(),
            fecha_actualizacion: Timestamp.now()
        });

        return { id: docRef.id, ...trabajadorData };
    } catch (error) {
        console.error('Error al crear trabajador:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function getTrabajadores(userId) {
    try {
        const q = query(
            collection(db, 'trabajadores'),
            where('usuario_id', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const trabajadores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return trabajadores.sort((a, b) => {
            const timeA = a.fecha_registro?.toMillis?.() || 0;
            const timeB = b.fecha_registro?.toMillis?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error al obtener trabajadores:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function getTrabajador(trabajadorId) {
    try {
        const docSnap = await getDoc(doc(db, 'trabajadores', trabajadorId));
        if (!docSnap.exists()) throw new Error('Trabajador no encontrado');
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error al obtener trabajador:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function updateTrabajador(trabajadorId, trabajadorData, userId) {
    try {
        const trabajador = await getTrabajador(trabajadorId);
        if (trabajador.usuario_id !== userId) {
            throw new Error('No tienes permiso para editar este trabajador');
        }

        const updateData = {
            nombre: trabajadorData.nombre || trabajador.nombre,
            cargo: trabajadorData.cargo || trabajador.cargo,
            rfc: trabajadorData.rfc || trabajador.rfc,
            salario: trabajadorData.salario ? parseFloat(trabajadorData.salario) : trabajador.salario,
            periodo_cobro: trabajadorData.periodo_cobro || trabajador.periodo_cobro,
            forma_pago: trabajadorData.forma_pago || trabajador.forma_pago,
            foto_url: trabajadorData.foto_url || trabajador.foto_url,
            fecha_actualizacion: Timestamp.now()
        };

        await updateDoc(doc(db, 'trabajadores', trabajadorId), updateData);
        return { id: trabajadorId, ...updateData };
    } catch (error) {
        console.error('Error al actualizar trabajador:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function deleteTrabajador(trabajadorId, userId) {
    try {
        const trabajador = await getTrabajador(trabajadorId);
        if (trabajador.usuario_id !== userId) {
            throw new Error('No tienes permiso para eliminar este trabajador');
        }

        const q = query(collection(db, 'trabajadores_documentos'), where('trabajador_id', '==', trabajadorId));
        const docs = await getDocs(q);
        for (const d of docs.docs) {
            await deleteDoc(d.ref);
        }

        if (trabajador.foto_url) {
            try {
                const fotoRef = ref(storage, trabajador.foto_url);
                await deleteObject(fotoRef);
            } catch (err) {
                console.warn('Error al eliminar foto:', err);
            }
        }

        await deleteDoc(doc(db, 'trabajadores', trabajadorId));
    } catch (error) {
        console.error('Error al eliminar trabajador:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function getTrabajadorDocumentos(trabajadorId) {
    try {
        const q = query(
            collection(db, 'trabajadores_documentos'),
            where('trabajador_id', '==', trabajadorId)
        );
        const querySnapshot = await getDocs(q);
        const documentos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return documentos.sort((a, b) => {
            const timeA = a.fecha_subida?.toMillis?.() || 0;
            const timeB = b.fecha_subida?.toMillis?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function uploadTrabajadorDocumento(trabajadorId, file, userId) {
    try {
        const extension = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const storagePath = `trabajadores/${trabajadorId}/${fileName}`;
        
        // Convertir a base64 en lugar de subir a Firebase Storage
        const base64Data = await fileToBase64(file);

        await addDoc(collection(db, 'trabajadores_documentos'), {
            trabajador_id: trabajadorId,
            usuario_id: userId,
            archivo: storagePath,
            nombre_original: file.name,
            tipo_archivo: extension.toUpperCase(),
            tamaño: file.size,
            fecha_subida: Timestamp.now(),
            url_descarga: base64Data
        });

        return { url: base64Data, nombre: file.name };
    } catch (error) {
        console.error('Error al subir documento:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function deleteTrabajadorDocumento(docId, userId) {
    try {
        const docSnap = await getDoc(doc(db, 'trabajadores_documentos', docId));
        if (docSnap.data().usuario_id !== userId) {
            throw new Error('No tienes permiso para eliminar este documento');
        }

        const archivo = docSnap.data().archivo;
        try {
            const fileRef = ref(storage, archivo);
            await deleteObject(fileRef);
        } catch (err) {
            console.warn('Error al eliminar archivo:', err);
        }

        await deleteDoc(doc(db, 'trabajadores_documentos', docId));
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                            IMPUESTOS                                          ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export async function createImpuesto(impuestoData, userId) {
    try {
        if (!impuestoData.tipo_impuesto || !impuestoData.mes || !impuestoData.año) {
            throw new Error('Todos los campos son requeridos');
        }

        const docRef = await addDoc(collection(db, 'impuestos_pagos'), {
            tipo_impuesto: impuestoData.tipo_impuesto,
            mes: parseInt(impuestoData.mes),
            año: parseInt(impuestoData.año),
            estado: impuestoData.estado || 'sin_pagar',
            fecha_pago: impuestoData.fecha_pago || null,
            usuario_id: userId,
            fecha_registro: Timestamp.now(),
            fecha_actualizacion: Timestamp.now()
        });

        return { id: docRef.id, ...impuestoData };
    } catch (error) {
        console.error('Error al crear impuesto:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function getImpuestos(userId) {
    try {
        const q = query(
            collection(db, 'impuestos_pagos'),
            where('usuario_id', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const impuestos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return impuestos.sort((a, b) => {
            if (b.año !== a.año) return b.año - a.año;
            return b.mes - a.mes;
        });
    } catch (error) {
        console.error('Error al obtener impuestos:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function updateImpuesto(impuestoId, impuestoData, userId) {
    try {
        const impuesto = await getDoc(doc(db, 'impuestos_pagos', impuestoId));
        if (impuesto.data().usuario_id !== userId) {
            throw new Error('No tienes permiso para editar este impuesto');
        }

        await updateDoc(doc(db, 'impuestos_pagos', impuestoId), {
            estado: impuestoData.estado,
            fecha_pago: impuestoData.fecha_pago || null,
            fecha_actualizacion: Timestamp.now()
        });
    } catch (error) {
        console.error('Error al actualizar impuesto:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function getImpuestoDocumentos(impuestoId) {
    try {
        const q = query(
            collection(db, 'impuestos_documentos'),
            where('impuesto_id', '==', impuestoId)
        );
        const querySnapshot = await getDocs(q);
        const documentos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return documentos.sort((a, b) => {
            const timeA = a.fecha_subida?.toMillis?.() || 0;
            const timeB = b.fecha_subida?.toMillis?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function uploadImpuestoDocumento(impuestoId, file, impuestoData, userId) {
    try {
        const extension = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const storagePath = `impuestos/${impuestoData.tipo_impuesto}/${impuestoData.año}/${fileName}`;
        
        // Convertir a base64 en lugar de subir a Firebase Storage
        const base64Data = await fileToBase64(file);

        await addDoc(collection(db, 'impuestos_documentos'), {
            impuesto_id: impuestoId,
            tipo_impuesto: impuestoData.tipo_impuesto,
            archivo: storagePath,
            nombre_original: file.name,
            tipo_archivo: extension.toUpperCase(),
            tamaño: file.size,
            mes: parseInt(impuestoData.mes),
            año: parseInt(impuestoData.año),
            usuario_id: userId,
            fecha_subida: Timestamp.now(),
            url_descarga: base64Data
        });

        return { url: base64Data, nombre: file.name };
    } catch (error) {
        console.error('Error al subir documento:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function deleteImpuestoDocumento(docId, userId) {
    try {
        const docSnap = await getDoc(doc(db, 'impuestos_documentos', docId));
        if (docSnap.data().usuario_id !== userId) {
            throw new Error('No tienes permiso para eliminar este documento');
        }

        const archivo = docSnap.data().archivo;
        try {
            const fileRef = ref(storage, archivo);
            await deleteObject(fileRef);
        } catch (err) {
            console.warn('Error al eliminar archivo:', err);
        }

        await deleteDoc(doc(db, 'impuestos_documentos', docId));
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                            FACTURACIÓN                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export async function createFactura(facturaData, userId) {
    try {
        const docRef = await addDoc(collection(db, 'facturacion'), {
            usuario_id: userId,
            rfc: facturaData.rfc || '',
            razon_social: facturaData.razon_social || '',
            cliente: facturaData.cliente || '',
            email: facturaData.email || '',
            subtotal: parseFloat(facturaData.subtotal) || 0,
            impuestos: parseFloat(facturaData.impuestos) || 0,
            total: parseFloat(facturaData.total) || 0,
            descripcion: facturaData.descripcion || '',
            fecha_emision: facturaData.fecha_emision,
            estado: facturaData.estado || 'emitida',
            fecha_creacion: Timestamp.now(),
            fecha_actualizacion: Timestamp.now()
        });

        return { id: docRef.id, ...facturaData };
    } catch (error) {
        console.error('Error al crear factura:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

export async function getFacturas(userId) {
    try {
        const q = query(
            collection(db, 'facturacion'),
            where('usuario_id', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const facturas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return facturas.sort((a, b) => {
            const timeA = a.fecha_emision?.toMillis?.() || (new Date(a.fecha_emision)).getTime() || 0;
            const timeB = b.fecha_emision?.toMillis?.() || (new Date(b.fecha_emision)).getTime() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function uploadFacturaArchivo(file, userId) {
    try {
        const extension = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const storagePath = `facturacion/${userId}/${fileName}`;
        
        // Convertir a base64 en lugar de subir a Firebase Storage
        const base64Data = await fileToBase64(file);

        return { url: base64Data, nombre: file.name };
    } catch (error) {
        console.error('Error al subir factura:', error);
        throw new Error(parseFirebaseError(error.code) || error.message);
    }
}

export async function deleteFactura(facturaId, userId) {
    try {
        const factura = await getDoc(doc(db, 'facturacion', facturaId));
        if (!factura.exists()) throw new Error('Factura no encontrada');
        if (factura.data().usuario_id !== userId) {
            throw new Error('No tienes permiso para eliminar esta factura');
        }

        if (factura.data().archivo_url) {
            try {
                const fileRef = ref(storage, factura.data().archivo_url);
                await deleteObject(fileRef);
            } catch (err) {
                console.warn('Error al eliminar archivo adjunto:', err);
            }
        }

        await deleteDoc(doc(db, 'facturacion', facturaId));
    } catch (error) {
        console.error('Error al eliminar factura:', error);
        throw new Error(parseFirebaseError(error.code));
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                            ESTADÍSTICAS / DASHBOARD                           ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export async function getDashboardStats(userId) {
    try {
        const productosQ = query(collection(db, 'productos'), where('usuario_id', '==', userId));
        const productosSnap = await getDocs(productosQ);
        const totalProductos = productosSnap.size;

        const clientesQ = query(collection(db, 'clientes'), where('usuario_id', '==', userId));
        const clientesSnap = await getDocs(clientesQ);
        const totalClientes = clientesSnap.size;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const ventasQ = query(
            collection(db, 'ventas'),
            where('usuario_id', '==', userId)
        );
        const ventasSnap = await getDocs(ventasQ);
        let ventasHoy = 0;
        ventasSnap.forEach(doc => {
            const fecha = doc.data().fecha_venta.toDate();
            if (fecha >= hoy) ventasHoy += parseFloat(doc.data().total) || 0;
        });

        const trabajadoresQ = query(collection(db, 'trabajadores'), where('usuario_id', '==', userId));
        const trabajadoresSnap = await getDocs(trabajadoresQ);
        const totalTrabajadores = trabajadoresSnap.size;

        const ticketsQ = query(collection(db, 'tickets'), where('usuario_id', '==', userId));
        const ticketsSnap = await getDocs(ticketsQ);
        const totalTickets = ticketsSnap.size;

        return {
            totalProductos,
            totalClientes,
            ventasHoy: parseFloat(ventasHoy.toFixed(2)),
            totalTrabajadores,
            totalTickets,
            backend: 'Firebase',
            version: '2.0 (Migrado)',
            timestamp: new Date().toLocaleString('es-MX')
        };
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return {
            totalProductos: 0,
            totalClientes: 0,
            ventasHoy: 0,
            totalTrabajadores: 0,
            totalTickets: 0,
            error: error.message
        };
    }
}

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                            SUBIR ARCHIVOS / STORAGE                           ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

// Convertir archivo a base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

export async function uploadFile(file, path) {
    try {
        if (!file) throw new Error('No file provided');

        // Convertir archivo a base64 en lugar de subir a Firebase Storage
        const base64Data = await fileToBase64(file);

        return {
            url: base64Data,  // Retorna el dato base64
            path: `${path}/${Date.now()}_${file.name}`,
            name: file.name,
            size: file.size,
            isBase64: true
        };
    } catch (error) {
        console.error('Error al procesar archivo:', error);
        throw new Error(`Error al procesar archivo: ${error.message}`);
    }
}

export async function deleteFile(path) {
    try {
        if (!path) throw new Error('No path provided');
        // Ya no necesita eliminar de Firebase Storage si se guarda como base64
        console.log('Archivo base64 - no requiere eliminación de storage');
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
    }
}

/**
 * Descargar archivo desde base64
 * @param {string} base64Data - Datos en formato base64 (data:tipo/subtipo;base64,...)
 * @param {string} nombreArchivo - Nombre del archivo a descargar
 */
export function descargarArchivo(base64Data, nombreArchivo) {
    try {
        if (!base64Data) {
            throw new Error('No hay datos para descargar');
        }

        // Crear elemento link
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = nombreArchivo || 'archivo_descargado';
        
        // Agregar al DOM, hacer click y remover
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`✓ Descargando: ${nombreArchivo}`);
    } catch (error) {
        console.error('Error al descargar archivo:', error);
        throw new Error(`Error al descargar: ${error.message}`);
    }
}
