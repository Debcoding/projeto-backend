'use strict';

const { Router } = require('express');

const router = Router();

router.use('/user', require('./userRoutes'));
router.use('/category', require('./categoryRoutes'));
router.use('/product', require('./productRoutes'));

module.exports = router;
