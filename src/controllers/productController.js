'use strict';

const productService = require('../services/productService');

/** GET /v1/product/search */
exports.search = async (req, res) => {
  res.status(200).json(await productService.search(req.valid.query));
};

/** GET /v1/product/:id */
exports.show = async (req, res) => {
  res.status(200).json(await productService.getById(req.valid.params.id));
};

/** POST /v1/product */
exports.create = async (req, res) => {
  res.status(201).json(await productService.create(req.valid.body));
};

/** PUT /v1/product/:id */
exports.update = async (req, res) => {
  await productService.update(req.valid.params.id, req.valid.body);
  res.status(204).end();
};

/** DELETE /v1/product/:id */
exports.remove = async (req, res) => {
  await productService.remove(req.valid.params.id);
  res.status(204).end();
};
