const createChat = (message, io) => {
  io.of("/private-chats")
};

const sendMessage = ({ message, room }, io) => {
  io.of("/private-chats").to(room).emit("message", { message });
};

const leaveRoom = (roomId) => {

};

export const roomsChatController = {
  sendMessage,
  createChat,
  leaveRoom,
};