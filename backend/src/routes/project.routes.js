const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

// Apply protection middleware to all project endpoints
router.use(protect);

router
  .route('/')
  .post(projectController.createProject)
  .get(projectController.getProjects);

router
  .route('/:id')
  .get(projectController.getProjectById)
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

router.get('/:id/stats', projectController.getProjectStats);

module.exports = router;
