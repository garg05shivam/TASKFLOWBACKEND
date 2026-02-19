const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  createTaskValidation,
  updateTaskValidation,
  taskQueryValidation,
} = require("../utils/task.validation");

const {
  create,
  getAll,
  update,
  remove,
} = require("../controllers/task.controller");

// Create Task
router.post(
  "/",
  protect,
  createTaskValidation,
  validate,
  create
);

// Get Tasks (with filtering + pagination)
router.get(
  "/",
  protect,
  taskQueryValidation,
  validate,
  getAll
);

// Update Task
router.put(
  "/:id",
  protect,
  updateTaskValidation,
  validate,
  update
);

// Delete Task
router.delete(
  "/:id",
  protect,
  updateTaskValidation,
  validate,
  remove
);

module.exports = router;
