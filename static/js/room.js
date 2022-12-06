  if(type!="random"){
    //房間制才檢查名稱
    nameChecker(userName);
    room=type
    let me = userName;


    //是否這裡先打GET確認登入狀況？

    const options = {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ username: me, room: room }),
    };
    const response = await fetch("/room",options);
    const result = await response.json();

    if(result.error){
      return null
    }
    socket = io.connect();
    socket.emit("join", { username: userName, room: room });



    socket.on("status",(data)=>{
      console.log(data)
      if (data.join) {
        loger.style.display = "none";
        mask.style.display = "none";
        chatter.style.filter = "none";
        window.removeEventListener("scroll", locker);
      }else if(data.leave){
        loger.style.display = "block";
        mask.style.display = "block";
        chatter.style.filter = "block";
        window.addEventListener("scroll", locker);
      }
      else{console.log("JOIN ERROR")}
    })



    socket.on("message",(data)=>{
      who = data.name;
      let message = document.createElement("div");
      let box = document.createElement("div");
      let sayer = document.createElement("div");
      let content = document.createElement("div");
      box.setAttribute("class", "box");
      sayer.appendChild(document.createTextNode(who));
      content.appendChild(document.createTextNode(data.say));
      box.appendChild(sayer);
      box.appendChild(content);
      message.appendChild(box);
      chatter_inner.appendChild(message);
      if (me == who) {
        console.log("這是自己的訊息");
        message.setAttribute("class", "myMessage");
        updateScroll();
      } else {
        message.setAttribute("class", "userMessage");
        updateScroll();
      }
    })



    send = () => {
      words = document.getElementById("input_bar");
      if (words.value) {
        summary = { message: words.value, username: me };
        socket.emit("text", summary);
        words.value = "";
      } else {
        return;
      }
    };




  leave = () => {
    socket.emit("left",{username:me});
    socket.disconnect();
  };





  }