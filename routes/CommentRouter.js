const express = require("express")
const mongoose = require("mongoose")
const Photo = require("../db/photoModel")
const router = express.Router()

// API 1: Post new Comment
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