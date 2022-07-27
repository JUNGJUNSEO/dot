const socket = io();

const stream = document.getElementById("myStream")
const myFace = document.getElementById("myFace");
const peerFace = document.getElementById("peerFace");
const peerScreen = document.getElementById("peerScreen");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const phoneBtn = document.getElementById("phone");
const camerasSelect = document.getElementById("cameras");
const audiosSelect = document.getElementById("audios");
const call = document.getElementById("call");
const fullScreenBtn = document.getElementById("fullScreen");
const msgInput = document.querySelector(".message__Input");
const message = document.querySelector(".message");
const messageBar = document.querySelector(".message__bar");


const logoChat = document.querySelector(".logo__chat");
const logoButtonActive = document.querySelector(".logo__button-active");
const logoDot = document.querySelector(".logo__dot");


let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let userName
let myPeerConnection;
let myDataChannel;
let toggleWindow = false
let peerStream
let toggleActive = false;
let openChat = true;
// let intViewportWidth = window.innerWidth


// message 창크기


function handleResize(){
  messageBar.style.width = (message.scrollWidth)+"px";

};

window.addEventListener("resize", handleResize)



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
  socket.emit("join_room", roomName, userName);

  messageBar.style.width = (message.scrollWidth)+"px";
}

initCall();



// 오디오와 카메라 종류.
async function getDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const audios = devices.filter((device) => device.kind === "audioinput");

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
    
    const currentAudio = myStream.getAudioTracks()[0];
    console.log("현재 오디오",currentAudio)
    audios.forEach((audio) => {
      const option = document.createElement("option");
      option.value = audio.deviceId;
      option.innerText = audio.label;
      if (currentAudio.label === audio.label) {
        option.selected = true;
      }
      audiosSelect.appendChild(option);
    });


  } catch (e) {
    console.log(e);
  }
}
let constraints;
let videoInfo = { facingMode: "user" };
let audioInfo = true;

// 내 커퓨터의 카메라와 오디오를 가져옴.
async function getMedia(sort, deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  
  if(sort === "camera"){
    videoInfo = { deviceId: { exact: deviceId } }
    constraints = {
      audio: audioInfo,
      video: videoInfo,
    };
  }
  if(sort === "audio"){
    audioInfo = { deviceId: { exact: deviceId } }
    constraints = {
      audio: audioInfo,
      video: videoInfo,
    };
    console.log(constraints)
  }

  

  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? constraints : initialConstrains
    );
    if (toggleWindow){
      peerFace.srcObject = myStream;
      myFace.srcObject = peerStream;
    }else{
      myFace.srcObject = myStream;
      peerFace.srcObject = peerStream;
    }
    if(muted){
      myStream
      .getAudioTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    } ;
    if(cameraOff){
      myStream
      .getVideoTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    };
 
    if (!deviceId) {
      await getDevices();
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
  const icon = cameraBtn.querySelector("i");
  const buttons = document.querySelectorAll(".call__button > div");
  const phoneIcon = document.getElementById("phone")
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));

  if (cameraOff) {
    icon.classList = "fas fa-video";
    cameraOff = false;
    buttons.forEach((button) =>{
      button.style.color = "white"
      button.style.backgroundColor = "#343434"
    })
    phoneIcon.style.color = "#CC0000"
  } else {
    icon.classList = "fas fa-video-slash";
    cameraOff = true;
    buttons.forEach((button) =>{
      button.style.color = "#343434"
      button.style.backgroundColor = "white"
    })
    phoneIcon.style.color = "#CC0000"
    
  }
}

function handlePhoneClick() {
  history.back() 
}

