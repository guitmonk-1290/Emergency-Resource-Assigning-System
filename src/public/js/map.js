// Initialize map
const map = L.map('map', { drawControl: true }).setView([28.6139, 77.2090], 13); // Example: New Delhi

// Add OpenStreetMap layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// add markers on the map
// L.marker([28.61, 77.20]).addTo(map);

// FeatureGroup to store editable layers
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Add draw control
const drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    },
    draw: {
        polygon: true,
        rectangle: true,
        polyline: true,
        circle: true,
        marker: true
    }
});
map.addControl(drawControl);

async function loadZones() {
    try {
        const res = await fetch('http://localhost:5000/api/zones')

        console.log("loadZones response: ", res)

        const geojson = await res.json()

        L.geoJSON(geojson, {
            style: feature => ({
                color:
                    feature.properties.type === "residential" ? "blue" :
                        feature.properties.type === "commercial" ? "red" :
                            feature.properties.type === "industrial" ? "orange" :
                                "green",
                weight: 2,
                fillOpacity: 0.3
            }),
            onEachFeature: (feature, layer) => {
                layer.bindPopup(
                    `<strong>${feature.properties.name}</strong><br>Type: ${feature.properties.type}`
                );
            }
        }).addTo(map)
    }
    catch (err) {
        console.error("Failed to load zones: ", err)
    }
}

async function loadStations() {
    try {
        const res = await fetch('http://localhost:5000/api/stations');

        // if (!res.ok) {
        //     throw new Error(`HTTP error! status: ${res.status}`);
        // }

        const geojson = await res.json();

        L.geoJSON(geojson, {
            //  pointToLayer to customize how Point features are rendered (e.g., as CircleMarkers)
            // pointToLayer: (feature, latlng) => {
            //     // Return a CircleMarker instead of the default L.marker
            //     return L.circleMarker(latlng, {
            //         radius: 6,        // Set the size of the circle
            //         color: "purple",  // The stroke color
            //         weight: 2,        // The stroke weight
            //         fillColor: "#ff7800", // The fill color
            //         fillOpacity: 0.8  // The fill opacity
            //     });
            // },

            onEachFeature: (feature, layer) => {
                // 3. The bindPopup logic is correct and remains the same
                if (feature.properties) {
                    layer.bindPopup(
                        `<strong>${feature.properties.name || 'No Name'}</strong><br>Service type: ${feature.properties.type || 'N/A'}`
                    );
                }
            }
        }).addTo(map);
    }
    catch (err) {
        console.error("Failed to load stations: ", err);
    }
}

function getPriorityColor(p) {
    switch (p) {
        case 1:
            return "red";
            break
        case 2:
            return "orange"
            break
        case 3:
            return "blue"
            break
        case 4:
            return "skyblue"
            break
        case 5:
            return "green"
            break
    }
}

function generateStationsList(stations) {

    if (!stations || stations.length === 0) {
        return '<p style="color: #999; font-size: 0.85em;">No nearby stations found.</p>';
    }

    // Use map() to transform each station object into an <li> HTML string
    const stationItems = stations.map(station => `
        <li style="margin-top: 5px; padding-left: 10px; border-left: 3px solid ${getStationColor(station.sercice_type)};">
            <strong style="color: blue;">${station.station_name}</strong> 
            <span style="font-size: 0.85em; color: #777;">(${station.service_type})</span>
        </li>
    `).join(''); // Join the array of strings into one single string

    return `
        <ul style="list-style: none; padding: 0; margin-top: 5px;">
            ${stationItems}
        </ul>
    `;
}

// Helper function to get a color based on station type (assuming this exists)
function getStationColor(type) {
    const t = String(type).toLowerCase();
    if (t === 'police') return 'darkblue';
    if (t === 'fire') return 'red';
    if (t === 'ambulance') return 'orange';
    return '#ccc';
}

