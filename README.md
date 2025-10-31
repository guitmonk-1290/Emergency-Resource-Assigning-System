# Emergency Resource Assigning System

This system aims at creating and finding the nearest stations for emergencies or incidents on an interactive map using postgres database

The project uses leaflet.draw to present an interactive map using which a user can add incidents or stations to the map including zone marking

## Install dependencies
```
npm install
```
This will install all the needed libraries and dependencies

## Database schema
We will use the `postgis` extension to store location data in our database

```

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS zones(
	zone_id SERIAL PRIMARY KEY,
	zone_name VARCHAR(255) NOT NULL UNIQUE,
	zone_type VARCHAR(50) NOT NULL CHECK (zone_type in ('residential', 'commercial', 'industrial', 'rural')),
	zone_boundary GEOMETRY(POLYGON, 4326)
);

CREATE INDEX IF NOT EXISTS index_zone_boundary ON zones USING GIST (zone_boundary);

CREATE TABLE IF NOT EXISTS stations(
	station_id SERIAL PRIMARY KEY,
	station_name VARCHAR(255) NOT NULL UNIQUE,
	service_type VARCHAR(50) NOT NULL CHECK (service_type in ('police', 'fire', 'ambulance')),
	station_location GEOMETRY(POINT, 4326)
);

CREATE INDEX IF NOT EXISTS index_station_location ON stations USING GIST (station_location);

CREATE TABLE IF NOT EXISTS incidents(
	incident_id SERIAL PRIMARY KEY,
	incident_type VARCHAR(50) NOT NULL CHECK (incident_type in ('fire', 'accident', 'medical', 'crime')),
	incident_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	incident_location GEOMETRY(POINT, 4326),
	assigned_zone_id INTEGER REFERENCES zones(zone_id),
	priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS index_incident_location on incidents USING GIST (incident_location);
CREATE INDEX IF NOT EXISTS index_incident_timestamp on incident USING GIST (incident_timestamp);

CREATE TABLE IS NOT EXISTS resources(
resource_id SERIAL PRIMARY KEY,
unit_name VARCHAR(50) NOT NULL UNIQUE
)

```

## Running the project
Before running the project, make sure to put your database user's password and database name in the `index.ts` file
```
npm run dev
```