// 카메라 변경.
async function handleCameraChange() {
  await getMedia("camera", camerasSelect.value);
  if (myPeerConnection) {

    const audioTrack = myStream.getAudioTracks()[0];
    const audioSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "audio");
    audioSender.replaceTrack(audioTrack);

    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

// 오디오 변경.
async function handleAudioChange() {
  await getMedia("audio", audiosSelect.value);
  if (myPeerConnection) {
    const audioTrack = myStream.getAudioTracks()[0];
    const audioSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "audio");
    audioSender.replaceTrack(audioTrack);

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
audiosSelect.addEventListener("input", handleAudioChange);
// Welcome Form (join a room)
const alarm =  document.querySelector(".alarm");

function handleAlarmClick(){
  alarm.style.display = "none"
}

function roomAlarm(name, message) {
  alarm.style.display = "block"
  alarm.innerHTML = `<div>
                      <i class="fas fa-bell"></i>
                      <span>${name} ${message}</span>
                      <i class="alarm__remove-button fas fa-times"></i>
                    </div>
                      `;
  alarm.addEventListener("click", handleAlarmClick)

}

// Socket Code
socket.on("welcome", async (peerName) => {
  // message - peer에게 오는 message
  myDataChannel = await myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) => {
    console.log(event.data)
    const {value, userName, type} = JSON.parse(event.data)
    addMessage(value, userName, type)});
  
  fullScreenBtn.querySelector("span").innerText = `Video call with ${peerName}`
  roomAlarm(peerName, "entered the room!");
  // video
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  
  console.log("1. sent the offer ");
  socket.emit("offer", offer, roomName, userName);
});

socket.on("offer", async (offer, peerName) => {
  fullScreenBtn.querySelector("span").innerText = `Video call with ${peerName}`
  // message - peer에게 오는 message
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) => {
      const {value, userName, type} = JSON.parse(event.data)
      addMessage(value, userName, type)});
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

socket.on("leave", (name) => {
  roomAlarm(name, "left the room!")
  myDataChannel = undefined

  peerFace.srcObject = null
  peerScreen.style.display = "none"
  myFace.srcObject = myStream;
  fullScreenBtn.querySelector("span").innerText = `Video call`
});
// RTC Code

function makeConnection() {
  console.log("??", myStream.getTracks())
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
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
  peerStream = data.stream
  peerFace.srcObject = myStream;
  peerScreen.style.display = "block"
  myFace.srcObject = peerStream;
  toggleWindow = true
}

function handleWindowChange() {
  if (toggleWindow){
    peerFace.srcObject = peerStream;
    myFace.srcObject = myStream;
    toggleWindow = false;
  }else{
    peerFace.srcObject = myStream;
    myFace.srcObject = peerStream;
    toggleWindow = true;
  }
  
}

peerScreen.addEventListener("click", handleWindowChange)



// time
function time() {
  const today = new Date();   

  const hours = ('0' + today.getHours()).slice(-2); 
  const minutes = ('0' + today.getMinutes()).slice(-2);

  const timeString = hours + ':' + minutes;
  return timeString
}

// message bar
const messageBarChat = messageBar.querySelector(".message__bar-chat");
const messageBarSelf = messageBar.querySelector(".message__bar-self");
const messageChatList = document.querySelector(".message__chat-list");
const messageSelfList = document.querySelector(".message__self-list");
const dot = document.querySelector(".message__dot")
let messageChat = true

function handleBarClick(event){
  if (event.target.className === "message__bar-chat"){
    messageBarChat.style.color = "#343434"
    messageBarChat.style.fontWeight = "600"
    messageBarSelf.style.color = "#999999"
    messageBarSelf.style.fontWeight = "500"

    messageSelfList.style.display = "none"
    messageChatList.style.display = "block"
    messageChat = true
    dot.style.display = "none"
  }
  else{
    messageBarChat.style.color = "#999999"
    messageBarChat.style.fontWeight = "500"
    messageBarSelf.style.color = "#343434"
    messageBarSelf.style.fontWeight = "600"

    messageChatList.style.display = "none"
    messageSelfList.style.display = "block"
    messageChat = false

    
  }
}

messageBarChat.addEventListener("click", handleBarClick)
messageBarSelf.addEventListener("click", handleBarClick)

// send message

const msgForm = document.querySelector(".message__Form");
const msgbutton = document.querySelector(".message__button-icon");



