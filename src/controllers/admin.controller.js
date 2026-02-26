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

const changeUserRole = async (req, res, next) => {
  try {
    const result = await adminService.updateUserRole({
      targetUserId: req.params.id,
      actorUserId: req.user._id,
      role: req.body.role,
    });
    res.status(200).json({
      success: true,
      message: "User role updated",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const changeUserStatus = async (req, res, next) => {
  try {
    const result = await adminService.updateUserActiveStatus({
      targetUserId: req.params.id,
      actorUserId: req.user._id,
      isActive: req.body.isActive,
    });
    res.status(200).json({
      success: true,
      message: "User status updated",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const removeUser = async (req, res, next) => {
  try {
    const result = await adminService.removeUserById({
      targetUserId: req.params.id,
      actorUserId: req.user._id,
    });
    res.status(200).json({
      success: true,
      message: "User removed successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  changeUserRole,
  changeUserStatus,
  getOverview,
  removeUser,
};
