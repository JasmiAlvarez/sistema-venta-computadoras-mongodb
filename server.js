require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./config/mongodb');
const apiRoutes = require('./routes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    nombre: 'Sistema para Venta de Computadoras - API MongoDB',
    version: '1.0.0',
    documentacion: '/api',
    salud: '/api/health',
  });
});

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    recursos: {
      productos: '/api/productos',
      clientes: '/api/clientes',
      proveedores: '/api/proveedores',
      ventas: '/api/ventas',
      reportes: {
        resumen: '/api/reportes/resumen',
        ventas: '/api/reportes/ventas',
        productosMasVendidos: '/api/reportes/productos-mas-vendidos',
        stockCritico: '/api/reportes/stock-critico',
        ventasPorCategoria: '/api/reportes/ventas-por-categoria',
        ventasPorMes: '/api/reportes/ventas-por-mes',
      },
    },
  });
});

const estadosConexion = ['desconectado', 'conectado', 'conectando', 'desconectando'];

app.get('/api/health', (_req, res) => {
  const estado = mongoose.connection.readyState;

  res.json({
    success: true,
    estado: estado === 1 ? 'OK' : 'DEGRADADO',
    mongodb: estadosConexion[estado] || 'desconocido',
    baseDeDatos: mongoose.connection.name || null,
    fecha: new Date().toISOString(),
    uptimeSegundos: Number(process.uptime().toFixed(2)),
  });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details || null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación de datos';
    details = Object.values(err.errors).map((error) => error.message);
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Identificador o valor no válido: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Ya existe un registro con ese valor único';
    details = err.keyValue;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'El cuerpo de la solicitud no contiene un JSON válido';
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
});

const start = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });

    const apagar = async (senal) => {
      console.log(`\n${senal} recibido. Cerrando servidor...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => apagar('SIGINT'));
    process.on('SIGTERM', () => apagar('SIGTERM'));
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;
