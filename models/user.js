const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    maxlength: [40, "Name should be under 40 characters"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    validate: [validator.isEmail, "Please enter email in correct format"],
    unique: true,
  },
  mobile: {
    type: String,
    required: [true, "Please provide mobile number"],
    validate: {
      validator: function (v) {
        return validator.isMobilePhone(v, "en-IN");
      },
      message: (props) =>
        `${props.value} is not a valid mobile number for India!`,
    },
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password should be atleast 6 characters long"],
    select: false,
  },
  cart: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
    },
  ],
  role: {
    type: String,
    default: "user",
  },
  photo: {
    id: {
      type: String,
    },
    secure_url: {
      type: String,
    },
  },
  shippinginfo: [
    {
      name: {
        type: String,
      },
      address: {
        type: String,
      },
      city: {
        type: String,
      },
      phoneNo: {
        type: String,
        validate: {
          validator: function (v) {
            return validator.isMobilePhone(v, "en-IN");
          },
          message: (props) =>
            `${props.value} is not a valid mobile number for India!`,
        },
      },
      postalCode: {
        type: String,
        validate: {
          validator: function (v) {
            return validator.isPostalCode(v, "IN");
          },
          message: (props) =>
            `${props.value} is not a valid postal code for India!`,
        },
      },
      state: {
        type: String,
      },
      country: {
        type: String,
      },
    },
  ],
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//encrypt password before save --HOOKS
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

//validate the password
userSchema.methods.isValidatedPassword = async function (usersentPassword) {
  return await bcrypt.compare(usersentPassword, this.password);
};

//create and return jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

//generate forgot password token
userSchema.methods.getForgotPasswordToken = function () {
  //generate a long and random string
  const forgotToken = crypto.randomBytes(20).toString("hex");

  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotToken)
    .digest("hex");

  //time of token
  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;

  return forgotToken;
};

module.exports = mongoose.model("User", userSchema);
