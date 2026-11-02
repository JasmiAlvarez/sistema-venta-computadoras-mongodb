const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');
const Venta = require('../models/Venta');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { obtenerPaginacion } = require('../utils/paginacion');

const CAMPOS_CLIENTE = [
  'tipoDocumento',
  'numeroDocumento',
  'nombres',
  'apellidos',
  'email',
  'telefono',
  'direccion',
  'estado',
];

const seleccionarDatos = (body) =>
  CAMPOS_CLIENTE.reduce((datos, campo) => {
    if (body[campo] !== undefined) {
      datos[campo] = body[campo];
    }
    return datos;
  }, {});

const listar = asyncHandler(async (req, res) => {
  const { buscar, estado, ciudad, tipoDocumento } = req.query;
  const { page, limit, skip } = obtenerPaginacion(req.query);
  const filtro = {};

  if (estado) filtro.estado = estado;
  if (tipoDocumento) filtro.tipoDocumento = tipoDocumento;
  if (ciudad) filtro['direccion.ciudad'] = { $regex: `^${ciudad}$`, $options: 'i' };
  if (buscar) {
    filtro.$or = [
      { nombres: { $regex: buscar, $options: 'i' } },
      { apellidos: { $regex: buscar, $options: 'i' } },
      { numeroDocumento: { $regex: buscar, $options: 'i' } },
      { email: { $regex: buscar, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Cliente.find(filtro).sort({ apellidos: 1, nombres: 1 }).skip(skip).limit(limit),
    Cliente.countDocuments(filtro),
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
  const cliente = await Cliente.findById(req.params.id);

  if (!cliente) {
    throw new HttpError(404, 'Cliente no encontrado');
  }

  res.json({ success: true, data: cliente });
});

const obtenerVentas = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(400, 'El identificador del cliente no es válido');
  }

  const cliente = await Cliente.findById(req.params.id);
  if (!cliente) {
    throw new HttpError(404, 'Cliente no encontrado');
  }

  const ventas = await Venta.find({ cliente: cliente._id })
    .select('numeroVenta fechaVenta subtotal igv total estado detalles')
    .sort({ fechaVenta: -1 });

  res.json({
    success: true,
    cliente: {
      id: cliente._id,
      nombreCompleto: cliente.nombreCompleto,
      numeroDocumento: cliente.numeroDocumento,
    },
    total: ventas.length,
    data: ventas,
  });
});

const crear = asyncHandler(async (req, res) => {
  const datos = seleccionarDatos(req.body);
  const cliente = await Cliente.create(datos);

  res.status(201).json({
    success: true,
    message: 'Cliente registrado correctamente',
    data: cliente,
  });
});

const actualizar = asyncHandler(async (req, res) => {
  const datos = seleccionarDatos(req.body);

  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'No se enviaron campos para actualizar');
  }

  const cliente = await Cliente.findByIdAndUpdate(req.params.id, datos, {
    new: true,
    runValidators: true,
  });

  if (!cliente) {
    throw new HttpError(404, 'Cliente no encontrado');
  }

  res.json({
    success: true,
    message: 'Cliente actualizado correctamente',
    data: cliente,
  });
});

const eliminar = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);

  if (!cliente) {
    throw new HttpError(404, 'Cliente no encontrado');
  }

  const tieneVentas = await Venta.exists({ cliente: cliente._id });
  const desactivar = String(req.query.desactivar).toLowerCase() === 'true';

  if (tieneVentas && !desactivar) {
    throw new HttpError(
      409,
      'No se puede eliminar el cliente porque tiene ventas asociadas. Use ?desactivar=true para desactivarlo.'
    );
  }

  if (tieneVentas && desactivar) {
    cliente.estado = 'INACTIVO';
    await cliente.save();

    return res.json({
      success: true,
      message: 'El cliente tiene ventas asociadas, por lo que fue desactivado lógicamente',
      data: cliente,
    });
  }

  await cliente.deleteOne();

  res.json({
    success: true,
    message: 'Cliente eliminado correctamente',
    data: cliente,
  });
});

module.exports = { listar, obtener, obtenerVentas, crear, actualizar, eliminar };
