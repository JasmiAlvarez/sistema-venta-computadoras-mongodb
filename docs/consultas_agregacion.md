# Consultas de Agregación y Reportes

Las consultas se implementan con el método `aggregate()` de Mongoose en `controllers/reportesController.js`.

## 1. Operadores utilizados

| Operador | Uso en el proyecto |
|---|---|
| `$match` | Filtrar ventas por estado, cliente y rango de fechas; filtrar productos activos. |
| `$lookup` | Unir `ventas` con `clientes`, `ventas` con `productos` y `productos` con `proveedores`. |
| `$unwind` | Separar `ventas.detalles` para analizar cada producto vendido; convertir arrays de `$lookup` en objetos. |
| `$group` | Agrupar por producto, categoría, mes o estado; sumar cantidades e ingresos. |
| `$project` | Seleccionar y transformar campos de salida. |
| `$facet` | Obtener resumen y listado paginado en una sola consulta. |
| `$sort` | Ordenar por fecha, cantidad vendida, ingresos o stock. |
| `$addFields` | Calcular el faltante de stock. |
| `$round` | Redondear montos a dos decimales. |

## 2. Reporte de ventas

**Endpoint:** `GET /api/reportes/ventas`

**Filtros:** `fechaDesde`, `fechaHasta`, `cliente`, `estado`, `page`, `limit`.

**Pipeline:**

```js
[
  { $match: match },
  {
    $lookup: {
      from: 'clientes',
      localField: 'cliente',
      foreignField: '_id',
      as: 'clienteDoc',
    },
  },
  { $unwind: { path: '$clienteDoc', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      numeroVenta: 1,
      fechaVenta: 1,
      estado: 1,
      subtotal: 1,
      igv: 1,
      total: 1,
      cantidadProductos: { $sum: '$detalles.cantidad' },
      vendedor: '$vendedor.nombre',
      cliente: {
        $trim: {
          input: {
            $concat: [
              { $ifNull: ['$clienteDoc.nombres', 'Cliente'] },
              ' ',
              { $ifNull: ['$clienteDoc.apellidos', 'eliminado'] },
            ],
          },
        },
      },
      documentoCliente: { $ifNull: ['$clienteDoc.numeroDocumento', 'N/D'] },
      emailCliente: { $ifNull: ['$clienteDoc.email', 'N/D'] },
    },
  },
  {
    $facet: {
      resumen: [
        {
          $group: {
            _id: null,
            totalVentas: { $sum: 1 },
            subtotalTotal: { $sum: '$subtotal' },
            igvTotal: { $sum: '$igv' },
            totalGeneral: { $sum: '$total' },
            promedioVenta: { $avg: '$total' },
          },
        },
        { $project: { _id: 0 } },
      ],
      ventas: [{ $sort: { fechaVenta: -1 } }, { $skip: skip }, { $limit: limit }],
    },
  },
]
```

**Resultado:** un objeto `resumen` con cantidad de ventas y montos, y un arreglo `ventas` paginado.

## 3. Productos más vendidos

**Endpoint:** `GET /api/reportes/productos-mas-vendidos?limit=10`

**Filtros:** `fechaDesde`, `fechaHasta`, `cliente`, `estado` (por defecto solo `COMPLETADA`).

**Pipeline:**

```js
[
  { $match: { estado: 'COMPLETADA', ...filtros } },
  { $unwind: '$detalles' },
  {
    $group: {
      _id: '$detalles.producto',
      codigoSnapshot: { $first: '$detalles.codigoProducto' },
      nombreSnapshot: { $first: '$detalles.nombreProducto' },
      cantidadVendida: { $sum: '$detalles.cantidad' },
      ingresos: { $sum: '$detalles.subtotal' },
      numeroVentas: { $sum: 1 },
      precioPromedio: { $avg: '$detalles.precioUnitario' },
    },
  },
  {
    $lookup: {
      from: 'productos',
      localField: '_id',
      foreignField: '_id',
      as: 'producto',
    },
  },
  { $unwind: { path: '$producto', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      productoId: '$_id',
      codigo: { $ifNull: ['$producto.codigo', '$codigoSnapshot'] },
      nombre: { $ifNull: ['$producto.nombre', '$nombreSnapshot'] },
      categoria: { $ifNull: ['$producto.categoria', 'Sin categoría'] },
      marca: { $ifNull: ['$producto.marca', 'Sin marca'] },
      stockActual: { $ifNull: ['$producto.stock', 0] },
      precioVentaActual: { $ifNull: ['$producto.precioVenta', 0] },
      cantidadVendida: 1,
      ingresos: { $round: ['$ingresos', 2] },
      numeroVentas: 1,
      precioPromedio: { $round: ['$precioPromedio', 2] },
    },
  },
  { $sort: { cantidadVendida: -1, ingresos: -1 } },
  { $limit: limite },
]
```

**Resultado:** ranking de productos por cantidad vendida, con ingresos, precio promedio y stock actual.

## 4. Stock crítico

**Endpoint:** `GET /api/reportes/stock-critico`

