const express = require('express');
const controlador = require('../controllers/reportesController');

const router = express.Router();

router.get('/resumen', controlador.resumenGeneral);
router.get('/ventas', controlador.reporteVentas);
router.get('/productos-mas-vendidos', controlador.productosMasVendidos);
router.get('/stock-critico', controlador.stockCritico);
router.get('/ventas-por-categoria', controlador.ventasPorCategoria);
router.get('/ventas-por-mes', controlador.ventasPorMes);

module.exports = router;
