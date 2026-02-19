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
const { register, login, verify, resend } = require("../controllers/auth.controller");
const validate = require("../middlewares/validation.middleware");
const {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  resendOtpValidation,
} = require("../utils/auth.validation");

router.post("/verify", verifyOtpValidation, validate, verify);
router.post("/verify-otp", verifyOtpValidation, validate, verify);
router.post("/resend-otp", resendOtpValidation, validate, resend);
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

module.exports = router;
