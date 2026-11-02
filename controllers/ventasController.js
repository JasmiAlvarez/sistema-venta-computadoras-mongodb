const mongoose = require('mongoose');
const Venta = require('../models/Venta');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { obtenerPaginacion } = require('../utils/paginacion');

const ESTADOS_VALIDOS = ['COMPLETADA', 'ANULADA', 'PENDIENTE'];

const generarNumeroVenta = async (session) => {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);

  const totalDia = await Venta.countDocuments({
    fechaVenta: { $gte: inicio, $lt: fin },
  }).session(session);

  const fecha = [
    inicio.getFullYear(),
    String(inicio.getMonth() + 1).padStart(2, '0'),
    String(inicio.getDate()).padStart(2, '0'),
  ].join('');

  return `VTA-${fecha}-${String(totalDia + 1).padStart(4, '0')}`;
};

const listar = asyncHandler(async (req, res) => {
  const { fechaDesde, fechaHasta, cliente, estado, numero } = req.query;
  const { page, limit, skip } = obtenerPaginacion(req.query);
  const filtro = {};

  if (estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      throw new HttpError(400, `Estado no válido. Use: ${ESTADOS_VALIDOS.join(', ')}`);
    }
    filtro.estado = estado;
  }

  if (cliente) {
    if (!mongoose.isValidObjectId(cliente)) {
      throw new HttpError(400, 'El identificador del cliente no es válido');
    }
    filtro.cliente = cliente;
  }

  if (fechaDesde || fechaHasta) {
    filtro.fechaVenta = {};
    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      if (Number.isNaN(desde.getTime())) {
        throw new HttpError(400, 'La fechaDesde no es válida');
      }
      filtro.fechaVenta.$gte = desde;
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      if (Number.isNaN(hasta.getTime())) {
        throw new HttpError(400, 'La fechaHasta no es válida');
      }
      hasta.setHours(23, 59, 59, 999);
      filtro.fechaVenta.$lte = hasta;
    }
  }

  if (numero) {
    filtro.numeroVenta = { $regex: numero, $options: 'i' };
  }

  const [data, total] = await Promise.all([
    Venta.find(filtro)
      .populate('cliente', 'nombres apellidos numeroDocumento email')
      .sort({ fechaVenta: -1 })
      .skip(skip)
      .limit(limit),
    Venta.countDocuments(filtro),
  ]);

  res.json({
    success: true,
    total,
    page,
    limit,
    paginas: Math.ceil(total / limit) || 0,
    data,
  });
});

const obtener = asyncHandler(async (req, res) => {
  const venta = await Venta.findById(req.params.id)
    .populate('cliente', 'nombres apellidos numeroDocumento email telefono direccion')
    .populate('detalles.producto', 'codigo nombre categoria marca precioVenta stock estado');

  if (!venta) {
    throw new HttpError(404, 'Venta no encontrada');
  }

  res.json({ success: true, data: venta });
});

const crear = asyncHandler(async (req, res) => {
  const { cliente, vendedor, fechaVenta, detalles, observaciones, estado } = req.body;

  if (!mongoose.isValidObjectId(cliente)) {
    throw new HttpError(400, 'El identificador del cliente no es válido');
  }

  if (!vendedor || !vendedor.nombre) {
    throw new HttpError(400, 'Los datos del vendedor son obligatorios');
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    throw new HttpError(400, 'La venta debe incluir al menos un detalle');
  }

  const estadoFinal = estado || 'COMPLETADA';
  if (!ESTADOS_VALIDOS.includes(estadoFinal) || estadoFinal === 'ANULADA') {
    throw new HttpError(400, 'Una venta nueva solo puede registrarse como COMPLETADA o PENDIENTE');
  }

  const session = await mongoose.startSession();
  let ventaId;

  try {
    ventaId = await session.withTransaction(async () => {
      const clienteDoc = await Cliente.findOne({ _id: cliente, estado: 'ACTIVO' }).session(session);
      if (!clienteDoc) {
        throw new HttpError(404, 'Cliente no encontrado o inactivo');
      }

      const detallesCalculados = [];

      for (const item of detalles) {
        if (!item || !mongoose.isValidObjectId(item.producto)) {
          throw new HttpError(400, 'Cada detalle debe incluir un producto válido');
        }

        const cantidad = Number(item.cantidad);
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          throw new HttpError(400, 'La cantidad de cada detalle debe ser un entero mayor a cero');
        }

        const producto = await Producto.findOneAndUpdate(
          { _id: item.producto, estado: 'ACTIVO', stock: { $gte: cantidad } },
          { $inc: { stock: -cantidad } },
          { new: true, session }
        );

        if (!producto) {
          const existe = await Producto.findById(item.producto).session(session);
          if (!existe) {
            throw new HttpError(404, `Producto no encontrado: ${item.producto}`);
          }
          if (existe.estado !== 'ACTIVO') {
            throw new HttpError(409, `El producto ${existe.codigo} está inactivo`);
          }
          throw new HttpError(
            409,
            `Stock insuficiente para ${existe.codigo}. Disponible: ${existe.stock}, solicitado: ${cantidad}`
          );
        }

        const precioUnitario =
          item.precioUnitario !== undefined ? Number(item.precioUnitario) : producto.precioVenta;

        if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
          throw new HttpError(400, 'El precio unitario no es válido');
        }

        detallesCalculados.push({
          producto: producto._id,
          codigoProducto: producto.codigo,
          nombreProducto: producto.nombre,
          cantidad,
          precioUnitario,
          subtotal: Number((cantidad * precioUnitario).toFixed(2)),
        });
      }

      const numeroVenta = await generarNumeroVenta(session);

      const [venta] = await Venta.create(
        [
          {
            numeroVenta,
            cliente: clienteDoc._id,
            vendedor: {
              nombre: vendedor.nombre,
              documento: vendedor.documento || '',
              cargo: vendedor.cargo || 'Vendedor',
            },
            fechaVenta: fechaVenta ? new Date(fechaVenta) : new Date(),
            detalles: detallesCalculados,
            observaciones,
            estado: estadoFinal,
          },
        ],
        { session }
      );

      return venta._id;
    });
  } finally {
    await session.endSession();
  }

  const venta = await Venta.findById(ventaId)
    .populate('cliente', 'nombres apellidos numeroDocumento email')
    .populate('detalles.producto', 'codigo nombre categoria marca precioVenta stock');

  res.status(201).json({
    success: true,
    message: 'Venta registrada correctamente y stock actualizado',
    data: venta,
  });
});

