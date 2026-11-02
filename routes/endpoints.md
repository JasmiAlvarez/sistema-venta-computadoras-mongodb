# API REST Implementada - Sistema para Venta de Computadoras

API construida con Node.js, Express, Mongoose y MongoDB Atlas. Todas las rutas descritas en este documento están implementadas en el proyecto.

## Información general

- **Base URL local:** `http://localhost:3000`
- **Prefijo de la API:** `/api`
- **Formato:** JSON
- **Autenticación:** no implementada en este entregable.
- **Fechas:** se recomienda enviarlas en formato ISO `YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ss`.
- **Paginación:** parámetros `page` (por defecto 1) y `limit` (por defecto 20, máximo 100).

### Formato general de respuesta

```json
{
  "success": true,
  "total": 12,
  "page": 1,
  "limit": 20,
  "paginas": 1,
  "data": []
}
```

### Formato general de error

```json
{
  "success": false,
  "message": "Descripción del error",
  "details": "Detalle opcional"
}
```

### Códigos HTTP utilizados

| Código | Significado |
|---|---|
| 200 | Consulta o actualización exitosa. |
| 201 | Recurso creado. |
| 400 | Datos inválidos o identificador incorrecto. |
| 404 | Recurso o ruta no encontrada. |
| 409 | Conflicto: dato único duplicado, stock insuficiente o recurso relacionado. |
| 500 | Error interno del servidor. |

## Salud del servicio

### GET `/api/health`

```json
{
  "success": true,
  "estado": "OK",
  "mongodb": "conectado",
  "baseDeDatos": "venta_computadoras",
  "fecha": "2026-11-01T22:54:34.246Z",
  "uptimeSegundos": 3.1
}
```

## 1. Productos

### GET `/api/productos`

**Query params opcionales:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `categoria` | string | Filtra por categoría exacta. |
| `marca` | string | Filtra por marca sin distinguir mayúsculas. |
| `buscar` | string | Busca en código, nombre y descripción. |
| `stockBajo` | boolean | `true` para productos con `stock <= stockMinimo`. |
| `estado` | string | `ACTIVO` o `INACTIVO`. |
| `proveedor` | ObjectId | Filtra por proveedor. |
| `page` | number | Página. |
| `limit` | number | Tamaño de página. |

**Ejemplo:**

```http
GET /api/productos?categoria=Laptops&buscar=HP&page=1&limit=10
```

### GET `/api/productos/:id`

Obtiene un producto y popula el proveedor.

**Errores:** `400` si el ID no es válido, `404` si no existe.

### POST `/api/productos`

```json
{
  "codigo": "LP-ASUS-013",
  "nombre": "ASUS VivoBook 15 X515EA",
  "descripcion": "Laptop ASUS 15.6\" Intel Core i3, 8GB RAM, 256GB SSD",
  "categoria": "Laptops",
  "marca": "ASUS",
  "proveedor": "OBJECT_ID_DEL_PROVEEDOR",
  "especificaciones": {
    "procesador": "Intel Core i3-1115G4",
    "ram": "8 GB DDR4",
    "almacenamiento": "256 GB SSD",
    "tarjetaGrafica": "Intel UHD Graphics",
    "pantalla": "15.6\" Full HD",
    "sistemaOperativo": "Windows 11 Home"
  },
  "precioCompra": 1650,
  "precioVenta": 2099,
  "stock": 10,
  "stockMinimo": 5,
  "estado": "ACTIVO"
}
```

**Validaciones:** código único, categoría permitida, proveedor existente, precios no negativos, stock entero no negativo.

### PUT `/api/productos/:id`

Actualiza solo los campos enviados. Se validan igual que en la creación.

```json
{
  "precioVenta": 2199,
  "stockMinimo": 6
}
```

### DELETE `/api/productos/:id`

Elimina el producto si no tiene ventas asociadas. Si tiene ventas, responde `409`.

## 2. Clientes

### GET `/api/clientes`

**Query params opcionales:** `buscar`, `estado`, `ciudad`, `tipoDocumento`, `page`, `limit`.

### GET `/api/clientes/:id`

Obtiene un cliente.

### GET `/api/clientes/:id/ventas`

Devuelve las ventas del cliente, ordenadas por fecha descendente.

```json
{
  "success": true,
  "cliente": {
    "id": "68...",
    "nombreCompleto": "Juan Carlos Pérez García",
    "numeroDocumento": "12345678"
  },
  "total": 1,
  "data": []
}
```

### POST `/api/clientes`

```json
{
  "tipoDocumento": "DNI",
  "numeroDocumento": "56789012",
  "nombres": "Pedro Luis",
  "apellidos": "Sánchez Vargas",
  "email": "pedro.sanchez@example.com",
  "telefono": "943210987",
  "direccion": {
    "calle": "Av. Brasil 987",
    "ciudad": "Lima",
    "departamento": "Lima",
    "pais": "Perú"
  },
  "estado": "ACTIVO"
}
```

**Validaciones:** documento único, tipo de documento permitido, nombres y apellidos obligatorios, email válido.

### PUT `/api/clientes/:id`

Actualiza los campos enviados.

### DELETE `/api/clientes/:id`

Elimina el cliente si no tiene ventas. Si tiene ventas:

- Sin `?desactivar=true`: responde `409`.
- Con `?desactivar=true`: cambia el estado a `INACTIVO`.

## 3. Proveedores

### GET `/api/proveedores`

**Query params opcionales:** `buscar`, `estado`, `ciudad`, `page`, `limit`.

### GET `/api/proveedores/:id`

Obtiene el proveedor e incluye `totalProductos`.

### GET `/api/proveedores/:id/productos`

