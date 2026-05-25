/**
 * Módulo VENTAS - Registro de ventas y cotizaciones
 */

import { 
    createCliente, 
    getClientes,
    getClienteByPhone,
    getProductos, 
    createVenta,
    uploadFile 
} from '../api.js?v=4';

export async function render(container, user) {
    let productos = [];
    let clientes = [];

    try {
        // Cargar datos
        productos = await getProductos(user.uid);
        clientes = await getClientes(user.uid);

        container.innerHTML = `
            <h2>Ventas / Clientes / Cotizaciones</h2>

            <div class="module-form">
                <form id="formVenta" onsubmit="guardarVenta(event)">
                    <h3>Información del Cliente</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                        <div class="form-group">
                            <label>Nombre del Cliente *</label>
                            <input type="text" id="cliente_nombre" required placeholder="Nombre completo">
                        </div>
                        <div class="form-group">
                            <label>Número de Teléfono *</label>
                            <input type="tel" id="cliente_telefono" required placeholder="+52 1234567890">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Dirección</label>
                        <input type="text" id="cliente_direccion" placeholder="Dirección del cliente (opcional)">
                    </div>

                    <div class="form-group">
                        <label>¿Qué necesita el cliente? *</label>
                        <textarea id="cliente_necesidad" required placeholder="Descripción de las necesidades del cliente" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 80px;"></textarea>
                    </div>

                    <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;">
                    <h3>Información de Compra</h3>

                    <div class="form-group">
                        <label>¿Realizó una compra? *</label>
                        <select id="compro" required onchange="toggleProductosSelect()">
                            <option value="">Selecciona una opción</option>
                            <option value="si">Sí, realizó una compra</option>
                            <option value="no">No, solo cotización</option>
                        </select>
                    </div>

                    <div id="productosSection" style="display: none;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                            <div class="form-group">
                                <label>Selecciona el Producto/Servicio *</label>
                                <select id="producto_id" onchange="actualizarPrecio()">
                                    <option value="">Cargando productos...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Cantidad *</label>
                                <input type="number" id="cantidad" value="1" min="1" onchange="calcularSubtotal()">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
                            <div style="padding: 12px; background: #f9f9f9; border-radius: 6px;">
                                <label style="color: #999; font-size: 12px;">Precio Unitario</label>
                                <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: var(--primary);">$<span id="precioUnitario">0.00</span></p>
                            </div>
                            <div style="padding: 12px; background: #f9f9f9; border-radius: 6px;">
                                <label style="color: #999; font-size: 12px;">Subtotal</label>
                                <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: var(--primary);">$<span id="subtotal">0.00</span></p>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Notas Adicionales</label>
                        <textarea id="nota" placeholder="Notas adicionales (opcional)" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 80px;"></textarea>
                    </div>

                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button type="button" class="btn-secondary" onclick="limpiarFormVenta()">Limpiar</button>
                        <button type="submit" class="btn-primary">Guardar Venta</button>
                    </div>
                </form>
            </div>
        `;

        // Llenar select de productos
        const selectProductos = document.getElementById('producto_id');
        selectProductos.innerHTML = '<option value="">Selecciona un producto</option>' + 
            productos.map(p => `<option value="${p.id}" data-precio="${p.precio}">${p.nombre} - $${p.precio.toFixed(2)}</option>`).join('');

        // Funciones globales
        window.toggleProductosSelect = () => {
            const compro = document.getElementById('compro').value;
            document.getElementById('productosSection').style.display = compro === 'si' ? 'block' : 'none';
        };

        window.actualizarPrecio = () => {
            const selectProductos = document.getElementById('producto_id');
            const option = selectProductos.options[selectProductos.selectedIndex];
            const precio = parseFloat(option.dataset.precio) || 0;
            document.getElementById('precioUnitario').textContent = precio.toFixed(2);
            calcularSubtotal();
        };

        window.calcularSubtotal = () => {
            const precio = parseFloat(document.getElementById('precioUnitario').textContent);
            const cantidad = parseInt(document.getElementById('cantidad').value) || 0;
            const subtotal = precio * cantidad;
            document.getElementById('subtotal').textContent = subtotal.toFixed(2);
        };

        window.limpiarFormVenta = () => {
            document.getElementById('formVenta').reset();
            document.getElementById('productosSection').style.display = 'none';
            document.getElementById('precioUnitario').textContent = '0.00';
            document.getElementById('subtotal').textContent = '0.00';
        };

        window.guardarVenta = async (e) => {
            e.preventDefault();

            const nombre_cliente = document.getElementById('cliente_nombre').value.trim();
            const telefono_cliente = document.getElementById('cliente_telefono').value.trim();
            const direccion = document.getElementById('cliente_direccion').value.trim();
            const necesidad = document.getElementById('cliente_necesidad').value.trim();
            const compro_algo = document.getElementById('compro').value;
            const nota = document.getElementById('nota').value.trim();

            if (!nombre_cliente || !telefono_cliente || !necesidad) {
                showAlert('error', 'Llena todos los campos requeridos');
                return;
            }

            try {
                // Crear o buscar cliente
                let clienteData = {
                    nombre: nombre_cliente,
                    telefono: telefono_cliente,
                    direccion: direccion,
                    descripcion_necesidad: necesidad
                };

                const clienteExistente = clientes.find(c => c.telefono === telefono_cliente);
                const cliente_id = clienteExistente?.id || (await createCliente(clienteData, user.uid)).id;

                // Crear venta
                let ventaData = {
                    cliente_id,
                    nombre_cliente,
                    telefono_cliente,
                    direccion_cliente: direccion,
                    descripcion_necesidad: necesidad,
                    compro_algo,
                    nota,
                    total: 0
                };

                if (compro_algo === 'si') {
                    const producto_id = document.getElementById('producto_id').value;
                    const cantidad = parseInt(document.getElementById('cantidad').value);
                    const total = parseFloat(document.getElementById('subtotal').textContent);

                    if (!producto_id) {
                        showAlert('error', 'Selecciona un producto');
                        return;
                    }

                    ventaData.producto_id = producto_id;
                    ventaData.cantidad = cantidad;
                    ventaData.total = total;
                }

                await createVenta(ventaData, user.uid);
                showAlert('success', 'Venta guardada correctamente');
                limpiarFormVenta();

            } catch (error) {
                showAlert('error', error.message);
            }
        };

    } catch (error) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}
