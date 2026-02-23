const { body } = require("express-validator");

const registerValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

const verifyOtpValidation = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format"),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only digits"),
];

const resendOtpValidation = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format"),
];

module.exports = {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  resendOtpValidation,
};
