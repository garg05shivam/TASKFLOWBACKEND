const adminService = require("../services/admin.service");

const getOverview = async (req, res, next) => {
  try {
    const overview = await adminService.getSystemOverview();
    res.status(200).json({
      success: true,
      overview,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
};
