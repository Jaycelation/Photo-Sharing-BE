const express = require("express")
const Photo = require("../db/photoModel")
const User = require("../db/userModel")
const router = express.Router()

router.post("/search", async (req, res) => {
  const { searchText } = req.body

  if (!searchText) return res.status(400).send("Search text required")

  try {
    const regex = new RegExp(searchText, "i")

    const photos = await Photo.find({
      "comments.comment": regex
    })
    .populate({
        path: "user_id",
        model: User,
        select: "first_name last_name"
    })
    .populate({
        path: "comments.user_id",
        model: User,
        select: "first_name last_name"
    })

    if (!photos) return res.status(200).json([])
    res.status(200).json(photos)

  } catch (err) {
    console.error("Search Error:", err)
    res.status(500).send(err)
  }
})

router.post('/commentsOfPhoto/:photo_id', async (req, res) => {
    const { comment } = req.body
    const photoId = req.params.photo_id
    const userId = req.session.user_id || req.body.user_id

    if (!comment || !userId) {
        return res.status(400).send("Comment text and User ID are required")
    }

    try {
        const photo = await Photo.findById(photoId)
        if (!photo) return res.status(404).send("Photo not found")

        photo.comments.push({
            comment: comment,
            user_id: userId,
            date_time: new Date()
        })

        await photo.save()
        res.status(200).send(photo)
    } catch (err) {
        console.error("Add Comment Error:", err)
        res.status(500).send(err)
    }
})

router.put('/edit/:photo_id/:comment_id', async (req, res) => {
    const { photo_id, comment_id } = req.params
    const { new_text } = req.body

    if (!new_text) return res.status(400).send("New text required")

    try {
        const photo = await Photo.findById(photo_id)
        if (!photo) return res.status(404).send("Photo not found")

        const comment = photo.comments.id(comment_id)
        if (!comment) return res.status(404).send("Comment not found")

        comment.comment = new_text
        
        await photo.save()
        res.status(200).send("Comment updated")
    } catch (err) {
        console.error("Edit Error:", err)
        res.status(500).send(err)
    }
})

router.delete('/delete/:photo_id/:comment_id', async (req, res) => {
    const { photo_id, comment_id } = req.params

    try {
        const photo = await Photo.findById(photo_id)
        if (!photo) return res.status(404).send("Photo not found")

        photo.comments.pull({ _id: comment_id })

        await photo.save()
        res.status(200).send("Comment deleted")
    } catch (err) {
        console.error("Delete Error:", err)
        res.status(500).send(err)
    }
})

module.exports = router