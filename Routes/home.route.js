const express = require('express');
const router = express.Router();
const homeController = require('../Controllers/home.controller'); // Import the controller

router.get('/', homeController.getHome); // Link to the getHome function

module.exports = router;