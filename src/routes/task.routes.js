/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get tasks with filtering, pagination and search
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in-progress, done]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of tasks
 */
/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               project:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created
 */

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
