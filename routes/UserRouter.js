const express = require("express")
const User = require("../db/userModel")
const Photo = require("../db/photoModel")
const router = express.Router()
const mongoose = require("mongoose")


// API 1: List all users
router.get("/list", async (req, res) => {
    try {
        const users = await User.find({}, "_id first_name last_name").lean()

        const photoCounts = await Photo.aggregate([
            { $group: { _id: "$user_id", count: { $sum: 1 } } }
        ])

        const commentCounts = await Photo.aggregate([
            { $unwind: "$comments" },
            { $group: { _id: "$comments.user_id", count: { $sum: 1 } } }
        ])

        const photoCountMap = {}
        photoCounts.forEach(item => { photoCountMap[item._id.toString()] = item.count })

        const commentCountMap = {}
        commentCounts.forEach(item => { commentCountMap[item._id.toString()] = item.count })

        const usersWithCounts = users.map(user => {
            const userId = user._id.toString()
            return {
                ...user,
                photo_count: photoCountMap[userId] || 0,
                comment_count: commentCountMap[userId] || 0
            }
        })

        res.status(200).json(usersWithCounts)
    } catch (error) {
        console.error("Error in /list:", error)
        res.status(500).send({ message: "Internal server error", error })
    }
})

// API 2: Get User Detail
router.get("/:id", async (req, res) => {
    const userId = req.params.id
    if (!mongoose.Types.ObjectId.isValid(userId)){
        return res.status(400).json({error: "Invalid User Id format"})
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

// API 4: Update User info
router.put("/:id", async(req, res) => {
    const userId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ message: "Invalid User ID format"})
    }

    if (req.session.user_id !== userId) {
        return res.status(403).send({ message: "You are not authorized to update this profile" })
    }

    const { first_name, last_name, location, description, occupation } = req.body

    if (!first_name || !last_name) {
        return res.status(400).send({ message: "First Name and Last Name are required"})
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId, {
                first_name,
                last_name,
                location: location || "",
                description: description || "",
                occupation: occupation || ""
            }, {
                new: true,
                runValidations: true
            }
        ).select("-password")

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found"})
        }
        res.status(200).json(updatedUser)

    } catch (error) {
        console.error("Error editting user:", error)
        res.status(500).send({ message: "Internal server error", error })
    }
})

module.exports = router