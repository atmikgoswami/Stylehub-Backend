const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide product name"],
    trim: true,
    maxlength: [120, "Product name should not be more than 120 characters"],
  },
  price: {
    type: Number,
    required: [true, "Please provide product price"],
    maxlength: [6, "Product price should not be more than 6 digits"],
  },
  description: {
    type: String,
    required: [true, "Please provide product description"],
  },
  photos: [
    {
      id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
  ],
  tags: {
    type: String,
    required: [true, "Please provide some tag"],
  },
  category: {
    type: String,
    required: [true, "Please provide category"],
  },
  forUse: {
    type: String,
    required: [
      true,
      "Please select foruse type from - Men, Women, Boys, Girls, All",
    ],
    enum: {
      values: ["Men", "Women", "Boys", "Girls", "All"],
      message:
        "Please select foruse type ONLY from - Men, Women, Boys, Girls, All",
    },
  },
  stock: {
    type: Number,
    required: [true, "Please add a number in stock"],
  },
  brand: {
    type: String,
    required: [true, "Please add a brand"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
