const express = require("express")
const mongoose = require("mongoose")
const Photo = require("../db/photoModel")
const User = require("../db/userModel")
const router = express.Router()
const multer = require("multer")

const fs = require("fs")
const path = require("path")

// API 1: List Photo of User by userId
router.get("/photosOfUser/:id", async (req, res) => {
    const userId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid User Id format" })
    }
    try {
        const photos = await Photo.find({ user_id: userId }).sort({ date_time: -1 })

        const newPhotos = []

        for (const photo of photos) {
            const comments = []
            for (const comment of photo.comments) {
                const user = await User.findById(comment.user_id).select("_id first_name last_name")
                comments.push({
                    _id: comment._id,
                    comment: comment.comment,
                    date_time: comment.date_time,
                    user: user,
                })
            }

            newPhotos.push({
                _id: photo._id,
                user_id: userId,
                comments: comments,
                file_name: photo.file_name,
                date_time: photo.date_time
            })
        }
        // console.log(newPhotos)
        res.json(newPhotos)
    } catch (error) {
        console.error(error)
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
            comments: []
        })

        await newPhoto.save()
        res.status(200).send(newPhoto)

    } catch (error) {
        console.error("Error uploading photo:", error)
        res.status(500).send({ message: "Internal Server Error", error })
    }
})

module.exports = router