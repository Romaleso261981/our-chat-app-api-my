// import { Rooms } from '../models/rooms.js'
import ChatModel from '../models/ChatModel.js'
import MessageModel from '../models/messageModel.js'
import { Rooms } from '../models/rooms.js'

export default async function (io) {
	let activeUsers = []

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
		socket.on('add-user-in-curent-chatRoom', ({ userName }) => {
			console.log('get-curent-chatRoom', userName)
			io.emit('user-added-in-chatRoom', userName)
		})
		socket.on('get-curent-chatRoom', async (chatName, userId) => {
			console.log('get-curent-chatRoom', chatName, userId)
			try {
				const chatRoom = await ChatModel.findOne({ chatName })
				console.log(!chatRoom)
				if (!chatRoom) {
					const newChatRoom = new ChatModel({
            chatName,
						members: [userId],
						messages: [],
						messagesById: [],
					})
					await newChatRoom.save()
					// const chatRoomMessages = await ChatModel.findOne({ chatName }).populate('messagesById')
          // console.log('chatRoomMessages', chatRoomMessages)
					io.emit('get-chatRoom', newChatRoom)
				} else {
					// const chatRoomMessages = await ChatModel.findOne({ chatName }).populate('messagesById')
					io.emit('get-chatRoom', chatRoom)
					// io.emit('get-chatRoomMessages', chatRoomMessages)
				}
			} catch (error) {
				console.error("Error while processing 'get-curent-chatRoom':", error)
			}
		})
		socket.on('send-message', async ({ text, senderId, chatId: chatName, userName, userMood }) => {
			console.log('send-message', text, senderId, chatName, userName, userMood)

			try {
				const newMessage = new MessageModel({
					chatName,
					senderId,
					text,
				})
				const savedMessage = await newMessage.save()
				const chatRoom = await ChatModel.findOne({ chatName })

				if (chatRoom) {
				  chatRoom.messagesById.push(savedMessage._id); // Додавання ID повідомлення до чату
				  const savedChatRoom = await chatRoom.save();
				}
				console.log(savedMessage, savedChatRoom)
			} catch (error) {
        console.log('error savedMessage')
			}
			try {
				const chatRoom = await ChatModel.findOne({ chatName })
        console.log('chatRoom', chatRoom)

				if (chatRoom) {
					chatRoom.messages.push({ text, senderId, chatName, userName, userMood })
					await chatRoom.save()
				}
			} catch (error) {
				console.error("Error while processing 'get-curent-chatRoom':", error)
			}

			const upDatedChat = await ChatModel.findOne({ chatName })
			activeUsers.forEach(element => {
				io.to(element.socketId).emit('receive-message', upDatedChat.messages.at(-1))
			})
		})
		socket.on('disconnect', () => {
			activeUsers = activeUsers.filter(user => user.socketId !== socket.id)
			console.log('User Disconnected', activeUsers)
			io.emit('get-users', activeUsers)
		})
	})
}

// Предварительный код для сравнения, работает - проверял )
// let rooms = await Rooms.find().exec();

//   rooms = rooms
//       .map(({ id, title, image, description }) => (
//         { id, title, image, description }
//       ));

//   for (const room of rooms) {
//     io.of(`/${room.id}`).on("connection", (socket) => {
//       socket.on("message", async (message) => {
//         const sockets = [];
//         (await io.of(`/${room.id}`).allSockets()).forEach(item => sockets.push(item));
//         io.of(`/${room.id}`).emit("message", {
//           message,
//           iosockets:sockets
//         })
//       })
//     });
//   }

// Для получения учасников чата обратись к io.of(`/${room.id}`).allSockets()
// он возвращает промис с типом Set который может быть удобно проитерировать например:
// orderNamespace.on("connection", (socket) => {
//   socket.on("create", (message) => {
//     io.of("/private-chats")
//   });
//   socket.join("room1");
//   socket.on("message", async (message) => {
//     const sockets = [];
//     (await orderNamespace.allSockets()).forEach(item => sockets.push(item));
//     orderNamespace.to("room1").emit("message", {
//       message,
//       iosockets:sockets
//     })
//   })
// });
