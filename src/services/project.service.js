const Project = require("../models/project.model");
const AppError = require("../utils/appError");

//  CREATE PROJECT
const createProject = async (data, userId) => {
  const project = await Project.create({
    name: data.name,
    description: data.description,
    owner: userId,
  });

  return project;
};


//  GET ALL PROJECTS 
const getProjects = async (user) => {
  if (user.role === "admin") {
    return await Project.find().populate("owner", "name email");
  }

  return await Project.find({ owner: user._id });
};


//  GET PROJECT BY ID 
const getProjectById = async (id, user) => {
  const project = await Project.findById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (
    user.role !== "admin" &&
    project.owner.toString() !== user._id.toString()
  ) {
    throw new AppError("Access denied", 403);
  }

  return project;
};


//  UPDATE PROJECT 
const updateProject = async (id, data, user) => {
  const project = await Project.findById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (
    user.role !== "admin" &&
    project.owner.toString() !== user._id.toString()
  ) {
    throw new AppError("Access denied", 403);
  }

  project.name = data.name || project.name;
  project.description = data.description || project.description;

  await project.save();

  return project;
};


// DELETE PROJECT 
const deleteProject = async (id, user) => {
  const project = await Project.findById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (
    user.role !== "admin" &&
    project.owner.toString() !== user._id.toString()
  ) {
    throw new AppError("Access denied", 403);
  }

  await project.deleteOne();

  return { message: "Project deleted successfully" };
};


module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
