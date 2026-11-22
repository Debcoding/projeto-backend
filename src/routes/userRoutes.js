'use strict';

const { Router } = require('express');
const controller = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { idParams } = require('../validators/common');
const schemas = require('../validators/user');

const router = Router();

// Rotas públicas: cadastro e geração do token.
// (a rota /token deve vir antes de /:id)
router.post('/token', validate(schemas.login), controller.token);
router.post('/', validate(schemas.create), controller.create);
router.get('/:id', validate(idParams, 'params'), controller.show);

// Rotas protegidas: a autenticação roda antes da validação (401 antes de 400).
router.put('/:id', authenticate, validate(idParams, 'params'), validate(schemas.update), controller.update);
router.delete('/:id', authenticate, validate(idParams, 'params'), controller.remove);

module.exports = router;
