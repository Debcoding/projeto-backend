'use strict';

const Joi = require('joi');
const { pagination, fieldsList } = require('./common');

const CATEGORY_FIELDS = ['id', 'name', 'slug', 'use_in_menu'];

/** POST /v1/category e PUT /v1/category/:id */
const body = Joi.object({
  name: Joi.string().trim().max(255).required(),
  slug: Joi.string().trim().max(255).required(),
  use_in_menu: Joi.boolean(),
});

/** GET /v1/category/search */
const search = Joi.object({
  ...pagination,
  fields: fieldsList(CATEGORY_FIELDS),
  use_in_menu: Joi.boolean(),
});

module.exports = { body, search, CATEGORY_FIELDS };
