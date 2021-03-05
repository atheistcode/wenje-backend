/* DEPENDENCIES */
const mongoose = require("mongoose");

/* SCHEMA DEFINITION */
const commentSchemaOptions = {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
};

const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Comment must belong to an author."],
    },
    onPost: {
      type: mongoose.Schema.ObjectId,
      ref: "Post",
      required: [true, "Comment must belong to a post."],
    },
    content: {
      type: String,
      required: [true, "Comment cannot be empty."],
      maxlength: [250, "Max length allowed for content is 250 characters."],
    },
  },
  commentSchemaOptions
);

/* VIRTUAL POPULATE */
CommentSchema.virtual("likesCount", {
  ref: "Like",
  localField: "_id",
  foreignField: "onPostOnComment",
  count: true,
});

/* DOCUMENT MIDDLEWARES */
CommentSchema.pre(/^find/, function (next) {
  this.populate({ path: "author", select: "name bio country image" }).populate({ path: "likesCount" });

  next();
});

/* SCHEMA COMPILATION TO MODEL */
const CommentModel = mongoose.model("Comment", CommentSchema);

/* DEFAULT EXPORT */
module.exports = CommentModel;
