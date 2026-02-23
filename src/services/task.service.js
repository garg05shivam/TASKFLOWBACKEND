const Task = require("../models/task.model");
const Project = require("../models/project.model");
const AppError = require("../utils/appError");
const {
  canAccessProject,
  isProjectManager,
  notifyUsers,
  projectAudienceUserIds,
  recordActivity,
} = require("./collaboration.service");

const normalizeAssignee = (project, assignedTo) => {
  if (assignedTo === undefined) {
    return { hasValue: false, value: undefined };
  }

  if (!assignedTo) {
    return { hasValue: true, value: null };
  }

  const assigneeId = String(assignedTo);
  const ownerId = String(project.owner?._id || project.owner);
  const memberIds = new Set((project.members || []).map((member) => String(member._id || member)));

  if (assigneeId !== ownerId && !memberIds.has(assigneeId)) {
    throw new AppError("Assignee must be project owner or member", 400);
  }

  return { hasValue: true, value: assigneeId };
};

const getTaskById = async (id, user) => {
  const task = await Task.findById(id)
    .populate("assignedTo", "name email role")
    .populate({
      path: "project",
      populate: [
        { path: "owner", select: "name email" },
        { path: "members", select: "name email role" },
      ],
    });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!canAccessProject(task.project, user)) {
    throw new AppError("Access denied", 403);
  }

  return task;
};

const createTask = async (data, user) => {
  const project = await Project.findById(data.project).populate("owner members", "name email role");

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!isProjectManager(project, user)) {
    throw new AppError("Only project admin can create tasks", 403);
  }

  const assignee = normalizeAssignee(project, data.assignedTo);

  const task = await Task.create({
    title: data.title,
    description: data.description,
    project: data.project,
    dueDate: data.dueDate || null,
    assignedTo: assignee.hasValue ? assignee.value : null,
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  });

  await recordActivity({
    projectId: project._id,
    actorId: user._id,
    action: "created task",
    entityType: "task",
    entityId: task._id,
    metadata: { title: task.title },
  });

  await notifyUsers({
    userIds: projectAudienceUserIds(project),
    projectId: project._id,
    type: "activity",
    message: `${user.name || "A teammate"} created task "${task.title}"`,
    metadata: { taskId: String(task._id) },
  });

  if (assignee.hasValue && assignee.value) {
    await notifyUsers({
      userIds: [assignee.value],
      projectId: project._id,
      type: "task_assign",
      message: `You were assigned task "${task.title}"`,
      metadata: { taskId: String(task._id) },
    });
  }

  return await Task.findById(task._id).populate("assignedTo", "name email role");
};

const getTasks = async (query, user) => {
  const { project, status, page = 1, limit = 5, search } = query;

  const projectData = await Project.findById(project).populate("owner members", "name email role");

  if (!projectData) {
    throw new AppError("Project not found", 404);
  }

  if (!canAccessProject(projectData, user)) {
    throw new AppError("Access denied", 403);
  }

  const filter = { project };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email role")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const total = await Task.countDocuments(filter);

  return {
    tasks,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber),
  };
};

const updateTask = async (id, data, user) => {
  const task = await Task.findById(id).populate({
    path: "project",
    populate: [
      { path: "owner", select: "name email" },
      { path: "members", select: "name email role" },
    ],
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!isProjectManager(task.project, user)) {
    throw new AppError("Only project admin can update tasks", 403);
  }

  const previousDue = task.dueDate ? new Date(task.dueDate).getTime() : null;

  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.status !== undefined) task.status = data.status;
  if (data.dueDate !== undefined) task.dueDate = data.dueDate || null;
  if (Array.isArray(data.attachments)) task.attachments = data.attachments;

  const assignee = normalizeAssignee(task.project, data.assignedTo);
  if (assignee.hasValue) {
    task.assignedTo = assignee.value;
  }

  await task.save();

  await recordActivity({
    projectId: task.project._id,
    actorId: user._id,
    action: "updated task",
    entityType: "task",
    entityId: task._id,
    metadata: { title: task.title, status: task.status },
  });

  await notifyUsers({
    userIds: projectAudienceUserIds(task.project),
    projectId: task.project._id,
    type: "activity",
    message: `${user.name || "A teammate"} updated task "${task.title}"`,
    metadata: { taskId: String(task._id), status: task.status },
  });

  if (assignee.hasValue && assignee.value) {
    await notifyUsers({
      userIds: [assignee.value],
      projectId: task.project._id,
      type: "task_assign",
      message: `You were assigned task "${task.title}"`,
      metadata: { taskId: String(task._id) },
    });
  }

  if (task.dueDate) {
    const dueAt = new Date(task.dueDate).getTime();
    const soon = dueAt - Date.now() <= 48 * 60 * 60 * 1000;
    const changed = previousDue !== dueAt;
    if (soon && changed) {
      await notifyUsers({
        userIds: projectAudienceUserIds(task.project),
        projectId: task.project._id,
        type: "task_due",
        message: `Task "${task.title}" is due soon`,
        metadata: { taskId: String(task._id), dueDate: task.dueDate },
      });
    }
  }

  return await Task.findById(task._id)
    .populate("assignedTo", "name email role")
    .populate({
      path: "project",
      populate: [
        { path: "owner", select: "name email" },
        { path: "members", select: "name email role" },
      ],
    });
};

const deleteTask = async (id, user) => {
  const task = await Task.findById(id).populate("project");

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!isProjectManager(task.project, user)) {
    throw new AppError("Only project admin can delete tasks", 403);
  }

  await task.deleteOne();

  await recordActivity({
    projectId: task.project._id,
    actorId: user._id,
    action: "deleted task",
    entityType: "task",
    entityId: id,
    metadata: { title: task.title },
  });

  return { message: "Task deleted successfully" };
};

module.exports = {
  createTask,
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
};
