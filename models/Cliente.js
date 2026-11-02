const mongoose = require('mongoose');

const direccionSchema = new mongoose.Schema(
  {
    calle: { type: String, trim: true, default: '' },
    ciudad: { type: String, trim: true, default: '' },
    departamento: { type: String, trim: true, default: '' },
    pais: { type: String, trim: true, default: 'Perú' },
  },
  { _id: false }
);

const clienteSchema = new mongoose.Schema(
  {
    tipoDocumento: {
      type: String,
      required: [true, 'El tipo de documento es obligatorio'],
      enum: {
        values: ['DNI', 'RUC', 'CE'],
        message: 'Tipo de documento no válido: {VALUE}',
      },
    },
    numeroDocumento: {
      type: String,
      required: [true, 'El número de documento es obligatorio'],
      unique: true,
      trim: true,
      maxlength: [15, 'El número de documento no puede superar los 15 caracteres'],
    },
    nombres: {
      type: String,
      required: [true, 'Los nombres son obligatorios'],
      trim: true,
      maxlength: [100, 'Los nombres no pueden superar los 100 caracteres'],
    },
    apellidos: {
      type: String,
      required: [true, 'Los apellidos son obligatorios'],
      trim: true,
      maxlength: [100, 'Los apellidos no pueden superar los 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El correo electrónico no es válido'],
    },
    telefono: {
      type: String,
      trim: true,
      default: '',
      maxlength: [15, 'El teléfono no puede superar los 15 caracteres'],
    },
    direccion: {
      type: direccionSchema,
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
    collection: 'clientes',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

clienteSchema.virtual('nombreCompleto').get(function nombreCompleto() {
  return `${this.nombres} ${this.apellidos}`.trim();
});

clienteSchema.index({ apellidos: 1, nombres: 1 }, { name: 'idx_clientes_nombres' });
clienteSchema.index({ email: 1 }, { name: 'idx_clientes_email' });
clienteSchema.index({ estado: 1 }, { name: 'idx_clientes_estado' });
clienteSchema.index({ 'direccion.ciudad': 1 }, { name: 'idx_clientes_ciudad' });

module.exports = mongoose.model('Cliente', clienteSchema);
