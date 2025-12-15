const express = require("express")
const mongoose = require("mongoose")
const Photo = require("../db/photoModel")
const router = express.Router()

// API 1: List Comment of user by id
router.get("/:id", async(req, res) => {
    const userId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid User Id format" })
    }
    const userComments = []

    try {
        const photos = await Photo.find()
        
        for (const photo of photos) {
            for (const comment of photo.comments) {
                if (comment.user_id.toString() === userId) {
                    userComments.push({
                        comment_id: comment._id,
                        photo_file_name: photo.file_name,
                        photo_id: photo._id,
                        comment: comment.comment,
                        date_time: comment.date_time,
                        user_id: comment.user_id
                    })
                }
            }
        }
        res.status(200).json(userComments)
    } catch (error) {
        console.error("Error list comments: ", error)
        res.status(500).json({error: "Internal server error"})
    }
})

// API 2: Add Comment
router.post("/commentsOfPhoto/:photo_id", async (req, res) => {
    const userId = req.session.user_id
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid User Id format" })
    }

    const { comment } = req.body
    const photoId = req.params.photo_id

    if (!comment || comment.trim() === "") {
        return res.status(400).send({ message: "Comment cannot be empty" })
    }

    try {
        const photo = await Photo.findById(photoId)
        if (!photo) {
            return res.status(404).send({ message: "Photo not found" })
        }

        const newComment = {
            comment: comment,
            date_time: new Date(),
            user_id: userId
        }

        photo.comments.push(newComment)
        await photo.save()

        res.status(200).send({ message: "Comment added successfully" })
    } catch (error) {
        console.error("Error adding comment:", error)
        res.status(500).send({ message: "Server error", error })
    }
})

module.exports = router