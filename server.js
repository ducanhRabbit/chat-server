const app = require('./app')

const http = require('http')

const server = http.createServer(app)

const port = 3000

const db = require('./config/database/db')
process.on("uncaughtException", (err) => {
    console.log(err);
    console.log("UNCAUGHT Exception! Shutting down ...");
    process.exit(1); // Exit Code 1 indicates that a container shut down, either because of an application failure.
});


// Connect DB
db.connectToDB()
server.listen(port, () => {
    console.log(`App is listening on port ${port}`)
})