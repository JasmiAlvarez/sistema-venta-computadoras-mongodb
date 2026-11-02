# Sistema para Venta de Computadoras (MongoDB + Node.js)

## Descripción

Sistema backend para la gestión comercial de una tienda de computadoras. Permite administrar productos, clientes, proveedores y ventas, controlar el stock y generar reportes mediante consultas de agregación de MongoDB.

La base de datos principal de este entregable es **MongoDB Atlas**, gestionada con **Mongoose**. El proyecto incluye una API REST funcional construida con **Node.js** y **Express**, datos de prueba, índices y reportes de ventas, productos más vendidos y stock crítico.

> Los archivos de `database/*.sql` se conservan como documentación histórica del primer diseño relacional. **No son la base de datos principal ni se ejecutan para este entregable.**

## Objetivo General

Implementar una solución NoSQL con MongoDB que permita registrar y consultar información comercial, relacionar colecciones mediante `ObjectId`, usar documentos embebidos cuando corresponde y obtener reportes mediante pipelines de agregación.

## Funcionalidades

- CRUD de productos, clientes, proveedores y ventas.
- Relaciones entre colecciones mediante `ObjectId`.
- Documentos embebidos para especificaciones, direcciones, vendedor y detalles de venta.
- Validaciones con Mongoose y manejo centralizado de errores.
- Control automático de stock al registrar, anular o eliminar ventas.
- Ventas registradas dentro de transacciones de MongoDB.
- Paginación y filtros en las consultas.
- Índices para búsquedas por código, documento, RUC, fechas, estado, categoría y texto.
- Reportes con `$match`, `$group`, `$lookup`, `$unwind` y `$project`.
- Datos de prueba para las cuatro colecciones.

## Tecnologías y Versiones

| Tecnología | Versión |
|---|---|
| Node.js | 20.19 o superior (probado con 25.8.1) |
| Express | 4.22.3 |
| Mongoose | 9.11.4 |
| MongoDB Atlas | Versión gestionada por Atlas (pruebas locales con MongoDB 8.2.6) |
| dotenv | 18.0.9 |
| cors | 2.8.6 |
| Lenguaje | JavaScript (CommonJS) |

## Datos del Estudiante

- **Nombre:** Jasmi Janeli Alvarez Caisahuana
- **Carrera:** Ingeniería de Sistemas e Informática
- **Asignatura:** Base de Datos
- **Proyecto:** Sistema para Venta de Computadoras
- **Año:** 2026

## Estructura del Proyecto

```text
Venta de Computadoras/
├── config/
│   └── mongodb.js              Conexión a MongoDB Atlas con Mongoose
├── controllers/
│   ├── productosController.js
│   ├── clientesController.js
│   ├── proveedoresController.js
│   ├── ventasController.js
│   └── reportesController.js
├── models/
│   ├── Producto.js
│   ├── Cliente.js
│   ├── Proveedor.js
│   └── Venta.js
├── routes/
│   ├── index.js
│   ├── productos.js
│   ├── clientes.js
│   ├── proveedores.js
│   ├── ventas.js
│   ├── reportes.js
│   └── endpoints.md            Documentación de la API implementada
├── scripts/
│   ├── seed.js                 Carga de datos de prueba
│   └── verificar.js            Verificación de conexión, datos e índices
├── utils/
│   ├── asyncHandler.js
│   ├── HttpError.js
│   └── paginacion.js
├── docs/
│   ├── diseno_conceptual.md
│   ├── modelo_mongodb.md
│   ├── diccionario_datos.md
│   ├── consultas_agregacion.md
│   ├── diagrama_er.mmd
│   └── modelo_relacional.md    Documento legado del diseño SQL
├── database/                   Scripts SQL históricos (no son la BD principal)
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Instalación y Ejecución

### 1. Clonar e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd "Venta de Computadoras"
npm install
```

### 2. Configurar variables de entorno

Cree un archivo `.env` a partir de `.env.example`:

```bash
copy .env.example .env
```

En Windows PowerShell también puede usar:

```powershell
Copy-Item .env.example .env
```

Edite `.env` con sus propios datos:

```env
MONGODB_URI=mongodb+srv://USUARIO:CONTRASENA@CLUSTER.mongodb.net/venta_computadoras?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
```

**Nunca publique el archivo `.env`.** Ya está incluido en `.gitignore`. No escriba credenciales reales en `README.md`, `.env.example` ni en el código fuente.

### 3. Cargar datos de prueba

```bash
npm run seed
```

