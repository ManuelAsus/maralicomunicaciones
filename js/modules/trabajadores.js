/**
 * Módulo TRABAJADORES - Gestión de empleados
 * Replicación exacta del módulo trabajadores.php del sistema PHP
 */

import {
    createTrabajador,
    getTrabajadores,
    updateTrabajador,
    deleteTrabajador,
    getTrabajadorDocumentos,
    uploadTrabajadorDocumento,
    deleteTrabajadorDocumento,
    uploadFile,
    descargarArchivo
} from '../api.js?v=5';

export async function render(container, user) {
    let trabajadores = [];
    let editingId = null;

    try {
        // Cargar trabajadores
        trabajadores = await getTrabajadores(user.uid);

        container.innerHTML = `
            <h2>👥 Gestión de Trabajadores</h2>

            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <button class="btn-primary" onclick="abrirFormulario()">➕ Nuevo Trabajador</button>
                <input type="text" id="searchTrabajador" placeholder="Buscar trabajador..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>

            <!-- Formulario -->
            <div id="formContainer" style="display: none; margin-bottom: 30px;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 id="formTitle">Nuevo Trabajador</h3>
                    <form id="trabajadorForm" onsubmit="guardarTrabajador(event)">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                            <div class="form-group">
                                <label>Nombre Completo *</label>
                                <input type="text" id="nombre" required>
                            </div>
                            <div class="form-group">
                                <label>Cargo *</label>
                                <input type="text" id="cargo" required>
                            </div>
                            <div class="form-group">
                                <label>RFC</label>
                                <input type="text" id="rfc" placeholder="Ej: SASM9507113H3">
                            </div>
                            <div class="form-group">
                                <label>Salario</label>
                                <input type="number" id="salario" step="0.01" min="0">
                            </div>
                            <div class="form-group">
                                <label>Período de Cobro</label>
                                <select id="periodo_cobro">
                                    <option value="diario">Diario</option>
                                    <option value="semanal">Semanal</option>
                                    <option value="quincenal" selected>Quincenal</option>
                                    <option value="mensual">Mensual</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Forma de Pago</label>
                                <select id="forma_pago">
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia" selected>Transferencia</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Foto</label>
                            <input type="file" id="foto" accept="image/*">
                        </div>

                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" class="btn-secondary" onclick="cerrarFormulario()">Cancelar</button>
                            <button type="submit" class="btn-primary">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Tabla de Trabajadores -->
            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <div id="trabajadoresContainer" style="overflow-x: auto;">
                    <table class="table" style="margin: 0;">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Cargo</th>
                                <th>RFC</th>
                                <th>Salario</th>
                                <th>Período</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="trabajadoresTableBody">
                            <tr><td colspan="6" style="text-align: center; padding: 30px;"><div class="loading"></div> Cargando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal de Documentos -->
            <div id="documentosModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;">
                <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 50px auto; max-height: 80vh; overflow-y: auto;">
                    <h3>Documentos del Trabajador</h3>
                    <div style="margin-bottom: 20px;">
                        <input type="file" id="documentoFile" multiple>
                        <button class="btn-primary" onclick="subirDocumento()" style="margin-top: 10px;">Subir Documento</button>
                    </div>
                    <div id="documentosList"></div>
                    <button class="btn-secondary" onclick="cerrarDocumentos()" style="margin-top: 20px;">Cerrar</button>
                </div>
            </div>
        `;

        // Asignar funciones globales
        window.abrirFormulario = () => {
            editingId = null;
            document.getElementById('formContainer').style.display = 'block';
            document.getElementById('formTitle').textContent = 'Nuevo Trabajador';
            document.getElementById('trabajadorForm').reset();
        };

        window.cerrarFormulario = () => {
            document.getElementById('formContainer').style.display = 'none';
            document.getElementById('trabajadorForm').reset();
        };

        window.guardarTrabajador = async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value.trim();
            const cargo = document.getElementById('cargo').value.trim();
            const rfc = document.getElementById('rfc').value.trim();
            const salario = parseFloat(document.getElementById('salario').value) || 0;
            const periodo_cobro = document.getElementById('periodo_cobro').value;
            const forma_pago = document.getElementById('forma_pago').value;

            try {
                const trabajadorData = {
                    nombre,
                    cargo,
                    rfc,
                    salario,
                    periodo_cobro,
                    forma_pago
                };

                if (editingId) {
                    await updateTrabajador(editingId, trabajadorData, user.uid);
                    showAlert('success', 'Trabajador actualizado');
                } else {
                    await createTrabajador(trabajadorData, user.uid);
                    showAlert('success', 'Trabajador creado');
                }

                cerrarFormulario();
                trabajadores = await getTrabajadores(user.uid);
                renderTrabajadores();
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        window.editarTrabajador = async (id) => {
            const t = trabajadores.find(x => x.id === id);
            if (!t) return;

            editingId = id;
            document.getElementById('nombre').value = t.nombre;
            document.getElementById('cargo').value = t.cargo;
            document.getElementById('rfc').value = t.rfc || '';
            document.getElementById('salario').value = t.salario || 0;
            document.getElementById('periodo_cobro').value = t.periodo_cobro || 'mensual';
            document.getElementById('forma_pago').value = t.forma_pago || 'transferencia';
            document.getElementById('formTitle').textContent = 'Editar Trabajador';
            document.getElementById('formContainer').style.display = 'block';
        };

        window.eliminarTrabajador = async (id) => {
            if (!confirm('¿Seguro que deseas eliminar este trabajador?')) return;

            try {
                await deleteTrabajador(id, user.uid);
                showAlert('success', 'Trabajador eliminado');
                trabajadores = await getTrabajadores(user.uid);
                renderTrabajadores();
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        window.abrirDocumentos = async (id) => {
            window.currentTrabajadorId = id;
            const documentos = await getTrabajadorDocumentos(id);
            
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
                for (const file of files) {
                    await uploadTrabajadorDocumento(window.currentTrabajadorId, file, user.uid);
                }
                showAlert('success', 'Documentos subidos');
                abrirDocumentos(window.currentTrabajadorId);
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        window.eliminarDocumento = async (id) => {
            try {
                await deleteTrabajadorDocumento(id, user.uid);
                showAlert('success', 'Documento eliminado');
                abrirDocumentos(window.currentTrabajadorId);
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
        document.getElementById('searchTrabajador').addEventListener('keyup', (e) => {
            const search = e.target.value.toLowerCase();
            const tbody = document.getElementById('trabajadoresTableBody');
            tbody.querySelectorAll('tr').forEach(tr => {
                const text = tr.textContent.toLowerCase();
                tr.style.display = text.includes(search) ? '' : 'none';
            });
        });

        function renderTrabajadores() {
            const tbody = document.getElementById('trabajadoresTableBody');
            
            if (trabajadores.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">No hay trabajadores. Agrega uno nuevo.</td></tr>';
                return;
            }

            tbody.innerHTML = trabajadores.map(t => `
                <tr>
                    <td><strong>${t.nombre}</strong></td>
                    <td>${t.cargo}</td>
                    <td><code style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px;">${t.rfc || '-'}</code></td>
                    <td>$${t.salario ? t.salario.toFixed(2) : '0.00'}</td>
                    <td><span class="badge badge-success">${t.periodo_cobro || 'mensual'}</span></td>
                    <td>
                        <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="editarTrabajador('${t.id}')">✏️ Editar</button>
                        <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="abrirDocumentos('${t.id}')">📄 Docs</button>
                        <button class="btn-delete" style="padding: 6px 12px; font-size: 12px;" onclick="eliminarTrabajador('${t.id}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }

        renderTrabajadores();

    } catch (error) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}
