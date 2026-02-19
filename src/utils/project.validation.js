const { body, param } = require("express-validator");

const createProjectValidation = [
  body("name")
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ min: 3 })
    .withMessage("Project name must be at least 3 characters long"),
];

const updateProjectValidation = [
  body("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Project name must be at least 3 characters long"),
];

const projectIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid project ID"),
];

module.exports = {
  createProjectValidation,
  updateProjectValidation,
  projectIdValidation,
};
