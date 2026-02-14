const express = require("express");
const fs = require("fs");

const app = express();
const FILE = "data.json";

// Setup Views and Forms
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- HELPER FUNCTIONS ---

// Function to read data from file
function readData() {
  if (!fs.existsSync(FILE)) return []; // Handle if file doesn't exist
  return JSON.parse(fs.readFileSync(FILE));
}

// Function to save data to file
function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// --- ROUTES ---

// 1. Home Page - Show all messages
app.get("/", (req, res) => {
  const messages = readData();
  res.render("index", { messages: messages, error: null });
});

// 2. Add Message - Save new message
app.post("/add", (req, res) => {
  const { message, time } = req.body;
  const unlockTime = new Date(time);
  const now = new Date();

  // Simple Validation: Time must be in future
  if (unlockTime <= now) {
    const messages = readData();
    return res.render("index", {
      messages: messages,
      error: "Please select a future time!"
    });
  }

  // Create new message object
  const newMsg = {
    id: Date.now(),      // Unique ID based on current time
    text: message,       // The message content
    time: unlockTime,    // When it unlocks
    visible: false       // Initially hidden
  };

  // Save to list
  const messages = readData();
  messages.push(newMsg);
  saveData(messages);

  res.redirect("/");
});

// 3. View Single Message
app.get("/message/:id", (req, res) => {
  const messages = readData();
  const foundMsg = messages.find(m => m.id == req.params.id);

  if (!foundMsg) return res.send("Message not found");

  res.render("message", { msg: foundMsg });
});

// 4. Delete Message
app.post("/delete/:id", (req, res) => {
  let messages = readData();
  const idToDelete = req.params.id;

  // Filter out the message with the given ID
  messages = messages.filter(m => m.id != idToDelete);

  saveData(messages);
  res.redirect("/");
});

// --- BACKGROUND TASK ---

// Check every second (1000ms) if any message needs unlocking
setInterval(() => {
  const messages = readData();
  const now = new Date();
  let fileChanged = false;

  messages.forEach(msg => {
    // If message is hidden AND time has passed -> Unlock it
    if (!msg.visible && now >= new Date(msg.time)) {
      msg.visible = true;
      fileChanged = true;
    }
  });

  // Only save if something changed to save computer resources
  if (fileChanged) {
    saveData(messages);
    console.log("A message has been unlocked!");
  }
}, 1000);

// Start Server
app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
