# Diccionario de Datos - MongoDB

Base de datos: `venta_computadoras`  
ODM: Mongoose 9.11.4  
Convención: los campos `createdAt` y `updatedAt` son generados automáticamente por `timestamps: true`.

## 1. Colección `productos`

| Campo | Tipo BSON | Obligatorio | Restricciones | Descripción |
|---|---|---|---|---|
| `_id` | ObjectId | Sí | Generado por MongoDB | Clave primaria del producto. |
| `codigo` | String | Sí | Único, máximo 20, mayúsculas | Código interno del producto. |
| `nombre` | String | Sí | Máximo 150 | Nombre comercial. |
| `descripcion` | String | No | Máximo 500 | Descripción detallada. |
| `categoria` | String | Sí | Enum de categorías | Categoría del producto. |
| `marca` | String | Sí | Texto | Marca del producto. |
| `proveedor` | ObjectId | Sí | Referencia a `proveedores._id` | Proveedor principal. |
| `especificaciones` | Objeto | No | Documento embebido | Características técnicas. |
| `precioCompra` | Number | Sí | >= 0 | Precio de compra. |
| `precioVenta` | Number | Sí | >= 0 | Precio de venta. |
| `stock` | Number | No | Entero >= 0, por defecto 0 | Unidades disponibles. |
| `stockMinimo` | Number | No | Entero >= 0, por defecto 5 | Umbral de reposición. |
| `estado` | String | No | `ACTIVO` o `INACTIVO` | Estado lógico. |
| `createdAt` | Date | Sí | Automático | Fecha de creación. |
| `updatedAt` | Date | Sí | Automático | Fecha de actualización. |

Categorías permitidas: `Laptops`, `Desktops`, `Monitores`, `Periféricos`, `Componentes`, `Almacenamiento`, `Redes`, `Impresoras`, `Accesorios`.

### 1.1 Documento embebido `especificaciones`

| Campo | Tipo | Descripción |
|---|---|---|
| `procesador` | String | Procesador. |
| `ram` | String | Memoria RAM. |
| `almacenamiento` | String | Disco/almacenamiento. |
| `tarjetaGrafica` | String | Tarjeta gráfica. |
| `pantalla` | String | Pantalla. |
| `sistemaOperativo` | String | Sistema operativo. |

### 1.2 Índices de `productos`

| Nombre | Campos | Tipo |
|---|---|---|
| `codigo_1` | `codigo` | Único |
| `idx_productos_texto` | `nombre`, `descripcion` | Texto |
| `idx_productos_categoria_marca` | `categoria`, `marca` | Compuesto |
| `idx_productos_estado_stock` | `estado`, `stock` | Compuesto |
| `idx_productos_proveedor` | `proveedor` | Simple |
| `idx_productos_precio_venta` | `precioVenta` | Simple |

## 2. Colección `clientes`

| Campo | Tipo BSON | Obligatorio | Restricciones | Descripción |
|---|---|---|---|---|
| `_id` | ObjectId | Sí | Generado por MongoDB | Clave primaria del cliente. |
| `tipoDocumento` | String | Sí | `DNI`, `RUC`, `CE` | Tipo de documento. |
| `numeroDocumento` | String | Sí | Único, máximo 15 | Número de documento. |
| `nombres` | String | Sí | Máximo 100 | Nombres o razón social. |
| `apellidos` | String | Sí | Máximo 100 | Apellidos o complemento. |
| `email` | String | Sí | Formato de correo, minúsculas | Correo electrónico. |
| `telefono` | String | No | Máximo 15 | Teléfono. |
| `direccion` | Objeto | No | Documento embebido | Dirección del cliente. |
| `estado` | String | No | `ACTIVO` o `INACTIVO` | Estado lógico. |
| `createdAt` | Date | Sí | Automático | Fecha de creación. |
| `updatedAt` | Date | Sí | Automático | Fecha de actualización. |

Virtual: `nombreCompleto` = `nombres` + `apellidos`.

### 2.1 Documento embebido `direccion`

| Campo | Tipo | Descripción |
|---|---|---|
| `calle` | String | Calle o avenida. |
| `ciudad` | String | Ciudad. |
| `departamento` | String | Departamento/región. |
| `pais` | String | País, por defecto `Perú`. |

### 2.2 Índices de `clientes`

| Nombre | Campos | Tipo |
|---|---|---|
| `numeroDocumento_1` | `numeroDocumento` | Único |
| `idx_clientes_nombres` | `apellidos`, `nombres` | Compuesto |
| `idx_clientes_email` | `email` | Simple |
| `idx_clientes_estado` | `estado` | Simple |
| `idx_clientes_ciudad` | `direccion.ciudad` | Simple |

## 3. Colección `proveedores`

