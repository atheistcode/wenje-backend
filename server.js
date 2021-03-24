/* DEPENDENCIES */
require("dotenv").config();
const mongoose = require("mongoose");
/* OWN MODULES*/
const app = require("./app");

/* LISTEN TO SERVER */
app.listen(process.env.PORT, () => console.log(`Server started and listening to port "${process.env.PORT}".`));

/* CONNECT TO DATABASE */
const mongoUri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.${process.env.MONGO_STRCODE}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((connection) => console.log(`Connected to MongoDB "${connection.connections[0].name}" database.`))
  .catch((err) => console.log("Couldn't connect to database because of the following:", err));

/* NODE ENVIRONMENT */
console.log(`App is running in the "${process.env.NODE_ENV}" environment.`);
