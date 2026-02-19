const Task = require("../models/task.model");
const Project = require("../models/project.model");
const AppError = require("../utils/appError");

//  CREATE TASK 
const createTask = async (data, user) => {
  const project = await Project.findById(data.project);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (
    user.role !== "admin" &&
    project.owner.toString() !== user._id.toString()
  ) {
    throw new AppError("Access denied", 403);
  }

  const task = await Task.create({
    title: data.title,
    description: data.description,
    project: data.project,
  });

  return task;
};


//  GET TASKS (FILTER + PAGINATION) 
const getTasks = async (query, user) => {
  const { project, status, page = 1, limit = 5 } = query;

  const projectData = await Project.findById(project);

  if (!projectData) {
    throw new AppError("Project not found", 404);
  }

  if (
    user.role !== "admin" &&
    projectData.owner.toString() !== user._id.toString()
  ) {
    throw new AppError("Access denied", 403);
  }

  const filter = { project };

  if (status) {
    filter.status = status;
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const tasks = await Task.find(filter)
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


//  UPDATE TASK 
const updateTask = async (id, data, user) => {
  const task = await Task.findById(id).populate("project");

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (
    user.role !== "admin" &&
    task.project.owner.toString() !== user._id.toString()
  ) {
    throw new AppError("Access denied", 403);
  }

  task.title = data.title || task.title;
  task.description = data.description || task.description;
  task.status = data.status || task.status;

  await task.save();

  return task;
};


// DELETE TASK 
const deleteTask = async (id, user) => {
  const task = await Task.findById(id).populate("project");

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (
    user.role !== "admin" &&
    task.project.owner.toString() !== user._id.toString()
  ) {
    throw new AppError("Access denied", 403);
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
