require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/mongodb');
const Proveedor = require('../models/Proveedor');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Venta = require('../models/Venta');

const redondear = (valor) => Number(valor.toFixed(2));

const diasAtras = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(10, 30, 0, 0);
  return fecha;
};

const proveedoresSeed = [
  {
    razonSocial: 'TechSupply S.A.C.',
    ruc: '20123456789',
    contacto: {
      nombre: 'Carlos Mendoza',
      telefono: '014567890',
      email: 'ventas@techsupply.com.pe',
    },
    direccion: {
      calle: 'Av. Javier Prado Este 1250',
      ciudad: 'Lima',
      departamento: 'Lima',
      pais: 'Perú',
    },
  },
  {
    razonSocial: 'Importadora Andina de Cómputo S.A.C.',
    ruc: '20456789123',
    contacto: {
      nombre: 'Rosa Quispe',
      telefono: '014789123',
      email: 'contacto@importadoraandina.com.pe',
    },
    direccion: {
      calle: 'Jr. Paruro 850',
      ciudad: 'Lima',
      departamento: 'Lima',
      pais: 'Perú',
    },
  },
  {
    razonSocial: 'Distribuidora Digital del Pacífico S.A.C.',
    ruc: '20567891234',
    contacto: {
      nombre: 'Miguel Torres',
      telefono: '013456789',
      email: 'compras@digitalpacifico.com.pe',
    },
    direccion: {
      calle: 'Av. Larco 345',
      ciudad: 'Trujillo',
      departamento: 'La Libertad',
      pais: 'Perú',
    },
  },
  {
    razonSocial: 'Mayorista Global Tech S.A.C.',
    ruc: '20678912345',
    contacto: {
      nombre: 'Ana Ramírez',
      telefono: '012345678',
      email: 'ventas@globaltech.com.pe',
    },
    direccion: {
      calle: 'Av. Arequipa 2100',
      ciudad: 'Arequipa',
      departamento: 'Arequipa',
      pais: 'Perú',
    },
  },
  {
    razonSocial: 'Corporación Informática Lima S.A.C.',
    ruc: '20789123456',
    contacto: {
      nombre: 'Luis Castro',
      telefono: '015678901',
      email: 'informes@corpinfollima.com.pe',
    },
    direccion: {
      calle: 'Av. Universitaria 1800',
      ciudad: 'Lima',
      departamento: 'Lima',
      pais: 'Perú',
    },
  },
];

