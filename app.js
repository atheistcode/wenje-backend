/* DEPENDENCIES */
const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const compression = require("compression");
/* OWN MODULES */
const authRouter = require("./routes/auth.routes");
const userRouter = require("./routes/user.routes");
const postRouter = require("./routes/post.routes");
const AppError = require("./utils/AppError");
const globalErrorhandler = require("./helpers/globalErrorHandler");

/* MODULES INITIALIZATION AND CONFIGURATION */
const app = express();

/* GLOBAL MIDDLEWARES */

/* read data from req.body - body parser */
app.use(express.json({ limit: "2MB" }));

/* data sanitization usually included after body parser */
/* security - data sanitization against nosql query injection */
app.use(mongoSanitize());

/* security - data sanitization against xss */
app.use(xss());

/* security - set security HTTP headers */
app.use(helmet());

/* security - prevent parameter pollution */
app.use(hpp());

/* security - limit requests from same IP */
const limiter = rateLimit({
  max: 180,
  windowMs: 5 * 60 * 1000,
  message: { message: "Too many request from this IP, please try again in 5 minutes." },
});
// app.use("/api", limiter);

/* security - adding cors headers to every response */
app.use(cors({ origin: process.env.CLIENT_HOST }), limiter);
app.options("*", cors());

/* compress response bodies */
app.use(compression());

/* set requestedAt property on each request object */
// app.use((req, res, next) => {
//   req.requestedAt = new Date().toString();
//   next();
// });

/* MOUNTING ROUTERS */
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);

/* UNDEFINED ROUTES ERROR HANDLER */
app.all("*", (req, res, next) => {
  next(new AppError({ message: `Could not ${req.method} ${req.originalUrl} from/on the server.` }, 404));
});

/* GLOBAL ERROR HANDLER MIDDLEWARE */
app.use(globalErrorhandler);

/* DEFAULT EXPORT */
module.exports = app;
