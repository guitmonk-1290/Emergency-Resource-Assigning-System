import express, { Express, Request, Response } from "express";
import cors from "cors"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import router from "./routes/routes";
import http from "http"
import { Client } from "pg"
import path from "path"

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// middlewares
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(__dirname + '/public'));
app.use(cors({
    credentials: true,
    origin: "http://localhost:3000"
}))
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser())
app.use(express.json())
app.use('/api', router)

app.get('/', (req, res) => {
  res.render('index');
});

export const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'gis_project',
    password: 'password',
    port: 5432
})

async function initializeAndStartServer() {
    console.log(`[INIT] Attempting to connect to database...`);
    
    try {
        // 1. Connect to PostgreSQL
        await client.connect();
        console.log('[SUCCESS] PostgreSQL connection established.');

        // 2. Start the HTTP server
        const server = http.createServer(app);
        
        server.listen(port, () => {
            console.log(`[SUCCESS] HTTP Server is running on port ${port}`);
        });

    } catch (error) {
        console.error("[ERROR] ", error)
    }
}

initializeAndStartServer();