const express = require("express")
const app = express()
const cors = require("cors")
const dbConnect = require("./db/dbConnect")
const mongoose = require("mongoose")
const MongoStore = require("connect-mongo").default || require("connect-mongo")
require("dotenv").config()
const UserRouter = require("./routes/UserRouter")
const PhotoRouter = require("./routes/PhotoRouter")
const LoginRegisterRouter = require("./routes/LoginRegisterRouter")
const CommentRouter = require("./routes/CommentRouter")
const isAuthenticated = require("./middleware/authMiddleware")

const session = require("express-session")

dbConnect()

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}))

app.use(express.json())

app.use(session({
  secret: "secretKey",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DB_URL,
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: {
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000
  }
}))

app.use("/images", express.static("images"))

app.use("/admin", LoginRegisterRouter)

app.use("/user", UserRouter)
app.use("/comment", CommentRouter)

app.use("/", PhotoRouter)

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" })
})

app.listen(8081, () => {
  console.log("Server listening on port 8081")
})