| Campo | Tipo BSON | Obligatorio | Restricciones | Descripción |
|---|---|---|---|---|
| `_id` | ObjectId | Sí | Generado por MongoDB | Clave primaria del proveedor. |
| `razonSocial` | String | Sí | Máximo 150 | Razón social. |
| `ruc` | String | Sí | Único, 11 dígitos | RUC del proveedor. |
| `contacto` | Objeto | No | Documento embebido | Datos de contacto. |
| `direccion` | Objeto | No | Documento embebido | Dirección fiscal/comercial. |
| `estado` | String | No | `ACTIVO` o `INACTIVO` | Estado lógico. |
| `createdAt` | Date | Sí | Automático | Fecha de creación. |
| `updatedAt` | Date | Sí | Automático | Fecha de actualización. |

### 3.1 Documento embebido `contacto`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | String | Persona de contacto. |
| `telefono` | String | Teléfono de contacto. |
| `email` | String | Correo de contacto. |

### 3.2 Documento embebido `direccion`

| Campo | Tipo | Descripción |
|---|---|---|
| `calle` | String | Calle o avenida. |
| `ciudad` | String | Ciudad. |
| `departamento` | String | Departamento/región. |
| `pais` | String | País, por defecto `Perú`. |

### 3.3 Índices de `proveedores`

| Nombre | Campos | Tipo |
|---|---|---|
| `ruc_1` | `ruc` | Único |
| `idx_proveedores_razon_social` | `razonSocial` | Texto |
| `idx_proveedores_estado` | `estado` | Simple |
| `idx_proveedores_ciudad` | `direccion.ciudad` | Simple |

## 4. Colección `ventas`

| Campo | Tipo BSON | Obligatorio | Restricciones | Descripción |
|---|---|---|---|---|
| `_id` | ObjectId | Sí | Generado por MongoDB | Clave primaria de la venta. |
| `numeroVenta` | String | Sí | Único | Número correlativo de venta. |
| `cliente` | ObjectId | Sí | Referencia a `clientes._id` | Cliente que compra. |
| `vendedor` | Objeto | Sí | Documento embebido | Datos del vendedor. |
| `fechaVenta` | Date | No | Por defecto fecha actual | Fecha de la venta. |
| `detalles` | Array | Sí | Mínimo 1 elemento | Líneas de la venta. |
| `subtotal` | Number | Sí | >= 0 | Suma de subtotales. |
| `igv` | Number | Sí | >= 0 | IGV calculado al 18%. |
| `total` | Number | Sí | >= 0 | Subtotal + IGV. |
| `estado` | String | No | `COMPLETADA`, `ANULADA`, `PENDIENTE` | Estado de la venta. |
| `observaciones` | String | No | Máximo 255 | Observaciones. |
| `createdAt` | Date | Sí | Automático | Fecha de creación. |
| `updatedAt` | Date | Sí | Automático | Fecha de actualización. |

Virtual: `cantidadItems` = suma de `detalles[].cantidad`.

### 4.1 Documento embebido `vendedor`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | String | Nombre del vendedor. |
| `documento` | String | Documento de identidad. |
| `cargo` | String | Cargo, por defecto `Vendedor`. |

### 4.2 Documento embebido `detalles[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `producto` | ObjectId | Referencia a `productos._id`. |
| `codigoProducto` | String | Código del producto al momento de la venta. |
| `nombreProducto` | String | Nombre del producto al momento de la venta. |
| `cantidad` | Number | Entero mayor a cero. |
| `precioUnitario` | Number | Precio aplicado. |
| `subtotal` | Number | `cantidad * precioUnitario`. |

### 4.3 Índices de `ventas`

| Nombre | Campos | Tipo |
|---|---|---|
| `numeroVenta_1` | `numeroVenta` | Único |
| `idx_ventas_cliente_fecha` | `cliente`, `fechaVenta` | Compuesto |
| `idx_ventas_fecha` | `fechaVenta` | Simple descendente |
| `idx_ventas_estado` | `estado` | Simple |
| `idx_ventas_producto` | `detalles.producto` | Simple |
| `idx_ventas_total` | `total` | Simple descendente |

## 5. Relaciones

| Referencia | Destino | Descripción |
|---|---|---|
| `productos.proveedor` | `proveedores._id` | Proveedor principal del producto. |
| `ventas.cliente` | `clientes._id` | Cliente de la venta. |
| `ventas.detalles[].producto` | `productos._id` | Producto vendido en cada línea. |

## 6. Reglas de integridad

- No se puede eliminar un producto que aparezca en `ventas.detalles.producto`.
- No se puede eliminar un cliente con ventas; puede desactivarse con `DELETE /api/clientes/:id?desactivar=true`.
- No se puede eliminar un proveedor con productos; puede desactivarse con `DELETE /api/proveedores/:id?desactivar=true`.
- El stock no puede quedar negativo.
- Una venta no se crea si no hay stock suficiente.
- Al anular una venta se restituye el stock de sus detalles.
- Los detalles de una venta no se editan directamente; se anula y se registra una nueva venta.
