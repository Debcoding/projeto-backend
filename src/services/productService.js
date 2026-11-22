'use strict';

const { Op } = require('sequelize');
const {
  sequelize,
  Product,
  Category,
  ProductImage,
  ProductOption,
  ProductCategory,
} = require('../models');
const AppError = require('../utils/AppError');
const imageStorage = require('./imageStorage');

const PRODUCT_COLUMNS = [
  'id',
  'enabled',
  'name',
  'slug',
  'use_in_menu',
  'stock',
  'description',
  'price',
  'price_with_discount',
];
const SCALAR_FIELDS = PRODUCT_COLUMNS.filter((column) => column !== 'id');
const RELATION_FIELDS = ['category_ids', 'images', 'options'];
const URL_PATTERN = /^https?:\/\//i;

/* -------------------------------------------------------------------------- */
/* Serialização                                                               */
/* -------------------------------------------------------------------------- */

const serializeImage = (image) => ({ id: image.id, content: imageStorage.toUrl(image.path) });

const serializeOption = (option) => ({
  id: option.id,
  title: option.title,
  shape: option.shape,
  radius: option.radius,
  type: option.type,
  values: option.option_values.split(','),
});

/** Mantém apenas as chaves pedidas em ?fields= (ou tudo, se não houver). */
const pick = (object, keys) =>
  keys ? Object.fromEntries(keys.map((key) => [key, object[key]])) : object;

/** Copia apenas os campos escalares presentes no payload. */
const pickScalars = (payload) =>
  Object.fromEntries(
    SCALAR_FIELDS.filter((field) => payload[field] !== undefined).map((field) => [
      field,
      payload[field],
    ]),
  );

/** Converte um item de option do payload nas colunas da tabela. */
function toOptionColumns(item) {
  const columns = {};
  if (item.title !== undefined) columns.title = item.title;
  if (item.shape !== undefined) columns.shape = item.shape;
  if (item.type !== undefined) columns.type = item.type;
  if (item.radius !== undefined) columns.radius = parseInt(item.radius, 10); // 4 ou "4px"

  const list = item.values ?? item.value;
  if (list !== undefined) {
    const joined = list.join(',');
    if (joined.length > 1000) throw new AppError('Os valores da opção excedem 1000 caracteres', 400);
    columns.option_values = joined;
  }
  return columns;
}

/* -------------------------------------------------------------------------- */
/* Leitura                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Carrega imagens, opções e categorias de VÁRIOS produtos com no máximo
 * 3 queries (evita N+1 e o produto cartesiano de JOINs múltiplos).
 */
async function loadRelations(productIds, wanted) {
  const relations = new Map(
    productIds.map((id) => [id, { category_ids: [], images: [], options: [] }]),
  );
  if (productIds.length === 0) return relations;

  const where = { product_id: productIds };
  const [images, options, links] = await Promise.all([
    wanted.has('images') ? ProductImage.findAll({ where, order: [['id', 'ASC']] }) : [],
    wanted.has('options') ? ProductOption.findAll({ where, order: [['id', 'ASC']] }) : [],
    wanted.has('category_ids')
      ? ProductCategory.findAll({ where, order: [['category_id', 'ASC']] })
      : [],
  ]);

  images.forEach((image) => relations.get(image.product_id).images.push(serializeImage(image)));
  options.forEach((option) => relations.get(option.product_id).options.push(serializeOption(option)));
  links.forEach((link) => relations.get(link.product_id).category_ids.push(link.category_id));

  return relations;
}

async function getById(id) {
  const product = await Product.findByPk(id, { attributes: PRODUCT_COLUMNS });
  if (!product) throw new AppError('Produto não encontrado', 404);

  const relations = await loadRelations([product.id], new Set(RELATION_FIELDS));
  return { ...product.toJSON(), ...relations.get(product.id) };
}

/** IDs de produtos cujas opções (por id da opção) contêm algum dos valores pedidos. */
async function productIdsByOptions(optionFilter) {
  const optionIds = Object.keys(optionFilter).map(Number);
  const rows = await ProductOption.findAll({
    where: { id: optionIds },
    attributes: ['id', 'product_id', 'option_values'],
  });

  const matchedByProduct = new Map();
  rows.forEach((row) => {
    const wanted = optionFilter[row.id].split(',').map((value) => value.trim());
    const available = row.option_values.split(',');
    if (wanted.some((value) => available.includes(value))) {
      if (!matchedByProduct.has(row.product_id)) matchedByProduct.set(row.product_id, new Set());
      matchedByProduct.get(row.product_id).add(row.id);
    }
  });

  // O produto precisa satisfazer TODAS as opções informadas.
  return [...matchedByProduct.entries()]
    .filter(([, matched]) => matched.size === optionIds.length)
    .map(([productId]) => productId);
}

