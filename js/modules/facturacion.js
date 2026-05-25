import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';

// Importar función de descarga
import { descargarArchivo } from '../api.js?v=5';

let facturas = [];
let datosFacturacion = {};

export async function render(container, user) {
    container.innerHTML = `
        <div style="padding: 20px;">
            <h2>Centro de Facturación</h2>

            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 25px;">
                <div style="flex: 1; min-width: 280px; background: #fff; border: 1px solid #eee; padding: 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,.06);">
                    <h3 style="margin-top: 0;">1. Subir Facturas (PDF / XML)</h3>
                    <form id="formSubirFactura" enctype="multipart/form-data">
                        <div style="margin-bottom: 10px;">
                            <label for="facturaFile">Factura</label><br>
                            <input type="file" id="facturaFile" name="factura" accept=".pdf,.xml" required>
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%;">Subir factura</button>
                    </form>
                    <small style="color: #777;">El archivo se almacena como base64 en Firestore</small>
                </div>

                <div style="flex: 1; min-width: 280px; background: #fff; border: 1px solid #eee; padding: 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,.06);">
                    <h3 style="margin-top: 0;">2. Filtrar Facturas por Fecha</h3>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px;">
                        <input type="number" id="filtroDia" min="1" max="31" placeholder="Día">
                        <input type="number" id="filtroMes" min="1" max="12" placeholder="Mes">
                        <input type="number" id="filtroAño" min="2000" max="2099" placeholder="Año">
                    </div>
                    <button id="btnFiltrarFacturas" class="btn-secondary" style="width:100%;">Buscar</button>
                    <button id="btnLimpiarFiltro" class="btn-secondary" style="width:100%; margin-top:8px; background:#ddd; color:#2c245c;">Limpiar</button>
                </div>

                <div style="flex: 1; min-width: 280px; background: #fff; border: 1px solid #eee; padding: 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,.06);">
                    <h3 style="margin-top: 0;">3. Datos para Facturar</h3>
                    <form id="formDatosFacturacion">
                        <div style="margin-bottom: 8px;"><input type="text" id="rfc" placeholder="RFC" required style="width: 100%; padding: 8px; border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
                        <div style="margin-bottom: 8px;"><input type="text" id="nombre_comercial" placeholder="Nombre comercial" style="width: 100%; padding: 8px; border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
                        <div style="margin-bottom: 8px;"><input type="text" id="nombre_razon_social" placeholder="Razón social" style="width: 100%; padding: 8px; border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
                        <div style="margin-bottom: 8px;"><input type="text" id="domicilio_fiscal" placeholder="Domicilio fiscal" style="width: 100%; padding: 8px; border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                            <input type="text" id="colonia" placeholder="Colonia" style="padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
                            <input type="text" id="localidad" placeholder="Localidad" style="padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                            <input type="text" id="entidad" placeholder="Entidad" style="padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
                            <input type="text" id="cp" placeholder="CP" style="padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
                        </div>
                        <div style="margin-bottom:8px;"><input type="text" id="regimen" placeholder="Régimen fiscal" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                            <input type="email" id="correo" placeholder="Correo" style="padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
                            <input type="text" id="telefono" placeholder="Teléfono" style="padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
                        </div>
                        <button type="submit" class="btn-primary" style="width:100%;">Guardar datos</button>
                    </form>
                </div>
            </div>

            <h3>Facturas cargadas</h3>
            <div id="facturasListado" style="background:#fff;border:1px solid #eee;border-radius:8px;overflow:auto;min-height:170px;"></div>

            <h3 style="margin-top: 40px;">Portales de Facturación</h3>
            <div class="facturacion-grid">
                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">🛒</div>
                        <h3>Super Sánchez</h3>
                    </div>
                    <p class="facturacion-description">Portal de facturación para Super Sánchez</p>
                    <a href="https://portal.tufacturasanchez.com/manualBilling" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>

                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">🏪</div>
                        <h3>OXXO</h3>
                    </div>
                    <p class="facturacion-description">Portal de facturación electrónica OXXO</p>
                    <a href="https://www4.oxxo.com:9443/facturacionElectronica-web/views/layout/inicio.do" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>
                
                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">🏪</div>
                        <h3>COPPEL</h3>
                    </div>
                    <p class="facturacion-description">Portal de facturación electrónica COPPEL</p>
                    <a href="https://facturas.coppel.com/generar-factura" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>

                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">🛍️</div>
                        <h3>Chedraui</h3>
                    </div>
                    <p class="facturacion-description">Portal Mas Factura Web - Chedraui</p>
                    <a href="https://www.masfacturaweb.com.mx/chedraui/chedraui_mfw.aspx" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>

                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">🏬</div>
                        <h3>Walmart y Bodega Aurrera</h3>
                    </div>
                    <p class="facturacion-description">Portal de facturación Walmart México</p>
                    <a href="https://facturacion.walmartmexico.com.mx/frmDatos.aspx" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>

                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">🚚</div>
                        <h3>CAPUFE</h3>
                    </div>
                    <p class="facturacion-description">Facturación rápida CAPUFE</p>
                    <a href="https://facturacioncapufe.com.mx/Capufe/facturacionrapida" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>

                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">💊</div>
                        <h3>Farmacias Guadalajara</h3>
                    </div>
                    <p class="facturacion-description">Portal de facturación Farmacias Guadalajara</p>
                    <a href="https://www.movil.farmaciasguadalajara.com/facturacion/" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>

                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">⚕️</div>
                        <h3>Farmacias Similares</h3>
                    </div>
                    <p class="facturacion-description">SimiFactura - Portal de Farmacias Similares</p>
                    <a href="https://facturacion.gpupm.com/simifactura/portal" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>
                
                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">⚕️</div>
                        <h3>Farmacias Union</h3>
                    </div>
                    <p class="facturacion-description">Farmacias Union - Portal de Farmacias Union</p>
                    <a href="https://rfp.face-suite.com/rfp/#!/main" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>

                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">🍔</div>
                        <h3>ALSEA (BK, VIPS, Domino's, Starbucks)</h3>
                    </div>
                    <p class="facturacion-description">Portal InterFactura - Grupo ALSEA</p>
                    <a href="https://alsea.interfactura.com/" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>

                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">⛽</div>
                        <h3>LA GAS</h3>
                    </div>
                    <p class="facturacion-description">Portal de facturación LA GAS</p>
                    <a href="https://facturacion.lagas.com.mx/auth/login" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>
                
                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">⛽</div>
                        <h3>EL GALLITO</h3>
                    </div>
                    <p class="facturacion-description">Portal de facturación EL GALLITO</p>
                    <a href="https://efegascarburacion.sgcweb.com.mx/index.php?module=isies_facturacion&entryPoint=facturacionEnLinea&content=facturarConsultar" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>
                
                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">⛽</div>
                        <h3>FACTURA GAS - ATIO</h3>
                    </div>
                    <p class="facturacion-description">Portal de facturación FACTURA GAS - ATIO</p>
                    <a href="https://facturagas.net/#facturar" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>
                
                <div class="facturacion-card">
                    <div class="facturacion-header">
                        <div class="facturacion-icon">🏎️</div>
                        <h3>Autozone</h3>
                    </div>
                    <p class="facturacion-description">Portal de facturación Autozone</p>
                    <a href="https://autozone.cdc.origon.cloud/facturacion/autozone" target="_blank" class="facturacion-btn">Acceder →</a>
                </div>
            </div>
        </div>

        <style>
        .facturacion-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .facturacion-card {
            background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 24px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            display: flex;
            flex-direction: column;
        }
        .facturacion-card:hover {
            border-color: #fcc30b;
            box-shadow: 0 6px 16px rgba(252, 195, 11, 0.15);
            transform: translateY(-4px);
        }
        .facturacion-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }
        .facturacion-icon {
            font-size: 40px;
            min-width: 50px;
            text-align: center;
        }
        .facturacion-card h3 {
            margin: 0;
            color: #2c245c;
            font-size: 18px;
            font-weight: 600;
        }
        .facturacion-description {
            color: #666;
            font-size: 14px;
            margin: 12px 0;
            flex: 1;
        }
        .facturacion-btn {
            display: inline-block;
            background: linear-gradient(135deg, #fcc30b 0%, #f3992c 100%);
            color: #2c245c;
            padding: 12px 16px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .facturacion-btn:hover {
            background: linear-gradient(135deg, #f3992c 0%, #ec6534 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(252, 195, 11, 0.3);
        }
        .facturacion-btn:active {
            transform: scale(0.98);
        }
        .table-facturas {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .table-facturas th, .table-facturas td {
            border-bottom: 1px solid #eee;
            padding: 10px;
            text-align: left;
        }
        .table-facturas th {
            background: #fcc30b;
            color: #2c245c;
            font-weight: 700;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        #facturasListado .mensaje-error {
            color: #c00;
            padding: 12px;
        }
        @media (max-width: 768px) {
            .facturacion-grid {
                grid-template-columns: 1fr;
            }
            .facturacion-card {
                padding: 16px;
            }
            .facturacion-icon {
                font-size: 32px;
            }
            .facturacion-card h3 {
                font-size: 16px;
            }
        }
        </style>
    `;

    // Cargar datos de facturación al iniciar
    await fac_cargarDatosFacturacion(user.uid);
    await fac_cargarFacturas(user.uid);

    // Event listeners
    const formSubir = document.getElementById('formSubirFactura');
    const formDatos = document.getElementById('formDatosFacturacion');
    const btnFiltrar = document.getElementById('btnFiltrarFacturas');
    const btnLimpiar = document.getElementById('btnLimpiarFiltro');

    if (formSubir) {
        formSubir.addEventListener('submit', (e) => fac_subirFactura(e, user.uid));
    }
    if (formDatos) {
        formDatos.addEventListener('submit', (e) => fac_guardarDatos(e, user.uid));
    }
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => fac_filtrarFacturas(user.uid));
    }
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => fac_limpiarFiltro(user.uid));
    }

    window.fac_subirFactura = (e) => fac_subirFactura(e, user.uid);
    window.fac_cargarFacturas = () => fac_cargarFacturas(user.uid);
    window.fac_eliminarFactura = (id) => fac_eliminarFactura(id, user.uid);
    window.fac_descargarFactura = (id, nombre, base64) => {
        try {
            descargarArchivo(base64, nombre);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };
}

