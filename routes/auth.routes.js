/* DEPENDENCIES */
const express = require("express");
/* OWN MODULES */
const authController = require("../controllers/auth.controller");

/* EXPRESS ROUTER - SUB APP */
const router = express.Router();

/* ROUTES */
router.route("/signup").post(authController.signup);
router.route("/signin").post(authController.signin);
// router.route("/signout").get(authController.signout);
router.route("/forgotpassword").post(authController.forgotPassword);
router.route("/resetpassword/:resetToken").patch(authController.resetPassword);

/* DEFAULT EXPORT */
module.exports = router;