/** Escapa curingas do LIKE (comportamento do MySQL: barra invertida). */
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

/**
 * Busca paginada com filtros: match, category_ids, price-range e option[id].
 * Os filtros viram condições SQL; categorias usam subquery (sem trazer IDs para a aplicação).
 */
async function search(query) {
  const { limit, page, fields, match, category_ids: categoryIds, option } = query;
  const priceRange = query['price-range'];
  const emptyPage = { data: [], total: 0, limit, page: limit === -1 ? 1 : page };

  const conditions = [];

  if (match) {
    const like = `%${escapeLike(match)}%`;
    conditions.push({
      [Op.or]: [{ name: { [Op.like]: like } }, { description: { [Op.like]: like } }],
    });
  }
  if (priceRange) {
    conditions.push({ price: { [Op.between]: [priceRange.min, priceRange.max] } });
  }
  if (categoryIds) {
    // categoryIds já foi validado como lista de inteiros, logo é seguro interpolar.
    conditions.push({
      id: {
        [Op.in]: sequelize.literal(
          `(SELECT product_id FROM product_categories WHERE category_id IN (${categoryIds.join(',')}))`,
        ),
      },
    });
  }
  if (option) {
    const ids = await productIdsByOptions(option);
    if (ids.length === 0) return emptyPage;
    conditions.push({ id: { [Op.in]: ids } });
  }

  const where = conditions.length ? { [Op.and]: conditions } : {};

  // "id" é sempre buscado (necessário para carregar as relações); depois o pick() filtra.
  const attributes = fields
    ? [...new Set(['id', ...fields.filter((field) => PRODUCT_COLUMNS.includes(field))])]
    : PRODUCT_COLUMNS;

  const queryOptions = { where, attributes, order: [['id', 'ASC']] };
  if (limit !== -1) {
    queryOptions.limit = limit;
    queryOptions.offset = (page - 1) * limit;
  }

  const [rows, total] = await Promise.all([Product.findAll(queryOptions), Product.count({ where })]);

  const wanted = new Set(
    fields ? fields.filter((field) => RELATION_FIELDS.includes(field)) : RELATION_FIELDS,
  );
  const relations = await loadRelations(
    rows.map((row) => row.id),
    wanted,
  );

  return {
    data: rows.map((row) => pick({ ...row.toJSON(), ...relations.get(row.id) }, fields)),
    total,
    limit,
    page: limit === -1 ? 1 : page,
  };
}

/* -------------------------------------------------------------------------- */
/* Escrita                                                                    */
/* -------------------------------------------------------------------------- */

async function assertCategoriesExist(categoryIds, transaction) {
  if (!categoryIds || categoryIds.length === 0) return;
  const found = await Category.count({ where: { id: categoryIds }, transaction });
  if (found !== categoryIds.length) {
    throw new AppError('Uma ou mais categorias informadas não existem', 400);
  }
}

/** Substitui todos os vínculos produto <-> categoria. */
async function replaceCategories(productId, categoryIds, transaction) {
  await ProductCategory.destroy({ where: { product_id: productId }, transaction });
  if (categoryIds.length > 0) {
    await ProductCategory.bulkCreate(
      categoryIds.map((categoryId) => ({ product_id: productId, category_id: categoryId })),
      { transaction },
    );
  }
}

/**
 * Aplica o array "images" de um PUT:
 *  - sem id            -> cria nova imagem
 *  - { id, deleted }   -> remove
 *  - { id, content }   -> URL: mantém | base64: substitui o arquivo
 * Arquivos criados/obsoletos são registrados nas listas recebidas para que o
 * chamador limpe o disco conforme o resultado da transação.
 */
