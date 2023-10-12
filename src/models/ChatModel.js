import mongoose from 'mongoose'

const ChatSchema = new mongoose.Schema(
	{
		id: {
			type: mongoose.Schema.Types.ObjectId,
		},
		chatName: {
			type: String,
		},
		members: {
			type: Array,
		},
		messages: {
			type: Array,
		},
		messagesById: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'MessageModel',
			},
		],
	},
	{
		timestamps: true,
	}
)

const ChatModel = mongoose.model('Chat', ChatSchema)
export default ChatModel
