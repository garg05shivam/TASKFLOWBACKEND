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

const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  createTaskValidation,
  taskIdValidation,
  updateTaskValidation,
  taskQueryValidation,
} = require("../utils/task.validation");

const {
  complete,
  create,
  getAnalytics,
  getOne,
  getAll,
  update,
  remove,
} = require("../controllers/task.controller");

// Create Task
router.post("/", protect, createTaskValidation, validate, create);

// Get Tasks (with filtering + pagination)
router.get("/", protect, taskQueryValidation, validate, getAll);
router.get("/analytics", protect, getAnalytics);

// Get single task
router.get("/:id", protect, taskIdValidation, validate, getOne);

// Update Task
router.put("/:id", protect, updateTaskValidation, validate, update);

// Assigned user marks task done (auto-remove)
router.post("/:id/complete", protect, taskIdValidation, validate, complete);

// Delete Task
router.delete("/:id", protect, taskIdValidation, validate, remove);

module.exports = router;
