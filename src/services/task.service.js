const Task = require("../models/task.model");
const Project = require("../models/project.model");

// Create Task
const createTask = async (data, user) => {
  const project = await Project.findById(data.project);

  if (!project) throw new Error("Project not found");

  if (
    user.role !== "admin" &&
    project.owner.toString() !== user._id.toString()
  ) {
    throw new Error("Access denied");
  }

  const task = await Task.create({
    title: data.title,
    description: data.description,
    project: data.project,
  });

  return task;
};

// Filtering + Pagination
const getTasks = async (query, user) => {
  const { project, status, page = 1, limit = 5 } = query;

  const projectData = await Project.findById(project);

  if (!projectData) throw new Error("Project not found");

  if (
    user.role !== "admin" &&
    projectData.owner.toString() !== user._id.toString()
  ) {
    throw new Error("Access denied");
  }

  const filter = { project };

  if (status) {
    filter.status = status;
  }

  const tasks = await Task.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(filter);

  return {
    tasks,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };
};

// Update Task
const updateTask = async (id, data, user) => {
  const task = await Task.findById(id).populate("project");

  if (!task) throw new Error("Task not found");

  if (
    user.role !== "admin" &&
    task.project.owner.toString() !== user._id.toString()
  ) {
    throw new Error("Access denied");
  }

  task.title = data.title || task.title;
  task.description = data.description || task.description;
  task.status = data.status || task.status;

  await task.save();

  return task;
};

// Delete Task
const deleteTask = async (id, user) => {
  const task = await Task.findById(id).populate("project");

  if (!task) throw new Error("Task not found");

  if (
    user.role !== "admin" &&
    task.project.owner.toString() !== user._id.toString()
  ) {
    throw new Error("Access denied");
  }

  await task.deleteOne();

  return { message: "Task deleted successfully" };
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
