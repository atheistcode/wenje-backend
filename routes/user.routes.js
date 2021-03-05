/* DEPENDENCIES */
const express = require("express");
/* OWN MODULES */
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const { uploadProfileImage } = require("../utils/cloudinary");

/* EXPRESS ROUTER - SUB APP */
const router = express.Router();

/* ROUTES */
/* all routes come after this middleware will be executed after protectRoute */
router.use(authController.protectRoute);

router.route("/").get(userController.getAll);
router.route("/update").patch(userController.update);
router.route("/uploadimage").patch(uploadProfileImage, userController.uploadImage);
router.route("/updatepassword").patch(userController.updatePassword);
router.route("/delete").delete(userController.deleteOne);
router.route("/search").get(userController.searchByName);
router.route("/follow").patch(userController.addFollowing, userController.addFollower);
router.route("/unfollow").patch(userController.deleteFollowing, userController.deleteFollower);
router.route("/findpeople").get(userController.findPeople);
router.route("/me").get(userController.getMe, userController.getByParamId);
router.route("/:userId").get(userController.getByParamId);

/* DEFAULT EXPORT */
module.exports = router;
