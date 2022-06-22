const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const phoneBtn = document.getElementById("phone");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");


let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let userName
let myPeerConnection;
let myDataChannel;

async function initCall() {
  await getMedia();
  makeConnection();
  const {id} = call.dataset;
  const objData = JSON.parse(id);

  if (!objData.camera){
    handleCameraClick()
  }
  if (!objData.voice){
    handleMuteClick()
  }
  roomName = objData.roomname
  userName = objData.username
  socket.emit("join_room", roomName);
}

initCall();

// 카메라 종류.
async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

// 내 커퓨터의 카메라와 오디오를 가져옴.
async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}
// 음성 끄고 켜기
function handleMuteClick() {
  const icon = muteBtn.querySelector("i")
  
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  
  if (!muted) {
    icon.classList = "fas fa-microphone-slash";
    muted = true;
  } else {
    icon.classList = "fas fa-microphone";
    muted = false;
  }
}

// 카메라 끄고 켜기
function handleCameraClick() {
  const icon = cameraBtn.querySelector("i")
  const buttons = document.querySelectorAll(".call__button div")

  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));

  if (cameraOff) {
    icon.classList = "fas fa-video";
    cameraOff = false;
    buttons.forEach((button) =>{
      button.style.color = "white"
      button.style.backgroundColor = "rgba(0,0,0,0.4)"
    })
  } else {
    icon.classList = "fas fa-video-slash";
    cameraOff = true;
    buttons.forEach((button) =>{
      button.style.color = "black"
      button.style.backgroundColor = "white"
    })
    
  }
}

function handlePhoneClick() {
  history.back() 
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
phoneBtn.addEventListener("click", handlePhoneClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)

// const welcomeForm = document.querySelector("form");



// Socket Code
socket.on("welcome", async () => {
  // 방을 만든 사람.
  // message - peer에게 오는 message
  myDataChannel = await myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) => {
    const {value, userName} = JSON.parse(event.data)
    addMessage(value, userName)});
  
  // video
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {

  // message - peer에게 오는 message
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) => {
      const {value, userName} = JSON.parse(event.data)
      addMessage(value, userName)});
  });

  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

// RTC Code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}


// setting code

const callSettingIcon = document.querySelector(".call__setting-icon")
const callSettingBox = document.querySelector(".call__setting-box")


// time
function time() {
  const today = new Date();   

  const hours = ('0' + today.getHours()).slice(-2); 
  const minutes = ('0' + today.getMinutes()).slice(-2);

  const timeString = hours + ':' + minutes;
  return timeString
}


// send message

const msgForm = document.querySelector(".message__Form");
const msgbutton = document.querySelector(".message__button-icon");
const msgInput = document.querySelector(".message__Input");

function addMessage(message, person) {
  const ul = document.querySelector("ul");
  const first_char = person.charAt(0);
  // const time = time()

  if (person === "my"){
    ul.insertAdjacentHTML("beforeend",`
    <li style="justify-content: right">
      <div class="message__content" style="align-items: flex-end; ">
        <span class="message__content-user">me</span>
        <p>${message}</p>
      </div>
      <div class="message__user-img" style="margin-left: 15px; background-color: #1EAC86;">m</div>
    </li>`)
    
  }
  else{
    ul.insertAdjacentHTML("beforeend",`
    <li>
      <div class="message__user-img" style="margin-right: 15px; background-color: #DFAF43;">${first_char}</div>
      <div class="message__content">
        <span class="message__content-user">${person}</span>
        <p>${message}</p>
      </div>
    </li>`)
  }

};

function handleMessageSubmit(event){
  event.preventDefault();
  
  const input = msgForm.querySelector(".message__Input");
  const message = document.querySelector(".message")
  if (input.value === ""){
    return
  }
  const value = input.value;
  addMessage(value, "my")

  message.scrollTop = message.scrollHeight;
  myDataChannel.send(JSON.stringify({value, userName}))
  
  
  input.value = "";
}

function resize(){
  msgInput.style.height = (msgInput.scrollHeight)+"px";

}

msgForm.addEventListener("submit", handleMessageSubmit);
msgbutton.addEventListener("click", handleMessageSubmit);
// msgInput.addEventListener("keypress", handleMessageSubmit);
msgInput.addEventListener("keydown", resize);
msgInput.addEventListener("keyup", resize);

//setting box

const settingIcon = document.querySelector(".call__setting-icon");
const settingBox = document.querySelector(".call__setting-box");
let toggle = true;

settingIcon.addEventListener("click", () => {
  if (toggle){
    settingBox.style.display = "flex"
    toggle = false
  }  
  else{
    settingBox.style.display = "none"
    toggle = true
  }
});

//Full screen
const fullScreenBtn = document.getElementById("fullScreen");
const fullScreenIcon = fullScreenBtn.querySelector("i");

const handleFullscreen = () => {
  const fullscreen = document.fullscreenElement;
  if (fullscreen) {
    document.exitFullscreen();
    fullScreenIcon.classList = "fas fa-expand";
  } else {
    const stream = document.getElementById("myStream")
    stream.requestFullscreen();
    fullScreenIcon.classList = "fas fa-compress";
  }
};

fullScreenBtn.addEventListener("click", handleFullscreen);