const productosSeed = [
  {
    codigo: 'LP-HP-001',
    nombre: 'HP Pavilion 15-dy2050la',
    descripcion: 'Laptop HP Pavilion 15.6" Intel Core i5, 8GB RAM, 256GB SSD',
    categoria: 'Laptops',
    marca: 'HP',
    proveedor: 0,
    especificaciones: {
      procesador: 'Intel Core i5-1135G7',
      ram: '8 GB DDR4',
      almacenamiento: '256 GB SSD',
      tarjetaGrafica: 'Intel Iris Xe',
      pantalla: '15.6" Full HD',
      sistemaOperativo: 'Windows 11 Home',
    },
    precioCompra: 2200,
    precioVenta: 2799,
    stock: 15,
    stockMinimo: 5,
  },
  {
    codigo: 'LP-LEN-002',
    nombre: 'Lenovo IdeaPad 3 15IIL05',
    descripcion: 'Laptop Lenovo IdeaPad 3 con procesador Intel Core i3 y 8GB de RAM',
    categoria: 'Laptops',
    marca: 'Lenovo',
    proveedor: 0,
    especificaciones: {
      procesador: 'Intel Core i3-1005G1',
      ram: '8 GB DDR4',
      almacenamiento: '512 GB SSD',
      tarjetaGrafica: 'Intel UHD Graphics',
      pantalla: '15.6" HD',
      sistemaOperativo: 'Windows 11 Home',
    },
    precioCompra: 1750,
    precioVenta: 2199,
    stock: 12,
    stockMinimo: 4,
  },
  {
    codigo: 'LP-ASU-003',
    nombre: 'ASUS VivoBook 15 X515EA',
    descripcion: 'Laptop ASUS VivoBook 15.6" Intel Core i3, 8GB RAM, 256GB SSD',
    categoria: 'Laptops',
    marca: 'ASUS',
    proveedor: 1,
    especificaciones: {
      procesador: 'Intel Core i3-1115G4',
      ram: '8 GB DDR4',
      almacenamiento: '256 GB SSD',
      tarjetaGrafica: 'Intel UHD Graphics',
      pantalla: '15.6" Full HD',
      sistemaOperativo: 'Windows 11 Home',
    },
    precioCompra: 1650,
    precioVenta: 2099,
    stock: 10,
    stockMinimo: 5,
  },
  {
    codigo: 'PC-DEL-004',
    nombre: 'Dell OptiPlex 7010 SFF',
    descripcion: 'Computadora de escritorio Dell OptiPlex 7010, Intel Core i5, 16GB RAM',
    categoria: 'Desktops',
    marca: 'Dell',
    proveedor: 1,
    especificaciones: {
      procesador: 'Intel Core i5-13500',
      ram: '16 GB DDR4',
      almacenamiento: '512 GB SSD',
      tarjetaGrafica: 'Intel UHD Graphics 770',
      pantalla: 'No incluye',
      sistemaOperativo: 'Windows 11 Pro',
    },
    precioCompra: 1900,
    precioVenta: 2499,
    stock: 8,
    stockMinimo: 3,
  },
  {
    codigo: 'PC-HP-005',
    nombre: 'HP ProDesk 400 G9',
    descripcion: 'Desktop HP ProDesk 400 G9 con Intel Core i5 y 8GB RAM',
    categoria: 'Desktops',
    marca: 'HP',
    proveedor: 0,
    especificaciones: {
      procesador: 'Intel Core i5-12500',
      ram: '8 GB DDR4',
      almacenamiento: '256 GB SSD',
      tarjetaGrafica: 'Intel UHD Graphics 770',
      pantalla: 'No incluye',
      sistemaOperativo: 'Windows 11 Pro',
    },
    precioCompra: 2100,
    precioVenta: 2699,
    stock: 6,
    stockMinimo: 3,
  },
  {
    codigo: 'MN-LG-006',
    nombre: 'LG UltraWide 29WP500-B',
    descripcion: 'Monitor LG UltraWide de 29 pulgadas con resolución Full HD',
    categoria: 'Monitores',
    marca: 'LG',
    proveedor: 2,
    especificaciones: {
      procesador: 'No aplica',
      ram: 'No aplica',
      almacenamiento: 'No aplica',
      tarjetaGrafica: 'No aplica',
      pantalla: '29" UltraWide Full HD 75Hz',
      sistemaOperativo: 'No aplica',
    },
    precioCompra: 850,
    precioVenta: 1199,
    stock: 9,
    stockMinimo: 4,
  },
  {
    codigo: 'MN-SAM-007',
    nombre: 'Samsung Odyssey G5 27"',
    descripcion: 'Monitor gamer Samsung Odyssey G5 de 27 pulgadas QHD 144Hz',
    categoria: 'Monitores',
    marca: 'Samsung',
    proveedor: 2,
    especificaciones: {
      procesador: 'No aplica',
      ram: 'No aplica',
      almacenamiento: 'No aplica',
      tarjetaGrafica: 'No aplica',
      pantalla: '27" QHD 144Hz curvo',
      sistemaOperativo: 'No aplica',
    },
    precioCompra: 1100,
    precioVenta: 1499,
    stock: 5,
    stockMinimo: 4,
  },
  {
    codigo: 'KB-LOG-008',
    nombre: 'Logitech MX Keys',
    descripcion: 'Teclado inalámbrico Logitech MX Keys con retroiluminación',
    categoria: 'Periféricos',
    marca: 'Logitech',
    proveedor: 3,
    especificaciones: {
      procesador: 'No aplica',
      ram: 'No aplica',
      almacenamiento: 'No aplica',
      tarjetaGrafica: 'No aplica',
      pantalla: 'No aplica',
      sistemaOperativo: 'Compatible Windows, macOS y Linux',
    },
    precioCompra: 280,
    precioVenta: 399,
    stock: 20,
    stockMinimo: 5,
  },
  {
    codigo: 'MS-LOG-009',
    nombre: 'Logitech MX Master 3S',
    descripcion: 'Mouse inalámbrico Logitech MX Master 3S de alta precisión',
    categoria: 'Periféricos',
    marca: 'Logitech',
    proveedor: 3,
    especificaciones: {
      procesador: 'No aplica',
      ram: 'No aplica',
      almacenamiento: 'No aplica',
      tarjetaGrafica: 'No aplica',
      pantalla: 'No aplica',
      sistemaOperativo: 'Compatible Windows, macOS y Linux',
    },
    precioCompra: 250,
    precioVenta: 349,
    stock: 18,
    stockMinimo: 5,
  },
  {
    codigo: 'SSD-KIN-010',
    nombre: 'Kingston NV2 1TB NVMe',
    descripcion: 'Unidad SSD Kingston NV2 de 1TB con interfaz PCIe 4.0 NVMe',
    categoria: 'Almacenamiento',
    marca: 'Kingston',
    proveedor: 3,
    especificaciones: {
      procesador: 'No aplica',
      ram: 'No aplica',
      almacenamiento: '1 TB NVMe PCIe 4.0',
      tarjetaGrafica: 'No aplica',
      pantalla: 'No aplica',
      sistemaOperativo: 'No aplica',
    },
    precioCompra: 210,
    precioVenta: 299,
    stock: 25,
    stockMinimo: 8,
  },
  {
    codigo: 'GPU-ASU-011',
    nombre: 'ASUS Dual GeForce RTX 4060',
    descripcion: 'Tarjeta gráfica ASUS Dual GeForce RTX 4060 de 8GB GDDR6',
    categoria: 'Componentes',
    marca: 'ASUS',
    proveedor: 1,
    especificaciones: {
      procesador: 'No aplica',
      ram: '8 GB GDDR6',
      almacenamiento: 'No aplica',
      tarjetaGrafica: 'NVIDIA GeForce RTX 4060',
      pantalla: 'No aplica',
      sistemaOperativo: 'No aplica',
    },
    precioCompra: 1500,
    precioVenta: 1899,
    stock: 4,
    stockMinimo: 5,
  },
  {
    codigo: 'RAM-KIN-012',
    nombre: 'Kingston Fury Beast 16GB',
    descripcion: 'Memoria RAM Kingston Fury Beast de 16GB DDR4 3200MHz',
    categoria: 'Componentes',
    marca: 'Kingston',
    proveedor: 3,
    especificaciones: {
      procesador: 'No aplica',
      ram: '16 GB DDR4 3200MHz',
      almacenamiento: 'No aplica',
      tarjetaGrafica: 'No aplica',
      pantalla: 'No aplica',
      sistemaOperativo: 'No aplica',
    },
    precioCompra: 180,
    precioVenta: 259,
    stock: 14,
    stockMinimo: 6,
  },
];

