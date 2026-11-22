'use strict';

/**
 * Armazenamento das imagens dos produtos no disco local.
 * No banco guardamos apenas o caminho RELATIVO (ex.: "products/<uuid>.png");
 * a URL pública é montada em toUrl(). Para usar S3/GCS no futuro, basta
 * trocar a implementação deste módulo.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/** Descobre o formato real do arquivo pelos primeiros bytes (magic numbers). */
function detectExtension(buffer) {
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    return 'png';
  }
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return 'jpg';
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'GIF8') {
    return 'gif';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

/**
 * Decodifica uma imagem em base64 (com ou sem prefixo "data:image/...;base64,"),
 * grava em disco e devolve o caminho relativo.
 * @param {string} content
 * @returns {Promise<string>}
 */
async function saveBase64(content) {
  const base64 = content.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const extension = buffer.length ? detectExtension(buffer) : null;

  if (!extension) {
    throw new AppError('Imagem inválida: envie PNG, JPEG, GIF ou WEBP codificado em base64', 400);
  }

  const relativePath = `products/${crypto.randomUUID()}.${extension}`;
  const absolutePath = path.join(env.uploadDir, relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);
  return relativePath;
}

/** Remove um arquivo (ignora se já não existir). */
async function remove(relativePath) {
  const absolutePath = path.resolve(env.uploadDir, relativePath);
  // Proteção extra: nunca apagar nada fora da pasta de uploads.
  if (!absolutePath.startsWith(env.uploadDir + path.sep)) return;

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

/** URL pública da imagem (servida por express.static em /media). */
function toUrl(relativePath) {
  return `${env.appUrl}/media/${relativePath}`;
}

module.exports = { saveBase64, remove, toUrl };
