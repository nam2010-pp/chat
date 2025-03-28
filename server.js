require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const usersFile = path.join(__dirname, "users.json");
const messagesFile = path.join(__dirname, "messages.json");

// Đọc dữ liệu từ file
function readFile(file) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
}

// Ghi dữ liệu vào file
function writeFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Đăng ký
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    let users = readFile(usersFile);

    if (users.find((u) => u.username === username)) {
        return res.status(400).json({ error: "Tên đăng nhập đã tồn tại!" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    users.push({ username, password: hashedPassword });
    writeFile(usersFile, users);

    res.json({ message: "Đăng ký thành công!" });
});

// Đăng nhập
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const users = readFile(usersFile);
    const user = users.find((u) => u.username === username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ error: "Sai tài khoản hoặc mật khẩu!" });
    }

    res.json({ message: "Đăng nhập thành công!", username });
});

// Lấy tin nhắn cũ
app.get("/messages", (req, res) => {
    const messages = readFile(messagesFile);
    res.json(messages);
});

// Socket.io xử lý tin nhắn real-time
io.on("connection", (socket) => {
    console.log("🟢 Người dùng kết nối");

    socket.on("sendMessage", (data) => {
        let messages = readFile(messagesFile);
        messages.push(data);
        writeFile(messagesFile, messages);

        io.emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
        console.log("🔴 Người dùng ngắt kết nối");
    });
});

server.listen(port, () => {
    console.log(`🚀 Server chạy tại http://localhost:${port}`);
});
console.log("© 2025 Nam2010. All rights reserved.");