Este comando elimina los documentos existentes de las colecciones `productos`, `clientes`, `proveedores` y `ventas`, y vuelve a cargar los datos de prueba. No elimina la base de datos ni otras colecciones.

### 4. Verificar la conexión y los datos

```bash
npm run verify
```

Muestra el host de conexión, la cantidad de documentos por colección, los productos en stock crítico, el monto vendido y la cantidad de índices.

### 5. Iniciar el servidor

```bash
npm start
```

Para desarrollo con recarga automática:

```bash
npm run dev
```

La API estará disponible en `http://localhost:3000`. La salud del servicio se consulta en `http://localhost:3000/api/health`.

## Configuración de MongoDB Atlas

1. Cree una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Cree un clúster gratuito (M0).
3. En **Database Access**, cree un usuario de base de datos con contraseña. Use una contraseña segura y no la comparta.
4. En **Network Access**, agregue la IP desde la que se ejecutará el proyecto. Para pruebas académicas se puede usar `0.0.0.0/0`, aunque no es recomendable para producción.
5. En **Clusters**, seleccione **Connect** > **Drivers** y copie la cadena de conexión.
6. Reemplace `<password>` por la contraseña del usuario. Si la contraseña contiene caracteres especiales, codifíquela para URL.
7. Asegúrese de que la cadena incluya la base de datos `venta_computadoras` antes de los parámetros:

```text
mongodb+srv://USUARIO:CONTRASENA@CLUSTER.mongodb.net/venta_computadoras?retryWrites=true&w=majority
```

8. Pegue la cadena en `MONGODB_URI` dentro de `.env`.
9. Ejecute `npm run verify` para comprobar la conexión.

### Solución de problemas de conexión

- **`bad auth : Authentication failed`**: el usuario o la contraseña de `MONGODB_URI` son incorrectos. Genere una contraseña nueva en Atlas y actualice `.env`.
- **IP no autorizada**: agregue su IP en **Network Access** de Atlas.
- **`querySrv ECONNREFUSED`**: algunos entornos Windows con DNS local no resuelven los registros SRV de Atlas desde Node.js. Agregue esta variable opcional a `.env`:

```env
DNS_SERVERS=8.8.8.8,1.1.1.1
```

- **Transacciones**: el endpoint `POST /api/ventas` usa transacciones. MongoDB Atlas funciona como replica set y las soporta. Un MongoDB local en modo standalone no las soporta.

## Modelado de Datos

El proyecto utiliza cuatro colecciones principales:

### `productos`
- Referencia al proveedor mediante `proveedor: ObjectId` -> `proveedores._id`.
- Documento embebido `especificaciones` con procesador, RAM, almacenamiento, GPU, pantalla y sistema operativo.
- Índices: código único, texto en nombre/descripción, categoría + marca, estado + stock, proveedor y precio de venta.

### `clientes`
- Documento embebido `direccion` con calle, ciudad, departamento y país.
- Índice único en `numeroDocumento`.
- Índices adicionales por apellidos/nombres, email, estado y ciudad.

### `proveedores`
- Documentos embebidos `contacto` y `direccion`.
- Índice único en `ruc`.
- Índices por razón social (texto), estado y ciudad.

### `ventas`
- Referencia al cliente mediante `cliente: ObjectId` -> `clientes._id`.
- Referencia a cada producto mediante `detalles[].producto: ObjectId` -> `productos._id`.
- Documento embebido `vendedor` con nombre, documento y cargo.
- Detalles de venta embebidos con cantidad, precio unitario y subtotal.
- Índices: número de venta único, cliente + fecha, fecha, estado, producto referenciado y total.

### Criterios de modelado

- **Referencias (`ObjectId`)**: se usan para entidades reutilizables y consultadas de forma independiente, como clientes, proveedores y productos.
- **Documentos embebidos**: se usan para datos que pertenecen a un documento principal y se leen junto con él, como las especificaciones del producto, la dirección del cliente, el vendedor y los detalles de una venta.
- **Instantáneas históricas**: cada detalle de venta guarda código, nombre y precio del producto al momento de la venta, evitando que un cambio futuro de precio altere el histórico.
- **Integridad**: las operaciones de venta validan cliente, producto, stock y estado; si una operación falla, la transacción se revierte.

La explicación completa está en `docs/modelo_mongodb.md` y el diccionario de campos en `docs/diccionario_datos.md`.

## API REST

La documentación detallada con ejemplos está en [`routes/endpoints.md`](routes/endpoints.md).

