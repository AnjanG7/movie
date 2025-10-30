import app from "./app.js";
app.get("/", (req, res) => {
  res.send("Film Finance API running successfully");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