async function fac_cargarFacturas(userId) {
    try {
        const q = query(collection(db, 'facturas'), where('usuario_id', '==', userId));
        const snapshot = await getDocs(q);
        facturas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fac_renderFacturas(facturas);
    } catch (error) {
        console.error('Error cargando facturas:', error);
        const div = document.getElementById('facturasListado');
        if (div) div.innerHTML = '<p class="mensaje-error">Error cargando facturas</p>';
    }
}

function fac_renderFacturas(list) {
    const div = document.getElementById('facturasListado');
    if (!div) return;

    if (!list || list.length === 0) {
        div.innerHTML = '<p style="padding:15px;color:#666;">No se encontraron facturas.</p>';
        return;
    }

    let html = '<table class="table-facturas"><thead><tr><th>Archivo</th><th>Empresa</th><th>RFC</th><th>Tipo</th><th>Acciones</th></tr></thead><tbody>';
    list.forEach(f => {
        html += '<tr>' +
            '<td>' + (f.nombre_original || 'Sin nombre') + '</td>' +
            '<td>' + (f.empresa_emisora || 'Desconocido') + '</td>' +
            '<td>' + (f.rfc_emisor || '-') + '</td>' +
            '<td>' + (f.tipo_archivo || '-') + '</td>' +
            '<td><button class="btn-small btn-secondary" style="margin-right:5px;" onclick="fac_descargarFactura(\'' + f.id + '\', \'' + (f.nombre_original || 'factura') + '\', \'' + f.datos_base64.replace(/'/g, "\\'") + '\')">⬇️ Descargar</button><button class="btn-small btn-delete" onclick="fac_eliminarFactura(\'' + f.id + '\')">Eliminar</button></td>' +
            '</tr>';
    });
    html += '</tbody></table>';
    div.innerHTML = html;
}

async function fac_subirFactura(e, userId) {
    e.preventDefault();
    const file = document.getElementById('facturaFile').files[0];
    if (!file) {
        alert('Selecciona un archivo');
        return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'xml'].includes(ext)) {
        alert('Solo archivos PDF o XML');
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Data = event.target.result;
            
            await addDoc(collection(db, 'facturas'), {
                usuario_id: userId,
                nombre_original: file.name,
                tipo_archivo: ext,
                datos_base64: base64Data,
                empresa_emisora: null,
                rfc_emisor: null,
                creado_en: serverTimestamp()
            });

            document.getElementById('formSubirFactura').reset();
            await fac_cargarFacturas(userId);
            alert('Factura subida correctamente');
        };
        reader.readAsDataURL(file);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function fac_eliminarFactura(id, userId) {
    if (!confirm('¿Eliminar factura?')) return;

    try {
        await deleteDoc(doc(db, 'facturas', id));
        await fac_cargarFacturas(userId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function fac_filtrarFacturas(userId) {
    const dia = document.getElementById('filtroDia').value;
    const mes = document.getElementById('filtroMes').value;
    const año = document.getElementById('filtroAño').value;

    let filtered = facturas;

    if (dia || mes || año) {
        filtered = facturas.filter(f => {
            const date = f.creado_en?.toDate?.() || new Date(f.creado_en);
            if (dia && date.getDate() != dia) return false;
            if (mes && date.getMonth() + 1 != mes) return false;
            if (año && date.getFullYear() != año) return false;
            return true;
        });
    }

    fac_renderFacturas(filtered);
}

function fac_limpiarFiltro(userId) {
    document.getElementById('filtroDia').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroAño').value = '';
    fac_cargarFacturas(userId);
}

async function fac_cargarDatosFacturacion(userId) {
    try {
        const q = query(collection(db, 'datosFacturacion'), where('usuario_id', '==', userId));
        const snapshot = await getDocs(q);
        
        if (snapshot.docs.length > 0) {
            const datos = snapshot.docs[0].data();
            document.getElementById('rfc').value = datos.rfc || '';
            document.getElementById('nombre_comercial').value = datos.nombre_comercial || '';
            document.getElementById('nombre_razon_social').value = datos.nombre_razon_social || '';
            document.getElementById('domicilio_fiscal').value = datos.domicilio_fiscal || '';
            document.getElementById('colonia').value = datos.colonia || '';
            document.getElementById('localidad').value = datos.localidad || '';
            document.getElementById('entidad').value = datos.entidad || '';
            document.getElementById('cp').value = datos.cp || '';
            document.getElementById('regimen').value = datos.regimen || '';
            document.getElementById('correo').value = datos.correo || '';
            document.getElementById('telefono').value = datos.telefono || '';
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

async function fac_guardarDatos(e, userId) {
    e.preventDefault();

    try {
        const datos = {
            usuario_id: userId,
            rfc: document.getElementById('rfc').value,
            nombre_comercial: document.getElementById('nombre_comercial').value,
            nombre_razon_social: document.getElementById('nombre_razon_social').value,
            domicilio_fiscal: document.getElementById('domicilio_fiscal').value,
            colonia: document.getElementById('colonia').value,
            localidad: document.getElementById('localidad').value,
            entidad: document.getElementById('entidad').value,
            cp: document.getElementById('cp').value,
            regimen: document.getElementById('regimen').value,
            correo: document.getElementById('correo').value,
            telefono: document.getElementById('telefono').value,
            actualizado_en: serverTimestamp()
        };

        // Buscar si ya existe
        const q = query(collection(db, 'datosFacturacion'), where('usuario_id', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.docs.length > 0) {
            // Actualizar
            await updateDoc(doc(db, 'datosFacturacion', snapshot.docs[0].id), datos);
        } else {
            // Crear
            await addDoc(collection(db, 'datosFacturacion'), datos);
        }

        alert('Datos guardados correctamente');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}