const actualizar = asyncHandler(async (req, res) => {
  const { estado, observaciones, fechaVenta, vendedor, detalles } = req.body;

  if (detalles !== undefined) {
    throw new HttpError(
      400,
      'Los detalles no se modifican directamente. Anule la venta y registre una nueva.'
    );
  }

  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
    throw new HttpError(400, `Estado no válido. Use: ${ESTADOS_VALIDOS.join(', ')}`);
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const venta = await Venta.findById(req.params.id).session(session);
      if (!venta) {
        throw new HttpError(404, 'Venta no encontrada');
      }

      if (estado !== undefined && estado !== venta.estado) {
        if (estado === 'ANULADA' && venta.estado !== 'ANULADA') {
          for (const detalle of venta.detalles) {
            await Producto.updateOne(
              { _id: detalle.producto },
              { $inc: { stock: detalle.cantidad } },
              { session }
            );
          }
        }

        if (venta.estado === 'ANULADA' && estado === 'COMPLETADA') {
          for (const detalle of venta.detalles) {
            const producto = await Producto.findOneAndUpdate(
              { _id: detalle.producto, stock: { $gte: detalle.cantidad } },
              { $inc: { stock: -detalle.cantidad } },
              { new: true, session }
            );

            if (!producto) {
              throw new HttpError(
                409,
                `No hay stock suficiente para reactivar la venta del producto ${detalle.codigoProducto}`
              );
            }
          }
        }

        venta.estado = estado;
      }

      if (observaciones !== undefined) venta.observaciones = observaciones;
      if (fechaVenta !== undefined) venta.fechaVenta = new Date(fechaVenta);
      if (vendedor !== undefined) {
        if (!vendedor.nombre) {
          throw new HttpError(400, 'El nombre del vendedor es obligatorio');
        }
        venta.vendedor = {
          nombre: vendedor.nombre,
          documento: vendedor.documento || '',
          cargo: vendedor.cargo || 'Vendedor',
        };
      }

      await venta.save({ session });
    });
  } finally {
    await session.endSession();
  }

  const venta = await Venta.findById(req.params.id)
    .populate('cliente', 'nombres apellidos numeroDocumento email')
    .populate('detalles.producto', 'codigo nombre categoria marca precioVenta stock');

  res.json({
    success: true,
    message: 'Venta actualizada correctamente',
    data: venta,
  });
});

const eliminar = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const venta = await Venta.findById(req.params.id).session(session);
      if (!venta) {
        throw new HttpError(404, 'Venta no encontrada');
      }

      if (venta.estado !== 'ANULADA') {
        for (const detalle of venta.detalles) {
          await Producto.updateOne(
            { _id: detalle.producto },
            { $inc: { stock: detalle.cantidad } },
            { session }
          );
        }
      }

      await venta.deleteOne({ session });
    });
  } finally {
    await session.endSession();
  }

  res.json({
    success: true,
    message: 'Venta eliminada correctamente y stock restituido',
  });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