function addIncidentEntry(incidentData, nearest_stations, list) {
    console.log("[INFO] data: ", incidentData);

    // 1. Create a new list item (LI) element
    const newListItem = document.createElement('li');
    newListItem.classList.add('incident-entry');

    // Optional: Use a data attribute to store the zone ID for later filtering/interaction
    newListItem.dataset.zone_id = incidentData.assigned_zone_id;

    // 2. Generate detailed HTML content using a template literal
    newListItem.innerHTML = `
        <div class="incident-card" style="
            padding: 12px 15px; 
            border: 1px solid gray; 
            display: flex; 
            flex-direction: column;  
            background-color: #ffffff;
            margin-bottom: 8px;
            background-color: #F7F0F0;
        ">
        
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                font-size: 1.1em; 
                font-weight: 600;
            ">
                <div style="display: flex; gap: 15px;">
                    <span style="color: #666;">ID: ${incidentData.id}</span>
                    <span style="color: #333;">${incidentData.type}</span>
                </div>

                <span style="
                    color: white; 
                    background-color: ${getPriorityColor(incidentData.priority)}; 
                    padding: 4px 8px; 
                    border-radius: 4px;
                    font-size: 0.9em;
                    font-weight: bold;
                ">
                    ${incidentData.priority}
                </span>
            </div>

            <div style="
                display: flex; 
                justify-content: space-between; 
                font-size: 0.9em; 
                color: #888; 
                padding-top: 5px; 
                border-top: 1px dashed #f0f0f0;
            ">
                <span>
                    <i class="far fa-clock"></i> 
                    ${new Date(incidentData.timestamp).toLocaleString()}
                </span>
                
                <span>
                    Zone ID: 
                    <strong style="color: #007bff;">${incidentData.assigned_zone_id || 'Unassigned'}</strong>
                </span>
            </div>

            <div style="
                margin-top: 10px; 
                padding-top: 5px; 
                border-top: 1px solid #eee;
            ">
                <p style="font-weight: 600; margin-bottom: 5px; font-size: 0.95em;">Nearest Response Stations:</p>
                
                ${generateStationsList(nearest_stations)}
            </div>
        </div>
    `;

    // 3. Append the new list item to the unordered list
    list.appendChild(newListItem);
}

const loadIncidents = async (list) => {
    try {
        const res = await fetch('http://localhost:5000/api/incidents');

        const geojson = await res.json();

        L.geoJSON(geojson, {
            //  pointToLayer to customize how Point features are rendered (e.g., as CircleMarkers)
            pointToLayer: (feature, latlng) => {
                const cautionIcon = L.divIcon({
                    // Use Font Awesome classes for styling and the icon itself
                    html: '<i class="fa-solid fa-triangle-exclamation" style="font-size: 24px; color: gold; text-shadow: 1px 1px 2px #000;"></i>',
                    className: 'incident-marker', // Optional: for custom CSS targeting
                    iconSize: [24, 24],          // Size of the icon container
                    iconAnchor: [12, 24]         // Point of the icon which will correspond to marker's location
                });

                // Return a standard marker with the custom icon
                return L.marker(latlng, { icon: cautionIcon });
            },

            onEachFeature: (feature, layer) => {

                // 3. The bindPopup logic is correct and remains the same
                if (feature.properties) {

                    addIncidentEntry(feature.properties, feature.nearest_stations, list)

                    layer.bindPopup(
                        `<strong>${feature.properties.type}</strong><br>Incident priority: ${feature.properties.priority || 'N/A'}`
                    );
                }
            }
        }).addTo(map);
    }
    catch (err) {
        console.error("Failed to load stations: ", err);
    }
}

function askPointType() {
    return new Promise((resolve) => {
        const choice = prompt("Enter marker type (station / incident): ");
        if (choice && (choice.toLowerCase() === "station" || choice.toLowerCase() === "incident")) {
            resolve(choice.toLowerCase());
        } else {
            resolve(null);
        }
    });
}

function askZoneDetails() {
    return new Promise((resolve) => {
        const zone_name = prompt("Enter zone name ")
        const zone_type = prompt("Enter zone type (residential / commercial / industrial / rural) ")
        if (zone_name && zone_type && (["residential", "commercial", "industrial", "rural"].includes(zone_type.toLowerCase()))) {
            resolve({
                zone_name: zone_name,
                zone_type: zone_type.toLowerCase()
            });
        } else {
            resolve(null);
        }
    });
}

function askStationDetails() {
    return new Promise((resolve) => {
        const station_name = prompt("Enter station name ")
        const station_type = prompt("Enter station type (police / fire / ambulance) ")
        if (station_name && station_type && (["police", "fire", "ambulance"].includes(station_type.toLowerCase()))) {
            resolve({
                station_name: station_name,
                station_type: station_type.toLowerCase()
            });
        } else {
            resolve(null);
        }
    });
}