| Recurso | Métodos | Rutas principales |
|---|---|---|
| Productos | GET, POST, PUT, DELETE | `/api/productos`, `/api/productos/:id` |
| Clientes | GET, POST, PUT, DELETE | `/api/clientes`, `/api/clientes/:id`, `/api/clientes/:id/ventas` |
| Proveedores | GET, POST, PUT, DELETE | `/api/proveedores`, `/api/proveedores/:id`, `/api/proveedores/:id/productos` |
| Ventas | GET, POST, PUT, DELETE | `/api/ventas`, `/api/ventas/:id` |
| Reportes | GET | `/api/reportes/...` |
| Salud | GET | `/api/health` |

Filtros habituales:

- `GET /api/productos?buscar=HP&categoria=Laptops&stockBajo=true&page=1&limit=10`
- `GET /api/clientes?buscar=Pérez&estado=ACTIVO`
- `GET /api/proveedores?ciudad=Lima&estado=ACTIVO`
- `GET /api/ventas?fechaDesde=2026-01-01&fechaHasta=2026-12-31&estado=COMPLETADA`
- `GET /api/reportes/ventas?fechaDesde=2026-01-01&fechaHasta=2026-12-31`
- `GET /api/reportes/productos-mas-vendidos?limit=10`
- `GET /api/reportes/stock-critico`

### Ejemplo de registro de venta

```json
{
  "cliente": "OBJECT_ID_DEL_CLIENTE",
  "vendedor": {
    "nombre": "Luis Fernando Castro Mendoza",
    "documento": "10234567",
    "cargo": "Vendedor"
  },
  "detalles": [
    {
      "producto": "OBJECT_ID_DEL_PRODUCTO",
      "cantidad": 2
    }
  ],
  "observaciones": "Venta al contado"
}
```

El servidor calcula el subtotal, IGV (18%) y total, descuenta el stock y registra la venta en una transacción. Los precios se toman del producto si no se envía `precioUnitario`.

### Reportes y agregaciones

| Endpoint | Pipeline utilizado |
|---|---|
| `GET /api/reportes/ventas` | `$match`, `$lookup`, `$unwind`, `$project`, `$facet`, `$group` |
| `GET /api/reportes/productos-mas-vendidos` | `$match`, `$unwind`, `$group`, `$lookup`, `$project`, `$sort` |
| `GET /api/reportes/stock-critico` | `$match`, `$lookup`, `$unwind`, `$addFields`, `$project` |
| `GET /api/reportes/ventas-por-categoria` | `$match`, `$unwind`, `$lookup`, `$project`, `$group` |
| `GET /api/reportes/ventas-por-mes` | `$match`, `$group`, `$project` |
| `GET /api/reportes/resumen` | Conteos, `$group`, `$project` y stock crítico |

El detalle de cada pipeline está en `docs/consultas_agregacion.md`.

## Comandos de Prueba

```bash
npm run verify
npm start
```

Con el servidor iniciado, en otra terminal:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/productos
Invoke-RestMethod http://localhost:3000/api/reportes/ventas
Invoke-RestMethod http://localhost:3000/api/reportes/productos-mas-vendidos
Invoke-RestMethod http://localhost:3000/api/reportes/stock-critico
```

También puede usar `curl`:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/productos
curl "http://localhost:3000/api/reportes/productos-mas-vendidos?limit=5"
```

## Seguridad

- Las credenciales se leen exclusivamente desde variables de entorno.
- `.env` está excluido del repositorio mediante `.gitignore`.
- No se registran contraseñas ni cadenas de conexión en la consola.
- Si una cadena de conexión fue publicada accidentalmente, rote la contraseña del usuario en MongoDB Atlas.
- La autenticación con JWT y la autorización por roles no forman parte de este entregable.

## Documentación Adicional

- [`docs/modelo_mongodb.md`](docs/modelo_mongodb.md): modelado de colecciones, referencias, documentos embebidos e índices.
- [`docs/diccionario_datos.md`](docs/diccionario_datos.md): diccionario de campos de MongoDB.
- [`docs/consultas_agregacion.md`](docs/consultas_agregacion.md): pipelines de agregación y reportes.
- [`docs/diseno_conceptual.md`](docs/diseno_conceptual.md): diseño conceptual adaptado a MongoDB.
- [`docs/diagrama_er.mmd`](docs/diagrama_er.mmd): diagrama Mermaid de colecciones y relaciones.
- [`routes/endpoints.md`](routes/endpoints.md): referencia de la API REST implementada.
- [`docs/modelo_relacional.md`](docs/modelo_relacional.md): documento legado del diseño relacional original.
