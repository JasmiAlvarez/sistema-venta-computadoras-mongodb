const mongoose = require('mongoose');
const Proveedor = require('../models/Proveedor');
const Producto = require('../models/Producto');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { obtenerPaginacion } = require('../utils/paginacion');

const CAMPOS_PROVEEDOR = ['razonSocial', 'ruc', 'contacto', 'direccion', 'estado'];

const seleccionarDatos = (body) =>
  CAMPOS_PROVEEDOR.reduce((datos, campo) => {
    if (body[campo] !== undefined) {
      datos[campo] = body[campo];
    }
    return datos;
  }, {});

const listar = asyncHandler(async (req, res) => {
  const { buscar, estado, ciudad } = req.query;
  const { page, limit, skip } = obtenerPaginacion(req.query);
  const filtro = {};

  if (estado) filtro.estado = estado;
  if (ciudad) filtro['direccion.ciudad'] = { $regex: `^${ciudad}$`, $options: 'i' };
  if (buscar) {
    filtro.$or = [
      { razonSocial: { $regex: buscar, $options: 'i' } },
      { ruc: { $regex: buscar, $options: 'i' } },
      { 'contacto.email': { $regex: buscar, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Proveedor.find(filtro).sort({ razonSocial: 1 }).skip(skip).limit(limit),
    Proveedor.countDocuments(filtro),
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
  const proveedor = await Proveedor.findById(req.params.id);

  if (!proveedor) {
    throw new HttpError(404, 'Proveedor no encontrado');
  }

  const totalProductos = await Producto.countDocuments({ proveedor: proveedor._id });

  res.json({
    success: true,
    data: {
      ...proveedor.toObject(),
      totalProductos,
    },
  });
});

const obtenerProductos = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(400, 'El identificador del proveedor no es válido');
  }

  const proveedor = await Proveedor.findById(req.params.id);
  if (!proveedor) {
    throw new HttpError(404, 'Proveedor no encontrado');
  }

  const productos = await Producto.find({ proveedor: proveedor._id }).sort({ nombre: 1 });

  res.json({
    success: true,
    proveedor: {
      id: proveedor._id,
      razonSocial: proveedor.razonSocial,
      ruc: proveedor.ruc,
    },
    total: productos.length,
    data: productos,
  });
});

const crear = asyncHandler(async (req, res) => {
  const datos = seleccionarDatos(req.body);
  const proveedor = await Proveedor.create(datos);

  res.status(201).json({
    success: true,
    message: 'Proveedor registrado correctamente',
    data: proveedor,
  });
});

const actualizar = asyncHandler(async (req, res) => {
  const datos = seleccionarDatos(req.body);

  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'No se enviaron campos para actualizar');
  }

  const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, datos, {
    new: true,
    runValidators: true,
  });

  if (!proveedor) {
    throw new HttpError(404, 'Proveedor no encontrado');
  }

  res.json({
    success: true,
    message: 'Proveedor actualizado correctamente',
    data: proveedor,
  });
});

const eliminar = asyncHandler(async (req, res) => {
  const proveedor = await Proveedor.findById(req.params.id);

  if (!proveedor) {
    throw new HttpError(404, 'Proveedor no encontrado');
  }

  const tieneProductos = await Producto.exists({ proveedor: proveedor._id });
  const desactivar = String(req.query.desactivar).toLowerCase() === 'true';

  if (tieneProductos && !desactivar) {
    throw new HttpError(
      409,
      'No se puede eliminar el proveedor porque tiene productos asociados. Use ?desactivar=true para desactivarlo.'
    );
  }

  if (tieneProductos && desactivar) {
    proveedor.estado = 'INACTIVO';
    await proveedor.save();

    return res.json({
      success: true,
      message: 'El proveedor tiene productos asociados, por lo que fue desactivado lógicamente',
      data: proveedor,
    });
  }

  await proveedor.deleteOne();

  res.json({
    success: true,
    message: 'Proveedor eliminado correctamente',
    data: proveedor,
  });
});

module.exports = { listar, obtener, obtenerProductos, crear, actualizar, eliminar };
