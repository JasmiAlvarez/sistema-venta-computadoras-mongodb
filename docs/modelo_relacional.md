# Modelo Relacional (Documento Legado)

> **Nota:** este documento conserva el diseño relacional original del proyecto y se mantiene como referencia histórica. La base de datos principal del entregable es MongoDB. El modelado vigente se encuentra en `docs/modelo_mongodb.md`, `docs/diccionario_datos.md` y `docs/diagrama_er.mmd`.

## Notación Utilizada

- **PK** = Primary Key (Clave Primaria)
- **FK** = Foreign Key (Clave Foránea)
- **NN** = Not Null (No Nulo)
- **UQ** = Unique (Único)
- **CHK** = Check (Restricción de Validación)

## Esquema Relacional

### CATEGORIAS
```
CATEGORIAS(
  id_categoria: INTEGER PK NN,
  nombre_categoria: VARCHAR(50) NN UQ,
  descripcion: VARCHAR(255),
  fecha_creacion: TIMESTAMP NN DEFAULT CURRENT_TIMESTAMP
)
```

### MARCAS
```
MARCAS(
  id_marca: INTEGER PK NN,
  nombre_marca: VARCHAR(50) NN UQ,
  descripcion: VARCHAR(255),
  fecha_creacion: TIMESTAMP NN DEFAULT CURRENT_TIMESTAMP
)
```

### PROVEEDORES
```
PROVEEDORES(
  id_proveedor: INTEGER PK NN,
  razon_social: VARCHAR(150) NN,
  ruc: VARCHAR(11) NN UQ,
  telefono: VARCHAR(15),
  email: VARCHAR(100),
  direccion: VARCHAR(200),
  fecha_creacion: TIMESTAMP NN DEFAULT CURRENT_TIMESTAMP,
  estado: VARCHAR(10) NN DEFAULT 'ACTIVO' CHK(estado IN ('ACTIVO','INACTIVO'))
)
```

### PRODUCTOS
```
PRODUCTOS(
  id_producto: INTEGER PK NN,
  codigo_producto: VARCHAR(20) NN UQ,
  nombre: VARCHAR(150) NN,
  descripcion: VARCHAR(500),
  id_categoria: INTEGER NN FK -> CATEGORIAS(id_categoria),
  id_marca: INTEGER NN FK -> MARCAS(id_marca),
  id_proveedor: INTEGER FK -> PROVEEDORES(id_proveedor),
  precio_compra: DECIMAL(10,2) NN CHK(precio_compra >= 0),
  precio_venta: DECIMAL(10,2) NN CHK(precio_venta >= 0),
  stock: INTEGER NN DEFAULT 0 CHK(stock >= 0),
  stock_minimo: INTEGER NN DEFAULT 5 CHK(stock_minimo >= 0),
  fecha_creacion: TIMESTAMP NN DEFAULT CURRENT_TIMESTAMP,
  estado: VARCHAR(10) NN DEFAULT 'ACTIVO' CHK(estado IN ('ACTIVO','INACTIVO'))
)
```

### CLIENTES
```
CLIENTES(
  id_cliente: INTEGER PK NN,
  tipo_documento: VARCHAR(10) NN CHK(tipo_documento IN ('DNI','RUC','CE')),
  numero_documento: VARCHAR(15) NN UQ,
  nombres: VARCHAR(100) NN,
  apellidos: VARCHAR(100) NN,
  telefono: VARCHAR(15),
  email: VARCHAR(100),
  direccion: VARCHAR(200),
  fecha_creacion: TIMESTAMP NN DEFAULT CURRENT_TIMESTAMP,
  estado: VARCHAR(10) NN DEFAULT 'ACTIVO' CHK(estado IN ('ACTIVO','INACTIVO'))
)
```

### EMPLEADOS
```
EMPLEADOS(
  id_empleado: INTEGER PK NN,
  tipo_documento: VARCHAR(10) NN CHK(tipo_documento IN ('DNI','CE')),
  numero_documento: VARCHAR(15) NN UQ,
  nombres: VARCHAR(100) NN,
  apellidos: VARCHAR(100) NN,
  cargo: VARCHAR(50) NN,
  telefono: VARCHAR(15),
  email: VARCHAR(100),
  fecha_creacion: TIMESTAMP NN DEFAULT CURRENT_TIMESTAMP,
  estado: VARCHAR(10) NN DEFAULT 'ACTIVO' CHK(estado IN ('ACTIVO','INACTIVO'))
)
```

