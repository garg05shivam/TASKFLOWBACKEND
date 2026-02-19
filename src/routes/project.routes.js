/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 */

const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  createProjectValidation,
  updateProjectValidation,
  projectIdValidation,
} = require("../utils/project.validation");

const {
  create,
  getAll,
  getOne,
  update,
  remove,
} = require("../controllers/project.controller");

// Create Project
router.post(
  "/",
  protect,
  createProjectValidation,
  validate,
  create
);

// Get All Projects
router.get("/", protect, getAll);

// Get Single Project
router.get(
  "/:id",
  protect,
  projectIdValidation,
  validate,
  getOne
);

// Update Project
router.put(
  "/:id",
  protect,
  projectIdValidation,
  updateProjectValidation,
  validate,
  update
);

// Delete Project
router.delete(
  "/:id",
  protect,
  projectIdValidation,
  validate,
  remove
);

module.exports = router;
