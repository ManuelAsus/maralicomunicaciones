/**
 * Módulo TICKETS - Gestión de recibos/tickets
 */

import { getTickets, deleteTicket, formatDate, formatMoney } from '../api.js?v=4';

export async function render(container, user) {
    let tickets = [];

    try {
        // Cargar tickets
        tickets = await getTickets(user.uid);

        container.innerHTML = `
            <h2>🎫 Tickets / Recibos</h2>

            <div style="margin-bottom: 20px;">
                <input type="text" id="searchTicket" placeholder="Buscar ticket..." style="max-width: 300px; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>

            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <div id="ticketsContainer" style="overflow-x: auto;">
                    <table class="table" style="margin: 0;">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Cliente</th>
                                <th>Teléfono</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="ticketsTableBody">
                            <tr><td colspan="6" style="text-align: center; padding: 30px;"><div class="loading"></div> Cargando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        renderTickets();

        // Búsqueda
        document.getElementById('searchTicket').addEventListener('keyup', (e) => {
            const search = e.target.value.toLowerCase();
            const tbody = document.getElementById('ticketsTableBody');
            
            tbody.querySelectorAll('tr').forEach(tr => {
                const text = tr.textContent.toLowerCase();
                tr.style.display = text.includes(search) ? '' : 'none';
            });
        });

        function renderTickets() {
            const tbody = document.getElementById('ticketsTableBody');
            
            if (tickets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">No hay tickets.</td></tr>';
                return;
            }

            tbody.innerHTML = tickets.map(t => {
                const fecha = formatDate(t.fecha_creacion);
                const total = formatMoney(t.total);

                return `
                    <tr>
                        <td><strong>#${t.numero_ticket.toString().padStart(6, '0')}</strong></td>
                        <td>${t.cliente_nombre}</td>
                        <td>${t.cliente_telefono}</td>
                        <td>${fecha}</td>
                        <td><strong>${total}</strong></td>
                        <td>
                            <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="imprimirTicket('${t.id}')">🖨️ Imprimir</button>
                            <button class="btn-delete" style="padding: 6px 12px; font-size: 12px;" onclick="eliminarTicket('${t.id}')">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        window.imprimirTicket = (id) => {
            const ticket = tickets.find(t => t.id === id);
            if (!ticket) return;

            const ticketHTML = `
                <div style="font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="margin: 0;">MARALI COMUNICACIONES</h2>
                        <p style="margin: 5px 0;">RFC: ${ticket.rfc}</p>
                        <hr style="margin: 10px 0;">
                        <p style="margin: 5px 0;"><strong>TICKET #${ticket.numero_ticket.toString().padStart(6, '0')}</strong></p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 5px 0;"><strong>Cliente:</strong> ${ticket.cliente_nombre}</p>
                        <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${ticket.cliente_telefono}</p>
                        <p style="margin: 5px 0;"><strong>Dirección:</strong> ${ticket.cliente_direccion || 'N/A'}</p>
                    </div>

                    <hr style="margin: 10px 0;">
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 5px 0;"><strong>Detalles:</strong></p>
                        <p style="margin: 5px 0; font-size: 12px;">${ticket.detalles}</p>
                    </div>

                    <hr style="margin: 10px 0;">
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 5px 0;"><strong>Fecha:</strong> ${ticket.fecha_venta}</p>
                        <p style="margin: 5px 0;"><strong>Hora:</strong> ${ticket.hora_venta}</p>
                        <p style="margin: 5px 0;"><strong>Método de Pago:</strong> ${ticket.metodo_pago}</p>
                    </div>

                    <hr style="margin: 10px 0;">
                    
                    <div style="text-align: right; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 18px; font-weight: bold;">Total: $${ticket.total.toFixed(2)}</p>
                    </div>

                    <div style="text-align: center; color: #999; font-size: 12px;">
                        <p style="margin: 5px 0;">Gracias por su compra</p>
                        <p style="margin: 5px 0;">${new Date().toLocaleString('es-MX')}</p>
                    </div>
                </div>
            `;

            const printWindow = window.open('', '', 'height=400,width=400');
            printWindow.document.write(ticketHTML);
            printWindow.document.close();
            printWindow.print();
        };

        window.eliminarTicket = async (id) => {
            if (!confirm('¿Seguro que deseas eliminar este ticket?')) return;

            try {
                await deleteTicket(id, user.uid);
                showAlert('success', 'Ticket eliminado');
                tickets = await getTickets(user.uid);
                renderTickets();
            } catch (error) {
                showAlert('error', error.message);
            }
        };

    } catch (error) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}
