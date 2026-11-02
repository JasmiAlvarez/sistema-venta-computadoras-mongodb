# Modelo de Datos MongoDB - Sistema para Venta de Computadoras

## 1. Base de datos

- **Motor:** MongoDB Atlas
- **Nombre lógico de la base de datos:** `venta_computadoras`
- **Driver/ODM:** Mongoose 9.11.4
- **Colecciones principales:** `productos`, `clientes`, `proveedores`, `ventas`

## 2. Decisiones de modelado

MongoDB es una base de datos documental. Por ello, el diseño no replica el esquema relacional original, sino que aplica dos estrategias:

### 2.1 Referencias con `ObjectId`

Se utilizan referencias cuando el dato representa una entidad independiente que se consulta, actualiza o reutiliza por separado:

| Documento origen | Campo | Colección destino | Cardinalidad |
|---|---|---|---|
| `productos` | `proveedor` | `proveedores` | N productos -> 1 proveedor |
| `ventas` | `cliente` | `clientes` | N ventas -> 1 cliente |
| `ventas` | `detalles[].producto` | `productos` | N ventas -> N productos |

Estas referencias permiten usar `$lookup` en las consultas de agregación.

### 2.2 Documentos embebidos

Se embeben datos que pertenecen al documento principal y que normalmente se consultan junto con él:

| Colección | Documento embebido | Motivo |
|---|---|---|
| `productos` | `especificaciones` | Las especificaciones solo tienen sentido dentro del producto. |
| `clientes` | `direccion` | La dirección es un atributo del cliente. |
| `proveedores` | `contacto` y `direccion` | Datos de contacto propios del proveedor. |
| `ventas` | `vendedor` | Instantánea del vendedor al momento de la venta. |
| `ventas` | `detalles[]` | Líneas de la venta; se leen siempre con la venta. |

### 2.3 Datos históricos

Cada detalle de venta almacena `codigoProducto`, `nombreProducto` y `precioUnitario`. Esto evita que una modificación futura del producto altere los totales de ventas pasadas. El campo `producto` conserva la referencia al documento actual del producto.

## 3. Colección `productos`

**Nombre físico:** `productos`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `_id` | ObjectId | Sí | Identificador generado por MongoDB. |
| `codigo` | String | Sí | Código único del producto. Se guarda en mayúsculas. |
| `nombre` | String | Sí | Nombre comercial. |
| `descripcion` | String | No | Descripción del producto. |
| `categoria` | String | Sí | Categoría validada por enumeración. |
| `marca` | String | Sí | Marca del producto. |
| `proveedor` | ObjectId | Sí | Referencia a `proveedores._id`. |
| `especificaciones` | Documento embebido | No | Procesador, RAM, almacenamiento, GPU, pantalla y SO. |
| `precioCompra` | Number | Sí | Precio de compra, mayor o igual a 0. |
| `precioVenta` | Number | Sí | Precio de venta, mayor o igual a 0. |
| `stock` | Number | No | Stock actual, entero mayor o igual a 0. Por defecto 0. |
| `stockMinimo` | Number | No | Umbral de stock crítico. Por defecto 5. |
| `estado` | String | No | `ACTIVO` o `INACTIVO`. Por defecto `ACTIVO`. |
| `createdAt` | Date | Sí | Generado por `timestamps`. |
| `updatedAt` | Date | Sí | Generado por `timestamps`. |

### Documento embebido `especificaciones`

| Campo | Tipo | Descripción |
|---|---|---|
| `procesador` | String | Procesador o indicación "No aplica". |
| `ram` | String | Memoria RAM. |
| `almacenamiento` | String | Disco o almacenamiento. |
| `tarjetaGrafica` | String | GPU. |
| `pantalla` | String | Características de pantalla. |
| `sistemaOperativo` | String | Sistema operativo. |

### Índices de `productos`

| Índice | Tipo | Uso |
|---|---|---|
| `codigo` | Único | Evitar códigos duplicados y acelerar búsquedas. |
| `idx_productos_texto` | Texto (`nombre`, `descripcion`) | Búsquedas textuales. |
| `idx_productos_categoria_marca` | Compuesto | Filtros por categoría y marca. |
| `idx_productos_estado_stock` | Compuesto | Productos activos y control de stock. |
| `idx_productos_proveedor` | Simple | Productos por proveedor. |
| `idx_productos_precio_venta` | Simple | Ordenamientos y filtros por precio. |

## 4. Colección `clientes`

**Nombre físico:** `clientes`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `_id` | ObjectId | Sí | Identificador del cliente. |
| `tipoDocumento` | String | Sí | `DNI`, `RUC` o `CE`. |
| `numeroDocumento` | String | Sí | Documento único. |
| `nombres` | String | Sí | Nombres o razón social. |
| `apellidos` | String | Sí | Apellidos o complemento de razón social. |
| `email` | String | Sí | Correo validado y almacenado en minúsculas. |
| `telefono` | String | No | Teléfono de contacto. |
| `direccion` | Documento embebido | No | Calle, ciudad, departamento y país. |
| `estado` | String | No | `ACTIVO` o `INACTIVO`. |
| `createdAt` | Date | Sí | Fecha de creación. |
| `updatedAt` | Date | Sí | Fecha de actualización. |

El modelo expone el virtual `nombreCompleto`, que concatena nombres y apellidos.

### Documento embebido `direccion`

| Campo | Tipo | Descripción |
|---|---|---|
| `calle` | String | Dirección o calle. |
| `ciudad` | String | Ciudad. |
| `departamento` | String | Departamento o región. |
| `pais` | String | País; por defecto `Perú`. |

### Índices de `clientes`