async function applyImageChanges(productId, images, { transaction, createdFiles, obsoleteFiles }) {
  const existingIds = images.filter((item) => item.id !== undefined).map((item) => item.id);
  const existing = existingIds.length
    ? await ProductImage.findAll({ where: { product_id: productId, id: existingIds }, transaction })
    : [];
  const byId = new Map(existing.map((image) => [image.id, image]));

  for (const item of images) {
    if (item.id === undefined) {
      const path = await imageStorage.saveBase64(item.content);
      createdFiles.push(path);
      await ProductImage.create({ product_id: productId, path, enabled: true }, { transaction });
      continue;
    }

    const current = byId.get(item.id);
    if (!current) throw new AppError(`A imagem ${item.id} não pertence a este produto`, 400);

    if (item.deleted) {
      obsoleteFiles.push(current.path);
      await current.destroy({ transaction });
    } else if (!URL_PATTERN.test(item.content)) {
      const path = await imageStorage.saveBase64(item.content);
      createdFiles.push(path);
      obsoleteFiles.push(current.path);
      await current.update({ path }, { transaction });
    }
    // content em formato de URL: imagem mantida como está.
  }
}

/** Aplica o array "options" de um PUT (criar / alterar parcialmente / remover). */
async function applyOptionChanges(productId, options, transaction) {
  const existingIds = options.filter((item) => item.id !== undefined).map((item) => item.id);
  const existing = existingIds.length
    ? await ProductOption.findAll({ where: { product_id: productId, id: existingIds }, transaction })
    : [];
  const byId = new Map(existing.map((option) => [option.id, option]));

  for (const item of options) {
    if (item.id === undefined) {
      await ProductOption.create({ product_id: productId, ...toOptionColumns(item) }, { transaction });
      continue;
    }

    const current = byId.get(item.id);
    if (!current) throw new AppError(`A opção ${item.id} não pertence a este produto`, 400);

    if (item.deleted) await current.destroy({ transaction });
    else await current.update(toOptionColumns(item), { transaction });
  }
}

async function create(payload) {
  const createdFiles = [];
  let productId;

  try {
    productId = await sequelize.transaction(async (transaction) => {
      await assertCategoriesExist(payload.category_ids, transaction);

      const product = await Product.create(pickScalars(payload), { transaction });
      await replaceCategories(product.id, payload.category_ids ?? [], transaction);

      for (const image of payload.images ?? []) {
        const path = await imageStorage.saveBase64(image.content);
        createdFiles.push(path);
        await ProductImage.create({ product_id: product.id, path, enabled: true }, { transaction });
      }

      if (payload.options?.length) {
        await ProductOption.bulkCreate(
          payload.options.map((option) => ({ product_id: product.id, ...toOptionColumns(option) })),
          { transaction },
        );
      }

      return product.id;
    });
  } catch (error) {
    // A transação foi revertida: apaga os arquivos já gravados para não deixar lixo no disco.
    await Promise.all(createdFiles.map(imageStorage.remove));
    throw error;
  }

  return getById(productId);
}

async function update(id, payload) {
  const createdFiles = [];
  const obsoleteFiles = [];

  try {
    await sequelize.transaction(async (transaction) => {
      const product = await Product.findByPk(id, { transaction });
      if (!product) throw new AppError('Produto não encontrado', 404);

      await product.update(pickScalars(payload), { transaction });

      if (payload.category_ids) {
        await assertCategoriesExist(payload.category_ids, transaction);
        await replaceCategories(product.id, payload.category_ids, transaction);
      }
      if (payload.images) {
        await applyImageChanges(product.id, payload.images, {
          transaction,
          createdFiles,
          obsoleteFiles,
        });
      }
      if (payload.options) await applyOptionChanges(product.id, payload.options, transaction);
    });
  } catch (error) {
    await Promise.all(createdFiles.map(imageStorage.remove));
    throw error;
  }

  // Só depois do commit removemos os arquivos substituídos/excluídos.
  await Promise.all(obsoleteFiles.map(imageStorage.remove));
}

async function remove(id) {
  const filePaths = [];

  await sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(id, { transaction });
    if (!product) throw new AppError('Produto não encontrado', 404);

    const images = await ProductImage.findAll({
      where: { product_id: id },
      attributes: ['path'],
      transaction,
    });
    filePaths.push(...images.map((image) => image.path));

    // ON DELETE CASCADE remove imagens, opções e vínculos de categoria.
    await product.destroy({ transaction });
  });

  await Promise.all(filePaths.map(imageStorage.remove));
}

module.exports = { search, getById, create, update, remove };
