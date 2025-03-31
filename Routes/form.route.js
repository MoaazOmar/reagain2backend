const express = require('express');
const { check } = require('express-validator');
const authGuard = require('./guards/auth.guard');
const formController = require('../Controllers/form.controller');

const router = express.Router(); // Initialize the router

router.get(
    '/',
    authGuard.isLoggedIn,
    formController.getForm
);

// custmorName   address

router.post(
    '/',
    authGuard.isLoggedIn,
    check("custmorName").not().isEmpty().withMessage("Your name is Required"),
    check("address").not().isEmpty().withMessage("Your address is Required").isString({ min: 7 }).withMessage("Please try to provide more details with your address"),
    formController.postForm // Fix here: should be formController instead of cartController
);

module.exports = router;
