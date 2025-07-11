// src/routes/auth.routes.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generarToken } from '../helpers/jwt.js';
import { agregarATokenBlacklist } from '../helpers/tokenBlacklist.js';
import { pool } from "../db.js";
import { tenantMiddleware } from '../middlewares/tenant.middleware.js';

const router = Router();


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autenticación de usuario
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tenant que realiza la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retorna el token JWT
 */
router.post('/login',tenantMiddleware, async (req, res) => {
  const { correo, password } = req.body;

  //obtener los usuarios de la base de datos para comparacion y logeo
  const response = await pool.query("SELECT * FROM identity.users WHERE email = $1", [correo]);
  
  //const responseTenant = await pool.query("SELECT * FROM config.tenants WHERE id = $1", [response.rows[0].tenant_id]);
  //console.log(responseTenant);
  const usuario = response.rows.find(u => u.email === correo && u.password === password);
  if (!usuario ) {//|| !bcrypt.compareSync(password, usuario.email)
    return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
  }

  const token = generarToken(usuario);
  res.json({ token });
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Cerrar sesión (logout)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada
 */
router.post('/logout', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    agregarATokenBlacklist(token);
  }
  res.json({ mensaje: 'Sesión cerrada correctamente' });
});

export default router;
