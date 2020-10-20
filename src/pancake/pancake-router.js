const path = require('path')
const express = require('express')
const xss = require('xss')
const PancakeService = require('./pancake-service')

const pancakeRouter = express.Router()
const jsonParser = express.json()

//filter out the response to avoid showing broken data
const serializePancake = pancake => ({
    id: pancake.id,
    title: xss(pancake.title),
    completed: pancake.completed
})

pancakeRouter
    .route('/')
    //relevant
    .get((req, res, next) => {

        //connect to the service to get the data
        PancakeService.getPancakes(req.app.get('db'))
            .then(pancakes => {
                //map the results to get each one of the objects and serialize them
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
            title,
            completed
        }

        //validate the input
        for (const [key, value] of Object.entries(newPancake)) {
            if (value == null) {
                //if there is an error show it
                return res.status(400).json({
                    error: {
                        message: `Missing '${key}' in request body`
                    }
                })
            }
        }

        //save the input in the db
        PancakeService.insertPancake(
                req.app.get('db'),
                newPancake
            )
            .then(pancake => {
                res
                //display the 201 status code
                    .status(201)
                    //redirect the request to the original url adding the pancake id for editing
                    .location(path.posix.join(req.originalUrl, `/${pancake.id}`))
                    //return the serialized results
                    .json(serializePancake(pancake))
            })
            .catch(next)
    })


pancakeRouter
    .route('/:pancake_id')
    .all((req, res, next) => {
        if (isNaN(parseInt(req.params.pancake_id))) {
            //if there is an error show it
            return res.status(404).json({
                error: {
                    message: `Invalid id`
                }
            })
        }

        //connect to the service to get the data
        PancakeService.getPancakeById(
                req.app.get('db'),
                req.params.pancake_id
            )
            .then(pancake => {
                if (!pancake) {
                    //if there is an error show it
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

        //get each one of the objects from the results and serialize them
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

        //validate the input by checking the length of the pancakeToUpdate object to make sure that we have all the values
        const numberOfValues = Object.values(pancakeToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            //if there is an error show it
            return res.status(400).json({
                error: {
                    message: `Request body must content either 'title' or 'completed'`
                }
            })
        }

        //save the input in the db
        PancakeService.updatePancake(
                req.app.get('db'),
                req.params.pancake_id,
                pancakeToUpdate
            )
            .then(updatedPancake => {

                //get each one of the objects from the results and serialize them
                res.status(200).json(serializePancake(updatedPancake))
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

                //check how many rows are effected to figure out if the delete was successful
                res.status(204).json(numRowsAffected).end()
            })
            .catch(next)
    })


module.exports = pancakeRouter