const { body, param, query } = require("express-validator");

const createTaskValidation = [
  body("title")
    .notEmpty()
    .withMessage("Task title is required"),

  body("project")
    .isMongoId()
    .withMessage("Invalid project ID"),
];

const taskIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid task ID"),
];

const updateTaskValidation = [
  ...taskIdValidation,

  body("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid task status"),
];

const taskQueryValidation = [
  query("project")
    .isMongoId()
    .withMessage("Invalid project ID"),
  query("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid task status"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

module.exports = {
  createTaskValidation,
  taskIdValidation,
  updateTaskValidation,
  taskQueryValidation,
};
