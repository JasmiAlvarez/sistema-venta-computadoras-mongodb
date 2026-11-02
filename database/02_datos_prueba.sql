-- =====================================================
-- SISTEMA PARA VENTA DE COMPUTADORAS
-- Script 02: Datos de Prueba (DML)
-- Gestor: PostgreSQL
-- =====================================================

-- IMPORTANTE: Ejecutar después de 01_creacion_tablas.sql
-- Respeta el orden de inserción por dependencias

-- =====================================================
-- DATOS MAESTROS
-- =====================================================

-- Categorías
INSERT INTO categorias (nombre_categoria, descripcion) VALUES
('Laptops', 'Computadoras portátiles'),
('Desktops', 'Computadoras de escritorio'),
('Componentes', 'Componentes de hardware'),
('Periféricos', 'Dispositivos periféricos'),
('Almacenamiento', 'Discos duros y unidades SSD'),
('Monitores', 'Pantallas y monitores');

-- Marcas
INSERT INTO marcas (nombre_marca, descripcion) VALUES
('HP', 'Hewlett-Packard'),
('Dell', 'Dell Technologies'),
('Lenovo', 'Lenovo Group'),
('ASUS', 'ASUSTeK Computer'),
('Acer', 'Acer Inc.'),
('Kingston', 'Kingston Technology'),
('Samsung', 'Samsung Electronics'),
('Logitech', 'Logitech International');

-- Proveedores
INSERT INTO proveedores (razon_social, ruc, telefono, email, direccion, estado) VALUES
('TechSupply S.A.C.', '20123456789', '014567890', 'ventas@techsupply.com', 'Av. Arequipa 1234, Lima', 'ACTIVO'),
('CompuImport E.I.R.L.', '20234567890', '015678901', 'contacto@compuimport.com', 'Jr. Cusco 567, Lima', 'ACTIVO'),
('Global Hardware S.A.C.', '20345678901', '016789012', 'ventas@globalhardware.com', 'Av. Brasil 890, Lima', 'ACTIVO');

-- Clientes
INSERT INTO clientes (tipo_documento, numero_documento, nombres, apellidos, telefono, email, direccion, estado) VALUES
('DNI', '12345678', 'Juan Carlos', 'Pérez García', '987654321', 'juan.perez@gmail.com', 'Av. Los Olivos 456, Lima', 'ACTIVO'),
('DNI', '23456789', 'María Elena', 'López Sánchez', '976543210', 'maria.lopez@gmail.com', 'Jr. San Martín 789, Lima', 'ACTIVO'),
('DNI', '34567890', 'Carlos Alberto', 'Ramírez Torres', '965432109', 'carlos.ramirez@gmail.com', 'Calle Las Flores 321, Lima', 'ACTIVO'),
('RUC', '20111222333', 'Empresa Soluciones Tech SAC', 'Representante Legal', '014445556', 'compras@solucionestech.com', 'Av. Industrial 654, Callao', 'ACTIVO'),
('DNI', '45678901', 'Ana Lucía', 'Mendoza Flores', '954321098', 'ana.mendoza@gmail.com', 'Av. Tacna 147, Lima', 'ACTIVO');

-- Empleados
INSERT INTO empleados (tipo_documento, numero_documento, nombres, apellidos, cargo, telefono, email, estado) VALUES
('DNI', '11111111', 'Roberto Carlos', 'Gonzales Vega', 'Jefe de Ventas', '998877665', 'roberto.gonzales@ventacomputadoras.com', 'ACTIVO'),
('DNI', '22222222', 'Luis Fernando', 'Castro Mendoza', 'Vendedor', '997766554', 'luis.castro@ventacomputadoras.com', 'ACTIVO'),
('DNI', '33333333', 'Patricia Isabel', 'Huamán Rojas', 'Vendedora', '996655443', 'patricia.huaman@ventacomputadoras.com', 'ACTIVO'),
('DNI', '44444444', 'Miguel Ángel', 'Torres Quispe', 'Almacenero', '995544332', 'miguel.torres@ventacomputadoras.com', 'ACTIVO');

-- Usuarios
INSERT INTO usuarios (id_empleado, username, password_hash, rol, estado) VALUES
(1, 'rgonzales', 'hash_ejemplo_123456', 'ADMIN', 'ACTIVO'),
(2, 'lcastro', 'hash_ejemplo_234567', 'VENDEDOR', 'ACTIVO'),
(3, 'phuaman', 'hash_ejemplo_345678', 'VENDEDOR', 'ACTIVO'),
(4, 'mtorres', 'hash_ejemplo_456789', 'ALMACEN', 'ACTIVO');

-- =====================================================
-- PRODUCTOS
-- =====================================================

