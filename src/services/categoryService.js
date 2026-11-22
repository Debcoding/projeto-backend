'use strict';

const { Category } = require('../models');
const AppError = require('../utils/AppError');
const { CATEGORY_FIELDS } = require('../validators/category');

const serialize = (category) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  use_in_menu: category.use_in_menu,
});

async function findOrFail(id) {
  const category = await Category.findByPk(id);
  if (!category) throw new AppError('Categoria não encontrada', 404);
  return category;
}

/**
 * Lista paginada. limit = -1 retorna tudo (page é ignorado).
 * "fields" limita as colunas selecionadas direto na query.
 */
async function search({ limit, page, fields, use_in_menu: useInMenu }) {
  const where = {};
  if (useInMenu !== undefined) where.use_in_menu = useInMenu;

  const options = {
    where,
    attributes: fields || CATEGORY_FIELDS,
    order: [['id', 'ASC']],
  };
  if (limit !== -1) {
    options.limit = limit;
    options.offset = (page - 1) * limit;
  }

  const [rows, total] = await Promise.all([Category.findAll(options), Category.count({ where })]);

  return {
    data: rows.map((row) => row.toJSON()),
    total,
    limit,
    page: limit === -1 ? 1 : page,
  };
}

async function getById(id) {
  return serialize(await findOrFail(id));
}

async function create(payload) {
  const category = await Category.create(payload);
  return serialize(category);
}

async function update(id, payload) {
  const category = await findOrFail(id);
  await category.update(payload);
}

async function remove(id) {
  const category = await findOrFail(id);
  await category.destroy();
}

module.exports = { search, getById, create, update, remove };
