/* CORE MODULES */
const crypto = require("crypto");
/* DEPENDENCIES */
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

/* SCHEMA DEFINITION */
const userSchemaOptions = {
  timestamps: true,
};

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide a name."],
      maxlength: [40, "Max length allowed for a name is 40 characters."],
      minlength: [6, "Min length allowed for a name is 6 characters."],
      validate: {
        validator: /^(?:[A-Za-z]+)(?:[A-Za-z0-9 _]*)$/,
        message: "Name should start with a letter and only contain letters, numbers, and spaces.",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Please provide an email address."],
      maxlength: [50, "Max length allowed for an email address is 50 characters."],
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email address.",
      },
    },
    passwordData: {
      hashedPassword: {
        type: String,
        required: [true, "Please provide a password."],
        select: false,
      },
      encryptionSalt: {
        type: String,
        select: false,
      },
      passwordUpdatedAt: {
        type: Date,
        select: false,
      },
      hashedResetToken: {
        type: String,
        select: false,
      },
      resetTokenExpire: {
        type: Date,
        select: false,
      },
    },
    bio: {
      type: String,
      default: "New Member",
      required: [true, "Please provide a bio."],
      maxlength: [60, "Max length allowed for a bio is 60 characters."],
    },
    country: {
      type: String,
      default: "Earth",
      required: [true, "Please provide a country name."],
      maxlength: [25, "Max length allowed for a country name is 25 characters."],
    },
    image: {
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/ahmile/image/upload/v1595505350/wenje/profile-images/standard-user-image_kup9gd.png",
        maxlength: [200, "Max length allowed for an image URL is 200 characters."],
        validate: {
          validator: validator.isURL,
          message: "Please provide a valid image URL.",
        },
      },
      publicId: {
        type: String,
        default: "standard-user-image_kup9gd",
      },
    },
    following: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  userSchemaOptions
);

/* VIRTUALS */
UserSchema.virtual("password")
  .set(function (password) {
    this.passwordData._password = password;
    this.passwordData.encryptionSalt = this.makeEncryptionSalt();
    this.passwordData.hashedPassword = this.encryptPassword(password);
  })
  .get(function () {
    return this.passwordData._password;
  });

UserSchema.path("passwordData.hashedPassword").validate(function (v) {
  if (this.passwordData._password && this.passwordData._password.length < 6) {
    this.invalidate("password", "Min length allowed for a password is 6 characters.");
  }
  if (this.isNew && !this.passwordData._password) {
    this.invalidate("password", "Please provide a password.");
  }
}, null);

/* INSTANCE METHODS */
// TODO: need to change these methods to async methods
UserSchema.methods = {
  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return bcrypt.hashSync(password, this.passwordData.encryptionSalt);
    } catch (err) {
      return "";
    }
  },

  comparePassword: function (clientPassword, hashedPassword) {
    return bcrypt.compareSync(clientPassword, hashedPassword);
  },

  makeEncryptionSalt: function () {
    return bcrypt.genSaltSync(12);
  },

  passwordUpdatedAfter: function (timestamp) {
    if (!this.passwordData.passwordUpdatedAt) return false;

    return Number(this.passwordData.passwordUpdatedAt.getTime() / 1000) > timestamp;
  },

  createResetToken: function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordData.hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.passwordData.resetTokenExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
  },
};

/* DOCUMENT MIDDLEWARES */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("passwordData.hashedPassword") || this.isNew) return next();

  this.passwordData.passwordUpdatedAt = Date.now() - 5000;

  next();
});

/* SCHEMA COMPILATION TO MODEL */
const UserModel = mongoose.model("User", UserSchema);

/* DEFAULT EXPORT */
module.exports = UserModel;