const clientesSeed = [
  {
    tipoDocumento: 'DNI',
    numeroDocumento: '12345678',
    nombres: 'Juan Carlos',
    apellidos: 'Pérez García',
    email: 'juan.perez@gmail.com',
    telefono: '987654321',
    direccion: {
      calle: 'Av. Los Olivos 456',
      ciudad: 'Lima',
      departamento: 'Lima',
      pais: 'Perú',
    },
  },
  {
    tipoDocumento: 'DNI',
    numeroDocumento: '56789012',
    nombres: 'Pedro Luis',
    apellidos: 'Sánchez Vargas',
    email: 'pedro.sanchez@gmail.com',
    telefono: '943210987',
    direccion: {
      calle: 'Av. Brasil 987',
      ciudad: 'Lima',
      departamento: 'Lima',
      pais: 'Perú',
    },
  },
  {
    tipoDocumento: 'RUC',
    numeroDocumento: '20548796321',
    nombres: 'Inversiones Tecnológicas',
    apellidos: 'del Perú S.A.C.',
    email: 'compras@invtecnologicas.pe',
    telefono: '014567123',
    direccion: {
      calle: 'Av. Canaval y Moreyra 380',
      ciudad: 'Lima',
      departamento: 'Lima',
      pais: 'Perú',
    },
  },
  {
    tipoDocumento: 'DNI',
    numeroDocumento: '87654321',
    nombres: 'María Fernanda',
    apellidos: 'Torres Ríos',
    email: 'maria.torres@gmail.com',
    telefono: '956781234',
    direccion: {
      calle: 'Calle Los Pinos 120',
      ciudad: 'Trujillo',
      departamento: 'La Libertad',
      pais: 'Perú',
    },
  },
  {
    tipoDocumento: 'CE',
    numeroDocumento: '001234567',
    nombres: 'Lucas Martín',
    apellidos: 'Gómez Silva',
    email: 'lucas.gomez@outlook.com',
    telefono: '912345678',
    direccion: {
      calle: 'Av. Ejército 560',
      ciudad: 'Arequipa',
      departamento: 'Arequipa',
      pais: 'Perú',
    },
  },
  {
    tipoDocumento: 'DNI',
    numeroDocumento: '44556677',
    nombres: 'Ana Lucía',
    apellidos: 'Ramírez Castro',
    email: 'ana.ramirez@gmail.com',
    telefono: '998877665',
    direccion: {
      calle: 'Jr. Junín 230',
      ciudad: 'Cusco',
      departamento: 'Cusco',
      pais: 'Perú',
    },
  },
];

