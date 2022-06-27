import http from "http";
import { Server } from "socket.io";
import express from "express";
import path from "path";

let user;
const __dirname = path.resolve();
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/src/views");
// /public에 static을 해준 이유는?
app.use("/public", express.static(__dirname + "/src/public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get("/", (_, res) => res.render("home"));
app.post("/room", (req, res) => {
 
  const camera = req.body.camera ? false : true
  const voice = req.body.voice ? false : true
  const {roomname, username} = req.body
  user = username
  return res.render("room", {roomname, username, camera, voice})
});
app.get("/*", (_, res) => res.redirect("/"));



const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on("connection", (socket) => {
  socket["nickname"] = user
  socket.on("join_room", (roomName, userName) => {
    socket.join(roomName);
    // to - 나의 room을 제외한 나와 연결된 room에만 영향.
    socket.to(roomName).emit("welcome", userName);
  });
  socket.on("offer", (offer, roomName, userName) => {
    socket.to(roomName).emit("offer", offer, userName);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${msg}`);
    done();
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => socket.to(room).emit("leave", socket.nickname));
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);