const express = require("express")
const app = express()
const cors = require("cors")
const dbConnect = require("./db/dbConnect")
const UserRouter = require("./routes/UserRouter")
const PhotoRouter = require("./routes/PhotoRouter")
const LoginRegisterRouter = require("./routes/LoginRegisterRouter")

const session = require("express-session") // Add session in Final Lab

dbConnect()

app.use(session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}))

const isAuthenticated = (req, res, next) => {
    const whiteList = ['/admin/login', '/admin/logout', '/user']

    if (whiteList.includes(req.path) || req.method === 'POST' && req.path === '/user' || req.session.user_id) {
        return next()
    }
    return res.status(401).send("Unauthorized")
}

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

app.use(express.json())
app.use(isAuthenticated)
app.use("/admin", LoginRegisterRouter)
app.use("/user", UserRouter)
app.use("/", PhotoRouter)

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" })
})

app.listen(8081, () => {
  console.log("server listening on port 8081")
})
