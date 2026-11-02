-- =====================================================
-- SISTEMA PARA VENTA DE COMPUTADORAS
-- Script 01: Creación de Tablas (DDL)
-- Gestor: PostgreSQL
-- =====================================================

-- IMPORTANTE: 
-- CREATE DATABASE debe ejecutarse FUERA de una transacción.
-- Conéctese a PostgreSQL como superusuario y ejecute primero:
-- 
-- CREATE DATABASE venta_computadoras
--     WITH ENCODING = 'UTF8'
--     LC_COLLATE = 'es_ES.UTF-8'
--     LC_CTYPE = 'es_ES.UTF-8';
--
-- Luego conéctese a la base de datos venta_computadoras y ejecute este script.

-- Eliminar tablas si existen (en orden inverso por dependencias)
DROP TABLE IF EXISTS detalle_ventas CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS detalle_compras CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS marcas CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

-- =====================================================
-- CREACIÓN DE TABLAS MAESTRAS
-- =====================================================

-- Tabla: categorias
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: marcas
CREATE TABLE marcas (
    id_marca SERIAL PRIMARY KEY,
    nombre_marca VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: proveedores
CREATE TABLE proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    ruc VARCHAR(11) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion VARCHAR(200),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT chk_proveedores_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- Tabla: clientes
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    tipo_documento VARCHAR(10) NOT NULL,
    numero_documento VARCHAR(15) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion VARCHAR(200),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT chk_clientes_tipo_doc CHECK (tipo_documento IN ('DNI', 'RUC', 'CE')),
    CONSTRAINT chk_clientes_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- Tabla: empleados
CREATE TABLE empleados (
    id_empleado SERIAL PRIMARY KEY,
    tipo_documento VARCHAR(10) NOT NULL,
    numero_documento VARCHAR(15) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    telefono VARCHAR(15),
    email VARCHAR(100),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT chk_empleados_tipo_doc CHECK (tipo_documento IN ('DNI', 'CE')),
    CONSTRAINT chk_empleados_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- =====================================================
-- CREACIÓN DE TABLAS TRANSACCIONALES
-- =====================================================

-- Tabla: productos
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    codigo_producto VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500),
    id_categoria INTEGER NOT NULL,
    id_marca INTEGER NOT NULL,
    id_proveedor INTEGER,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_productos_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    CONSTRAINT fk_productos_marca FOREIGN KEY (id_marca) REFERENCES marcas(id_marca),
    CONSTRAINT fk_productos_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    CONSTRAINT chk_productos_precio_compra CHECK (precio_compra >= 0),
    CONSTRAINT chk_productos_precio_venta CHECK (precio_venta >= 0),
    CONSTRAINT chk_productos_stock CHECK (stock >= 0),
    CONSTRAINT chk_productos_stock_minimo CHECK (stock_minimo >= 0),
    CONSTRAINT chk_productos_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- Tabla: compras
CREATE TABLE compras (
    id_compra SERIAL PRIMARY KEY,
    numero_compra VARCHAR(20) NOT NULL UNIQUE,
    id_proveedor INTEGER NOT NULL,
    id_empleado INTEGER NOT NULL,
    fecha_compra TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(10) NOT NULL DEFAULT 'COMPLETADA',
    observaciones VARCHAR(255),
    CONSTRAINT fk_compras_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    CONSTRAINT fk_compras_empleado FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado),
    CONSTRAINT chk_compras_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_compras_igv CHECK (igv >= 0),
    CONSTRAINT chk_compras_total CHECK (total >= 0),
    CONSTRAINT chk_compras_estado CHECK (estado IN ('COMPLETADA', 'ANULADA', 'PENDIENTE'))
);

-- Tabla: detalle_compras
CREATE TABLE detalle_compras (
    id_detalle_compra SERIAL PRIMARY KEY,
    id_compra INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detalle_compras_compra FOREIGN KEY (id_compra) REFERENCES compras(id_compra) ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_compras_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_compras_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_compras_precio CHECK (precio_compra >= 0),
    CONSTRAINT chk_detalle_compras_subtotal CHECK (subtotal >= 0)
);

-- Tabla: ventas
CREATE TABLE ventas (
    id_venta SERIAL PRIMARY KEY,
    numero_venta VARCHAR(20) NOT NULL UNIQUE,
    id_cliente INTEGER NOT NULL,
    id_empleado INTEGER NOT NULL,
    fecha_venta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(10) NOT NULL DEFAULT 'COMPLETADA',
    observaciones VARCHAR(255),
    CONSTRAINT fk_ventas_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    CONSTRAINT fk_ventas_empleado FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado),
    CONSTRAINT chk_ventas_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_ventas_igv CHECK (igv >= 0),
    CONSTRAINT chk_ventas_total CHECK (total >= 0),
    CONSTRAINT chk_ventas_estado CHECK (estado IN ('COMPLETADA', 'ANULADA', 'PENDIENTE'))
);

-- Tabla: detalle_ventas
CREATE TABLE detalle_ventas (
    id_detalle_venta SERIAL PRIMARY KEY,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detalle_ventas_venta FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_ventas_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_ventas_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_ventas_precio CHECK (precio_venta >= 0),
    CONSTRAINT chk_detalle_ventas_subtotal CHECK (subtotal >= 0)
);

-- Tabla: usuarios
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_empleado INTEGER,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_usuarios_empleado FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado) ON DELETE SET NULL,
    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('ADMIN', 'VENDEDOR', 'ALMACEN')),
    CONSTRAINT chk_usuarios_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- =====================================================
-- CREACIÓN DE ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX idx_productos_categoria ON productos(id_categoria);
CREATE INDEX idx_productos_marca ON productos(id_marca);
CREATE INDEX idx_productos_proveedor ON productos(id_proveedor);
CREATE INDEX idx_productos_codigo ON productos(codigo_producto);
CREATE INDEX idx_ventas_cliente ON ventas(id_cliente);
CREATE INDEX idx_ventas_empleado ON ventas(id_empleado);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_compras_proveedor ON compras(id_proveedor);
CREATE INDEX idx_compras_empleado ON compras(id_empleado);
CREATE INDEX idx_compras_fecha ON compras(fecha_compra);
CREATE INDEX idx_detalle_ventas_venta ON detalle_ventas(id_venta);
CREATE INDEX idx_detalle_ventas_producto ON detalle_ventas(id_producto);
CREATE INDEX idx_detalle_compras_compra ON detalle_compras(id_compra);
CREATE INDEX idx_detalle_compras_producto ON detalle_compras(id_producto);
