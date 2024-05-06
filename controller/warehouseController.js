const BigPromise = require("../middleware/bigPromise");
const CustomError = require("../utils/customError");
const Warehouse = require("../models/warehouse");

exports.addWarehouse = BigPromise(async (req, res, next) => {
  const warehouse = await Warehouse.create(req.body);

  res.status(200).json({
    success: true,
    warehouse,
  });
});