Devuelve los productos suministrados por el proveedor.

### POST `/api/proveedores`

```json
{
  "razonSocial": "TechSupply S.A.C.",
  "ruc": "20123456789",
  "contacto": {
    "nombre": "Carlos Mendoza",
    "telefono": "014567890",
    "email": "ventas@techsupply.com.pe"
  },
  "direccion": {
    "calle": "Av. Javier Prado Este 1250",
    "ciudad": "Lima",
    "departamento": "Lima",
    "pais": "Perú"
  },
  "estado": "ACTIVO"
}
```

**Validaciones:** RUC único de 11 dígitos, razón social obligatoria, email de contacto válido.

### PUT `/api/proveedores/:id`

Actualiza los campos enviados.

### DELETE `/api/proveedores/:id`

Elimina el proveedor si no tiene productos. Si tiene productos:

- Sin `?desactivar=true`: responde `409`.
- Con `?desactivar=true`: cambia el estado a `INACTIVO`.

## 4. Ventas

### GET `/api/ventas`

**Query params opcionales:** `fechaDesde`, `fechaHasta`, `cliente`, `estado`, `numero`, `page`, `limit`.

**Ejemplo:**

```http
GET /api/ventas?fechaDesde=2026-01-01&fechaHasta=2026-12-31&estado=COMPLETADA
```

La respuesta incluye el cliente populado con nombres, apellidos, documento y email.

### GET `/api/ventas/:id`

Devuelve la venta completa con el cliente y los productos de cada detalle populados.

### POST `/api/ventas`

Registra una venta dentro de una transacción. Calcula subtotales, IGV (18%) y total; valida y descuenta stock.

```json
{
  "cliente": "OBJECT_ID_DEL_CLIENTE",
  "vendedor": {
    "nombre": "Luis Fernando Castro Mendoza",
    "documento": "10234567",
    "cargo": "Vendedor"
  },
  "fechaVenta": "2026-11-01T10:30:00",
  "detalles": [
    {
      "producto": "OBJECT_ID_DEL_PRODUCTO",
      "cantidad": 2
    }
  ],
  "observaciones": "Venta al contado",
  "estado": "COMPLETADA"
}
```

**Campos opcionales del detalle:** `precioUnitario`. Si no se envía, se toma `precioVenta` del producto.

**Estados permitidos al crear:** `COMPLETADA` o `PENDIENTE`. No se puede crear una venta `ANULADA`.

**Errores relevantes:**

- `404`: cliente o producto no encontrado.
- `409`: cliente inactivo, producto inactivo o stock insuficiente.
- `400`: detalles vacíos, cantidades inválidas o vendedor ausente.

### PUT `/api/ventas/:id`

Permite actualizar `estado`, `observaciones`, `fechaVenta` y `vendedor`.

- Cambiar de `COMPLETADA`/`PENDIENTE` a `ANULADA` restituye el stock.
- Cambiar de `ANULADA` a `COMPLETADA` vuelve a descontar stock y valida existencias.
- No se permite modificar `detalles` directamente.

```json
{
  "estado": "ANULADA",
  "observaciones": "Anulada por solicitud del cliente"
}
```

### DELETE `/api/ventas/:id`

Elimina la venta y restituye el stock si la venta no estaba anulada.

## 5. Reportes

### GET `/api/reportes/ventas`

**Query params:** `fechaDesde`, `fechaHasta`, `cliente`, `estado`, `page`, `limit`.

Devuelve un resumen y el listado paginado.

```json
{
  "success": true,
  "resumen": {
    "totalVentas": 5,
    "subtotalTotal": 16994,
    "igvTotal": 3058.92,
    "totalGeneral": 20052.92,
    "promedioVenta": 4010.58
  },
  "page": 1,
  "limit": 20,
  "paginas": 1,
  "ventas": []
}
```

### GET `/api/reportes/productos-mas-vendidos`

**Query params:** `fechaDesde`, `fechaHasta`, `cliente`, `estado`, `limit`.

Agrupa por producto y devuelve cantidad vendida, ingresos, número de ventas y precio promedio. Por defecto solo considera ventas `COMPLETADA`.

### GET `/api/reportes/stock-critico`

Devuelve productos activos con `stock <= stockMinimo`, el faltante y el valor de reposición, junto con los datos del proveedor.

### GET `/api/reportes/ventas-por-categoria`

Devuelve unidades, ingresos y ticket promedio por categoría de producto.

### GET `/api/reportes/ventas-por-mes`

Devuelve la evolución mensual de ventas completadas.

### GET `/api/reportes/resumen`

Devuelve conteos de las cuatro colecciones, total vendido, distribución por estado y cantidad de productos en stock crítico.

## 6. Ejemplos con PowerShell

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/productos
Invoke-RestMethod http://localhost:3000/api/reportes/stock-critico

$venta = @{
  cliente = "OBJECT_ID_DEL_CLIENTE"
  vendedor = @{ nombre = "Vendedor de Prueba"; documento = "10000000"; cargo = "Vendedor" }
  detalles = @(@{ producto = "OBJECT_ID_DEL_PRODUCTO"; cantidad = 1 })
  observaciones = "Venta de prueba"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/ventas `
  -ContentType "application/json" -Body $venta
```

## 7. Orden de conceptos en la base de datos

Para probar las rutas con datos existentes:

1. Ejecute `npm run seed`.
2. Ejecute `npm start`.
3. Consulte `GET /api/clientes` y `GET /api/productos` para obtener los `_id`.
4. Use esos `_id` en `POST /api/ventas`.

Los detalles completos de los pipelines están en `docs/consultas_agregacion.md`.
