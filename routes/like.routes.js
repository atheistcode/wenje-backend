/* DEPENDENCIES */
const express = require("express");
/* OWN MODULES */
const authController = require("../controllers/auth.controller");
const likeController = require("../controllers/like.controller");

/* EXPRESS ROUTER - SUB APP */
const router = express.Router({ mergeParams: true });

/* ROUTES */
/* all routes come after this middleware will be executed after protectRoute */
router.use(authController.protectRoute);

router.route("/").post(likeController.like);

/* DEFAULT EXPORT */
module.exports = router;
