const router = require('express').Router()
const homeController = require('../Controllers/home.controller')

router.get('/' , homeController.getHome)

module.exports = router