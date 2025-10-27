import express from "express";
import dotenv from "dotenv";
import router from "./routes";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use("/", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`running on ${PORT}`);
});