**Pipeline:**

```js
[
  { $match: { estado: 'ACTIVO' } },
  {
    $lookup: {
      from: 'proveedores',
      localField: 'proveedor',
      foreignField: '_id',
      as: 'proveedorDoc',
    },
  },
  { $unwind: { path: '$proveedorDoc', preserveNullAndEmptyArrays: true } },
  { $addFields: { faltante: { $subtract: ['$stockMinimo', '$stock'] } } },
  { $match: { $expr: { $lte: ['$stock', '$stockMinimo'] } } },
  {
    $project: {
      codigo: 1,
      nombre: 1,
      categoria: 1,
      marca: 1,
      stock: 1,
      stockMinimo: 1,
      faltante: 1,
      precioCompra: 1,
      precioVenta: 1,
      valorReposicion: {
        $round: [{ $multiply: ['$faltante', '$precioCompra'] }, 2],
      },
      proveedor: {
        razonSocial: { $ifNull: ['$proveedorDoc.razonSocial', 'Sin proveedor'] },
        ruc: { $ifNull: ['$proveedorDoc.ruc', 'N/D'] },
        contacto: { $ifNull: ['$proveedorDoc.contacto', {}] },
      },
    },
  },
  { $sort: { stock: 1, faltante: -1 } },
]
```

**Resultado:** productos activos cuyo stock es menor o igual al stock mínimo, con faltante y valor estimado de reposición.

## 5. Ventas por categoría

**Endpoint:** `GET /api/reportes/ventas-por-categoria`

**Pipeline:**

```js
[
  { $match: { estado: 'COMPLETADA', ...filtros } },
  { $unwind: '$detalles' },
  {
    $lookup: {
      from: 'productos',
      localField: 'detalles.producto',
      foreignField: '_id',
      as: 'producto',
    },
  },
  { $unwind: { path: '$producto', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      categoria: { $ifNull: ['$producto.categoria', 'Sin categoría'] },
      cantidad: '$detalles.cantidad',
      ingreso: '$detalles.subtotal',
    },
  },
  {
    $group: {
      _id: '$categoria',
      cantidadVendida: { $sum: '$cantidad' },
      ingresos: { $sum: '$ingreso' },
      numeroVentas: { $sum: 1 },
    },
  },
  {
    $project: {
      categoria: '$_id',
      cantidadVendida: 1,
      ingresos: { $round: ['$ingresos', 2] },
      numeroVentas: 1,
      ticketPromedio: { $round: [{ $divide: ['$ingresos', '$numeroVentas'] }, 2] },
    },
  },
  { $sort: { ingresos: -1 } },
]
```

**Resultado:** ingresos, unidades y ticket promedio por categoría.

## 6. Ventas por mes

**Endpoint:** `GET /api/reportes/ventas-por-mes`

**Pipeline:**

```js
[
  { $match: { estado: 'COMPLETADA', ...filtros } },
  {
    $group: {
      _id: {
        $dateToString: { format: '%Y-%m', date: '$fechaVenta', timezone: 'America/Lima' },
      },
      numeroVentas: { $sum: 1 },
      subtotal: { $sum: '$subtotal' },
      igv: { $sum: '$igv' },
      total: { $sum: '$total' },
    },
  },
  {
    $project: {
      periodo: '$_id',
      numeroVentas: 1,
      subtotal: { $round: ['$subtotal', 2] },
      igv: { $round: ['$igv', 2] },
      total: { $round: ['$total', 2] },
    },
  },
  { $sort: { periodo: -1 } },
]
```

**Resultado:** evolución mensual de ventas y montos.

## 7. Resumen general

**Endpoint:** `GET /api/reportes/resumen`

Devuelve:

- Cantidad de documentos en `clientes`, `productos`, `proveedores` y `ventas`.
- Total vendido, subtotal, IGV y promedio de ventas completadas.
- Distribución de ventas por estado.
- Cantidad de productos en stock crítico.

## 8. Ejemplos de respuesta

### Productos más vendidos

```json
{
  "success": true,
  "total": 2,
  "data": [
    {
      "productoId": "68...",
      "codigo": "LP-HP-001",
      "nombre": "HP Pavilion 15-dy2050la",
      "categoria": "Laptops",
      "marca": "HP",
      "stockActual": 12,
      "precioVentaActual": 2799,
      "cantidadVendida": 3,
      "ingresos": 8397,
      "numeroVentas": 2,
      "precioPromedio": 2799
    }
  ]
}
```

### Stock crítico

```json
{
  "success": true,
  "total": 2,
  "data": [
    {
      "codigo": "GPU-ASU-011",
      "nombre": "ASUS Dual GeForce RTX 4060",
      "stock": 3,
      "stockMinimo": 5,
      "faltante": 2,
      "valorReposicion": 3000,
      "proveedor": {
        "razonSocial": "Importadora Andina de Cómputo S.A.C.",
        "ruc": "20456789123"
      }
    }
  ]
}
```

Los valores exactos dependen de los datos cargados por `npm run seed` y de las ventas realizadas.
