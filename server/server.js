const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');
const connectDB = require('./src/config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*', // To be configured to specific frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Pass io to routes via req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);


// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Define routes here
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/profiles', require('./src/routes/profileRoutes'));
app.use('/api/connections', require('./src/routes/connectionRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/jobs', require('./src/routes/jobRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/chats', require('./src/routes/chatRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/companies', require('./src/routes/companyRoutes'));
app.use('/api/search', require('./src/routes/searchRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/stories', require('./src/routes/storyRoutes'));

app.get('/', (req, res) => {
  res.send('SkillLinked API is running...');
});

// Socket.io events
require('./src/sockets')(io);

// Error handling middleware
const { notFound, errorHandler } = require('./src/middlewares/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
