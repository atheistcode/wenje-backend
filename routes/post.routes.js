/* DEPENDENCIES */
const express = require("express");
/* OWN MODULES */
const authController = require("../controllers/auth.controller");
const postController = require("../controllers/post.controller");
const commentRouter = require("./comment.routes");
const likeRouter = require("./like.routes");
const { uploadPostImage } = require("../utils/cloudinary");

/* EXPRESS ROUTER - SUB APP */
const router = express.Router();

/* MOUNTING ROUTERS */
router.use("/:postId/comments", commentRouter);
router.use("/:postId/likes", likeRouter);

/* ROUTES */
/* all routes come after this middleware will be executed after protectRoute */
router.use(authController.protectRoute);

router.route("/").post(uploadPostImage, postController.addPost);
router.route("/newsfeed").get(postController.getNewsFeed);
router.route("/byuser/:userId").get(postController.postsByUser);
router.route("/:postId").get(postController.getPost).delete(postController.deletePost);

/* DEFAULT EXPORT */
module.exports = router;
