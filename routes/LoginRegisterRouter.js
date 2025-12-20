const express = require("express")
const User = require("../db/userModel")
const router = express.Router()

// API 1: Login
router.post("/login", async (req, res) => {
    const { login_name, password } = req.body
    try {
        const user = await User.findOne({ login_name: login_name, password: password })
        if (!user) {
            return res.status(400).send({ message: "Invalid login name or password"})
        }
        req.session.user_id = user._id 

        res.status(200).json({
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            login_name: user.login_name
        })
    } catch (error) {
        console.error("Login error:", error)
        res.status(500).send({ message: "Internal Server Error", error})
    }
})


// API 2: Logout
router.post("/logout", (req, res) => {
    if (!req.session.user_id) {
        return res.status(400).send({ message: "User is not logged in"})
    }
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send({ message: "Could not log out"})
        }
        res.status(200).send({ message: "Logout successful"})
    })
})

module.exports = router