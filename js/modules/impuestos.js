/**
 * Módulo IMPUESTOS - Control de impuestos y documentación fiscal
 * Replicación exacta del módulo control-impuestos.php del sistema PHP
 */

import {
    createImpuesto,
    getImpuestos,
    updateImpuesto,
    getImpuestoDocumentos,
    uploadImpuestoDocumento,
    deleteImpuestoDocumento,
    descargarArchivo
} from '../api.js?v=5';

const TIPOS_IMPUESTO = [
    { value: 'imms', label: 'IMMS (Mensual)', frecuencia: 'mensual' },
    { value: 'sat', label: 'SAT (Mensual)', frecuencia: 'mensual' },
    { value: 'infonavit', label: 'INFONAVIT (Bimestral)', frecuencia: 'bimestral' },
    { value: 'impuesto_tabasco', label: 'Impuesto Tabasco', frecuencia: 'mensual' }
];

const MESES = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' }
];

export async function render(container, user) {
    let impuestos = [];
    const currentYear = new Date().getFullYear();

    try {
        impuestos = await getImpuestos(user.uid);

        container.innerHTML = `
            <h2>💰 Control de Impuestos</h2>

            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <button class="btn-primary" onclick="abrirFormulario()">➕ Registrar Pago</button>
                <input type="text" id="searchImpuesto" placeholder="Buscar..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>

            <!-- Formulario -->
            <div id="formContainer" style="display: none; margin-bottom: 30px;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3>Registrar Pago de Impuesto</h3>
                    <form id="impuestoForm" onsubmit="guardarImpuesto(event)">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                            <div class="form-group">
                                <label>Tipo de Impuesto *</label>
                                <select id="tipo_impuesto" required>
                                    <option value="">Selecciona...</option>
                                    ${TIPOS_IMPUESTO.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Mes *</label>
                                <select id="mes" required>
                                    <option value="">Selecciona...</option>
                                    ${MESES.map(m => `<option value="${m.num}">${m.nombre}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Año *</label>
                                <input type="number" id="ano" value="${currentYear}" min="2020" required>
                            </div>
                            <div class="form-group">
                                <label>Estado *</label>
                                <select id="estado" required>
                                    <option value="sin_pagar">Sin Pagar</option>
                                    <option value="pagado">Pagado</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Fecha de Pago</label>
                            <input type="date" id="fecha_pago">
                        </div>

                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" class="btn-secondary" onclick="cerrarFormulario()">Cancelar</button>
                            <button type="submit" class="btn-primary">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Tabla de Impuestos -->
            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <div id="impuestosContainer" style="overflow-x: auto;">
                    <table class="table" style="margin: 0;">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Mes/Año</th>
                                <th>Estado</th>
                                <th>Fecha Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="impuestosTableBody">
                            <tr><td colspan="5" style="text-align: center; padding: 30px;"><div class="loading"></div> Cargando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal de Documentos -->
            <div id="documentosModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;">
                <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 50px auto; max-height: 80vh; overflow-y: auto;">
                    <h3>Documentos del Impuesto</h3>
                    <div style="margin-bottom: 20px;">
                        <input type="file" id="documentoFile" multiple>
                        <button class="btn-primary" onclick="subirDocumento()" style="margin-top: 10px;">Subir Documentos</button>
                    </div>
                    <div id="documentosList"></div>
                    <button class="btn-secondary" onclick="cerrarDocumentos()" style="margin-top: 20px;">Cerrar</button>
                </div>
            </div>
        `;

        // Asignar funciones globales
        window.abrirFormulario = () => {
            document.getElementById('formContainer').style.display = 'block';
            document.getElementById('impuestoForm').reset();
        };

        window.cerrarFormulario = () => {
            document.getElementById('formContainer').style.display = 'none';
        };

        window.guardarImpuesto = async (e) => {
            e.preventDefault();

            const tipo_impuesto = document.getElementById('tipo_impuesto').value;
            const mes = parseInt(document.getElementById('mes').value);
            const ano = parseInt(document.getElementById('ano').value);
            const estado = document.getElementById('estado').value;
            const fecha_pago = document.getElementById('fecha_pago').value || null;

            try {
                // Verificar si existe
                const existente = impuestos.find(i => 
                    i.tipo_impuesto === tipo_impuesto && i.mes === mes && i.año === ano
                );

                if (existente) {
                    await updateImpuesto(existente.id, {
                        estado,
                        fecha_pago
                    }, user.uid);
                    showAlert('success', 'Impuesto actualizado');
                } else {
                    await createImpuesto({
                        tipo_impuesto,
                        mes,
                        año: ano,
                        estado,
                        fecha_pago
                    }, user.uid);
                    showAlert('success', 'Impuesto registrado');
                }

                cerrarFormulario();
                impuestos = await getImpuestos(user.uid);
                renderImpuestos();
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        window.cambiarEstado = async (id) => {
            try {
                const impuesto = impuestos.find(i => i.id === id);
                const nuevoEstado = impuesto.estado === 'pagado' ? 'sin_pagar' : 'pagado';
                
                await updateImpuesto(id, {
                    estado: nuevoEstado,
                    fecha_pago: nuevoEstado === 'pagado' ? new Date().toISOString().split('T')[0] : null
                }, user.uid);
                
                impuestos = await getImpuestos(user.uid);
                renderImpuestos();
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        window.abrirDocumentos = async (id) => {
            window.currentImpuestoId = id;
            const documentos = await getImpuestoDocumentos(id);
            
            const listHTML = documentos.map(d => `
                <div style="padding: 10px; background: #f0f0f0; border-radius: 4px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${d.nombre_original}</strong><br>
                        <small>${(d.tamaño / 1024).toFixed(2)} KB | ${d.tipo_archivo}</small>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="descargarDocumento('${d.id}', '${d.nombre_original}', '${d.url_descarga.replace(/'/g, "\\'")}')">⬇️ Descargar</button>
                        <button class="btn-delete" style="padding: 6px 12px;" onclick="eliminarDocumento('${d.id}')">Eliminar</button>
                    </div>
                </div>
            `).join('');

            document.getElementById('documentosList').innerHTML = listHTML || '<p style="color: #999;">No hay documentos aún.</p>';
            document.getElementById('documentosModal').style.display = 'block';
        };

        window.cerrarDocumentos = () => {
            document.getElementById('documentosModal').style.display = 'none';
            document.getElementById('documentoFile').value = '';
        };

        window.subirDocumento = async () => {
            const files = document.getElementById('documentoFile').files;
            if (files.length === 0) {
                showAlert('error', 'Selecciona un archivo');
                return;
            }

            try {
                const impuesto = impuestos.find(i => i.id === window.currentImpuestoId);
                
                for (const file of files) {
                    await uploadImpuestoDocumento(
                        window.currentImpuestoId,
                        file,
                        {
                            tipo_impuesto: impuesto.tipo_impuesto,
                            mes: impuesto.mes,
                            año: impuesto.año
                        },
                        user.uid
                    );
                }
                showAlert('success', 'Documentos subidos');
                abrirDocumentos(window.currentImpuestoId);
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        window.eliminarDocumento = async (id) => {
            try {
                await deleteImpuestoDocumento(id, user.uid);
                showAlert('success', 'Documento eliminado');
                abrirDocumentos(window.currentImpuestoId);
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        window.descargarDocumento = (id, nombreArchivo, base64Data) => {
            try {
                descargarArchivo(base64Data, nombreArchivo);
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        // Búsqueda
        document.getElementById('searchImpuesto').addEventListener('keyup', (e) => {
            const search = e.target.value.toLowerCase();
            const tbody = document.getElementById('impuestosTableBody');
            tbody.querySelectorAll('tr').forEach(tr => {
                const text = tr.textContent.toLowerCase();
                tr.style.display = text.includes(search) ? '' : 'none';
            });
        });

        function renderImpuestos() {
            const tbody = document.getElementById('impuestosTableBody');
            
            if (impuestos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">No hay registros. Registra un pago.</td></tr>';
                return;
            }

            tbody.innerHTML = impuestos.map(i => {
                const tipo = TIPOS_IMPUESTO.find(t => t.value === i.tipo_impuesto);
                const mes = MESES.find(m => m.num === i.mes);
                const badge = i.estado === 'pagado' ? 'badge-success' : 'badge-warning';
                const estadoText = i.estado === 'pagado' ? '✓ Pagado' : '⏳ Sin Pagar';
                
                return `
                    <tr>
                        <td><strong>${tipo?.label || i.tipo_impuesto}</strong></td>
                        <td>${mes?.nombre || 'N/A'} ${i.año}</td>
                        <td><span class="badge ${badge}" onclick="cambiarEstado('${i.id}')" style="cursor: pointer;">${estadoText}</span></td>
                        <td>${i.fecha_pago ? new Date(i.fecha_pago).toLocaleDateString('es-MX') : '-'}</td>
                        <td>
                            <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="abrirDocumentos('${i.id}')">📄 Docs</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        renderImpuestos();

    } catch (error) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}
