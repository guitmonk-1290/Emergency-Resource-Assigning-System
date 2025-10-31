import express from "express"
import { addIncident, addStation, addZone, getAllStations, getIncidents, getZones } from "../controllers/controllers"

const router = express.Router()

router.get('/', (req, res) => {
    console.log("Hit the API router!")
})

router.post('/station/add', addStation)
router.post('/station/edit', () => {})
router.post('/station/delete', () => {})
router.get('/stations', getAllStations)
router.get('/station/details/:stationId', () => {})

router.post('/incident/add', addIncident)
router.post('/incident/edit', () => {})
router.post('/incident/delete', () => {})
router.get('/incidents', getIncidents)
router.get('/incident/details/:incidentId', () => {})

router.post('/zone/add', addZone)
router.post('/zone/edit', () => {})
router.post('/zone/delete', () => {})
router.get('/zones', getZones)
router.get('/zone/details/:zoneId', () => {})

router.post('/resource/add', () => {})
router.post('/resource/edit', () => {})
router.post('/resource/delete', () => {})
router.get('/resources', () => {})
router.get('/resource/details/:resourceId', () => {})

export default router