-- =====================================================
-- SISTEMA PARA VENTA DE COMPUTADORAS
-- Script 03: Consultas de Ventas (DQL, Transacciones, Funciones)
-- Gestor: PostgreSQL
-- =====================================================

-- =====================================================
-- CONSULTAS ÚTILES
-- =====================================================

-- 1. Listado de productos con categoría, marca y proveedor
SELECT 
    p.codigo_producto,
    p.nombre AS producto,
    c.nombre_categoria AS categoria,
    m.nombre_marca AS marca,
    pr.razon_social AS proveedor,
    p.precio_compra,
    p.precio_venta,
    p.stock,
    p.stock_minimo,
    p.estado
FROM productos p
INNER JOIN categorias c ON p.id_categoria = c.id_categoria
INNER JOIN marcas m ON p.id_marca = m.id_marca
LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
ORDER BY p.nombre;

-- 2. Productos con stock bajo (stock <= stock_minimo)
SELECT 
    p.codigo_producto,
    p.nombre AS producto,
    c.nombre_categoria AS categoria,
    m.nombre_marca AS marca,
    p.stock,
    p.stock_minimo,
    p.precio_venta
FROM productos p
INNER JOIN categorias c ON p.id_categoria = c.id_categoria
INNER JOIN marcas m ON p.id_marca = m.id_marca
WHERE p.stock <= p.stock_minimo
  AND p.estado = 'ACTIVO'
ORDER BY p.stock ASC;

-- 3. Búsqueda de productos por nombre
SELECT 
    p.codigo_producto,
    p.nombre AS producto,
    c.nombre_categoria AS categoria,
    m.nombre_marca AS marca,
    p.precio_venta,
    p.stock
FROM productos p
INNER JOIN categorias c ON p.id_categoria = c.id_categoria
INNER JOIN marcas m ON p.id_marca = m.id_marca
WHERE LOWER(p.nombre) LIKE LOWER('%Dell%')
ORDER BY p.nombre;

-- 4. Consulta de clientes
SELECT 
    c.id_cliente,
    c.tipo_documento,
    c.numero_documento,
    CONCAT(c.nombres, ' ', c.apellidos) AS cliente,
    c.telefono,
    c.email,
    c.direccion,
    c.estado
FROM clientes c
ORDER BY c.apellidos, c.nombres;

-- 5. Historial de ventas
SELECT 
    v.numero_venta,
    v.fecha_venta,
    CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
    cl.numero_documento,
    CONCAT(e.nombres, ' ', e.apellidos) AS empleado,
    v.subtotal,
    v.igv,
    v.total,
    v.estado
FROM ventas v
INNER JOIN clientes cl ON v.id_cliente = cl.id_cliente
INNER JOIN empleados e ON v.id_empleado = e.id_empleado
ORDER BY v.fecha_venta DESC;

-- 6. Detalle de una venta con subtotal e importe total
SELECT 
    v.numero_venta,
    v.fecha_venta,
    CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
    p.codigo_producto,
    p.nombre AS producto,
    dv.cantidad,
    dv.precio_venta,
    dv.subtotal,
    v.igv,
    v.total
FROM detalle_ventas dv
INNER JOIN ventas v ON dv.id_venta = v.id_venta
INNER JOIN clientes cl ON v.id_cliente = cl.id_cliente
INNER JOIN productos p ON dv.id_producto = p.id_producto
WHERE v.numero_venta = 'VTA-001'
ORDER BY dv.id_detalle_venta;

-- 7. Total de ventas por día o mes
-- Por día
SELECT 
    DATE(v.fecha_venta) AS fecha,
    COUNT(v.id_venta) AS num_ventas,
    SUM(v.subtotal) AS subtotal_dia,
    SUM(v.igv) AS igv_dia,
    SUM(v.total) AS monto_total_dia
FROM ventas v
WHERE v.estado = 'COMPLETADA'
GROUP BY DATE(v.fecha_venta)
ORDER BY fecha DESC;

-- Por mes
SELECT 
    TO_CHAR(v.fecha_venta, 'YYYY-MM') AS mes,
    COUNT(v.id_venta) AS num_ventas,
    SUM(v.total) AS monto_total_mes
FROM ventas v
WHERE v.estado = 'COMPLETADA'
GROUP BY TO_CHAR(v.fecha_venta, 'YYYY-MM')
ORDER BY mes DESC;

-- 8. Productos más vendidos
SELECT 
    p.codigo_producto,
    p.nombre AS producto,
    c.nombre_categoria AS categoria,
    m.nombre_marca AS marca,
    SUM(dv.cantidad) AS total_vendido,
    SUM(dv.subtotal) AS importe_total_vendido
FROM detalle_ventas dv
INNER JOIN productos p ON dv.id_producto = p.id_producto
INNER JOIN categorias c ON p.id_categoria = c.id_categoria
INNER JOIN marcas m ON p.id_marca = m.id_marca
INNER JOIN ventas v ON dv.id_venta = v.id_venta
WHERE v.estado = 'COMPLETADA'
GROUP BY p.codigo_producto, p.nombre, c.nombre_categoria, m.nombre_marca
ORDER BY total_vendido DESC;

-- 9. Ventas por empleado
SELECT 
    CONCAT(e.nombres, ' ', e.apellidos) AS empleado,
    e.cargo,
    COUNT(v.id_venta) AS num_ventas,
    SUM(v.total) AS monto_total_vendido
FROM ventas v
INNER JOIN empleados e ON v.id_empleado = e.id_empleado
WHERE v.estado = 'COMPLETADA'
GROUP BY e.id_empleado, e.nombres, e.apellidos, e.cargo
ORDER BY monto_total_vendido DESC;

