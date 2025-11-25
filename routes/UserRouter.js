const express = require("express")
const User = require("../db/userModel")
const router = express.Router()
const mongoose = require("mongoose")


// API 1: List all users
router.get("/list", async (req, res) => {
    try {
        const users = await User.find({}, "_id first_name last_name")
        res.status(200).json(users)
    } catch (error) {
        res.status(500).send({ message: "Internal server error", error })
    }
})

// API 2: Get User Detail
router.get("/:id", async (req, res) => {
    const userId = req.params.id
    if (!mongoose.Types.ObjectId.isValid(userId)){
        return res.status(400).json({error: "Invalid User Id format"});
    }
    try {
        const user = await User.findById(userId, "_id first_name last_name location description occupation")
        if (!user) {
            return res.status(404).send({ message: "User not found" })
        }
        res.status(200).json(user)
    } catch (error) {
        res.status(400).send({ message: "Invalid User ID", error })
    }
})

module.exports = router