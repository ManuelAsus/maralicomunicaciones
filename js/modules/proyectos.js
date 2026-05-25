import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';

// Importar función de descarga
import { descargarArchivo } from '../api.js?v=5';

// Funciones principales del módulo de Proyectos
let proyectos = [];
let trabajadores = [];
let currentProyectoId = null;

export async function render(container, user) {
    container.innerHTML = `
        <div style="padding: 20px;">
            <h2>Proyectos y Reportes</h2>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <button class="btn-primary" onclick="pry_abrirModalCrearProyecto()">➕ Nuevo Proyecto</button>
                <input id="pry_buscar" placeholder="Buscar proyecto..." style="flex:1;padding:8px;border:1px solid #ddd;border-radius:4px;">
            </div>
            <div id="pry_lista"></div>
        </div>

        <!-- Modal crear/editar proyecto -->
        <div id="pry_modal" class="modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;z-index:1000;">
            <div class="modal-content" style="width:90%;max-width:640px;background:#fff;border-radius:8px;padding:20px;">
                <h3 id="pry_modal_title">Nuevo Proyecto</h3>
                <form id="pry_form" onsubmit="pry_guardarProyecto(event)">
                    <input type="hidden" id="pry_id">
                    <div style="margin-bottom:8px;"><label>Nombre *</label><input id="pry_nombre" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
                    <div style="margin-bottom:8px;"><label>Lugar</label><input id="pry_lugar" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
                    <div style="margin-bottom:8px;"><label>Descripción</label><textarea id="pry_descripcion" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></textarea></div>
                    <div style="display:flex;gap:8px;justify-content:flex-end;"><button type="button" class="btn-secondary" onclick="pry_cerrarModal()">Cancelar</button><button class="btn-primary">Guardar</button></div>
                </form>
            </div>
        </div>

        <!-- Detalle proyecto -->
        <div id="pry_detalle_modal" class="modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;z-index:1000;overflow-y:auto;">
            <div class="modal-content" style="width:95%;max-width:1200px;margin:20px auto;background:#fff;border-radius:8px;padding:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><h3 id="pry_detalle_titulo">Proyecto</h3><div><button class="btn-secondary" onclick="pry_cerrarDetalle()">Cerrar</button></div></div>
                
                <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;">
                    <!-- Left: Detalles proyecto + actividades + reportes -->
                    <div>
                        <div id="pry_detalle_body"></div>
                    </div>
                    
                    <!-- Right: Formularios -->
                    <div style="background:#f9f9f9;padding:16px;border-radius:8px;border:1px solid #ddd;overflow-y:auto;max-height:600px;">
                        <h4 style="margin-bottom:16px;border-bottom:2px solid #fcc30b;padding-bottom:8px;">⚙️ Acciones</h4>
                        
                        <!-- Form subir imagen -->
                        <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #ddd;">
                            <h5 style="font-size:13px;color:#2c245c;margin-bottom:8px;">📸 Subir Imagen</h5>
                            <form id="pry_form_imagen" onsubmit="pry_subirImagen(event)" style="display:flex;flex-direction:column;gap:8px;">
                                <input type="hidden" id="pry_img_proyecto_id">
                                <input id="pry_img_titulo" placeholder="Título de imagen..." required style="padding:6px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
                                <input id="pry_img_descripcion" placeholder="Descripción..." style="padding:6px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
                                <input type="file" id="pry_img_archivo" accept="image/*" required style="padding:6px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
                                <button type="submit" class="btn-primary" style="font-size:12px;padding:6px;">Subir</button>
                            </form>
                        </div>

                        <!-- Form crear actividad -->
                        <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #ddd;">
                            <h5 style="font-size:13px;color:#2c245c;margin-bottom:8px;">Crear Actividad</h5>
                            <form id="pry_form_actividad" onsubmit="pry_crearActividad(event)" style="display:flex;flex-direction:column;gap:8px;">
                                <input type="hidden" id="pry_act_proyecto_id">
                                <input id="pry_act_descripcion" placeholder="Descripción..." required style="padding:6px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
                                <select id="pry_act_trabajador" style="padding:6px;border:1px solid #ddd;border-radius:4px;font-size:12px;"><option value="">-- Trabajador --</option></select>
                                <button type="submit" class="btn-primary" style="font-size:12px;padding:6px;">Crear</button>
                            </form>
                        </div>

                        <!-- Form crear reporte -->
                        <div>
                            <h5 style="font-size:13px;color:#2c245c;margin-bottom:8px;">Crear Reporte</h5>
                            <form id="pry_form_reporte" onsubmit="pry_crearReporte(event)" style="display:flex;flex-direction:column;gap:8px;">
                                <input type="hidden" id="pry_rep_proyecto_id">
                                <select id="pry_rep_tipo" style="padding:6px;border:1px solid #ddd;border-radius:4px;font-size:12px;"><option value="diario">Diario</option><option value="final">Final</option></select>
                                <select id="pry_rep_actividad" style="padding:6px;border:1px solid #ddd;border-radius:4px;font-size:12px;"><option value="">-- Actividad --</option></select>
                                <select id="pry_rep_trabajador" style="padding:6px;border:1px solid #ddd;border-radius:4px;font-size:12px;"><option value="">-- Responsable --</option></select>
                                <textarea id="pry_rep_contenido" placeholder="Contenido del reporte..." required style="padding:6px;border:1px solid #ddd;border-radius:4px;font-size:12px;resize:vertical;min-height:80px;"></textarea>
                                <button type="submit" class="btn-primary" style="font-size:12px;padding:6px;">Crear</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
        .pry-card{border:1px solid #eee;padding:12px;border-radius:8px;margin-bottom:8px;background:#fff}
        </style>
    `;

    // Cargar proyectos al iniciar
    await pry_cargarProyectos(user.uid);

    // Asignar funciones globales
    window.pry_cargarProyectos = () => pry_cargarProyectos(user.uid);
    window.pry_renderLista = pry_renderLista;
    window.pry_abrirModalCrearProyecto = pry_abrirModalCrearProyecto;
    window.pry_cerrarModal = pry_cerrarModal;
    window.pry_guardarProyecto = (e) => pry_guardarProyecto(e, user.uid);
    window.pry_editarProyecto = pry_editarProyecto;
    window.pry_eliminarProyecto = (id) => pry_eliminarProyecto(id, user.uid);
    window.pry_verProyecto = (id) => pry_verProyecto(id, user.uid);
    window.pry_cerrarDetalle = pry_cerrarDetalle;
    window.pry_cargarTrabajadores = pry_cargarTrabajadores;
    window.pry_crearActividad = (e) => pry_crearActividad(e, user.uid);
    window.pry_crearReporte = (e) => pry_crearReporte(e, user.uid);
    window.pry_quitarActividad = (actId, proyectoId) => pry_quitarActividad(actId, proyectoId, user.uid);
    window.pry_subirImagen = (e) => pry_subirImagen(e, user.uid);
    window.pry_cargarImagenes = pry_cargarImagenes;
    window.pry_renderGaleria = pry_renderGaleria;
    window.pry_verImagenGrande = pry_verImagenGrande;
    window.pry_descargarImagen = (titulo, base64) => {
        try {
            descargarArchivo(base64, titulo);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };
    window.pry_eliminarImagen = pry_eliminarImagen;
    window.pry_eliminarReporte = (reporteId, proyectoId) => pry_eliminarReporte(reporteId, proyectoId, user.uid);
}

async function pry_cargarProyectos(userId) {
    try {
        const q = query(collection(db, 'proyectos'), where('usuario_id', '==', userId));
        const snapshot = await getDocs(q);
        proyectos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        pry_renderLista(proyectos);
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        document.getElementById('pry_lista').innerHTML = '<p style="color:#c00">Error al cargar proyectos</p>';
    }
}

function pry_renderLista(list) {
    const el = document.getElementById('pry_lista');
    if (!list || list.length === 0) {
        el.innerHTML = '<p>No hay proyectos</p>';
        return;
    }
    el.innerHTML = list.map(p => `<div class="pry-card"><strong>${p.nombre}</strong> <div style="color:#666">${p.lugar || ''}</div><div style="margin-top:8px"><button class="btn-small btn-secondary" onclick="pry_verProyecto('${p.id}')">Ver detalles</button> <button class="btn-small btn-secondary" onclick="pry_editarProyecto('${p.id}')">Editar</button> <button class="btn-small btn-delete" onclick="pry_eliminarProyecto('${p.id}')">Eliminar</button></div></div>`).join('');
}

function pry_abrirModalCrearProyecto() {
    document.getElementById('pry_modal').style.display = 'flex';
    document.getElementById('pry_modal_title').textContent = 'Nuevo Proyecto';
    document.getElementById('pry_id').value = '';
    document.getElementById('pry_nombre').value = '';
    document.getElementById('pry_lugar').value = '';
    document.getElementById('pry_descripcion').value = '';
}

function pry_cerrarModal() {
    document.getElementById('pry_modal').style.display = 'none';
}

async function pry_guardarProyecto(e, userId) {
    e.preventDefault();
    const id = document.getElementById('pry_id').value;
    const nombre = document.getElementById('pry_nombre').value;
    const lugar = document.getElementById('pry_lugar').value;
    const descripcion = document.getElementById('pry_descripcion').value;

    try {
        if (id) {
            // Actualizar
            await updateDoc(doc(db, 'proyectos', id), {
                nombre,
                lugar,
                descripcion,
                actualizado_en: serverTimestamp()
            });
        } else {
            // Crear
            await addDoc(collection(db, 'proyectos'), {
                nombre,
                lugar,
                descripcion,
                usuario_id: userId,
                actividades: [],
                reportes: [],
                imagenes: [],
                creado_en: serverTimestamp()
            });
        }
        pry_cerrarModal();
        await pry_cargarProyectos(userId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function pry_editarProyecto(id) {
    const p = proyectos.find(x => x.id === id);
    if (!p) return alert('No encontrado');
    
    document.getElementById('pry_modal').style.display = 'flex';
    document.getElementById('pry_modal_title').textContent = 'Editar Proyecto';
    document.getElementById('pry_id').value = p.id;
    document.getElementById('pry_nombre').value = p.nombre;
    document.getElementById('pry_lugar').value = p.lugar || '';
    document.getElementById('pry_descripcion').value = p.descripcion || '';
}

async function pry_eliminarProyecto(id, userId) {
    if (!confirm('¿Eliminar proyecto?')) return;
    
    try {
        await deleteDoc(doc(db, 'proyectos', id));
        await pry_cargarProyectos(userId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function pry_verProyecto(id, userId) {
    try {
        const docSnap = await getDoc(doc(db, 'proyectos', id));
        if (!docSnap.exists()) return alert('Proyecto no encontrado');
        
        const p = { id: docSnap.id, ...docSnap.data() };
        currentProyectoId = p.id;
        
        document.getElementById('pry_detalle_titulo').textContent = p.nombre;
        document.getElementById('pry_act_proyecto_id').value = p.id;
        document.getElementById('pry_rep_proyecto_id').value = p.id;
        document.getElementById('pry_img_proyecto_id').value = p.id;
        
        await pry_cargarTrabajadores('pry_act_trabajador');
        await pry_cargarTrabajadores('pry_rep_trabajador');
        
        // Cargar actividades en el select del reporte
        pry_cargarActividadesSelect(p.actividades || []);
        
        const body = document.getElementById('pry_detalle_body');
        body.innerHTML = `
            <p><strong>Lugar:</strong> ${p.lugar || ''}</p>
            <p><strong>Descripción:</strong><br>${p.descripcion || ''}</p>
            
            <h4>📸 Imágenes del Proyecto</h4>
            <div id="pry_galeria" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px;"></div>
            
            <h4>Actividades</h4>
            <div id="pry_acts"></div>
            <h4>Reportes</h4>
            <div id="pry_reps"></div>
        `;
        
        // Renderizar actividades
        const actsDiv = document.getElementById('pry_acts');
        if (p.actividades && p.actividades.length > 0) {
            actsDiv.innerHTML = p.actividades.map(a => `<div style="border:1px solid #eee;padding:8px;margin-bottom:6px;border-radius:6px"><strong>${a.descripcion}</strong><div style="color:#666">Asignado: ${a.trabajador_nombre || '—'}</div><div style="margin-top:6px"><button class="btn-small btn-delete" onclick="pry_quitarActividad('${a.id}', '${p.id}')">Quitar</button></div></div>`).join('');
        } else {
            actsDiv.innerHTML = '<p style="color:#666;">Sin actividades</p>';
        }
        
        // Renderizar reportes
        const repsDiv = document.getElementById('pry_reps');
        if (p.reportes && p.reportes.length > 0) {
            repsDiv.innerHTML = p.reportes.map(r => `<div style="border:1px solid #eee;padding:8px;margin-bottom:6px;border-radius:6px"><strong>${r.tipo_reporte}</strong><div style="color:#666">${new Date(r.fecha_creacion.toDate?.() || r.fecha_creacion).toLocaleString()}</div><div style="margin-top:6px"><button class="btn-small btn-delete" onclick="pry_eliminarReporte('${r.id}', '${p.id}')">Eliminar</button></div></div>`).join('');
        } else {
            repsDiv.innerHTML = '<p style="color:#666;">Sin reportes</p>';
        }
        
        await pry_cargarImagenes(p.id);
        document.getElementById('pry_detalle_modal').style.display = 'flex';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar proyecto: ' + error.message);
    }
}

function pry_cerrarDetalle() {
    document.getElementById('pry_detalle_modal').style.display = 'none';
}

async function pry_cargarTrabajadores(selEl) {
    try {
        const q = query(collection(db, 'trabajadores'));
        const snapshot = await getDocs(q);
        trabajadores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const sel = document.getElementById(selEl);
        if (sel) {
            sel.innerHTML = '<option value="">-- Ninguno --</option>' + 
                trabajadores.map(t => `<option value="${t.id}">${t.nombre} (${t.cargo || ''})</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando trabajadores:', error);
    }
}

function pry_cargarActividadesSelect(actividades) {
    const sel = document.getElementById('pry_rep_actividad');
    if (!sel) return;
    
    if (!actividades || actividades.length === 0) {
        sel.innerHTML = '<option value="">-- Ninguna --</option>';
    } else {
        sel.innerHTML = '<option value="">-- Ninguna --</option>' + 
            actividades.map(a => `<option value="${a.id}">${a.descripcion}</option>`).join('');
    }
}

async function pry_crearActividad(e, userId) {
    e.preventDefault();
    const proyectoId = document.getElementById('pry_act_proyecto_id').value;
    const desc = document.getElementById('pry_act_descripcion').value;
    const trabajadorId = document.getElementById('pry_act_trabajador').value;
    
    try {
        const proyectoRef = doc(db, 'proyectos', proyectoId);
        const proyectoSnap = await getDoc(proyectoRef);
        const proyecto = proyectoSnap.data();
        
        const actividades = proyecto.actividades || [];
        actividades.push({
            id: Date.now().toString(),
            descripcion: desc,
            trabajador_id: trabajadorId || null,
            trabajador_nombre: trabajadorId ? (trabajadores.find(t => t.id === trabajadorId)?.nombre || '') : null,
            creado_en: new Date()
        });
        
        await updateDoc(proyectoRef, { actividades });
        document.getElementById('pry_act_descripcion').value = '';
        document.getElementById('pry_act_trabajador').value = '';
        await pry_verProyecto(proyectoId, userId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function pry_crearReporte(e, userId) {
    e.preventDefault();
    const proyectoId = document.getElementById('pry_rep_proyecto_id').value;
    const tipo = document.getElementById('pry_rep_tipo').value;
    const actividad = document.getElementById('pry_rep_actividad').value;
    const trabajador = document.getElementById('pry_rep_trabajador').value;
    const contenido = document.getElementById('pry_rep_contenido').value;
    
    try {
        const proyectoRef = doc(db, 'proyectos', proyectoId);
        const proyectoSnap = await getDoc(proyectoRef);
        const proyecto = proyectoSnap.data();
        
        const reportes = proyecto.reportes || [];
        reportes.push({
            id: Date.now().toString(),
            tipo_reporte: tipo,
            contenido,
            actividad_id: actividad || null,
            trabajador_id: trabajador || null,
            trabajador_nombre: trabajador ? (trabajadores.find(t => t.id === trabajador)?.nombre || '') : null,
            fecha_creacion: new Date().toISOString()
        });
        
        await updateDoc(proyectoRef, { reportes });
        document.getElementById('pry_form_reporte').reset();
        await pry_verProyecto(proyectoId, userId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function pry_quitarActividad(actId, proyectoId, userId) {
    if (!confirm('¿Eliminar actividad?')) return;
    
    try {
        const proyectoRef = doc(db, 'proyectos', proyectoId);
        const proyectoSnap = await getDoc(proyectoRef);
        const proyecto = proyectoSnap.data();
        
        const actividades = (proyecto.actividades || []).filter(a => a.id !== actId);
        await updateDoc(proyectoRef, { actividades });
        await pry_verProyecto(proyectoId, userId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function pry_subirImagen(e, userId) {
    e.preventDefault();
    const proyectoId = document.getElementById('pry_img_proyecto_id').value;
    const titulo = document.getElementById('pry_img_titulo').value;
    const descripcion = document.getElementById('pry_img_descripcion').value;
    const archivo = document.getElementById('pry_img_archivo').files[0];
    
    if (!archivo) {
        alert('Selecciona una imagen');
        return;
    }
    
    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Data = event.target.result;
            
            const proyectoRef = doc(db, 'proyectos', proyectoId);
            const proyectoSnap = await getDoc(proyectoRef);
            const proyecto = proyectoSnap.data();
            
            const imagenes = proyecto.imagenes || [];
            imagenes.push({
                id: Date.now().toString(),
                titulo,
                descripcion,
                url_imagen: base64Data,
                creado_en: serverTimestamp()
            });
            
            await updateDoc(proyectoRef, { imagenes });
            document.getElementById('pry_form_imagen').reset();
            await pry_cargarImagenes(proyectoId);
        };
        reader.readAsDataURL(archivo);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function pry_cargarImagenes(proyectoId) {
    try {
        const docSnap = await getDoc(doc(db, 'proyectos', proyectoId));
        const proyecto = docSnap.data();
        const imagenes = proyecto.imagenes || [];
        pry_renderGaleria(imagenes);
    } catch (error) {
        console.error('Error cargando imágenes:', error);
    }
}

function pry_renderGaleria(imagenes) {
    const gal = document.getElementById('pry_galeria');
    if (!gal) return;
    
    if (!imagenes || imagenes.length === 0) {
        gal.innerHTML = '<p style="grid-column:1/-1;color:#666;font-size:12px;">No hay imágenes aún</p>';
        return;
    }
    
    gal.innerHTML = imagenes.map(img => `
        <div style="border:1px solid #ddd;border-radius:8px;overflow:hidden;background:#fff;">
            <img src="${img.url_imagen}" alt="${img.titulo}" style="width:100%;height:120px;object-fit:cover;cursor:pointer;" onclick="pry_verImagenGrande('${img.url_imagen}', '${img.titulo}')">
            <div style="padding:8px;font-size:11px;">
                <strong style="display:block;color:#2c245c;margin-bottom:4px;">${img.titulo}</strong>
                <p style="color:#666;margin:0;margin-bottom:8px;">${img.descripcion || 'Sin descripción'}</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
                    <button class="btn-secondary" style="padding:4px;font-size:11px;" onclick="pry_descargarImagen('${img.titulo}', '${img.url_imagen.replace(/'/g, "\\'")}')">⬇️ Desc</button>
                    <button class="btn-delete" style="padding:4px;font-size:11px;" onclick="pry_eliminarImagen('${img.id}', '${currentProyectoId}')">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}

function pry_verImagenGrande(url, titulo) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:#fff;padding:20px;border-radius:8px;max-width:90%;max-height:90%;position:relative;">
            <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:10px;right:10px;background:#f3992c;color:#fff;border:none;border-radius:4px;padding:8px 12px;cursor:pointer;">✕ Cerrar</button>
            <img src="${url}" alt="${titulo}" style="max-width:100%;max-height:80vh;margin-top:30px;">
            <p style="margin-top:12px;color:#2c245c;font-weight:bold;">${titulo}</p>
        </div>
    `;
    document.body.appendChild(modal);
}

async function pry_eliminarImagen(imageId, proyectoId) {
    if (!confirm('¿Eliminar imagen?')) return;
    
    try {
        const proyectoRef = doc(db, 'proyectos', proyectoId);
        const proyectoSnap = await getDoc(proyectoRef);
        const proyecto = proyectoSnap.data();
        
        const imagenes = (proyecto.imagenes || []).filter(img => img.id !== imageId);
        await updateDoc(proyectoRef, { imagenes });
        await pry_cargarImagenes(proyectoId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function pry_eliminarReporte(reporteId, proyectoId, userId) {
    if (!confirm('¿Eliminar reporte?')) return;
    
    try {
        const proyectoRef = doc(db, 'proyectos', proyectoId);
        const proyectoSnap = await getDoc(proyectoRef);
        const proyecto = proyectoSnap.data();
        
        const reportes = (proyecto.reportes || []).filter(r => r.id !== reporteId);
        await updateDoc(proyectoRef, { reportes });
        await pry_verProyecto(proyectoId, userId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}
