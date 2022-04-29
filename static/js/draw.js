
//本機繪圖 並且送出繪圖

create_board = () => {
    console.log("board up")
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");   
    let current = {
      color: "black",
    };
    //socket use

    let drawer 
    let start_point
    let end_point


    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.style.width = "100%"; 
    canvas.style.height = "100%";
    let drawing = false;

    start_draw = (e) => {
        console.log("pen_go");
        drawing = true;
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
    }
    end_draw = (e) => {
        drawing = false;
        console.log("pen_stop")
        drawLine(
          current.x,
          current.y,
          e.clientX || e.touches[0].clientX,
          e.clientY || e.touches[0].clientY,
          current.color,
          true
        );
    }
    draw = (e) => {
        if(!drawing) {
            return;        
        }
        drawLine(
        current.x,
        current.y,
        e.clientX || e.touches[0].clientX,
        e.clientY || e.touches[0].clientY,
        current.color,
        true
        );
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
            

    }
    canvas.addEventListener("mousedown",start_draw)
    canvas.addEventListener("mouseup", end_draw);
    canvas.addEventListener("mousemove",draw)
    canvas.addEventListener("touchstart",start_draw);
    canvas.addEventListener("touchend",draw);
    canvas.addEventListener("touchcancel",end_draw);
    // canvas.addEventListener("mousemove", throttle(onMouseMove, 10), false);




    
    socket.on("drawing",onDrawingEvent)



    
  function drawLine(x0, y0, x1, y1, color, emit) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();

    if (!emit) {
      return;
    }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit("drawing", {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color,
      status:drawing,
    });
  }

  function onDrawingEvent(data) {
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }


}




