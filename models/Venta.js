const mongoose = require('mongoose');

const vendedorSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del vendedor es obligatorio'],
      trim: true,
    },
    documento: { type: String, trim: true, default: '' },
    cargo: { type: String, trim: true, default: 'Vendedor' },
  },
  { _id: false }
);

const detalleVentaSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: [true, 'El producto del detalle es obligatorio'],
    },
    codigoProducto: {
      type: String,
      required: [true, 'El código del producto es obligatorio'],
      trim: true,
      uppercase: true,
    },
    nombreProducto: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad debe ser mayor a cero'],
      validate: {
        validator: Number.isInteger,
        message: 'La cantidad debe ser un número entero',
      },
    },
    precioUnitario: {
      type: Number,
      required: [true, 'El precio unitario es obligatorio'],
      min: [0, 'El precio unitario no puede ser negativo'],
    },
    subtotal: {
      type: Number,
      required: [true, 'El subtotal del detalle es obligatorio'],
      min: [0, 'El subtotal no puede ser negativo'],
    },
  },
  { _id: false }
);

const ventaSchema = new mongoose.Schema(
  {
    numeroVenta: {
      type: String,
      required: [true, 'El número de venta es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: [true, 'El cliente es obligatorio'],
    },
    vendedor: {
      type: vendedorSchema,
      required: [true, 'Los datos del vendedor son obligatorios'],
    },
    fechaVenta: {
      type: Date,
      default: Date.now,
    },
    detalles: {
      type: [detalleVentaSchema],
      validate: {
        validator: (detalles) => Array.isArray(detalles) && detalles.length > 0,
        message: 'La venta debe tener al menos un detalle',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'El subtotal no puede ser negativo'],
    },
    igv: {
      type: Number,
      required: true,
      min: [0, 'El IGV no puede ser negativo'],
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'El total no puede ser negativo'],
    },
    estado: {
      type: String,
      enum: {
        values: ['COMPLETADA', 'ANULADA', 'PENDIENTE'],
        message: 'Estado no válido: {VALUE}',
      },
      default: 'COMPLETADA',
    },
    observaciones: {
      type: String,
      trim: true,
      default: '',
      maxlength: [255, 'Las observaciones no pueden superar los 255 caracteres'],
    },
  },
  {
    timestamps: true,
    collection: 'ventas',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ventaSchema.virtual('cantidadItems').get(function cantidadItems() {
  return this.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
});

ventaSchema.pre('validate', function calcularTotales() {
  if (Array.isArray(this.detalles) && this.detalles.length > 0) {
    this.detalles.forEach((detalle) => {
      if (Number.isFinite(detalle.cantidad) && Number.isFinite(detalle.precioUnitario)) {
        detalle.subtotal = Number((detalle.cantidad * detalle.precioUnitario).toFixed(2));
      }
    });

    this.subtotal = Number(
      this.detalles.reduce((total, detalle) => total + (detalle.subtotal || 0), 0).toFixed(2)
    );
    this.igv = Number((this.subtotal * 0.18).toFixed(2));
    this.total = Number((this.subtotal + this.igv).toFixed(2));
  }
});

ventaSchema.index({ cliente: 1, fechaVenta: -1 }, { name: 'idx_ventas_cliente_fecha' });
ventaSchema.index({ fechaVenta: -1 }, { name: 'idx_ventas_fecha' });
ventaSchema.index({ estado: 1 }, { name: 'idx_ventas_estado' });
ventaSchema.index({ 'detalles.producto': 1 }, { name: 'idx_ventas_producto' });
ventaSchema.index({ total: -1 }, { name: 'idx_ventas_total' });

module.exports = mongoose.model('Venta', ventaSchema);
