import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import http from 'http'
// import ChatModel from './models/ChatModel.js'
import { rooms } from './data/rooms.js'
import { dbConnect } from './services/dbConnect.js'

// routes
import { globalRouter, authRouter, roomsRouter, privatsRouter, userRouter } from './routes/index.js'
import { ChatModel } from './models/ChatModel.js'
import { User } from './models/user.js'

dotenv.config()
const app = express()
// ... (використання middleware)

// Load environment variables
const PORT = process.env.SERVER_PORT || 8080

const startupDevMode = app.get('env') === 'development'
const formatsLogger = startupDevMode ? 'dev' : 'short'

dbConnect()

// Set up the express application
app.use(bodyParser.json({ limit: '30mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }))
app.use(
	cors({
		origin: ['https://our-chat-my.netlify.app', 'http://localhost:3000', 'http://localhost:3001'],
		credentials: true,
		optionsSuccessStatus: 200,
	})
)

app.use(express.static('public'))
app.use('/images', express.static('images'))

// routes
app.use('/', globalRouter)
app.use('/auth', authRouter)
app.use('/rooms', roomsRouter)
app.use('/private', privatsRouter)
app.use('/user', userRouter)

const httpServer = http.createServer(app)
const io = new Server(httpServer, {
	cors: {
		origin: ['https://our-chat-my.netlify.app', 'http://localhost:3000', 'http://localhost:3001'],
		optionsSuccessStatus: 200,
	},
})

let activeUsers = []
let addedUserInCurrentChat = []
const username = 'lesoRoman'

io.on('connection', socket => {
	console.log('New User Connected', socket.id)
	socket.on('new-user-add', async user_id => {
		// if user is not added previously
		console.log(!activeUsers.some(user => user.userId === user_id))
		if (!activeUsers.some(user => user.userId === user_id)) {
			activeUsers.push({ userId: user_id, socketId: socket.id })
			console.log('New User Connected', activeUsers)
		}

		io.emit('get-users', activeUsers)
	})
	socket.on("get-curent-chatRoom", async (chat_id, userId) => {
		try {
			const chatRoom = await ChatModel.findOne({ id: chat_id })
         console.log('chatRoom',chatRoom)
			if (!chatRoom) {
				const user = await User.findById(userId)
				console.log('user',user)

				const newChatRoom = new ChatModel({
					id: chat_id,
					members: [],
					messages: [],
				})
				await newChatRoom.save()
				io.emit("get-chatRoom", newChatRoom)
			} else {
				// const populatedChatRoom = await chatRoom.populate({
				// 	path: "messages",
				// 	populate: {
				// 		path: "user",
				// 	},
				// })
				// console.log("populatedChatRoom", populatedChatRoom)

				io.emit("get-chatRoom", chatRoom)
			}
		} catch (error) {
			console.error("Error get-curent-chatRoom:", error)
		}
	})
	socket.on("send-message", async ({ text, senderId, chatId }) => {
		try {
			const chatRoom = await ChatModel.findOne({ id: chatId })
			console.log(text, senderId, chatId)
			console.log('chatRoom',chatRoom)

			// const user = await User.findById(senderId)
			// const newMessage = new Message({ text, user, chatId })
			// await newMessage.save()

			// if (chatRoom.messages) {
			// 	chatRoom.messages.push(newMessage)
			// 	await chatRoom.save()
			// } else {
			// 	chatRoom.messages = [newMessage]
			// 	await chatRoom.save()
			// }

			// const upDatedChat = await chatRoom.populate({
			// 	path: "messages",
			// 	populate: {
			// 		path: "user",
			// 		model: "users",
			// 	},
			// })
			// console.log("upDatedChat", upDatedChat)

			activeUsers.forEach(element => {
				io.to(element.socketId).emit("receive-message", { text, senderId, chatId })
				// io.to(element.socketId).emit("receive-message", upDatedChat.messages.at(-1))
			})
		} catch (error) {
			console.error("Error while processing 'get-curent-chatRoom':", error)
		}
	})
	socket.on('disconnect', () => {
		activeUsers = activeUsers.filter(user => user.socketId !== socket.id)
		console.log('User Disconnected', activeUsers)
		io.emit('get-users', activeUsers)
	})
})

httpServer.listen(PORT, () => console.log(`Listening at Port ${PORT}`))
