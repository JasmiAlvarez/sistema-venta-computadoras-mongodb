# Diseño Conceptual - Sistema para Venta de Computadoras (MongoDB)

## Objetivo del diseño conceptual

Representar las entidades, reglas de negocio y relaciones del sistema de venta de computadoras, adaptando el modelo al paradigma documental de MongoDB. El diseño define qué información se almacena, cómo se relacionan los documentos y cuándo conviene usar referencias o documentos embebidos.

## Entidades principales

### 1. Producto
Equipo o componente que se comercializa. Contiene código, nombre, descripción, categoría, marca, precios, stock, stock mínimo y estado. Sus especificaciones técnicas se almacenan como documento embebido.

### 2. Cliente
Persona natural o empresa que compra productos. Se identifica por tipo y número de documento. Su dirección se almacena como documento embebido.

### 3. Proveedor
Empresa que suministra productos. Contiene razón social, RUC, datos de contacto, dirección y estado. Los productos referencian al proveedor mediante `ObjectId`.

### 4. Venta
Operación comercial realizada por un cliente. Contiene número de venta, referencia al cliente, datos del vendedor, fecha, detalles, subtotal, IGV, total, estado y observaciones.

### 5. Detalle de venta
Línea de una venta. Se almacena como documento embebido dentro de `ventas.detalles`. Contiene la referencia al producto, una instantánea del código y nombre del producto, cantidad, precio unitario y subtotal.

## Reglas de negocio

1. Un producto debe pertenecer a una categoría, tener una marca y estar asociado a un proveedor.
2. El código del producto es único.
3. Los precios de compra y venta no pueden ser negativos.
4. El stock y el stock mínimo son enteros no negativos.
5. Un cliente se identifica por la combinación única de tipo y número de documento; el número de documento es único.
6. El RUC del proveedor es único y tiene 11 dígitos.
7. Una venta debe tener un cliente activo y al menos un detalle.
8. Cada detalle debe referenciar un producto existente y activo.
9. La cantidad vendida debe ser un entero mayor a cero.
10. No se puede vender más cantidad que el stock disponible.
11. Al registrar una venta, el stock se descuenta dentro de una transacción.
12. Al anular una venta, el stock se restituye.
13. El subtotal de la venta es la suma de los subtotales de sus detalles.
14. El IGV corresponde al 18% del subtotal.
15. El total es el subtotal más el IGV.
16. No se elimina un producto con ventas asociadas.
17. No se elimina un cliente con ventas asociadas; se puede desactivar.
18. No se elimina un proveedor con productos asociados; se puede desactivar.
19. Los detalles de una venta no se modifican directamente; se anula la venta y se registra una nueva.
20. Los reportes de productos más vendidos consideran únicamente ventas en estado `COMPLETADA`.

## Relaciones

| Origen | Destino | Tipo | Implementación |
|---|---|---|---|
| Producto | Proveedor | N:1 | `productos.proveedor` -> `ObjectId` de `proveedores._id` |
| Venta | Cliente | N:1 | `ventas.cliente` -> `ObjectId` de `clientes._id` |
| Venta | Producto | N:M | `ventas.detalles[].producto` -> `ObjectId` de `productos._id` |
| Venta | Detalle de venta | 1:N | Documentos embebidos en `ventas.detalles` |
| Venta | Vendedor | 1:1 | Documento embebido `ventas.vendedor` |
| Producto | Especificaciones | 1:1 | Documento embebido `productos.especificaciones` |
| Cliente | Dirección | 1:1 | Documento embebido `clientes.direccion` |
| Proveedor | Contacto | 1:1 | Documento embebido `proveedores.contacto` |
| Proveedor | Dirección | 1:1 | Documento embebido `proveedores.direccion` |

## Decisión: referencias frente a documentos embebidos

### Se usan referencias `ObjectId` cuando:
- La entidad existe por sí misma y se consulta o actualiza de forma independiente (clientes, productos, proveedores).
- La relación puede crecer sin un límite práctico (un cliente puede tener muchas ventas).
- Se necesita evitar duplicidad de datos maestros.
- Se requiere `$lookup` para combinar información en reportes.

### Se usan documentos embebidos cuando:
- El dato pertenece a un único documento principal.
- Se consulta junto con el documento principal.
- El volumen del subdocumento es acotado (especificaciones, direcciones, vendedor).
- Se busca una lectura más rápida sin `$lookup` (detalles de venta).

## Ventajas del diseño documental

- Lectura de una venta completa en una sola consulta, incluyendo sus detalles.
- Histórico de precios y nombres dentro de los detalles de venta.
- Menos colecciones que el diseño relacional original.
- Índices específicos para búsquedas por documento, código, fecha, estado, categoría, marca y texto.
- Uso de transacciones para mantener consistente el stock cuando se registra o anula una venta.

## Colecciones resultantes

```text
venta_computadoras
├── productos
├── clientes
├── proveedores
└── ventas
```

El detalle de campos, tipos e índices está en `docs/modelo_mongodb.md` y `docs/diccionario_datos.md`.
