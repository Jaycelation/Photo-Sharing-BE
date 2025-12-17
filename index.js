const express = require("express")
const app = express()
const cors = require("cors")
const dbConnect = require("./db/dbConnect")
const UserRouter = require("./routes/UserRouter")
const PhotoRouter = require("./routes/PhotoRouter")
const LoginRegisterRouter = require("./routes/LoginRegisterRouter")
const CommentRouter = require("./routes/CommentRouter")
const isAuthenticated = require("./middleware/authMiddleware") 

const session = require("express-session")

dbConnect()

app.use(session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}))

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

app.use(express.json())

app.use(isAuthenticated) 

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