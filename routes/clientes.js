const express = require('express');
const controlador = require('../controllers/clientesController');

const router = express.Router();

router.get('/', controlador.listar);
router.get('/:id/ventas', controlador.obtenerVentas);
router.get('/:id', controlador.obtener);
router.post('/', controlador.crear);
router.put('/:id', controlador.actualizar);
router.delete('/:id', controlador.eliminar);

module.exports = router;
