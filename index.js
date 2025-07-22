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

app.post('/api/persons', (req, res) => {
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
    }).catch(err => {
        res.status(400).json(err.message);
    })

})

app.get('/', (req, res) => {
    res.send('OK');
});

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/api/persons/:id', (request, response) => {
    Person.findById(request.params.id).then(person => {
        if (!person) {
            return response.status(404).json({error: 'Nie znaleziono uzytkownika'});
        }
        response.json(person)
    }).catch(error => {
        if (error.name === 'CastError') {
            return response.status(400).json({error: 'Bledne id'});
        }

        console.log(error)
        response.status(500).json({error: 'Cos poszlo nie tak...'});
    })
})

app.delete('/api/persons/:id', (req, res) => {
    Person.findByIdAndDelete(req.params.id)
        .then(deleted => {
            if (!deleted) {
                return res.status(404).json({error: 'Notatka nie znaleziona'});
            }
            res.status(204).end();
        }).catch(error => {
        if (error.name === 'CastError') {
            return res.send(400).json({error: 'Bledne id'});
        }

        console.log(error)
        res.status(500).json({error: 'Cos poszlo nie tak...'});
    })
})

app.get('/info', (request, response) => {
    response.send(`<p>Phonebook has info for ${persons.reduce((acc) => acc + 1, 0)} people</p>
    <p>${date}</p>`)
})

const unknownEndpoint = (req, res) => {
    res.status(404).send({error: 'unknown endpoint'})
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});



