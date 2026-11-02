const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Proveedor = require('../models/Proveedor');
const Venta = require('../models/Venta');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const { obtenerPaginacion } = require('../utils/paginacion');

const CAMPOS_PRODUCTO = [
  'codigo',
  'nombre',
  'descripcion',
  'categoria',
  'marca',
  'proveedor',
  'especificaciones',
  'precioCompra',
  'precioVenta',
  'stock',
  'stockMinimo',
  'estado',
];

const seleccionarDatos = (body) =>
  CAMPOS_PRODUCTO.reduce((datos, campo) => {
    if (body[campo] !== undefined) {
      datos[campo] = body[campo];
    }
    return datos;
  }, {});

const validarProveedor = async (proveedorId) => {
  if (!mongoose.isValidObjectId(proveedorId)) {
    throw new HttpError(400, 'El identificador del proveedor no es válido');
  }

  const proveedor = await Proveedor.findById(proveedorId);
  if (!proveedor) {
    throw new HttpError(404, 'Proveedor no encontrado');
  }

  return proveedor;
};

const listar = asyncHandler(async (req, res) => {
  const { categoria, marca, buscar, stockBajo, estado, proveedor } = req.query;
  const { page, limit, skip } = obtenerPaginacion(req.query);
  const filtro = {};

  if (categoria) filtro.categoria = categoria;
  if (marca) filtro.marca = { $regex: `^${marca}$`, $options: 'i' };
  if (estado) filtro.estado = estado;
  if (proveedor) {
    if (!mongoose.isValidObjectId(proveedor)) {
      throw new HttpError(400, 'El identificador del proveedor no es válido');
    }
    filtro.proveedor = proveedor;
  }
  if (buscar) {
    filtro.$or = [
      { codigo: { $regex: buscar, $options: 'i' } },
      { nombre: { $regex: buscar, $options: 'i' } },
      { descripcion: { $regex: buscar, $options: 'i' } },
    ];
  }
  if (String(stockBajo).toLowerCase() === 'true') {
    filtro.$expr = { $lte: ['$stock', '$stockMinimo'] };
  }

  const [data, total] = await Promise.all([
    Producto.find(filtro)
      .populate('proveedor', 'razonSocial ruc contacto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Producto.countDocuments(filtro),
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
  const producto = await Producto.findById(req.params.id).populate(
    'proveedor',
    'razonSocial ruc contacto direccion'
  );

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado');
  }

  res.json({ success: true, data: producto });
});

const crear = asyncHandler(async (req, res) => {
  const datos = seleccionarDatos(req.body);

  if (!datos.proveedor) {
    throw new HttpError(400, 'El proveedor es obligatorio');
  }

  await validarProveedor(datos.proveedor);

  const producto = await Producto.create(datos);
  await producto.populate('proveedor', 'razonSocial ruc contacto');

  res.status(201).json({
    success: true,
    message: 'Producto registrado correctamente',
    data: producto,
  });
});

const actualizar = asyncHandler(async (req, res) => {
  const datos = seleccionarDatos(req.body);

  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'No se enviaron campos para actualizar');
  }

  if (datos.proveedor) {
    await validarProveedor(datos.proveedor);
  }

  const producto = await Producto.findByIdAndUpdate(req.params.id, datos, {
    new: true,
    runValidators: true,
  }).populate('proveedor', 'razonSocial ruc contacto');

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado');
  }

  res.json({
    success: true,
    message: 'Producto actualizado correctamente',
    data: producto,
  });
});

const eliminar = asyncHandler(async (req, res) => {
  const producto = await Producto.findById(req.params.id);

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado');
  }

  const tieneVentas = await Venta.exists({ 'detalles.producto': producto._id });
  if (tieneVentas) {
    throw new HttpError(
      409,
      'No se puede eliminar el producto porque tiene ventas asociadas. Cambie su estado a INACTIVO.'
    );
  }

  await producto.deleteOne();

  res.json({
    success: true,
    message: 'Producto eliminado correctamente',
    data: producto,
  });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
