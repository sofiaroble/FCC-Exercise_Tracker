const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Connect to MongoDB
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Define User and Exercise schemas
const UserSchema = new Schema({ username: String });
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON request bodies

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//Post api/users
app.post("/api/users", async (req, res) => {
 const { username } = req.body;
  
 try {
   const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
 }

   const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:_id/exercises
app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const { _id } = req.params;

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exercise = new Exercise({
      user_id: _id,
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date(),
    });

    await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date.toDateString(),
      description: exercise.description,
      duration: exercise.duration,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:_id/logs
app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let exercises = Exercise.find({ user_id: _id });

    if (from) {
      exercises = exercises.where('date').gte(new Date(from));
    }

    if (to) {
      exercises = exercises.where('date').lte(new Date(to));
    }

    if (limit) {
      exercises = exercises.limit(Number(limit));
    }

    const log = await exercises.exec();

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log: log.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
