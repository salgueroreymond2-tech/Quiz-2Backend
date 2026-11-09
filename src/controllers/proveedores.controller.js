import * as proveedores from '../repositories/proveedores.repository.js';
export async function listar(_req, res) { res.json({ data: await proveedores.listProveedores() }); }
export async function crear(req, res) { res.status(201).json({ data: await proveedores.createProveedor(req.body) }); }
