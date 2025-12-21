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

// API 2: Delete comment
router.delete("/delete/:photo_id/:comment_id", async (req, res) => {
    const userId = req.session.user_id

    if (!userId) {
        return res.status(401).send({ message: "Not logged in" })
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ message: "Invalid User Id format" })
    }

    try {
        const photo = await Photo.findById(req.params.photo_id)
        if (!photo) {
            return res.status(404).send({ message: "Photo not found" })
        }

        const comment = photo.comments.id(req.params.comment_id)
        if (!comment) {
            return res.status(404).send({ message: "Comment not found" })
        }

        if (comment.user_id.toString() !== userId) {
            return res.status(403).send({ message: "You are not authorized to delete this comment" })
        }
        photo.comments.pull(req.params.comment_id) 
        await photo.save()
        res.status(200).send({ message: "Deleted successfully" })
    } catch (error) {
        console.error("Error deleting comment:", error)
        res.status(500).send({ message: "Server error", error })
    }
})

// API 3. Edit comment
router.put("/edit/:photo_id/:comment_id", async (req, res) => {
    const userId = req.session.user_id

    if (!userId) {
        return res.status(401).send({ message: "Not logged in" })
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ message: "Invalid User Id format" })
    }

    const { new_text } = req.body
    
    if (!new_text || new_text.trim() === "") {
        return res.status(400).send({ message: "Comment text required" })
    }
    try {
        const photo = await Photo.findById(req.params.photo_id)
        if (!photo) {
            return res.status(404).send({ message: "Photo not found" })
        }

        const comment = photo.comments.id(req.params.comment_id)
        if (!comment) {
            return res.status(404).send({ message: "Comment not found" })
        }

        if (comment.user_id.toString() !== userId) {
            return res.status(403).send({ message: "Unauthorized" })
        }
        comment.comment = new_text

        await photo.save()
        res.status(200).send({ message: "Updated successfully" })
    } catch (error) {
        console.error("Error editing comment:", error)
        res.status(500).send({ message: "Server error", error })
    }
})

module.exports = router