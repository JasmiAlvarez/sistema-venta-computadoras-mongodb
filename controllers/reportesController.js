const mongoose = require('mongoose');
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Proveedor = require('../models/Proveedor');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { obtenerPaginacion } = require('../utils/paginacion');

const parsearFecha = (valor, nombre) => {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    throw new HttpError(400, `La ${nombre} no es válida`);
  }
  return fecha;
};

const construirMatchVentas = (query, estadoPorDefecto = null) => {
  const { fechaDesde, fechaHasta, cliente, estado } = query;
  const match = {};

  if (estado) {
    match.estado = estado;
  } else if (estadoPorDefecto) {
    match.estado = estadoPorDefecto;
  }

  if (cliente) {
    if (!mongoose.isValidObjectId(cliente)) {
      throw new HttpError(400, 'El identificador del cliente no es válido');
    }
    match.cliente = new mongoose.Types.ObjectId(cliente);
  }

  if (fechaDesde || fechaHasta) {
    match.fechaVenta = {};
    if (fechaDesde) match.fechaVenta.$gte = parsearFecha(fechaDesde, 'fechaDesde');
    if (fechaHasta) {
      const hasta = parsearFecha(fechaHasta, 'fechaHasta');
      hasta.setHours(23, 59, 59, 999);
      match.fechaVenta.$lte = hasta;
    }
  }

  return match;
};

const reporteVentas = asyncHandler(async (req, res) => {
  const { page, limit, skip } = obtenerPaginacion(req.query);
  const match = construirMatchVentas(req.query);

  const [resultado] = await Venta.aggregate([
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
        _id: 0,
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
  ]);

  const resumen =
    resultado && resultado.resumen.length > 0
      ? resultado.resumen[0]
      : {
          totalVentas: 0,
          subtotalTotal: 0,
          igvTotal: 0,
          totalGeneral: 0,
          promedioVenta: 0,
        };

  res.json({
    success: true,
    resumen,
    page,
    limit,
    paginas: Math.ceil(resumen.totalVentas / limit) || 0,
    ventas: resultado ? resultado.ventas : [],
  });
});

const productosMasVendidos = asyncHandler(async (req, res) => {
  const match = construirMatchVentas(req.query, 'COMPLETADA');
  const limite = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);

  const data = await Venta.aggregate([
    { $match: match },
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
        _id: 0,
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
  ]);

  res.json({
    success: true,
    total: data.length,
    data,
  });
});

const stockCritico = asyncHandler(async (req, res) => {
  const data = await Producto.aggregate([
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
    {
      $addFields: {
        faltante: { $subtract: ['$stockMinimo', '$stock'] },
      },
    },
    { $match: { $expr: { $lte: ['$stock', '$stockMinimo'] } } },
    {
      $project: {
        _id: 1,
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
  ]);

  res.json({
    success: true,
    total: data.length,
    data,
  });
});

const ventasPorCategoria = asyncHandler(async (req, res) => {
  const match = construirMatchVentas(req.query, 'COMPLETADA');

  const data = await Venta.aggregate([
    { $match: match },
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
        _id: 0,
        categoria: '$_id',
        cantidadVendida: 1,
        ingresos: { $round: ['$ingresos', 2] },
        numeroVentas: 1,
        ticketPromedio: { $round: [{ $divide: ['$ingresos', '$numeroVentas'] }, 2] },
      },
    },
    { $sort: { ingresos: -1 } },
  ]);

  res.json({ success: true, total: data.length, data });
});

const ventasPorMes = asyncHandler(async (req, res) => {
  const match = construirMatchVentas(req.query, 'COMPLETADA');

  const data = await Venta.aggregate([
    { $match: match },
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
        _id: 0,
        periodo: '$_id',
        numeroVentas: 1,
        subtotal: { $round: ['$subtotal', 2] },
        igv: { $round: ['$igv', 2] },
        total: { $round: ['$total', 2] },
      },
    },
    { $sort: { periodo: -1 } },
  ]);

  res.json({ success: true, total: data.length, data });
});

const resumenGeneral = asyncHandler(async (_req, res) => {
  const [clientes, productos, proveedores, ventas, resumenVentas, porEstado] = await Promise.all([
    Cliente.countDocuments(),
    Producto.countDocuments(),
    Proveedor.countDocuments(),
    Venta.countDocuments(),
    Venta.aggregate([
      { $match: { estado: 'COMPLETADA' } },
      {
        $group: {
          _id: null,
          totalVendido: { $sum: '$total' },
          subtotal: { $sum: '$subtotal' },
          igv: { $sum: '$igv' },
          promedio: { $avg: '$total' },
        },
      },
      { $project: { _id: 0 } },
    ]),
    Venta.aggregate([
      { $group: { _id: '$estado', cantidad: { $sum: 1 }, total: { $sum: '$total' } } },
      { $project: { _id: 0, estado: '$_id', cantidad: 1, total: { $round: ['$total', 2] } } },
      { $sort: { cantidad: -1 } },
    ]),
  ]);

  const criticos = await Producto.countDocuments({
    estado: 'ACTIVO',
    $expr: { $lte: ['$stock', '$stockMinimo'] },
  });

  res.json({
    success: true,
    data: {
      colecciones: { clientes, productos, proveedores, ventas },
      ventas: resumenVentas[0] || { totalVendido: 0, subtotal: 0, igv: 0, promedio: 0 },
      ventasPorEstado: porEstado,
      productosStockCritico: criticos,
    },
  });
});

module.exports = {
  reporteVentas,
  productosMasVendidos,
  stockCritico,
  ventasPorCategoria,
  ventasPorMes,
  resumenGeneral,
};