function askIncidentDetails() {
    return new Promise((resolve) => {
        const incident_type = prompt("What is the type of incident (fire / crime / accident / medical)")
        const incident_priority = prompt("Enter incident priority (1 to 5)")
        if (incident_type && incident_priority && (["fire", "crime", "accident", "medical"].includes(incident_type.toLowerCase()) && (incident_priority >= 1 && incident_priority <= 5))) {
            resolve({
                incident_type: incident_type.toLowerCase(),
                incident_priority: incident_priority
            });
        } else {
            resolve(null);
        }
    });
}

// When a shape is created
map.on(L.Draw.Event.CREATED, async function (e) {
    const layer = e.layer;
    drawnItems.addLayer(layer);

    // Convert drawn shape to GeoJSON
    const geojson = layer.toGeoJSON();
    console.log('Drawn shape:', geojson);

    switch (geojson.geometry.type) {
        case 'Polygon': {
            // create a zone
            const zone_details = await askZoneDetails()
            console.log("request body: ", JSON.stringify({
                geojson,
                zone_details
            }))
            console.log("zone details: ", zone_details)
            fetch('http://localhost:5000/api/zone/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    geojson,
                    zone_details
                })
            })
                .then(res => res.json)
                .then((data) => {
                    // console.log("server: ", data)
                    layer._leaflet_id = data.zone_id
                    alert("Zone created successfully")
                })
            break
        }
        case 'Point': {
            const pointType = await askPointType()
            console.log("pointType: ", pointType)
            if (pointType === "station") {
                const station_details = await askStationDetails()
                fetch('http://localhost:5000/api/station/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        geojson,
                        station_details
                    })
                })
                    .then(res => res.json)
                    .then(data => {
                        layer._leaflet_id = data.station_id
                        alert("Station added successfully")
                        window.location.reload()
                        // console.log("server: ", data)
                    })
            }
            else if (pointType === "incident") {
                const incident_details = await askIncidentDetails()
                const res = await fetch('http://localhost:5000/api/incident/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        geojson,
                        incident_details
                    })
                })

                const gj = await res.json()

                L.geoJSON(gj, {
                    //  pointToLayer to customize how Point features are rendered (e.g., as CircleMarkers)
                    pointToLayer: (feature, latlng) => {
                        const cautionIcon = L.divIcon({
                            // Use Font Awesome classes for styling and the icon itself
                            html: '<i class="fa-solid fa-triangle-exclamation" style="font-size: 24px; color: gold; text-shadow: 1px 1px 2px #000;"></i>',
                            className: 'incident-marker', // Optional: for custom CSS targeting
                            iconSize: [24, 24],          // Size of the icon container
                            iconAnchor: [12, 24]         // Point of the icon which will correspond to marker's location
                        });

                        // Return a standard marker with the custom icon
                        return L.marker(latlng, { icon: cautionIcon });
                    },

                    onEachFeature: (feature, layer) => {

                        // 3. The bindPopup logic is correct and remains the same
                        if (feature.properties) {

                            addIncidentEntry(feature.properties, feature.nearest_stations, list)

                            layer.bindPopup(
                                `<strong>${feature.properties.type}</strong><br>Incident priority: ${feature.properties.priority || 'N/A'}`
                            );
                        }
                    }
                }).addTo(map)
            }
            break
        }
    }

    // Send to backend (optional)
    //   fetch('/save-shape', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(geojson)
    //   })
    //   .then(res => res.json())
    //   .then(data => console.log('Server response:', data));
});

let featureList;

function setupDetailsPanel() {
    const detailsDiv = document.getElementById('details');

    // Add Search/Filter Controls
    detailsDiv.innerHTML = `
        <div style="padding: 15px; border-bottom: 1px solid #ccc;">
            <h2>Emergency Resource Assigning System</h2>
            <label style="color: blue;" for="search-input">Use the marker icon on the map to add a new incident</label>
        </div>
        
        <div id="list" style="padding: 15px; overflow-y: auto; height: calc(100% - 130px);">
            <h3>Active incidents</h3>
            <ul id="incidents-list" style="list-style: none; padding: 0;">
                <li style="margin-bottom: 5px; padding: 5px; border-bottom: 1px dotted #eee;">Loading features...</li>
            </ul>
        </div>
    `;

    // --- Add basic interactivity ---
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-btn');
    featureList = document.getElementById('incidents-list');

    // Initial placeholder for the list
    featureList.innerHTML = `<li style="margin-bottom: 5px; padding: 5px; border-bottom: 1px dotted #eee;">List content will be dynamic.</li>`;
}

// ====================================================================
// INITIAL LOAD
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup the details panel first
    setupDetailsPanel();

    // 2. Load data onto the map
    loadZones();
    loadStations();
    loadIncidents(featureList);
});