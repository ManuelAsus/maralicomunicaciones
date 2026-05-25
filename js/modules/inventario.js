/**
 * Módulo INVENTARIO - Gestión de productos
 */

import { 
    createProducto, 
    getProductos, 
    updateProducto, 
    deleteProducto,
    uploadFile,
    deleteFile 
} from '../api.js?v=4';

export async function render(container, user) {
    let productos = [];
    let editingId = null;

    try {
        // Renderizar interfaz primero
        container.innerHTML = `
            <h2>Gestión de Inventario</h2>

            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <button class="btn-primary" onclick="abrirFormulario()">➕ Nuevo Producto</button>
                <input type="text" id="searchProducto" placeholder="Buscar producto..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>

            <!-- Formulario -->
            <div id="formContainer" style="display: none; margin-bottom: 30px;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 id="formTitle">Nuevo Producto</h3>
                    <form id="productoForm" onsubmit="guardarProducto(event)">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                            <div class="form-group">
                                <label>Nombre *</label>
                                <input type="text" id="nombre" required>
                            </div>
                            <div class="form-group">
                                <label>Código *</label>
                                <input type="text" id="codigo" required>
                            </div>
                            <div class="form-group">
                                <label>Categoría</label>
                                <input type="text" id="categoria">
                            </div>
                            <div class="form-group">
                                <label>Precio *</label>
                                <input type="number" id="precio" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label>Stock *</label>
                                <input type="number" id="stock" required>
                            </div>
                            <div class="form-group">
                                <label>Imagen</label>
                                <input type="file" id="imagen" accept="image/*">
                            </div>
                        </div>
                        <div class="form-group" style="grid-column: 1/-1;">
                            <label>Descripción</label>
                            <textarea id="descripcion" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 100px;"></textarea>
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button type="button" class="btn-secondary" onclick="cerrarFormulario()">Cancelar</button>
                            <button type="submit" class="btn-primary">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Tabla de Productos -->
            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <div id="productosContainer" style="overflow-x: auto;">
                    <table class="table" style="margin: 0;">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Código</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="productosTableBody">
                            <tr><td colspan="6" style="text-align: center; padding: 30px;"><div class="loading"></div> Cargando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Asignar funciones globales
        window.abrirFormulario = () => {
            editingId = null;
            document.getElementById('formContainer').style.display = 'block';
            document.getElementById('formTitle').textContent = 'Nuevo Producto';
            document.getElementById('productoForm').reset();
            document.getElementById('productoForm').scrollIntoView();
        };

        window.cerrarFormulario = () => {
            document.getElementById('formContainer').style.display = 'none';
            document.getElementById('productoForm').reset();
        };

        window.guardarProducto = async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('nombre').value.trim();
            const codigo = document.getElementById('codigo').value.trim();
            const categoria = document.getElementById('categoria').value.trim();
            const precio = parseFloat(document.getElementById('precio').value);
            const stock = parseInt(document.getElementById('stock').value);
            const descripcion = document.getElementById('descripcion').value.trim();
            const imagenFile = document.getElementById('imagen').files[0];

            try {
                let imagenUrl = null;

                // Subir imagen si existe
                if (imagenFile) {
                    const uploadResult = await uploadFile(imagenFile, 'productos');
                    imagenUrl = uploadResult.url;
                }

                const productoData = {
                    nombre,
                    codigo,
                    categoria,
                    precio,
                    stock,
                    descripcion,
                    imagen: imagenUrl
                };

                if (editingId) {
                    await updateProducto(editingId, productoData, user.uid);
                    showAlert('success', 'Producto actualizado correctamente');
                } else {
                    await createProducto(productoData, user.uid);
                    showAlert('success', 'Producto creado correctamente');
                }

                cerrarFormulario();
                await loadProductos();
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        window.editarProducto = async (id) => {
            const producto = productos.find(p => p.id === id);
            if (!producto) return;

            editingId = id;
            document.getElementById('nombre').value = producto.nombre;
            document.getElementById('codigo').value = producto.codigo;
            document.getElementById('categoria').value = producto.categoria || '';
            document.getElementById('precio').value = producto.precio;
            document.getElementById('stock').value = producto.stock;
            document.getElementById('descripcion').value = producto.descripcion || '';
            document.getElementById('formTitle').textContent = 'Editar Producto';
            document.getElementById('formContainer').style.display = 'block';
        };

        window.eliminarProducto = async (id) => {
            if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

            try {
                await deleteProducto(id, user.uid);
                showAlert('success', 'Producto eliminado');
                await loadProductos();
            } catch (error) {
                showAlert('error', error.message);
            }
        };

        // Búsqueda
        document.getElementById('searchProducto').addEventListener('keyup', (e) => {
            const search = e.target.value.toLowerCase();
            const tbody = document.getElementById('productosTableBody');
            
            tbody.querySelectorAll('tr').forEach(tr => {
                const text = tr.textContent.toLowerCase();
                tr.style.display = text.includes(search) ? '' : 'none';
            });
        });

        // Cargar productos DESPUÉS de renderizar el HTML
        async function loadProductos() {
            try {
                const tbody = document.getElementById('productosTableBody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><div class="loading"></div> Cargando...</td></tr>';
                }
                
                productos = await getProductos(user.uid);
                renderProductos();
            } catch (error) {
                console.error('Error cargando productos:', error);
                const tbody = document.getElementById('productosTableBody');
                if (tbody) {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: #c00;">Error: ${error.message}</td></tr>`;
                }
            }
        }

        function renderProductos() {
            const tbody = document.getElementById('productosTableBody');
            
            if (productos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">No hay productos. Crea uno nuevo para empezar.</td></tr>';
                return;
            }

            tbody.innerHTML = productos.map(p => `
                <tr>
                    <td><strong>${p.nombre}</strong></td>
                    <td><code style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px;">${p.codigo}</code></td>
                    <td>${p.categoria || '-'}</td>
                    <td><strong>$${p.precio.toFixed(2)}</strong></td>
                    <td><span class="badge ${p.stock > 10 ? 'badge-success' : 'badge-warning'}">${p.stock} unidades</span></td>
                    <td>
                        <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="editarProducto('${p.id}')">✏️ Editar</button>
                        <button class="btn-delete" style="padding: 6px 12px; font-size: 12px;" onclick="eliminarProducto('${p.id}')">🗑️ Eliminar</button>
                    </td>
                </tr>
            `).join('');
        }

        // Llamar a cargar productos al final
        await loadProductos();

    } catch (error) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}