const ventasSeed = [
  {
    dias: 75,
    cliente: 0,
    vendedor: { nombre: 'Luis Fernando Castro Mendoza', documento: '10234567', cargo: 'Vendedor' },
    items: [
      ['LP-HP-001', 1],
      ['KB-LOG-008', 2],
    ],
    observaciones: 'Venta al contado con entrega en tienda',
  },
  {
    dias: 60,
    cliente: 1,
    vendedor: { nombre: 'María Elena Rojas Paredes', documento: '10456789', cargo: 'Vendedora' },
    items: [
      ['LP-LEN-002', 2],
      ['SSD-KIN-010', 1],
    ],
    observaciones: 'Equipos para oficina',
  },
  {
    dias: 45,
    cliente: 3,
    vendedor: { nombre: 'Luis Fernando Castro Mendoza', documento: '10234567', cargo: 'Vendedor' },
    items: [
      ['MN-LG-006', 1],
      ['MS-LOG-009', 1],
    ],
    observaciones: 'Venta con boleta electrónica',
  },
  {
    dias: 30,
    cliente: 2,
    vendedor: { nombre: 'Jorge Andrés Salazar Vega', documento: '10678901', cargo: 'Asesor comercial' },
    items: [
      ['LP-ASU-003', 1],
      ['GPU-ASU-011', 1],
    ],
    observaciones: 'Compra corporativa con factura',
  },
  {
    dias: 15,
    cliente: 4,
    vendedor: { nombre: 'María Elena Rojas Paredes', documento: '10456789', cargo: 'Vendedora' },
    items: [
      ['PC-DEL-004', 1],
      ['MN-SAM-007', 1],
    ],
    observaciones: 'Entrega programada',
  },
  {
    dias: 5,
    cliente: 5,
    vendedor: { nombre: 'Jorge Andrés Salazar Vega', documento: '10678901', cargo: 'Asesor comercial' },
    items: [
      ['LP-HP-001', 2],
      ['KB-LOG-008', 3],
      ['SSD-KIN-010', 2],
    ],
    observaciones: 'Venta por volumen',
  },
  {
    dias: 3,
    cliente: 1,
    vendedor: { nombre: 'Luis Fernando Castro Mendoza', documento: '10234567', cargo: 'Vendedor' },
    items: [['RAM-KIN-012', 1]],
    estado: 'ANULADA',
    observaciones: 'Venta anulada por solicitud del cliente',
  },
];

