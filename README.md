# dot
dot은 Node.js, WebRTC 및 Websocket을 사용하여 만든 비디오 회의 플랫폼입니다. 이 프로젝트는 Socket.io를 통해 웹소켓을 사용하여 통신하고, Pug 템플릿 엔진을 사용하여 렌더링합니다.

웹 사이트 주소: https://nomadcoders.co/community/thread/5579

## 기술 스택

| 분류       | 기술 스택                           |
|----------- |---------------------------------------|
| 언어       | JavaScript                 |
| 서버 | Node.js                              |
| 웹 프레임워크  |Express                   |
| 템플릿 엔진 | Pug                                |
| 웹소켓 라이브러리 | Socket.io                                |



## 디렉토리
디렉토리 구조는 아래와 같습니다.
```
src/                            
  ├─ public/                     # 정적 파일들을 제공하는 미들웨어 함수들이 위치하는 디렉토리
  │  ├─ css/                      # 클라이언트 측 CSS 파일들이 위치하는 디렉토리
  │  └─ js/                       # 클라이언트 측 JavaScript 파일들이 위치하는 디렉토리         
  ├─ views/                      # 템플릿 파일들이 위치하는 디렉토리
  │  ├─ base/                     # 템플릿 레이아웃들이 위치하는 디렉토리
  │  ├─ home/                     # 홈 화면에 대한 템플릿 파일들이 위치하는 디렉토리
  │  └─ room/                     # 채팅방 화면에 대한 템플릿 파일들이 위치하는 디렉토리
  └─ server.js                   # HTTP 및 WebSocket 서버를 생성하는 파일
```

