/* DEPENDENCIES */
const mongoose = require("mongoose");
const validator = require("validator");

/* SCHEMA DEFINITION */
const postSchemaOptions = {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
};

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Post must belong to an author."],
    },
    content: {
      type: String,
      // required: [true, "Post cannot be empty."],
      maxlength: [500, "Max length allowed for content is 500 characters."],
    },
    image: {
      url: {
        type: String,
        maxlength: [200, "Max length allowed for an image URL is 200 characters."],
        validate: {
          validator: validator.isURL,
          message: "Please provide a valid image URL.",
        },
      },
      publicId: {
        type: String,
      },
    },
  },
  postSchemaOptions
);

/* VIRTUAL POPULATE */
PostSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "onPost",
});

PostSchema.virtual("commentsCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "onPost",
  count: true,
});

PostSchema.virtual("likesCount", {
  ref: "Like",
  localField: "_id",
  foreignField: "onPostOnComment",
  count: true,
});

PostSchema.virtual("likedBy", {
  ref: "Like",
  localField: "_id",
  foreignField: "onPostOnComment",
});

/* DOCUMENT MIDDLEWARES */
PostSchema.pre(/^find/, function (next) {
  this.populate({
    path: "author",
    select: "name bio country image",
  })
    .populate({
      path: "commentsCount",
    })
    .populate({
      path: "likesCount",
    })
    .populate({
      path: "likedBy",
      select: "likedBy -_id -onPostOnComment",
      distinct: true,
    });

  next();
});

/* SCHEMA COMPILATION TO MODEL */
const PostModel = mongoose.model("Post", PostSchema);

/* DEFAULT EXPORT */
module.exports = PostModel;
