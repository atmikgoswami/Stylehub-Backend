const express = require("express");
const app = express();
const path = require('path');
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");

app.use(cors());

//for swagger documentation
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load(path.resolve(__dirname, 'swagger.yaml'));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//cookies and file middleware
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

//morgan middleware
app.use(morgan("tiny"));

app.get("/", (req, res) => res.send("Welcome to StyleHub API"));

//import all routes here
const user = require("./routes/user");
const product = require("./routes/product");
const warehouse = require("./routes/warehouse");
const payment = require("./routes/payment");
const order = require("./routes/order");

//router middleware
app.use("/api/v1", user);
app.use("/api/v1", product);
app.use("/api/v1", warehouse);
app.use("/api/v1",payment);
app.use("/api/v1",order);

//export app js
module.exports = app;
