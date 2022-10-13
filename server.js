const path = require("path");
const express = require("express");
const app = express();

const HOST = process.argv[2] || "localhost";
const PORT = process.argv[3] || 8080;
app.listen(PORT, HOST, () => console.log(`Server is running on 'http://${HOST}:${PORT}'`));

app.use(express.static(path.join(__dirname, "src")));

app.get("/", (request, response) => {
    return response.sendFile(path.join(__dirname, "src/index.html"));
})