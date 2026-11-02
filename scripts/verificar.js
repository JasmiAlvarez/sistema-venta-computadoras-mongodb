require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/mongodb');
const Proveedor = require('../models/Proveedor');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Venta = require('../models/Venta');

const verificar = async () => {
  await connectDB();

  const [proveedores, productos, clientes, ventas, criticos, resumenVentas] = await Promise.all([
    Proveedor.countDocuments(),
    Producto.countDocuments(),
    Cliente.countDocuments(),
    Venta.countDocuments(),
    Producto.countDocuments({
      estado: 'ACTIVO',
      $expr: { $lte: ['$stock', '$stockMinimo'] },
    }),
    Venta.aggregate([
      { $match: { estado: 'COMPLETADA' } },
      { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } },
      { $project: { _id: 0 } },
    ]),
  ]);

  const indices = await Promise.all([
    Producto.collection.indexes(),
    Cliente.collection.indexes(),
    Proveedor.collection.indexes(),
    Venta.collection.indexes(),
  ]);

  console.log(`Conexión: ${mongoose.connection.host}/${mongoose.connection.name}`);
  console.log(`Proveedores: ${proveedores}`);
  console.log(`Productos: ${productos}`);
  console.log(`Clientes: ${clientes}`);
  console.log(`Ventas: ${ventas}`);
  console.log(`Productos en stock crítico: ${criticos}`);
  console.log(`Ventas completadas: ${resumenVentas[0]?.cantidad || 0}`);
  console.log(`Monto vendido: S/ ${Number(resumenVentas[0]?.total || 0).toFixed(2)}`);
  console.log('Índices por colección:');
  console.log(`- productos: ${indices[0].length}`);
  console.log(`- clientes: ${indices[1].length}`);
  console.log(`- proveedores: ${indices[2].length}`);
  console.log(`- ventas: ${indices[3].length}`);

  await disconnectDB();
};

verificar().catch(async (error) => {
  console.error('Error en la verificación:', error.message);
  await disconnectDB().catch(() => {});
  process.exitCode = 1;
});
