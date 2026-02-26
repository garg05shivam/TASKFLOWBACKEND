const express = require("express");
const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const { body, param } = require("express-validator");
const validate = require("../middlewares/validation.middleware");
const {
  changeUserRole,
  changeUserStatus,
  getOverview,
  removeUser,
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/overview", protect, authorize("super_admin"), getOverview);
router.patch(
  "/users/:id/role",
  protect,
  authorize("super_admin"),
  [
    param("id").isMongoId().withMessage("Invalid user id"),
    body("role").isIn(["user", "admin"]).withMessage("Role must be user or admin"),
  ],
  validate,
  changeUserRole
);
router.patch(
  "/users/:id/status",
  protect,
  authorize("super_admin"),
  [
    param("id").isMongoId().withMessage("Invalid user id"),
    body("isActive").isBoolean().withMessage("isActive must be boolean").toBoolean(),
  ],
  validate,
  changeUserStatus
);
router.delete(
  "/users/:id",
  protect,
  authorize("super_admin"),
  param("id").isMongoId().withMessage("Invalid user id"),
  validate,
  removeUser
);

module.exports = router;
