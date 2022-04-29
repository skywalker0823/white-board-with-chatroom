document.addEventListener("DOMContentLoaded", () => {
  init();
});


let chatter_inner = document.getElementById("chatter_inner");
let room = document.getElementById("room");
let socket;
let options


//Main
init = async () => {
  //偵測使用者狀態 如已有連線則幫助他連回
  let me;
  let result;
  options = {
    method: "GET",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
  };
  const response = await fetch("/back_checker", options);
  result = await response.json();

  if (result.type == "back") {
    me = result.username;
    chatter_inner = document.getElementById("chatter_inner");
    console.log("this user is still connected!");
    loger.style.display = "none";
    mask.style.display = "none";
    chatter.style.filter = "none";
    window.removeEventListener("scroll", locker);
  } else {
    loger_on();
    let userName = document.getElementById("userName").value;
    me = userName;
    let chatter = document.getElementById("chatter");
    if (userName == null || userName == "") {
      console.log("輸入名稱喔！");
      return null;
    }
    options = {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
    };
    const response = await fetch("/roll?username=" + me, options);
    result = await response.json();
    console.log(result);
    if (result.ok) {
      console.log("申請隨機中");
      loger.style.display = "none";
      mask.style.display = "none";
      chatter.style.filter = "none";
      window.removeEventListener("scroll", locker);
    } else {
      loger_on();
    }
  }
  /////////////////////////Linking Area///////////////////////////
  //開啟websocket連線
  socket = io.connect("/random");
  create_board()
  //第一種行為emit go_to 進入同連線領域 只會執行一次
  socket.emit("link_start", result);

  //第二種行為on system系統訊息
  socket.on("random_system", (data) => {
    console.log("system_message");
    //是否加入分類 等待 及 加入 還有離開系統訊息
    if (data.create || data.join) {
      let content = document.createTextNode(
        "---連線成功，" + data.username + "進入房間---"
      );
      let message = document.createElement("div");
      message.setAttribute("class", "systemMessage");
      message.appendChild(content);
      chatter_inner.appendChild(message);
      return;
    } else if (data.leave) {
      let content = document.createTextNode(
        "---OOPS!" + data.username + "離開房間---"
      );
      let message = document.createElement("div");
      message.setAttribute("class", "systemMessage");
      message.appendChild(content);
      chatter_inner.appendChild(message);
      return;
    } else if (data.back) {
      let content = document.createTextNode(
        "---COOL!" + data.username + "回來了---"
      );
      let message = document.createElement("div");
      message.setAttribute("class", "systemMessage");
      message.appendChild(content);
      chatter_inner.appendChild(message);
    }
  });

  //第三種行為emit 給對方訊息
  send = () => {
    words = document.getElementById("input_bar");
    if (words.value) {
      console.log("who talks?", me);
      summary = { message: words.value, name: me };
      socket.emit("chats", summary);
      words.value = "";
    } else {
      return;
    }
  };

  //第四種行為on message對方訊息
  socket.on("talk", (data) => {
    console.log("sockeron talk get");
    // {"say":data["message"],"username":username,"echo":data['echo']}
    if (data) {
      who = data.username;
      let message = document.createElement("div");
      let box = document.createElement("div");
      let sayer = document.createElement("div");
      let content = document.createElement("div");
      box.setAttribute("class", "box");
      sayer.appendChild(document.createTextNode(who));
      content.appendChild(document.createTextNode(data.say));
      sayer.setAttribute("class", "sayer");
      content.setAttribute("class", "say_what");
      box.appendChild(sayer);
      box.appendChild(content);
      message.appendChild(box);
      chatter_inner.appendChild(message);
      if (me == who) {
        console.log("這是自己的訊息");
        message.setAttribute("class", "myMessage");
        updateScroll();
      } else {
        console.log("這是別人的訊息");
        message.setAttribute("class", "userMessage");
        updateScroll();
      }
    }
  });

  //第五種行為emit 離開
  leave = () => {
    //打一發離開訊息
    console.log("left");
    socket.emit("left", { username: me });
    chatter_inner.innerHTML = null;
    socket.disconnect();
    loger_on();
  };

  //對話更新
  updateScroll = () => {
    let chatter_inner = document.getElementById("chatter_inner");
    chatter_inner.scrollTop = chatter_inner.scrollHeight;
  };

  //Enter送出
  document.addEventListener("keydown", (e) => {
    if (e.keyCode == 13) {
      send();
    }
  });
};







//零散模組區~~
//同名檢測器
async function nameChecker(name) {
  console.log("checking name...");
  options = {
    method: "GET",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
  };
  const response = await fetch("/room?username=" + name, options);
  const result = await response.json();
  return result;
}
//輸入改變按鈕號碼
room.addEventListener("keyup", () => {
  mess = "進入房號 :" + room.value;
  document.getElementById("meet").value = mess;
  if (room.value == "" || room.value == null) {
    document.getElementById("meet").value = "Random";
  }
});
//測試器
async function tester() {
  console.log("fetching!");
  options = {
    method: "GET",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
  };
  const response = await fetch("/test", options);
  const result = await response.json();
}
//登出
async function logout() {
  console.log("fetching!");
  options = {
    method: "DELETE",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
  };
  const response = await fetch("/room", options);
  const result = await response.json();
}
//登入
login = () => {
  room = document.getElementById("room");
  if (room.value == "" || room.value == null || room.value == "random") {
    init("random");
  } else {
    init(room.value);
  }
};
//鎮鎖
locker = () => {
  window.scrollTo(0, 0);
};
//登入窗
loger_on = () => {
  loger.style.display = "block";
  mask.style.display = "block";
  window.addEventListener("scroll", locker);
};
//聊天側欄開
function openChat() {
  document.getElementById("chatter").style.width = "50%";
}
//聊天側欄關
function closeChat() {
  document.getElementById("chatter").style.width = "0";
}

