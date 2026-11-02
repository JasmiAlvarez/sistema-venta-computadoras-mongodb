const mongoose = require('mongoose');

const especificacionesSchema = new mongoose.Schema(
  {
    procesador: { type: String, trim: true, default: '' },
    ram: { type: String, trim: true, default: '' },
    almacenamiento: { type: String, trim: true, default: '' },
    tarjetaGrafica: { type: String, trim: true, default: '' },
    pantalla: { type: String, trim: true, default: '' },
    sistemaOperativo: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const productoSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: [true, 'El código del producto es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'El código no puede superar los 20 caracteres'],
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      maxlength: [150, 'El nombre no puede superar los 150 caracteres'],
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'La descripción no puede superar los 500 caracteres'],
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      trim: true,
      enum: {
        values: [
          'Laptops',
          'Desktops',
          'Monitores',
          'Periféricos',
          'Componentes',
          'Almacenamiento',
          'Redes',
          'Impresoras',
          'Accesorios',
        ],
        message: 'Categoría no válida: {VALUE}',
      },
    },
    marca: {
      type: String,
      required: [true, 'La marca es obligatoria'],
      trim: true,
    },
    proveedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proveedor',
      required: [true, 'El proveedor es obligatorio'],
    },
    especificaciones: {
      type: especificacionesSchema,
      default: () => ({}),
    },
    precioCompra: {
      type: Number,
      required: [true, 'El precio de compra es obligatorio'],
      min: [0, 'El precio de compra no puede ser negativo'],
    },
    precioVenta: {
      type: Number,
      required: [true, 'El precio de venta es obligatorio'],
      min: [0, 'El precio de venta no puede ser negativo'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
      validate: {
        validator: Number.isInteger,
        message: 'El stock debe ser un número entero',
      },
    },
    stockMinimo: {
      type: Number,
      default: 5,
      min: [0, 'El stock mínimo no puede ser negativo'],
      validate: {
        validator: Number.isInteger,
        message: 'El stock mínimo debe ser un número entero',
      },
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
    collection: 'productos',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productoSchema.virtual('stockCritico').get(function stockCritico() {
  return this.stock <= this.stockMinimo;
});

productoSchema.index({ nombre: 'text', descripcion: 'text' }, { name: 'idx_productos_texto' });
productoSchema.index({ categoria: 1, marca: 1 }, { name: 'idx_productos_categoria_marca' });
productoSchema.index({ estado: 1, stock: 1 }, { name: 'idx_productos_estado_stock' });
productoSchema.index({ proveedor: 1 }, { name: 'idx_productos_proveedor' });
productoSchema.index({ precioVenta: 1 }, { name: 'idx_productos_precio_venta' });

module.exports = mongoose.model('Producto', productoSchema);
