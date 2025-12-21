const express = require("express")
const User = require("../db/userModel")
const Photo = require("../db/photoModel")
const router = express.Router()
const mongoose = require("mongoose")

// API 1: List all users
router.get("/list", async (req, res) => {
    try {
        const users = await User.find({}, "_id first_name last_name").lean()
        // console.log(users)
        const photos = await Photo.find({}, "user_id comments").lean()
        //console.log(photos)
        const usersWithCounts = users.map(user => {
            const userId = user._id.toString()
            const photoCount = photos.filter(p => p.user_id.toString() === userId).length
            let commentCount = 0
            photos.forEach(photo => {
                if (photo.comments) {
                    photo.comments.forEach(comment => {
                        if (comment.user_id.toString() === userId) {
                            commentCount++
                        }
                    })
                }
            })
            return {
                ...user,
                photo_count: photoCount,
                comment_count: commentCount
            }
        })
        // res.status(200).json(users)
        // console.log(usersWithCounts)
        res.status(200).json(usersWithCounts)   //Extra credit
    } catch (error) {
        console.error("Error in /list:", error)
        res.status(500).send({ message: "Internal server error", error })
    }
})

// API 2: Get User Detail
router.get("/:id", async (req, res) => {
    const userId = req.params.id
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid User Id format" })
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

// API 3: Register New User
router.post("/", async (req, res) => {
    const { login_name, password, first_name, last_name, location, description, occupation } = req.body
    if (!login_name || !password || !first_name || !last_name) {
        return res.status(400).send({
            message: "Missing required fields: login_name, password, first_name, and last_name are required."
        })
    }
    try {
        const existingUser = await User.findOne({ login_name: login_name })

        if (existingUser) {
            return res.status(400).send({
                message: `User with login_name "${login_name}" already exists.`
            })
        }

        const newUser = new User({
            login_name,
            password,
            first_name,
            last_name,
            location: location || "",
            description: description || "",
            occupation: occupation || ""
        })

        const savedUser = await newUser.save()

        res.status(200).json({
            _id: savedUser._id,
            login_name: savedUser.login_name,
            first_name: savedUser.first_name,
            last_name: savedUser.last_name
        })

    } catch (error) {
        console.error("Error registering user:", error)
        res.status(500).send({ message: "Internal server error", error })
    }
})

module.exports = router