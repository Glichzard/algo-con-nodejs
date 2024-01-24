const express = require('express')
const cors = require('cors')
const mysql = require('mysql')

const app = express()
app.use(cors())

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'caca',
    database: 'searcher'
})

app.get('/api/places', async (req, res) => {

    console.log(req)
    const apiKey = 'AIzaSyBEPSYLKBt_5_R1BVJv14ICJp3S7FM2MkA'

    const getPlaces = async () => {
        const locationX = req.query.x || '-34.9055016'
        const locationY = req.query.y || '-56.1851147'
        const radius = req.query.radius || 500
        const type = req.query.type || 'restaurant'

        const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${locationX},${locationY}&radius=${radius}&type=${type}&key=${apiKey}`

        const response = await fetch(apiUrl)
        const { results, next_page_token } = await response.json()

        const placesToContact = []

        for (const place of results) {
            const placeInfo = await getPlacesInfo(place.place_id)
            placesToContact.push(placeInfo)
        }

        if (next_page_token) {
            const nextPagePlaces = await getMorePlaces(next_page_token)
            placesToContact.push(...nextPagePlaces)
        }

        return placesToContact
    }

    const getPlacesInfo = async (placeId) => {
        const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?&place_id=${placeId}&key=${apiKey}`
        const response = await fetch(apiUrl)
        const { result } = await response.json()

        const name = result.name
        const address = result.formatted_address
        const types = result.types
        const website = result.website
        const phone = result.formatted_phone_number

        const coords = {
            x: result.geometry.location.lat,
            y: result.geometry.location.lng,
        }

        const placeInfo = {
            name,
            address,
            types,
            website,
            coords,
            phone
        }

        return placeInfo
    }

    const getMorePlaces = async (pageToken) => {
        const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${apiKey}`

        const response = await fetch(apiUrl)
        const { results, next_page_token } = await response.json()

        const placesToContact = []

        for (const place of results) {
            const placeInfo = await getPlacesInfo(place.place_id)
            placesToContact.push(placeInfo)
        }

        if (next_page_token) {
            const nextPagePlaces = await getMorePlaces(next_page_token)
            placesToContact.push(...nextPagePlaces)
        }

        return placesToContact
    }

    const places = await getPlaces()
    res.json(places)
})

app.get('/api/history', async (req, res) => {
    connection.query('SELECT * FROM history', (error, results, fields) => {
        res.json(results)
    })
})

app.get('/api/saveHistory', async (req, res) => {
    const coords = req.query.coords
    const radius = req.query.radius

    connection.query('INSERT INTO history (coords, radius) VALUES (?, ?)', [coords, radius], (error, results, fields) => {
        console.log(error)
        console.log(results)
        console.log(fields)
    })
})

app.get('/api/clearHistory', async (req, res) => {
    connection.query('TRUNCATE TABLE history')
})

const port = 3500

app.listen(port, () => {
    console.log(`Server listening on port 127.0.0.1:${port}`)
})
