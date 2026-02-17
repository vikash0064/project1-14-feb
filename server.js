const express = require("express");
const fs = require("fs");

const app = express();
const FILE = "data.json";

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());




function readData() {
  if (!fs.existsSync(FILE)) return []; 
  return JSON.parse(fs.readFileSync(FILE));
}

//  save data
function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// --- ROUTES ---


app.get("/", (req, res) => {
  const messages = readData();
  res.render("index", { messages: messages, error: null });
});


app.post("/add", (req, res) => {
  const { message, time } = req.body;
  const unlockTime = new Date(time);
  const now = new Date();

  if (unlockTime <= now) {
    const messages = readData();
    return res.render("index", {
      messages: messages,
      error: "Please select a future time!"
    });
  }


  const newMsg = {
    id: Date.now(),      // Unique ID 
    text: message,      
    time: unlockTime,   
    visible: false       
  };

  // Save to list
  const messages = readData();
  messages.push(newMsg);
  saveData(messages);

  res.redirect("/");
});

//  Single Message
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

  messages = messages.filter(m => m.id != idToDelete);

  saveData(messages);
  res.redirect("/");
});

// --- BACKGROUND TASK ---

// Check every second
setInterval(() => {
  const messages = readData();
  const now = new Date();
  let fileChanged = false;

  messages.forEach(msg => {
    if (!msg.visible && now >= new Date(msg.time)) {
      msg.visible = true;
      fileChanged = true;
    }
  });
  if (fileChanged) {
    saveData(messages);
    console.log("A message has been unlocked!");
  }
}, 1000);


app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

