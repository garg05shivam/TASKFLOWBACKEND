const Project = require("../models/project.model");


const createProject = async (data, userId) => {
  const project = await Project.create({
    name: data.name,
    description: data.description,
    owner: userId,
  });

  return project;
};

const getProjects = async (user) => {
  if (user.role === "admin") {
    return await Project.find().populate("owner", "name email");
  }

  return await Project.find({ owner: user._id });
};


const getProjectById = async (id, user) => {
  const project = await Project.findById(id);

  if (!project) throw new Error("Project not found");

  if (
    user.role !== "admin" &&
    project.owner.toString() !== user._id.toString()
  ) {
    throw new Error("Access denied");
  }

  return project;
};


const updateProject = async (id, data, user) => {
  const project = await Project.findById(id);

  if (!project) throw new Error("Project not found");

  if (
    user.role !== "admin" &&
    project.owner.toString() !== user._id.toString()
  ) {
    throw new Error("Access denied");
  }

  project.name = data.name || project.name;
  project.description = data.description || project.description;

  await project.save();

  return project;
};


const deleteProject = async (id, user) => {
  const project = await Project.findById(id);

  if (!project) throw new Error("Project not found");

  if (
    user.role !== "admin" &&
    project.owner.toString() !== user._id.toString()
  ) {
    throw new Error("Access denied");
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
