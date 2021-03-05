/* OWN MODULES */
const PostModel = require("../models/post.model");
const CommentModel = require("../models/comment.model");
const LikeModel = require("../models/like.model");
const { deleteImage } = require("../utils/cloudinary");
const AppError = require("../utils/AppError");

/* CONTROLLERS */
const addPost = async (req, res, next) => {
  try {
    /* (1) store client input */
    const authorId = req.authUser._id;
    const content = req.body.content;
    let image;
    if (req.file) {
      image = { url: req.file.path, publicId: req.file.filename };
    }

    /* (2) create post */
    const post = await PostModel.create({
      author: authorId,
      content: content,
      image: image,
    });

    /* (3) send response */
    res.status(201).json({
      results: 1,
      status: "Success",
      statusCode: 201,
      message: "Created a post.",
      data: { post: post },
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};

const getPost = async (req, res, next) => {
  try {
    /* (1) store client input */
    const postId = req.params.postId;

    /* (2) find post */
    const post = await PostModel.findById(postId);

    /* (3) check if post exist */
    if (!post) return next(new AppError({ message: "Post doesn't exist." }, 404));

    /* (4) send response */
    res.status(200).json({
      results: 1,
      status: "Success",
      statusCode: 200,
      message: "Found a post",
      data: { post: post },
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};

const deletePost = async (req, res, next) => {
  try {
    /* (1) store client input */
    const postId = req.params.postId;

    /* (2) find post */
    const post = await PostModel.findById(postId);
    if (!post) return next(new AppError({ message: "Post doesn't exist." }, 404));

    /* (3) check if post belongs to authUser */
    if (String(post.author._id) !== String(req.authUser._id))
      return next(new AppError({ message: "Not authorized to delete this post." }, 401));

    /* (4) delete post */
    if (post.image && post.image.publicId) await deleteImage(post.image.publicId);
    await PostModel.findByIdAndDelete(postId);

    /* (5) delete post related data */
    await CommentModel.deleteMany({ onPost: postId });
    await LikeModel.deleteMany({ onPostOnComment: postId });

    /* (6) send response */
    res.status(204).json({
      results: 1,
      status: "Success",
      statusCode: 204,
      message: "Deleted a post.",
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};

const postsByUser = async (req, res, next) => {
  try {
    /* (1) store client input */
    const authorId = req.params.userId;
    const skipPage = req.body.createdAtOfLastReceived || Date.now();

    /* (2) find posts */
    const posts = await PostModel.find({ author: authorId, createdAt: { $lt: skipPage } })
      .sort("-createdAt")
      .limit(10);

    /* (3) send response */
    res.status(200).json({
      results: posts.length,
      status: "Success",
      statusCode: 200,
      message: `Sent a user posts results.`,
      data: { posts: posts },
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};

const getNewsFeed = async (req, res, next) => {
  try {
    /* (1) store client input */
    const authorId = req.authUser._id;
    const followingList = req.authUser.following;
    followingList.push(authorId);
    const skipPage = req.body.createdAtOfLastReceived || Date.now();

    /* (2) find posts */
    const newsfeed = await PostModel.find({ author: { $in: followingList }, createdAt: { $lt: skipPage } }).sort(
      "-createdAt"
    );
    // .limit(10);

    /* (3) send response */
    res.status(200).json({
      results: newsfeed.length,
      status: "Success",
      statusCode: 200,
      message: `Sent newsfeed results.`,
      data: { newsfeed: newsfeed },
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};

/* EXPORTS */
module.exports = { addPost, getPost, deletePost, postsByUser, getNewsFeed };