### COMPRAS
```
COMPRAS(
  id_compra: INTEGER PK NN,
  numero_compra: VARCHAR(20) NN UQ,
  id_proveedor: INTEGER NN FK -> PROVEEDORES(id_proveedor),
  id_empleado: INTEGER NN FK -> EMPLEADOS(id_empleado),
  fecha_compra: TIMESTAMP NN DEFAULT CURRENT_TIMESTAMP,
  subtotal: DECIMAL(10,2) NN CHK(subtotal >= 0),
  igv: DECIMAL(10,2) NN DEFAULT 0 CHK(igv >= 0),
  total: DECIMAL(10,2) NN CHK(total >= 0),
  estado: VARCHAR(10) NN DEFAULT 'COMPLETADA' CHK(estado IN ('COMPLETADA','ANULADA','PENDIENTE')),
  observaciones: VARCHAR(255)
)
```

### DETALLE_COMPRAS
```
DETALLE_COMPRAS(
  id_detalle_compra: INTEGER PK NN,
  id_compra: INTEGER NN FK -> COMPRAS(id_compra) ON DELETE RESTRICT,
  id_producto: INTEGER NN FK -> PRODUCTOS(id_producto) ON DELETE RESTRICT,
  cantidad: INTEGER NN CHK(cantidad > 0),
  precio_compra: DECIMAL(10,2) NN CHK(precio_compra >= 0),
  subtotal: DECIMAL(10,2) NN CHK(subtotal >= 0)
)
```

### VENTAS
```
VENTAS(
  id_venta: INTEGER PK NN,
  numero_venta: VARCHAR(20) NN UQ,
  id_cliente: INTEGER NN FK -> CLIENTES(id_cliente),
  id_empleado: INTEGER NN FK -> EMPLEADOS(id_empleado),
  fecha_venta: TIMESTAMP NN DEFAULT CURRENT_TIMESTAMP,
  subtotal: DECIMAL(10,2) NN CHK(subtotal >= 0),
  igv: DECIMAL(10,2) NN DEFAULT 0 CHK(igv >= 0),
  total: DECIMAL(10,2) NN CHK(total >= 0),
  estado: VARCHAR(10) NN DEFAULT 'COMPLETADA' CHK(estado IN ('COMPLETADA','ANULADA','PENDIENTE')),
  observaciones: VARCHAR(255)
)
```

### DETALLE_VENTAS
```
DETALLE_VENTAS(
  id_detalle_venta: INTEGER PK NN,
  id_venta: INTEGER NN FK -> VENTAS(id_venta) ON DELETE RESTRICT,
  id_producto: INTEGER NN FK -> PRODUCTOS(id_producto) ON DELETE RESTRICT,
  cantidad: INTEGER NN CHK(cantidad > 0),
  precio_venta: DECIMAL(10,2) NN CHK(precio_venta >= 0),
  subtotal: DECIMAL(10,2) NN CHK(subtotal >= 0)
)
```

### USUARIOS
```
USUARIOS(
  id_usuario: INTEGER PK NN,
  id_empleado: INTEGER FK -> EMPLEADOS(id_empleado) ON DELETE SET NULL,
  username: VARCHAR(50) NN UQ,
  password_hash: VARCHAR(255) NN,
  rol: VARCHAR(20) NN CHK(rol IN ('ADMIN','VENDEDOR','ALMACEN')),
  fecha_creacion: TIMESTAMP NN DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso: TIMESTAMP,
  estado: VARCHAR(10) NN DEFAULT 'ACTIVO' CHK(estado IN ('ACTIVO','INACTIVO'))
)
```

## Integridad Referencial

- Todas las claves foráneas mantienen integridad referencial.
- En `detalle_compras` y `detalle_ventas` se utiliza `ON DELETE RESTRICT` para evitar eliminar registros de ventas/compras con detalles.
- En `usuarios` se utiliza `ON DELETE SET NULL` dado que el usuario puede existir independientemente del empleado.
- Se aplican restricciones `CHECK` para validar rangos y valores permitidos.
- Se aplican restricciones `UNIQUE` para campos identificadores únicos.
- Se aplica `NOT NULL` en todos los campos esenciales.
