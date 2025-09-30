import resolvers from "#resolvers/index.js";
import express from "express";
const app = express();

const port = process.env.PORT || 27000;

app.get("/", (req, res) => {
  res.send("Hello World!");
  console.log("Response sent after");
});

app.listen(port, () => {
  console.log(`Example app listening on port 🍆 zgeg ${port}`);
});