const limpiarColecciones = async () => {
  await Venta.deleteMany({});
  await Producto.deleteMany({});
  await Cliente.deleteMany({});
  await Proveedor.deleteMany({});
};

const ejecutarSeed = async () => {
  await connectDB();
  await limpiarColecciones();

  const proveedores = await Proveedor.create(proveedoresSeed);
  const clientes = await Cliente.create(clientesSeed);

  const productos = await Producto.create(
    productosSeed.map((producto) => ({
      ...producto,
      proveedor: proveedores[producto.proveedor]._id,
    }))
  );

  const productosPorCodigo = new Map(productos.map((producto) => [producto.codigo, producto]));
  const consumos = new Map();
  const ventasCreadas = [];

  for (let indice = 0; indice < ventasSeed.length; indice += 1) {
    const definicion = ventasSeed[indice];
    const detalles = definicion.items.map(([codigo, cantidad]) => {
      const producto = productosPorCodigo.get(codigo);
      if (!producto) {
        throw new Error(`Producto de prueba no encontrado: ${codigo}`);
      }

      return {
        producto: producto._id,
        codigoProducto: producto.codigo,
        nombreProducto: producto.nombre,
        cantidad,
        precioUnitario: producto.precioVenta,
        subtotal: redondear(cantidad * producto.precioVenta),
      };
    });

    const subtotal = redondear(detalles.reduce((total, detalle) => total + detalle.subtotal, 0));
    const igv = redondear(subtotal * 0.18);
    const estado = definicion.estado || 'COMPLETADA';

    const venta = await Venta.create({
      numeroVenta: `VTA-SEED-${String(indice + 1).padStart(3, '0')}`,
      cliente: clientes[definicion.cliente]._id,
      vendedor: definicion.vendedor,
      fechaVenta: diasAtras(definicion.dias),
      detalles,
      subtotal,
      igv,
      total: redondear(subtotal + igv),
      estado,
      observaciones: definicion.observaciones,
    });

    ventasCreadas.push(venta);

    if (estado === 'COMPLETADA') {
      detalles.forEach((detalle) => {
        const acumulado = consumos.get(detalle.codigoProducto) || 0;
        consumos.set(detalle.codigoProducto, acumulado + detalle.cantidad);
      });
    }
  }

  const operacionesStock = Array.from(consumos.entries()).map(([codigo, cantidad]) => {
    const producto = productosPorCodigo.get(codigo);
    if (producto.stock < cantidad) {
      throw new Error(`Stock insuficiente en datos de prueba para ${codigo}`);
    }

    return {
      updateOne: {
        filter: { _id: producto._id },
        update: { $inc: { stock: -cantidad } },
      },
    };
  });

  if (operacionesStock.length > 0) {
    await Producto.bulkWrite(operacionesStock);
  }

  await Promise.all([
    Proveedor.createIndexes(),
    Producto.createIndexes(),
    Cliente.createIndexes(),
    Venta.createIndexes(),
  ]);

  const criticos = await Producto.countDocuments({
    estado: 'ACTIVO',
    $expr: { $lte: ['$stock', '$stockMinimo'] },
  });

  console.log('Datos de prueba cargados correctamente:');
  console.log(`- Proveedores: ${proveedores.length}`);
  console.log(`- Productos: ${productos.length}`);
  console.log(`- Clientes: ${clientes.length}`);
  console.log(`- Ventas: ${ventasCreadas.length}`);
  console.log(`- Productos en stock crítico: ${criticos}`);

  await disconnectDB();
};

ejecutarSeed().catch(async (error) => {
  console.error('Error al cargar los datos de prueba:', error.message);
  await disconnectDB().catch(() => {});
  process.exitCode = 1;
});
