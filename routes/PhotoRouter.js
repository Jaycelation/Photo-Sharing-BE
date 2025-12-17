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
        const photos = await Photo.find({ user_id: userId }).lean()

        if (!photos || photos.length === 0) {
            return res.status(200).send([])
        }

        const userIdsToFetch = new Set()
        photos.forEach(photo => {
            photo.comments.forEach(comment => {
                userIdsToFetch.add(comment.user_id)
            })
        })

        const usersInfo = await User.find(
            { _id: { $in: Array.from(userIdsToFetch) } },
            "_id first_name last_name"
        ).lean()

        const userMap = {}
        usersInfo.forEach(user => {
            userMap[user._id.toString()] = user
        })

        const newPhotos = photos.map(photo => {
            const enrichedComments = photo.comments.map(comment => {
                const commentUserId = comment.user_id.toString()
                return {
                    _id: comment._id,
                    comment: comment.comment,
                    date_time: comment.date_time,
                    user: userMap[commentUserId]
                }
            })

            return {
                _id: photo._id,
                user_id: photo.user_id,
                comments: enrichedComments,
                file_name: photo.file_name,
                date_time: photo.date_time,
            }
        })

        newPhotos.sort((a, b) => new Date(b.date_time) - new Date(a.date_time))

        res.status(200).send(newPhotos)
    } catch (error) {
        console.error("Error in /photosOfUser:", error)
        res.status(500).send({ message: "Server error", error })
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

// API 3: Delete photo
router.delete("/photos/:id", async(req, res) => {
    const photoId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(photoId)) {
        return res.status(400).json({ error: "Invalid Photo Id format" })
    }

    try {
        const photo = await Photo.findById(photoId)

        if (!photo) {
            return res.status(404).send({ message: "Photo not found" })
        }

        if (photo.user_id.toString() !== req.session.user_id) {
            return res.status(403).send({ message: "You are not authorized to delete this photo" })
        }

        const filePath = path.join(__dirname, "..", "images", photo.file_name)
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (!err) {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting file:", unlinkErr)
                })
            } else {
                console.warn("File not found")
            }
        })

        await Photo.findByIdAndDelete(photoId)
        res.status(200).send({ message: "Photo deleted successfully" })

    } catch(error) {
        console.error("Error deleting photo:", error)
        res.status(500).send({ message: "Internal Server Error", error })
    }

})

module.exports = router