function addMessage(message, person, type) {
  
  const ulChat = document.querySelector(".message__chat-list ");
  const ulSelf = document.querySelector(".message__self-list ");
  const first_char = person.charAt(0);
  // const time = time()
  if (type === "text"){
    if (messageChat){
      // 상대방과의 대화창.
      if (person === "my"){
        ulChat.insertAdjacentHTML("beforeend",`
        <li style="justify-content: right">
          <div class="message__content" style="align-items: flex-end; background-color: #1EAC86; border-radius: 10px 10px 0 10px;">
            <span class="message__content-user" style="color: white; ">me</span>
            <p>${message}</p>
          </div>
          
        </li>`)
      }
      else{
        ulChat.insertAdjacentHTML("beforeend",`
        <li style="align-items: flex-end;">
          <div class="message__user-img" style="margin-right: 8px; ">${first_char}</div>
          <div class="message__content" style="background-color: rgba(112, 128, 144, 0.1); color:black; border-radius: 10px 10px 10px 0px;">
            <span class="message__content-user">${person}</span>
            <p>${message}</p>
          </div>
        </li>`)
        console.log(toggleActive)
        if (!toggleActive){
          logoDot.style.display = "block"
        }
      }
  
    }else{
      // 나와의 대화창
      if (person === "my"){
        ulSelf.insertAdjacentHTML("beforeend",`
        <li style="justify-content: right">
          <div class="message__content" style="align-items: flex-end; background-color: #1EAC86; border-radius: 10px 10px 0 10px;">
            <span class="message__content-user" style="color: white; ">me</span>
            <p>${message}</p>
          </div>
          
        </li>`)

      }else{
        ulChat.insertAdjacentHTML("beforeend",`
        <li style="align-items: flex-end;">
          <div class="message__user-img" style="margin-right: 8px; ">${first_char}</div>
          <div class="message__content" style="background-color: rgba(112, 128, 144, 0.1); color:black; border-radius: 10px 10px 10px 0px;">
            <span class="message__content-user">${person}</span>
            <p>${message}</p>
          </div>
        </li>`)

        if (!messageChat){
          dot.style.display = "block"
        }
        
      }
      
    }

  }
  
  if (type === "img"){
    if (messageChat){
      // 상대방과의 대화창.
      if (person === "my"){
        ulChat.insertAdjacentHTML("beforeend",`
        <li style="justify-content: right">
          <img src="${message}" class="message__img" style="align-items: flex-end;">
        </li>`)
      
      }
      else{
        console.log(message)
        ulChat.insertAdjacentHTML("beforeend",`
        <li style="align-items: flex-end;">
          <div class="message__user-img" style="margin-right: 8px; ">${first_char}</div>
          <img src="/${message}" class="message__img">
        </li>`)
        
        if (!toggleActive){
          logoDot.style.display = "block"
        }
      }
  
    }else{
      // 나와의 대화창
      if (person === "my"){
        ulSelf.insertAdjacentHTML("beforeend",`
        <li style="justify-content: right">
          <img src="${message}" class="message__img" style="align-items: flex-end;">
        </li>`)
      }
      else{
        ulChat.insertAdjacentHTML("beforeend",`
        <li style="align-items: flex-end;">
          <div class="message__user-img" style="margin-right: 8px; ">${first_char}</div>
          <img src="/${message}" class="message__img">
        </li>`)

        if (!messageChat){
          dot.style.display = "block"
        }
        
      }
      
    }

  }

};

function handleMessageSubmit(event){
  if (event.type === "keypress" && event.key !== 'Enter'){
    return
  }

  event.preventDefault();
  

  if (msgInput.value === ""){
    return
  }
  const value = msgInput.value;
  addMessage(value, "my", "text")

  message.scrollTop = message.scrollHeight;
  if (messageChat && myDataChannel){
    myDataChannel.send(JSON.stringify({value, userName, type:"text"}))
  }
  
  msgInput.value = "";
}



