/**
 * Módulo HISTORIAL - Visualización de ventas anteriores
 */

import { getVentas, formatDate, formatMoney } from '../api.js?v=4';

export async function render(container, user) {
    let ventas = [];

    try {
        // Cargar ventas
        ventas = await getVentas(user.uid);

        container.innerHTML = `
            <h2>Historial de Ventas</h2>

            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <input type="text" id="searchVenta" placeholder="Buscar cliente..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>

            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <div id="ventasContainer" style="overflow-x: auto;">
                    <table class="table" style="margin: 0;">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Teléfono</th>
                                <th>Tipo</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="ventasTableBody">
                            <tr><td colspan="7" style="text-align: center; padding: 30px;"><div class="loading"></div> Cargando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        renderVentas();

        // Búsqueda
        document.getElementById('searchVenta').addEventListener('keyup', (e) => {
            const search = e.target.value.toLowerCase();
            const tbody = document.getElementById('ventasTableBody');
            
            tbody.querySelectorAll('tr').forEach(tr => {
                const text = tr.textContent.toLowerCase();
                tr.style.display = text.includes(search) ? '' : 'none';
            });
        });

        function renderVentas() {
            const tbody = document.getElementById('ventasTableBody');
            
            if (ventas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #999;">No hay ventas registradas.</td></tr>';
                return;
            }

            tbody.innerHTML = ventas.map(v => {
                const tipo = v.compro_algo === 'si' ? '💳 Compra' : '📋 Cotización';
                const fecha = formatDate(v.fecha_venta);
                const total = v.total ? formatMoney(v.total) : '-';

                return `
                    <tr>
                        <td>${fecha}</td>
                        <td><strong>${v.nombre_cliente}</strong></td>
                        <td>${v.telefono_cliente}</td>
                        <td>${tipo}</td>
                        <td>${total}</td>
                        <td><span class="badge badge-success">${v.estado || 'completada'}</span></td>
                        <td>
                            <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="abrirWhatsApp('${v.telefono_cliente}')">💬 WhatsApp</button>
                            <button class="btn-delete" style="padding: 6px 12px; font-size: 12px;" onclick="eliminarVenta('${v.id}')">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        window.abrirWhatsApp = (telefono) => {
            const mensaje = 'Hola, te compartimos los detalles de tu pedido/cotización.';
            const enlace = `https://api.whatsapp.com/send?phone=${telefono.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(mensaje)}`;
            window.open(enlace, '_blank');
        };

        window.eliminarVenta = async (id) => {
            if (!confirm('¿Seguro que deseas eliminar esta venta?')) return;

            try {
                // Implementar eliminación cuando tengas la función
                showAlert('success', 'Venta eliminada (feature próximamente)');
                // await deleteVenta(id);
                // ventas = ventas.filter(v => v.id !== id);
                // renderVentas();
            } catch (error) {
                showAlert('error', error.message);
            }
        };

    } catch (error) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}
