// import { Rooms } from '../models/rooms.js'
import ChatModel from '../models/ChatModel.js';

export default async function(io) {
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
    socket.on('get-curent-chatRoom', 
    async (chat_id, userId) => {
      try {
        const chatRoom = await ChatModel.findOne({ id: chat_id })
        if (!chatRoom) {
          const newChatRoom = new ChatModel({
            id: chat_id,
            members: [userId],
            messages: [],
          })
          await newChatRoom.save()
          io.emit('get-chatRoom', newChatRoom)
        } else {
          io.emit('get-chatRoom', chatRoom)
        }
      } catch (error) {
        console.error("Error while processing 'get-curent-chatRoom':", error)
      }
    })
    socket.on('send-message', async ({ text, senderId, chatId, userName, userMood }) => {
      try {
        const chatRoom = await ChatModel.findOne({id: chatId})
  
        if (chatRoom) {
          chatRoom.messages.push({ text, senderId, chatId, userName, userMood })
          await chatRoom.save()
        }
      } catch (error) {
        console.error("Error while processing 'get-curent-chatRoom':", error)
      }
  
      const upDatedChat = await ChatModel.findOne({ id: chatId })
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
io.of("/private-chats").on('connection', socket => {
console.log('New User Connected', socket.id)
console.log('New User Connected', socket)
})

}
