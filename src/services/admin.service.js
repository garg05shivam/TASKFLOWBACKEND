const User = require("../models/user.model");
const Project = require("../models/project.model");
const Task = require("../models/task.model");

const getSystemOverview = async () => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const [
    totalUsers,
    totalAdmins,
    totalProjects,
    totalTasks,
    overdueTasks,
    completedThisWeek,
    tasksByStatus,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "admin" }),
    Project.countDocuments({}),
    Task.countDocuments({}),
    Task.countDocuments({
      status: { $ne: "done" },
      dueDate: { $ne: null, $lt: now },
    }),
    Task.countDocuments({
      status: "done",
      updatedAt: { $gte: weekStart, $lte: now },
    }),
    Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    User.find({})
      .select("name email role createdAt isVerified")
      .sort({ createdAt: -1 })
      .limit(8),
  ]);

  const statusMap = {
    todo: 0,
    "in-progress": 0,
    done: 0,
  };

  tasksByStatus.forEach((row) => {
    if (statusMap[row._id] !== undefined) {
      statusMap[row._id] = row.count;
    }
  });

  return {
    totalUsers,
    totalAdmins,
    totalProjects,
    totalTasks,
    overdueTasks,
    completedThisWeek,
    tasksByStatus: statusMap,
    recentUsers,
  };
};

module.exports = {
  getSystemOverview,
};
