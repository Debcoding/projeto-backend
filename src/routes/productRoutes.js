'use strict';

const { Router } = require('express');
const controller = require('../controllers/productController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { idParams } = require('../validators/common');
const schemas = require('../validators/product');

const router = Router();

// /search deve vir antes de /:id
router.get('/search', validate(schemas.search, 'query'), controller.search);
router.get('/:id', validate(idParams, 'params'), controller.show);

router.post('/', authenticate, validate(schemas.create), controller.create);
router.put('/:id', authenticate, validate(idParams, 'params'), validate(schemas.update), controller.update);
router.delete('/:id', authenticate, validate(idParams, 'params'), controller.remove);

module.exports = router;
