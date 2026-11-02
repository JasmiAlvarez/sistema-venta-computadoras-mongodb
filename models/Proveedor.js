const mongoose = require('mongoose');

const contactoProveedorSchema = new mongoose.Schema(
  {
    nombre: { type: String, trim: true, default: '' },
    telefono: { type: String, trim: true, default: '' },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El correo electrónico no es válido'],
    },
  },
  { _id: false }
);

const direccionProveedorSchema = new mongoose.Schema(
  {
    calle: { type: String, trim: true, default: '' },
    ciudad: { type: String, trim: true, default: '' },
    departamento: { type: String, trim: true, default: '' },
    pais: { type: String, trim: true, default: 'Perú' },
  },
  { _id: false }
);

const proveedorSchema = new mongoose.Schema(
  {
    razonSocial: {
      type: String,
      required: [true, 'La razón social es obligatoria'],
      trim: true,
      maxlength: [150, 'La razón social no puede superar los 150 caracteres'],
    },
    ruc: {
      type: String,
      required: [true, 'El RUC es obligatorio'],
      unique: true,
      trim: true,
      match: [/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos'],
    },
    contacto: {
      type: contactoProveedorSchema,
      default: () => ({}),
    },
    direccion: {
      type: direccionProveedorSchema,
      default: () => ({}),
    },
    estado: {
      type: String,
      enum: {
        values: ['ACTIVO', 'INACTIVO'],
        message: 'Estado no válido: {VALUE}',
      },
      default: 'ACTIVO',
    },
  },
  {
    timestamps: true,
    collection: 'proveedores',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

proveedorSchema.index({ razonSocial: 'text' }, { name: 'idx_proveedores_razon_social' });
proveedorSchema.index({ estado: 1 }, { name: 'idx_proveedores_estado' });
proveedorSchema.index({ 'direccion.ciudad': 1 }, { name: 'idx_proveedores_ciudad' });

module.exports = mongoose.model('Proveedor', proveedorSchema);
