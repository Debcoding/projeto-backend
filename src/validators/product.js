'use strict';

const Joi = require('joi');
const { pagination, fieldsList, integerList } = require('./common');

const PRODUCT_FIELDS = [
  'id',
  'enabled',
  'name',
  'slug',
  'use_in_menu',
  'stock',
  'description',
  'price',
  'price_with_discount',
  'category_ids',
  'images',
  'options',
];

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const id = Joi.number().integer().positive();

/**
 * Item do array "images".
 *  - criação:   { type, content(base64) }
 *  - atualização: sem id = nova imagem; { id, deleted: true } = remove;
 *                 { id, content } = troca (base64) ou mantém (URL já existente).
 */
const imageItem = (allowExisting) =>
  Joi.object({
    id,
    type: Joi.string().valid(...IMAGE_TYPES),
    content: Joi.string().min(1),
    deleted: Joi.boolean(),
  }).custom((item, helpers) => {
    if (item.id === undefined) {
      if (!item.content) return helpers.message('Nova imagem exige o campo content (base64)');
      return item;
    }
    if (!allowExisting) return helpers.message('Não é possível informar id de imagem na criação');
    if (!item.deleted && !item.content) {
      return helpers.message('Imagem existente exige content ou deleted: true');
    }
    return item;
  });

const optionValues = Joi.array().items(Joi.string().trim().min(1).max(100).pattern(/^[^,]+$/)).min(1);

/**
 * Item do array "options". "values" (ou "value") é uma lista de strings.
 * Na atualização, itens com id alteram parcialmente a opção existente.
 */
const optionItem = (allowExisting) =>
  Joi.object({
    id,
    deleted: Joi.boolean(),
    title: Joi.string().trim().max(255),
    shape: Joi.string().valid('square', 'circle'),
    // aceita 4 ou "4px"
    radius: Joi.alternatives().try(
      Joi.number().integer().min(0),
      Joi.string().pattern(/^\d+(px)?$/),
    ),
    type: Joi.string().valid('text', 'color'),
    values: optionValues,
    value: optionValues,
  }).custom((item, helpers) => {
    if (item.id === undefined) {
      if (!item.title || !(item.values || item.value)) {
        return helpers.message('Nova opção exige title e values');
      }
      return item;
    }
    if (!allowExisting) return helpers.message('Não é possível informar id de opção na criação');
    return item;
  });

const scalarFields = {
  enabled: Joi.boolean(),
  name: Joi.string().trim().max(255),
  slug: Joi.string().trim().max(255),
  use_in_menu: Joi.boolean(),
  stock: Joi.number().integer().min(0),
  description: Joi.string().allow('').max(255),
  price: Joi.number().min(0),
  price_with_discount: Joi.number().min(0),
  category_ids: Joi.array().items(id).unique(),
};

/** POST /v1/product */
const create = Joi.object({
  ...scalarFields,
  images: Joi.array().items(imageItem(false)),
  options: Joi.array().items(optionItem(false)),
}).fork(['name', 'slug', 'price', 'price_with_discount'], (schema) => schema.required());

/** PUT /v1/product/:id (campos omitidos permanecem inalterados) */
const update = Joi.object({
  ...scalarFields,
  images: Joi.array().items(imageItem(true)),
  options: Joi.array().items(optionItem(true)),
});

/** "100-200" -> { min: 100, max: 200 } */
const priceRange = Joi.string().custom((value, helpers) => {
  const match = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(value);
  if (!match || Number(match[1]) > Number(match[2])) {
    return helpers.message('price-range deve ter o formato min-max (ex.: 100-200)');
  }
  return { min: Number(match[1]), max: Number(match[2]) };
});

/** GET /v1/product/search */
const search = Joi.object({
  ...pagination,
  fields: fieldsList(PRODUCT_FIELDS),
  match: Joi.string().trim().max(100),
  category_ids: integerList,
  'price-range': priceRange,
  // option[45]=GG,PP  ->  { option: { 45: 'GG,PP' } }
  option: Joi.object().pattern(/^\d+$/, Joi.string().max(255)),
});

module.exports = { create, update, search, PRODUCT_FIELDS };
