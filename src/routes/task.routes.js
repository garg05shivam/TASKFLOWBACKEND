const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const {
  create,
  getAll,
  update,
  remove,
} = require("../controllers/task.controller");

router.post("/", protect, create);
router.get("/", protect, getAll);
router.put("/:id", protect, update);
router.delete("/:id", protect, remove);

module.exports = router;
