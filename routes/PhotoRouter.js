const express = require("express")
const mongoose = require("mongoose")
const Photo = require("../db/photoModel")
const User = require("../db/userModel")
const router = express.Router()
const multer = require("multer")

const fs = require("fs")
const path = require("path")

router.get("/photosOfUser/:id", async (req, res) => {
    const userId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid User Id format" })
    }

    try {
        const photos = await Photo.find({ user_id: userId })
            .sort({ date_time: -1 })
            .populate({
                path: "comments.user_id",
                model: User,
                select: "_id first_name last_name"
            })
            .populate({
                path: "likes",
                model: User,
                select: "_id first_name last_name"
            })

        res.json(photos)

    } catch (error) {
        console.error("Populate Error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })

// API 2: Upload photo
router.post("/photos/new", upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: "No file uploaded" })
    }

    try {
        const newPhoto = new Photo({
            file_name: req.file.filename,
            date_time: new Date(),
            user_id: req.session.user_id,
            comments: [],
            likes: []
        })

        await newPhoto.save()
        res.status(200).send(newPhoto)

    } catch (error) {
        console.error("Error uploading photo:", error)
        res.status(500).send({ message: "Internal Server Error", error })
    }
})

// API 3:  Like/Unlike
router.post("/photos/like/:photo_id", async (req, res) => {
    const photoId = req.params.photo_id
    const userId = req.body.user_id

    if (!userId) return res.status(400).send("User ID required")

    try {
        const photo = await Photo.findById(photoId)
        if (!photo) return res.status(404).send("Photo not found")

        if (!photo.likes) {
            photo.likes = []
        }

        const index = photo.likes.findIndex(id => id.toString() === userId.toString())

        if (index === -1) {
            photo.likes.push(userId)
        } else {
            photo.likes.splice(index, 1)
        }

        await photo.save()
        res.status(200).json({ status: "success", likes: photo.likes })
    } catch (err) {
        console.error("Like Error:", err)
        res.status(500).send(err)
    }
})

module.exports = router