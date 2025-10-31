import { client } from "../index"
import { Request, Response, NextFunction } from "express"

// ----------------------------- Station Controllers ---------------------------------

const addStation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const station = req.body

        console.log("rcvd station: ", station)

        const geometryJson = JSON.stringify(station.geojson.geometry);

        console.log("geometryJSON: ", geometryJson)

        const query = `
            INSERT INTO stations (station_name, service_type, station_location)
            VALUES ($1, $2, ST_GeomFromGeoJSON($3))
            RETURNING station_id, ST_AsGeoJSON(station_location) AS station_location_json
        `;

        const values = [
            station.station_details.station_name,
            station.station_details.station_type,
            geometryJson
        ];

        const result = await client.query(query, values)

        console.log("DB result: ", result.rows[0])

        return res.status(200).json({
            id: result.rows[0].station_id
        })
    }
    catch (err: any) {
        console.error(err)
        return res.status(500).json({
            message: err.message
        })
    }
}

const editStation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

    }
    catch (err: any) {

    }
}

const deleteStation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

    }
    catch (err: any) {

    }
}

const getAllStations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await client.query(`
            SELECT
                station_id,
                station_name,
                service_type,
                ST_AsGeoJSON(station_location) AS geometry
            FROM stations
        `);

        console.log("fetched tations: ", result.rows)

        const geojson = {
            type: "FeatureCollection",
            features: result.rows.map(row => ({
                type: "Feature",
                geometry: JSON.parse(row.geometry),
                properties: {
                    id: row.station_id,
                    name: row.station_name,
                    type: row.service_type,
                },
            })),
        };

        res.status(200).json(geojson)
    }
    catch (err: any) {
        console.error(err)
        return res.status(500).json({
            message: err.message
        })
    }
}

const getStationDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

    }
    catch (err: any) {

    }
}

// --------------------------------- Zone COntrollers --------------------------------------

const addZone = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const zone = req.body

        console.log("rcvd zone: ", zone)

        const geometryJson = JSON.stringify(zone.geojson.geometry);

        console.log("geometryJSON: ", geometryJson)

        const query = `
            INSERT INTO zones (zone_name, zone_type, zone_boundary)
            VALUES ($1, $2, ST_GeomFromGeoJSON($3))
            RETURNING zone_id, ST_AsGeoJSON(zone_boundary) AS zone_boundary_json
        `;

        const values = [
            zone.zone_details.zone_name,
            zone.zone_details.zone_type,
            geometryJson
        ];

        const result = await client.query(query, values)

        console.log("DB result: ", result.rows[0])

        return res.status(200).json({
            id: result.rows[0].zone_id
        })
    }
    catch (err: any) {
        console.error(err)
        return res.status(500).json({
            message: err.message
        })
    }
}

const getZones = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await client.query(`
            SELECT
                zone_id,
                zone_name,
                zone_type,
                ST_AsGeoJSON(zone_boundary) AS geometry
            FROM zones
        `);

        console.log("fetched zones: ", result.rows)

        const geojson = {
            type: "FeatureCollection",
            features: result.rows.map(row => ({
                type: "Feature",
                geometry: JSON.parse(row.geometry),
                properties: {
                    id: row.zone_id,
                    name: row.zone_name,
                    type: row.zone_type,
                },
            })),
        };

        res.status(200).json(geojson)
    }
    catch (err: any) {
        console.error(err)
        return res.status(500).json({
            message: err.message
        })
    }
}

// -------------------------------- Incidents Controllers ---------------------------------

const checkIncidentZone = async (longitude: any, latitude: any, zoneId: string) => {
    try {

        const query = `
        SELECT EXISTS (
            SELECT 1
            FROM zones
            WHERE zone_id = $3
            AND ST_Contains(
                zone_boundary,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)
            )
        ) AS is_inside;
    `;

        // 2. Define the values for the parameterized query
        // $1: longitude, $2: latitude, $3: zoneId
        const values = [longitude, latitude, zoneId];

        const result = await client.query(query, values);

        // The result.rows[0].is_inside will be a boolean (or string 't'/'f' depending on driver settings)
        // We ensure it returns a boolean true/false.
        const isInside = result.rows[0].is_inside;
        return isInside === true || isInside === 't';
    }
    catch (err: any) {
        console.error(err)
        return null
    }
}

