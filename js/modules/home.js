/**
 * Módulo HOME - Dashboard principal con estadísticas
 */

import { getDashboardStats, formatMoney } from '../api.js?v=4';

export async function render(container, user) {
    try {
        const stats = await getDashboardStats(user.uid);

        container.innerHTML = `
            <h2>Panel de Control</h2>
            <div class="dashboard-grid">
                <div class="card-stat">
                    <div class="stat-icon">📦</div>
                    <div class="stat-content">
                        <h3>Productos en Inventario</h3>
                        <p class="stat-number">${stats.totalProductos}</p>
                    </div>
                </div>
                <div class="card-stat">
                    <div class="stat-icon">💳</div>
                    <div class="stat-content">
                        <h3>Ventas Hoy</h3>
                        <p class="stat-number">${stats.ventasHoy}</p>
                    </div>
                </div>
                <div class="card-stat">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <h3>Clientes Registrados</h3>
                        <p class="stat-number">${stats.totalClientes}</p>
                    </div>
                </div>
                <div class="card-stat">
                    <div class="stat-icon">👤</div>
                    <div class="stat-content">
                        <h3>Trabajadores</h3>
                        <p class="stat-number">${stats.totalTrabajadores}</p>
                    </div>
                </div>
            </div>

            <div style="margin-top: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                <h3>ℹ️ Información del Sistema</h3>
                <ul style="line-height: 1.8; color: #666;">
                    <li><strong>Versión:</strong> 3.0 Web (Firebase)</li>
                    <li><strong>Backend:</strong> Firebase Firestore + Cloud Storage</li>
                    <li><strong>Hosting:</strong> GitHub Pages</li>
                    <li><strong>Última actualización:</strong> ${new Date().toLocaleDateString('es-MX')}</li>
                </ul>
            </div>
        `;

    } catch (error) {
        container.innerHTML = `<div class="error">Error cargando estadísticas: ${error.message}</div>`;
    }
}
