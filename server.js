import { errorsMidleware } from './src/middlewares/errorsMiddleware.js';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import { dbConnect } from './src/services/dbConnect.js';

// routes
import {
  globalRouter,
  authRouter,
  roomsRouter,
  userRouter,
  privateChatsRouter,
  roomsChatRouter,
} from './src/routes/index.js';

dotenv.config();
const app = express();

// Load environment variables
const PORT = process.env.SERVER_PORT || 8080;
const startupDevMode = app.get('env') === 'development';

dbConnect();

const frontURL = ['http://localhost:3000', 'http://localhost:3001', 'https://our-chat-app-two.vercel.app']

// Set up the express application
app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));

app.options('/auth/signup', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*'); // Встановлюємо дозвіл на будь-яке джерело
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).send();
});

app.use(
  cors({
    origin: frontURL,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.options('/auth/signup', cors());

app.use(express.static('public'));
app.use('/images', express.static('images'));

// routes
app.use('/', globalRouter);
app.use('/auth', authRouter);
app.use('/rooms', roomsRouter);
app.use('/user', userRouter);

// Necessary to resolve server crash when an error occurs
// app.use(errorsMidleware);


const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: frontURL,
    optionsSuccessStatus: 200,
  },
});

privateChatsRouter(io);
roomsChatRouter(io);


httpServer.listen(PORT, () => console.log(`Listening at Port ${PORT} frontURL ${frontURL}`));