| Índice | Tipo | Uso |
|---|---|---|
| `numeroDocumento` | Único | Evitar documentos duplicados. |
| `idx_clientes_nombres` | Compuesto (`apellidos`, `nombres`) | Búsquedas y orden por nombre. |
| `idx_clientes_email` | Simple | Búsqueda por correo. |
| `idx_clientes_estado` | Simple | Filtro por estado. |
| `idx_clientes_ciudad` | Simple (`direccion.ciudad`) | Filtro por ciudad. |

## 5. Colección `proveedores`

**Nombre físico:** `proveedores`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `_id` | ObjectId | Sí | Identificador del proveedor. |
| `razonSocial` | String | Sí | Razón social. |
| `ruc` | String | Sí | RUC único de 11 dígitos. |
| `contacto` | Documento embebido | No | Nombre, teléfono y email de contacto. |
| `direccion` | Documento embebido | No | Calle, ciudad, departamento y país. |
| `estado` | String | No | `ACTIVO` o `INACTIVO`. |
| `createdAt` | Date | Sí | Fecha de creación. |
| `updatedAt` | Date | Sí | Fecha de actualización. |

### Documento embebido `contacto`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | String | Persona de contacto. |
| `telefono` | String | Teléfono. |
| `email` | String | Correo validado. |

### Índices de `proveedores`

| Índice | Tipo | Uso |
|---|---|---|
| `ruc` | Único | Evitar RUC duplicados. |
| `idx_proveedores_razon_social` | Texto | Búsqueda por razón social. |
| `idx_proveedores_estado` | Simple | Filtro por estado. |
| `idx_proveedores_ciudad` | Simple (`direccion.ciudad`) | Filtro por ciudad. |

## 6. Colección `ventas`

**Nombre físico:** `ventas`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `_id` | ObjectId | Sí | Identificador de la venta. |
| `numeroVenta` | String | Sí | Número único de venta. |
| `cliente` | ObjectId | Sí | Referencia a `clientes._id`. |
| `vendedor` | Documento embebido | Sí | Nombre, documento y cargo del vendedor. |
| `fechaVenta` | Date | No | Fecha de la venta; por defecto la fecha actual. |
| `detalles` | Array embebido | Sí | Al menos un detalle de venta. |
| `subtotal` | Number | Sí | Suma de subtotales de los detalles. |
| `igv` | Number | Sí | 18% del subtotal. |
| `total` | Number | Sí | Subtotal + IGV. |
| `estado` | String | No | `COMPLETADA`, `ANULADA` o `PENDIENTE`. |
| `observaciones` | String | No | Observaciones de la venta. |
| `createdAt` | Date | Sí | Fecha de creación. |
| `updatedAt` | Date | Sí | Fecha de actualización. |

El modelo expone el virtual `cantidadItems`, que suma las cantidades de todos los detalles.

### Documento embebido `vendedor`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | String | Nombre del vendedor. |
| `documento` | String | Documento de identidad. |
| `cargo` | String | Cargo; por defecto `Vendedor`. |

### Documento embebido `detalles[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `producto` | ObjectId | Referencia a `productos._id`. |
| `codigoProducto` | String | Código del producto al momento de la venta. |
| `nombreProducto` | String | Nombre del producto al momento de la venta. |
| `cantidad` | Number | Entero mayor a cero. |
| `precioUnitario` | Number | Precio aplicado en la venta. |
| `subtotal` | Number | `cantidad * precioUnitario`. |

### Índices de `ventas`

| Índice | Tipo | Uso |
|---|---|---|
| `numeroVenta` | Único | Evitar números de venta duplicados. |
| `idx_ventas_cliente_fecha` | Compuesto | Ventas por cliente ordenadas por fecha. |
| `idx_ventas_fecha` | Simple descendente | Reportes por rango de fechas. |
| `idx_ventas_estado` | Simple | Filtro por estado. |
| `idx_ventas_producto` | Simple (`detalles.producto`) | Ventas que incluyen un producto. |
| `idx_ventas_total` | Simple descendente | Ranking por importe. |

## 7. Relaciones del modelo

```text
proveedores._id  <--- productos.proveedor
clientes._id     <--- ventas.cliente
productos._id    <--- ventas.detalles[].producto
```

- Un proveedor puede suministrar muchos productos.
- Un cliente puede tener muchas ventas.
- Una venta pertenece a un cliente.
- Una venta contiene uno o más detalles.
- Cada detalle referencia un producto y conserva una instantánea de sus datos.

## 8. Validaciones principales

- Códigos de producto, números de documento, RUC y números de venta son únicos.
- Los precios, el stock y las cantidades no pueden ser negativos.
- Las cantidades de venta deben ser enteras y mayores a cero.
- Una venta debe tener al menos un detalle.
- Los estados y categorías se validan con enumeraciones.
- Los correos electrónicos se validan con expresión regular.
- Al registrar una venta se valida que el cliente esté activo, que el producto exista, que esté activo y que haya stock suficiente.
- El stock se descuenta en la misma transacción que crea la venta.
- Al anular una venta se restituye el stock.
- No se elimina un producto con ventas asociadas ni un cliente o proveedor con documentos relacionados.

## 9. Equivalencia con el diseño relacional anterior

| Diseño relacional legado | Implementación MongoDB |
|---|---|
| Tabla `productos` | Colección `productos` |
| Tabla `clientes` | Colección `clientes` |
| Tabla `proveedores` | Colección `proveedores` |
| Tabla `ventas` | Colección `ventas` |
| Tabla `detalle_ventas` | Array embebido `ventas.detalles` |
| Tabla `empleados` | Documento embebido `ventas.vendedor` |
| Tabla `categorias` y `marcas` | Campos `categoria` y `marca` en `productos` |
| Tabla `compras` | Fuera del alcance de este entregable |
