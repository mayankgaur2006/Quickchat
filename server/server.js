import express from 'express';
import "dotenv/config"
import cors from 'cors'
import http from 'http'
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io'


//Create Express app and HTTP server
const app = express();
const server = http.createServer(app)

//Intialize socket.io server
export const io = new Server(server, {
    cors: { origin: "*" }
})

//Store Online users
export const userSocketMap = {} //{userId : socketId}

//Socket.io connection handler
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId
    console.log('User connected', userId)

    if (userId) userSocketMap[userId] = socket.id

    //Emit online users to all connected clients
    io.emit('getOnlineUsers', Object.keys(userSocketMap))

    socket.on('disconnect', () => {
        console.log('User Disconnected', userId)
        delete userSocketMap[userId]
        io.emit('getOnlineUsers', Object.keys(userSocketMap))
    })
})

//Middleware SetUp
app.use(express.json({ limit: "4mb" }))
app.use(cors());

//Routes Setup
app.use('/api/auth/', userRouter)
app.use('/api/messages', messageRouter)
app.use('/', (req, res) => res.send('Server is live'))

//Connect to mongodb
await connectDB()
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 7000
    server.listen(PORT, () => console.log('Server is running on Port: ' + PORT))
}
export default server

