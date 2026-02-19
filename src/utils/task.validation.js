const { body, param, query } = require("express-validator");

const createTaskValidation = [
  body("title")
    .notEmpty()
    .withMessage("Task title is required"),

  body("project")
    .isMongoId()
    .withMessage("Invalid project ID"),
];

const updateTaskValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid task ID"),

  body("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid task status"),
];

const taskQueryValidation = [
  query("project")
    .isMongoId()
    .withMessage("Invalid project ID"),
];

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  taskQueryValidation,
};
