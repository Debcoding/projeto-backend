'use strict';

const categoryService = require('../services/categoryService');

/** GET /v1/category/search */
exports.search = async (req, res) => {
  res.status(200).json(await categoryService.search(req.valid.query));
};

/** GET /v1/category/:id */
exports.show = async (req, res) => {
  res.status(200).json(await categoryService.getById(req.valid.params.id));
};

/** POST /v1/category */
exports.create = async (req, res) => {
  res.status(201).json(await categoryService.create(req.valid.body));
};

/** PUT /v1/category/:id */
exports.update = async (req, res) => {
  await categoryService.update(req.valid.params.id, req.valid.body);
  res.status(204).end();
};

/** DELETE /v1/category/:id */
exports.remove = async (req, res) => {
  await categoryService.remove(req.valid.params.id);
  res.status(204).end();
};
