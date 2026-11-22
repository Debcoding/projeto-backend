'use strict';

const userService = require('../services/userService');
const authService = require('../services/authService');

/** GET /v1/user/:id */
exports.show = async (req, res) => {
  res.status(200).json(await userService.getById(req.valid.params.id));
};

/** POST /v1/user */
exports.create = async (req, res) => {
  res.status(201).json(await userService.create(req.valid.body));
};

/** PUT /v1/user/:id */
exports.update = async (req, res) => {
  await userService.update(req.valid.params.id, req.valid.body);
  res.status(204).end();
};

/** DELETE /v1/user/:id */
exports.remove = async (req, res) => {
  await userService.remove(req.valid.params.id);
  res.status(204).end();
};

/** POST /v1/user/token */
exports.token = async (req, res) => {
  res.status(200).json(await authService.login(req.valid.body));
};
