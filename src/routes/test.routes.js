const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

router.get("/protected", protect, (req, res) => {
  res.json({
    success: true,
    message: "You accessed protected route",
    user: req.user,
  });
});

// Admin only route
router.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({
    success: true,
    message: "Welcome Admin",
  });
});

module.exports = router;