function handleMessageResize(){
  msgInput.style.height = 'auto';
  let height = msgInput.scrollHeight; // 높이
  msgInput.style.height = `${height}px`;

}

// msgForm.addEventListener("submit", handleMessageSubmit);
msgbutton.addEventListener("click", handleMessageSubmit);
msgInput.addEventListener("keypress", handleMessageSubmit);
msgInput.addEventListener("keydown", handleMessageResize);
msgInput.addEventListener("keyup", handleMessageResize);

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

const fullScreenIcon = fullScreenBtn.querySelector("i");

const handleFullscreen = () => {
  const fullscreen = document.fullscreenElement;
  if (fullscreen) {
    document.exitFullscreen();
    fullScreenIcon.classList = "fas fa-expand";
  } else {
    // const stream = document.getElementById("myStream")
    stream.requestFullscreen();
    fullScreenIcon.classList = "fas fa-compress";
  }
};

fullScreenBtn.addEventListener("click", handleFullscreen);


// message window close



logoButtonActive.addEventListener("click", ()=> {
  const button = logoButtonActive.querySelector("span")

  stream.classList.toggle("active");
  message.classList.toggle("active");
  if (!toggleActive){
    button.innerText = "Vedio";
    toggleActive = true;
    logoDot.style.display = "none"
  }else{
    button.innerText = "Message";
    toggleActive = false;
  }
  messageBar.style.width = (message.scrollWidth)+"px";
})

function handleMessage(){
  const logo = document.querySelector(".logo")
  const logoChat = document.querySelector(".logo__chat span")

  if (openChat){
    // message.classList.add("translate-x")
    message.style.display = "none"
    logo.style.gridColumn = "1/-1"
    stream.style.gridColumn = "1/-1"
    logoChat.innerText = "Open the chat box"
    openChat = false

  }else{
    message.style.display = "flex"
    logo.style.gridColumn = "1/2"
    stream.style.gridColumn = "1/2"
    logoChat.innerText = "close the chat box"
    openChat = true
  }

}
const callButton = document.querySelector(".call__button");
function handleMouseEnter(){
  callButton.style.display = "flex"
  fullScreenBtn.style.display = "flex"
}

function handleMouseLeave(){
  callButton.style.display = "none"
  fullScreenBtn.style.display = "none"
}

logoChat.addEventListener("click", handleMessage)
stream.addEventListener("mouseenter", handleMouseEnter);
stream.addEventListener("mouseleave", handleMouseLeave);


const imageFile = document.querySelector(".image__input")

async function handleImageSubmit(event){
  console.log(event.target.files)
  console.log(event.srcElement.files)
  const file = event.srcElement.files[0]
  console.log(file)
  
  value = URL.createObjectURL(file);
  addMessage(value, "my" ,"img")

  message.scrollTop = message.scrollHeight;
  if (messageChat){
    const formData = new FormData();
    formData.append("image", file)
    console.log(formData)
    const response = await fetch("/room/image", {
      method: "POST",
      body: formData,
    }).catch(console.error);
    
    value = await response.json()
    myDataChannel.send(JSON.stringify({value, userName, type:"img"}))
  }

}

imageFile.addEventListener("change", handleImageSubmit)

// 이모티콘 삽입
const emojiPicker = document.querySelector('emoji-picker');
const emojiButton = document.querySelector('.emoji-button')
const overlay = document.querySelector('.overlay');
let toggleEmoji = false

function handleEmojiClick(event){
  msgInput.value += event.detail.unicode
}
function handleEmoji(event){
  
  if (!toggleEmoji){
    emojiPicker.style.display = "block";
    overlay.style.display = "block";
    stream.style.zIndex = "-1"
    toggleEmoji = true
  }else{
    emojiPicker.style.display = "none";
    overlay.style.display = "none";
    stream.style.zIndex = "unset"
    toggleEmoji = false
  }
  
}

emojiPicker.addEventListener('emoji-click', handleEmojiClick);
emojiButton.addEventListener('click', handleEmoji);
overlay.addEventListener('click', handleEmoji);