-- 10. Compras por proveedor
SELECT 
    pr.razon_social AS proveedor,
    pr.ruc,
    COUNT(c.id_compra) AS num_compras,
    SUM(c.total) AS monto_total_comprado
FROM compras c
INNER JOIN proveedores pr ON c.id_proveedor = pr.id_proveedor
WHERE c.estado = 'COMPLETADA'
GROUP BY pr.id_proveedor, pr.razon_social, pr.ruc
ORDER BY monto_total_comprado DESC;

-- =====================================================
-- TRANSACCIÓN DE EJEMPLO: REGISTRAR VENTA CON DETALLES Y ACTUALIZAR INVENTARIO
-- =====================================================

-- Ejemplo de transacción segura para registrar una venta
-- Se utilizan BEGIN, COMMIT, ROLLBACK
-- Se valida stock con SELECT ... FOR UPDATE para evitar concurrencia
-- NOTA: Los valores mostrados son ejemplos. Ajustar según necesidad.

BEGIN;

-- 1. Verificar stock disponible con bloqueo (ejemplo para producto id_producto = 1)
SELECT id_producto, nombre, stock 
FROM productos 
WHERE id_producto = 1 
FOR UPDATE;

-- 2. Insertar cabecera de venta
INSERT INTO ventas (numero_venta, id_cliente, id_empleado, fecha_venta, subtotal, igv, total, estado, observaciones)
VALUES ('VTA-EX-001', 1, 2, CURRENT_TIMESTAMP, 2799.00, 503.82, 3302.82, 'COMPLETADA', 'Venta registrada por transacción');

-- 3. Insertar detalle de venta
INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_venta, subtotal)
VALUES ((SELECT id_venta FROM ventas WHERE numero_venta = 'VTA-EX-001'), 1, 1, 2799.00, 2799.00);

-- 4. Actualizar stock del producto (restar cantidad vendida)
UPDATE productos 
SET stock = stock - 1 
WHERE id_producto = 1 
  AND stock >= 1;

-- 5. Verificar si se puede hacer commit (validaciones adicionales)
-- Si existe stock suficiente, COMMIT. Si no, ROLLBACK.
COMMIT;

-- En caso de error o stock insuficiente, ejecutar: ROLLBACK;

-- =====================================================
-- FUNCIÓN ALMACENADA PARA REGISTRAR VENTA (PostgreSQL)
-- =====================================================

-- Función que registra una venta con sus detalles y actualiza inventario
-- de forma transaccional, con validación de stock y bloqueo
CREATE OR REPLACE FUNCTION registrar_venta(
    p_numero_venta VARCHAR(20),
    p_id_cliente INTEGER,
    p_id_empleado INTEGER,
    p_detalles JSON
) RETURNS INTEGER AS $$
DECLARE
    v_id_venta INTEGER;
    v_detalle JSON;
    v_id_producto INTEGER;
    v_cantidad INTEGER;
    v_precio_venta DECIMAL(10,2);
    v_stock_actual INTEGER;
    v_subtotal DECIMAL(10,2) := 0;
    v_total DECIMAL(10,2);
    v_igv DECIMAL(10,2);
BEGIN
    -- Validar que exist den detalles
        IF p_detalles IS NULL OR json_array_length(p_detalles) = 0 THEN
        RAISE EXCEPTION 'Debe ingresar al menos one detalle for the sale';
    END IF;

    -- Crear cabecera de venta
    INSERT INTO ventas (numero_venta, id_cliente, id_empleado, fecha_venta, subtotal, igv, total, estado)
    VALUES (p_numero_venta, p_id_cliente, p_id_empleado, CURRENT_TIMESTAMP, 0, 0, 0, 'COMPLETADA')
    RETURNING id_venta INTO v_id_venta;

    -- Procesar cada detalle
    FOR v_detalle IN SELECT * FROM json_array_elements(p_detalles)
    LOOP
        v_id_producto := (v_detalle->>'id_producto')::INTEGER;
        v_cantidad := (v_detalle->>'cantidad')::INTEGER;
        v_precio_venta := (v_detalle->>'precio_venta')::DECIMAL(10,2);

        -- Verificar stock con bloqueo
        SELECT stock INTO v_stock_actual
        FROM productos
        WHERE id_producto = v_id_producto
        FOR UPDATE;

        IF v_stock_actual IS NULL THEN
            RAISE EXCEPTION 'Producto with id % not found', v_id_producto;
        END IF;

        IF v_stock_actual < v_cantidad THEN
            RAISE EXCEPTION 'Stock insufficient for product %. Available: %, Requested: %', v_id_producto, v_stock_actual, v_cantidad;
        END IF;

        -- Insertar detalle
        INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_venta, subtotal)
        VALUES (v_id_venta, v_id_producto, v_cantidad, v_precio_venta, v_cantidad * v_precio_venta);

        -- Actualizar stock
        UPDATE productos
        SET stock = stock - v_cantidad
        WHERE id_producto = v_id_producto;

        v_subtotal := v_subtotal + (v_cantidad * v_precig_venta);
    END LOOP;

    -- Calcular totals
    v_igv := v_subtotal * 0.18;
    v_total := v_subtotal + v_igv;

    -- Actualizar cabecera
    UPDATE ventas
    SET subtotal = v_subtotal, igv = v_igv, total = v_total
    WHERE id_venta = v_id_venta;

    RETURN v_id_venta;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso de la función
-- SELECT registrar_venta('VTA-EX-002', 1, 2, '[{"id_producto": 1, "cantidad": 1, "precio_venta": 2799.00}]');
