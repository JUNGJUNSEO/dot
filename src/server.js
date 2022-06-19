import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
// /public에 static을 해준 이유는?
app.use("/public", express.static(__dirname + "/public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get("/", (_, res) => res.render("home"));
app.post("/room", (req, res) => {
  const {roomname, username} = req.body
  return res.render("room", {roomname, username})
});
app.get("/*", (_, res) => res.redirect("/"));


const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
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
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);