/* DEPENDENCIES */
const express = require("express");
/* OWN MODULES */
const authController = require("../controllers/auth.controller");
const commentController = require("../controllers/comment.controller");
const likeRouter = require("./like.routes");

/* EXPRESS ROUTER - SUB APP */
const router = express.Router({ mergeParams: true });

/* MOUNTING ROUTERS */
router.use("/:commentId/likes", likeRouter);

/* ROUTES */
/* all routes come after this middleware will be executed after protectRoute */
router.use(authController.protectRoute);

router.route("/:limit").get(commentController.getCommentsOnPost);
router.route("/").post(commentController.addCommentOnPost);
router.route("/:commentId").delete(commentController.deleteCommentOnPost);

/* DEFAULT EXPORT */
module.exports = router;
