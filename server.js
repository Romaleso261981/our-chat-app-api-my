import { errorsMidleware } from './src/middlewares/errorsMiddleware.js'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import { Server } from 'socket.io'
import http from 'http'
import { dbConnect } from './src/services/dbConnect.js'

// routes
import {
	globalRouter,
	authRouter,
	roomsRouter,
	userRouter,
	privateChatsRouter,
	roomsChatRouter,
} from './src/routes/index.js'

dotenv.config()
const app = express()

// Load environment variables
const PORT = process.env.SERVER_PORT || 8080
const startupDevMode = app.get('env') === 'development'

dbConnect()

// Set up the express application
const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());  
app.use(express.json());

app.use(express.static('public'))
app.use('/images', express.static('images'))

// routes
app.use('/', globalRouter)
app.use('/auth', authRouter)
app.use('/rooms', roomsRouter)
app.use('/user', userRouter)

// Necessary to resolve server crash when an error occurs
// app.use(errorsMidleware)

const httpServer = http.createServer(app)
const io = new Server(httpServer, {
	cors: {
		origin: 'https://our-chat-my.netlify.app',
		optionsSuccessStatus: 200,
	},
})

privateChatsRouter(io)
roomsChatRouter(io)

httpServer.listen(PORT, () => console.log(`Listening at Port ${PORT} frontURL ${frontURL}`))
