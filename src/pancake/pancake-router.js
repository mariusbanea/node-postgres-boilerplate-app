const path = require('path')
const express = require('express')
const xss = require('xss')
const PancakeService = require('./pancake-service')

const pancakeRouter = express.Router()
const jsonParser = express.json()

const serializePancake = pancake => ({
    id: pancake.id,
    title: xss(pancake.title),
    completed: pancake.completed
})

pancakeRouter
    .route('/')

    //relevant
    .get((req, res, next) => {
        PancakeService.getPancakes(req.app.get('db'))
            .then(pancakes => {
                res.json(pancakes.map(serializePancake))
            })
            .catch(next)
    })

    //relevant
    .post(jsonParser, (req, res, next) => {

        //take the input from the user
        const {
            title,
            completed = false
        } = req.body
        const newPancake = {
            title
        }

        //validate the input
        for (const [key, value] of Object.entries(newPancake))
            if (value == null)
                return res.status(400).json({
                    error: {
                        message: `Missing '${key}' in request body`
                    }
                })

        newPancake.completed = completed;

        //save the input in the db
        PancakeService.insertPancake(
                req.app.get('db'),
                newPancake
            )
            .then(pancake => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${pancake.id}`))
                    .json(serializePancake(pancake))
            })
            .catch(next)
    })

pancakeRouter
    .route('/:pancake_id')
    .all((req, res, next) => {
        if (isNaN(parseInt(req.params.pancake_id))) {
            return res.status(404).json({
                error: {
                    message: `Invalid id`
                }
            })
        }
        PancakeService.getPancakeById(
                req.app.get('db'),
                req.params.pancake_id
            )
            .then(pancake => {
                if (!pancake) {
                    return res.status(404).json({
                        error: {
                            message: `Pancake doesn't exist`
                        }
                    })
                }
                res.pancake = pancake
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializePancake(res.pancake))
    })

    //relevant
    .patch(jsonParser, (req, res, next) => {
        //take the input from the user
        const {
            title,
            completed
        } = req.body
        const pancakeToUpdate = {
            title,
            completed
        }

        //validate the input
        const numberOfValues = Object.values(pancakeToUpdate).filter(Boolean).length
        if (numberOfValues === 0)
            return res.status(400).json({
                error: {
                    message: `Request body must content either 'title' or 'completed'`
                }
            })

        //save the input in the db
        PancakeService.updatePancake(
                req.app.get('db'),
                req.params.pancake_id,
                pancakeToUpdate
            )
            .then(updatedPancake => {
                res.status(200).json(serializePancake(updatedPancake[0]))
            })
            .catch(next)
    })

    //relevant
    .delete((req, res, next) => {
        PancakeService.deletePancake(
                req.app.get('db'),
                req.params.pancake_id
            )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })


module.exports = pancakeRouter