INSERT INTO productos (codigo_producto, nombre, descripcion, id_categoria, id_marca, id_proveedor, precio_compra, precio_venta, stock, stock_minimo, estado) VALUES
('LP-HP-001', 'HP Pavilion 15-dy2050la', 'Laptop HP Pavilion 15.6" Intel Core i5, 8GB RAM, 256GB SSD', 1, 1, 1, 2200.00, 2799.00, 15, 5, 'ACTIVO'),
('LP-DELL-002', 'Dell Inspiron 14 5420', 'Laptop Dell Inspiron 14" Intel Core i7, 16GB RAM, 512GB SSD', 1, 2, 1, 3200.00, 3899.00, 10, 3, 'ACTIVO'),
('LP-LEN-003', 'Lenovo IdeaPad 3 15ITL6', 'Laptop Lenovo IdeaPad 15.6" Intel Core i5, 8GB RAM, 256GB SSD', 1, 3, 2, 2000.00, 2499.00, 12, 5, 'ACTIVO'),
('DT-HP-004', 'HP ProDesk 400 G7', 'Desktop HP ProDesk Intel Core i5, 8GB RAM, 1TB HDD', 2, 1, 1, 1800.00, 2299.00, 8, 3, 'ACTIVO'),
('DT-DELL-005', 'Dell OptiPlex 5090', 'Desktop Dell OptiPlex Intel Core i7, 16GB RAM, 512GB SSD', 2, 2, 1, 2800.00, 3399.00, 6, 2, 'ACTIVO'),
('CPU-AMD-006', 'Procesador AMD Ryzen 5 5600X', 'Procesador AMD Ryzen 5 6-Core 3.7GHz', 3, 4, 3, 650.00, 899.00, 25, 10, 'ACTIVO'),
('RAM-KNG-007', 'Memoria RAM Kingston 8GB DDR4 3200MHz', 'Memoria RAM Kingston Fury Beast 8GB DDR4', 3, 6, 3, 95.00, 149.00, 50, 20, 'ACTIVO'),
('SSD-SAM-008', 'Samsung 980 500GB NVMe SSD', 'Unidad SSD Samsung 980 NVMe PCIe 3.0 500GB', 5, 7, 3, 220.00, 329.00, 40, 15, 'ACTIVO'),
('MON-DELL-009', 'Monitor Dell 24" P2422H', 'Monitor Dell 24" IPS Full HD 1920x1080', 6, 2, 2, 750.00, 949.00, 18, 5, 'ACTIVO'),
('TEC-LOG-010', 'Teclado Logitech K380', 'Teclado inalámbrico Logitech K380 Multi-Device', 4, 8, 2, 95.00, 149.00, 35, 10, 'ACTIVO'),
('MOU-LOG-011', 'Mouse Logitech M185', 'Mouse inalámbrico Logitech M185', 4, 8, 2, 25.00, 49.00, 60, 20, 'ACTIVO'),
('AUD-LOG-012', 'Auriculares Logitech H390', 'Auriculares con micrófono Logitech H390 USB', 4, 8, 2, 95.00, 149.00, 28, 10, 'ACTIVO');

-- =====================================================
-- COMPRAS DE PRUEBA
-- =====================================================

INSERT INTO compras (numero_compra, id_proveedor, id_empleado, fecha_compra, subtotal, igv, total, estado, observaciones) VALUES
('COM-001', 1, 4, '2026-10-15 09:30:00', 8800.00, 1584.00, 10384.00, 'COMPLETADA', 'Compra de laptops HP y Dell'),
('COM-002', 3, 4, '2026-10-18 14:15:00', 3070.00, 552.60, 3622.60, 'COMPLETATA', 'Compra de componentes y almacenamiento'),
('COM-003', 2, 4, '2026-10-20 11:00:00', 1825.00, 328.50, 2153.50, 'COMPLETADA', 'Compra of periféricos y monitores');

-- Detalle de compras
INSERT INTO detalle_compras (id_compra, id_producto, cantidad, precio_compra, subtotal) VALUES
(1, 1, 10, 2200.00, 22000.00),
(1, 2, 5, 3200.00, 16000.00),
(2, 6, 15, 650.00, 9750.00),
(2, 7, 30, 95.00, 2850.00),
(2, 8, 25, 220.00, 5500.00),
(3, 9, 10, 750.00, 7500.00),
(3, 10, 20, 95.00, 1900.00),
(3, 11, 40, 25.00, 1000.00),
(3, 12, 15, 95.00, 1425.00);

-- =====================================================
-- VENTAS DE PRUEBA
-- =====================================================

INSERT INTO ventas (numero_venta, id_cliente, id_empleado, fecha_venta, subtotal, igv, total, estado, observaciones) VALUES
('VTA-001', 1, 2, '2026-10-16 10:45:00', 2799.00, 503.82, 3302.82, 'COMPLETADA', 'Venta de laptop HP'),
('VTA-002', 2, 3, '2026-10-17 15:30:00', 3899.00, 561.82, 4460.82, 'COMPLETADA', 'Venta de laptop Dell'),
('VTA-003', 3, 2, '2026-10-19 12:20:00', 1578.00, 284.04, 1862.04, 'COMPLETADA', 'Venta de periféricos'),
('VTA-004', 4, 3, '2026-10-21 09:15:00', 5398.00, 971.64, 6369.64, 'COMPLETADA', 'Venta corporativa'),
('VTA-005', 5, 2, '2026-10-22 16:10:00', 2299.00, 373.83, 2672.83, 'COMPLETADA', 'Venta de desktop HP');

-- Detalle de ventas
INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_venta, subtotal) VALUES
(1, 1, 1, 2799.00, 2799.00),
(2, 2, 1, 3899.00, 3899.00),
(3, 10, 2, 149.00, 298.00),
(3, 11, 4, 49.00, 196.00),
(3, 12, 2, 149.00, 298.00),
(3, 7, 4, 149.00, 596.00),
(4, 1, 1, 2799.00, 2799.00),
(4, 2, 1, 3899.00, 3899.00),
(5, 4, 1, 2299.00, 2299.00);
