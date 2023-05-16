// server.js

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(bodyParser.json());

// Database configuration
const sequelize = new Sequelize('Ascend', 'Sakib', '1234', {
  host: '127.0.0.1',
  port:8000,
  dialect: 'postgres',
});

// User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// List model
const List = sequelize.define('List', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Task model
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  listId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

// Define associations between models
User.hasMany(List);
List.belongsTo(User);
List.hasMany(Task);
Task.belongsTo(List);

// Middleware to authenticate requests
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, 'your_secret_key');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Routes

// User registration
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.create({ username, password });
    res.json({ message: 'User registered successfully.', user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
});

// User login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username, password } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user.id }, 'your_secret_key');
    res.json({ message: 'Login successful.', token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.',error: err.message });
}
});

// Create a new list
app.post('/lists', authenticate, async (req, res) => {
try {
const { name } = req.body;
const userId = req.userId;
const list = await List.create({ name, userId });
res.json({ message: 'List created successfully.', list });
} catch (err) {
res.status(500).json({ message: 'List creation failed.', error: err.message });
}
});

// Move a task to another list
app.put('/tasks/:taskId', authenticate, async (req, res) => {
try {
const taskId = req.params.taskId;
const { listId } = req.body;
await Task.update({ listId }, { where: { id: taskId } });
res.json({ message: 'Task updated successfully.' });
} catch (err) {
res.status(500).json({ message: 'Task update failed.', error: err.message });
}
});

// Mark a task as completed
app.put('/tasks/:taskId/complete', authenticate, async (req, res) => {
try {
const taskId = req.params.taskId;
await Task.update({ completed: true }, { where: { id: taskId } });
res.json({ message: 'Task marked as completed.' });
} catch (err) {
res.status(500).json({ message: 'Task completion failed.', error: err.message });
}
});

// Set up server
const port = 3000;
sequelize.sync().then(() => {
app.listen(port, () => {
console.log('Server is running on http://localhost:${port}');
});
});
