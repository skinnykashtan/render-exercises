require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const {response, request} = require("express");
const app = express()
const Person = require('./models/persons')

morgan.token('body', (req) => {
    return JSON.stringify(req.body)
})
//kupa
app.use(express.static('dist'))
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

let date = new Date().toString()

app.post('/api/persons', (req, res, next) => {
    const body = req.body

    if (!body.number || !body.name) {
        return res.status(400).json({
            error: 'number or name is missing'
        })
    }

    Person.exists({ name: body.name }).then((exists) => {
        if (exists) {
            return Promise.reject({ status: 400, body: {error: 'name must be unique'}});
        }
        return new Person({
            name: body.name,
            number: body.number
        }).save();
    }).then(savedPerson => {
        res.status(201).json(savedPerson);
    }).catch(error => next(error));
})

app.get('/api/persons', (req, res, next) => {
    Person.find({}).then(persons => {
        res.status(200).json(persons);
    }).catch(error => next(error));
})

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(request.params.id)
        .then(person => {
        if (person) {
            return res.json(person);
        }
        res.status(404).end();
    }).catch(error => next(error));
})

app.delete('/api/persons/:id', (req, res, next) => {
    Person.findByIdAndDelete(req.params.id)
        .then(result => {
            if (result) {
                return res.status(204).end();
            }
            res.status(400).json({ error: 'person not found' });
        }).catch(error => next(error));
})

app.put('/api/persons/:id', (req, res, next) => {
    const { number } = req.body;
    const id = req.params.id;

    Person.findByIdAndUpdate(
        id,
        { number },
        {
            new: true,
            runValidators: true,
            context: 'query'
        })
        .then(updatedPerson => {
            if (!updatedPerson) {
                return res.status(404).end();
            }
            return res.status(200).json(updatedPerson);
        }).catch(error => next(error))
})

const unknownEndpoint = (req, res) => {
    res.status(404).send({error: 'unknown endpoint'})
}

app.use(unknownEndpoint)

const errorHandler = (error, req, res, next) => {
    console.error(error.message);

    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'malformatted id' });
    } else if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message})
    }

    return res.status(500).json({ error: 'internal server error' });
}

app.use(errorHandler);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});



