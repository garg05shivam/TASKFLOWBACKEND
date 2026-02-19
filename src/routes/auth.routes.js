const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const validate = require("../middlewares/validation.middleware");
const {
  registerValidation,
  loginValidation,
} = require("../utils/auth.validation");

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

module.exports = router;
