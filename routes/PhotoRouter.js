const express = require("express")
const mongoose = require("mongoose")
const Photo = require("../db/photoModel")
const User = require("../db/userModel")
const router = express.Router()

// API 1: List photos of user by id
router.get("/photosOfUser/:id", async (req, res) => {
  const userId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid User Id format" })
  }

  try {
    const photos = await Photo.find({ user_id: userId }).lean()

    if (!photos) {
      return res.status(404).send({ message: "No photos found" })
    }

    const newPhotos = await Promise.all(
      photos.map(async (photo) => {
        const comments = await Promise.all(
          photo.comments.map(async (comment) => {
            const user = await User.findById(comment.user_id).select(
              "_id first_name last_name"
            )
            return {
              _id: comment._id,
              comment: comment.comment,
              date_time: comment.date_time,
              user: user,
            }
          })
        )

        return {
          _id: photo._id,
          user_id: photo.user_id,
          comments: comments,
          file_name: photo.file_name,
          date_time: photo.date_time,
        }
      })
    )

    newPhotos.sort((a, b) => new Date(b.date_time) - new Date(a.date_time))

    res.status(200).send(newPhotos)
  } catch (error) {
    console.error("Error in /photosOfUser:", error)
    res.status(500).send({ message: "Server error", error })
  }
})

module.exports = router