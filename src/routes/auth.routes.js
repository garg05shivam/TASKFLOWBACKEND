/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */


const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const validate = require("../middlewares/validation.middleware");
const { verify } = require("../controllers/auth.controller");
const {
  registerValidation,
  loginValidation,
} = require("../utils/auth.validation");

router.post("/verify", verify);
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

module.exports = router;
