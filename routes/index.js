const express = require('express');

const productos = require('./productos');
const clientes = require('./clientes');
const proveedores = require('./proveedores');
const ventas = require('./ventas');
const reportes = require('./reportes');

const router = express.Router();

router.use('/productos', productos);
router.use('/clientes', clientes);
router.use('/proveedores', proveedores);
router.use('/ventas', ventas);
router.use('/reportes', reportes);

module.exports = router;