const getNearestStations = async (inc_lon: any, inc_lat: any, incident_type: string) => {
    try {
        let service_type;

        if (incident_type == "fire") {
            service_type = "fire"
        }
        else if (incident_type == "accident" || incident_type == "medical") {
            service_type = "ambulance"
        }
        else {
            service_type = "police"
        }

        const query = `
            SELECT 
                station_id,
                station_name,
                service_type,
                ST_Distance(
                    station_location,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)
                ) AS distance_meters
            FROM stations
            WHERE
                service_type = $3
                AND ST_DWithin(
                    station_location,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326),
                    10000
                )
            ORDER BY
                distance_meters
            LIMIT 3;
        `

        const values = [inc_lon, inc_lat, service_type]

        const result = await client.query(query, values)
        console.log("[RESULT] nearest stations: ", result.rows)

        return result.rows
    }
    catch (err: any) {
        console.error(err)
    }
}

const addIncident = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const incident = req.body

        console.log("incident: ", incident)

        const coor = incident.geojson.geometry.coordinates
        const incident_details = incident.incident_details
        const geomJSON = JSON.stringify(incident.geojson.geometry)

        const query = `
        SELECT 
            zone_id, 
            zone_name, 
            zone_type
        FROM 
            zones
        WHERE 
            ST_Contains(
                zone_boundary,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)
            )
        LIMIT 1;
        `;

        // 2. Define the values for the parameterized query
        // $1: longitude, $2: latitude
        const values = [coor[0], coor[1]];

        const result = await client.query(query, values);

        if (result.rows.length > 0) {
            console.log(`Point found in zone:\t`);
            console.log(result.rows[0])

            const query = `
                INSERT INTO incidents (incident_type, incident_location, assigned_zone_id, priority)
                VALUES ($1, ST_GeomFromGeoJSON($2), $3, $4)
                RETURNING incident_type, incident_timestamp, priority, incident_id, ST_AsGeoJSON(incident_location) AS geometry, assigned_zone_id
            `;

            const values = [
                incident_details.incident_type,
                geomJSON,
                result.rows[0].zone_id,
                incident_details.incident_priority
            ]

            const inc_res = await client.query(query, values)

            console.log("DB Result: ", inc_res)

            const geojson = await createIncidentGeoJSON(inc_res.rows)

            return res.status(201).json(geojson)

        } else {
            console.log('Point does not lie within any defined zone.');
            return res.status(400)
        }

    }
    catch (err: any) {
        console.error(err)
        return res.status(500).json({
            message: err.message
        })
    }
}

async function createIncidentGeoJSON(resultRows: any) {
    
    // 1. Create an array of Promises by mapping over the rows.
    const featurePromises = resultRows.map(async (row: any) => {
        
        // The geometry column is a string (GeoJSON object) and must be parsed.
        const geometryObject = JSON.parse(row.geometry);
        
        // 2. Extract Longitude (X) and Latitude (Y) from the coordinates array.
        // GeoJSON standard is [Longitude, Latitude]
        const longitude = geometryObject.coordinates[0];
        const latitude = geometryObject.coordinates[1];

        console.log("[INFO] incident_type: ", row.incident_type)

        // 3. Await the asynchronous call for nearest stations for THIS specific point.
        const nearestStations = await getNearestStations(
            longitude, // Correctly pass Longitude
            latitude,  // Correctly pass Latitude
            row.incident_type
        );

        // console.log("[INFO] nearest stations: ", nearestStations)

        // 4. Return the complete feature object
        return {
            type: "Feature",
            geometry: geometryObject, // Use the parsed object for the geometry field
            properties: {
                id: row.incident_id,
                type: row.incident_type,
                timestamp: row.incident_timestamp,
                assigned_zone_id: row.assigned_zone_id,
                priority: row.priority,
                // Note: Removed the redundant 'geometry' property
            },
            // nearest_stations is custom data, placed outside 'properties'
            nearest_stations: nearestStations 
        };
    });

    // 5. Wait for all promises (all nearest station fetches) to complete
    const features = await Promise.all(featurePromises);

    // 6. Construct the final GeoJSON FeatureCollection object
    const geojson = {
        type: "FeatureCollection",
        features: features,
    };
    
    return geojson;
}

const getIncidents = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await client.query(`
            SELECT
                incident_id,
                incident_type,
                incident_timestamp,
                assigned_zone_id,
                priority,
                ST_AsGeoJSON(incident_location) AS geometry
            FROM incidents
        `);

        console.log("fetched incidents: ", result.rows)

        const geojson = await createIncidentGeoJSON(result.rows)

        res.status(200).json(geojson)
    }
    catch (err: any) {
        console.error(err)
        return res.status(500).json({
            message: err.message
        })
    }
}

export {
    addStation,
    getAllStations,
    addZone,
    getZones,
    addIncident,
    getIncidents
}