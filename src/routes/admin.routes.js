const express = require("express");
const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const { getOverview } = require("../controllers/admin.controller");

const router = express.Router();

router.get("/overview", protect, authorize("super_admin"), getOverview);

module.exports = router;
