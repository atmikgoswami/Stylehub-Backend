const mongoose = require("mongoose");
const validator = require("validator");

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name of warehouse"],
    trim: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
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
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Warehouse", warehouseSchema);
