

from flask import Flask, session, request, Response, jsonify, render_template as rt
from flask_socketio import SocketIO
from flask_socketio import emit, send, disconnect
from flask_socketio import join_room, leave_room
from flask_session import Session
from os import urandom
from random import randint,random,choice
import cv2
import os
import string

from itsdangerous import json



app = Flask(__name__,static_folder="static",static_url_path="/",template_folder="template")
app.config['SECRET_KEY'] = os.urandom(8)
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
socketio = SocketIO(app, manage_session=False, cors_allowed_origins="*")



random_que = {}


@app.route('/')
def index():
    return rt('index.html')

@app.route('/test')
def test():
    if session.get('username'):
        print(session['username'])
        print(session["room"])
        session.clear()
        return jsonify({"ok":True})
    else:
        print("? no username")
        return jsonify({"error":True})


@app.route("/back_checker")
def back_check():
    if session.get("room") != None:
        print("still loged user",session.get("room"))
        return jsonify({"ok": True, "type": "back", "room": session.get('room'), "username": session.get('username')})
    else:
        print("new")
        return jsonify({"ok":True,"type":"new"})



@app.route("/roll")
def check_random_status():
    username = request.args.get("username")
    session['username'] = username
    if bool(random_que) == True:
        print("JOIN Random ing")
        print(random_que)
        lucky = choice(list(random_que))
        random_que.pop(lucky)
        session['room'] = lucky
        print("JOIN ROOM", lucky)
        print(random_que)
        return jsonify({"ok": True, "type": "join", "room": lucky, "username": username})
    else:
        print("CREATE Random ing")
        print(random_que)
        room = ''.join(choice(string.ascii_letters + string.digits)
                       for x in range(5))
        random_que[room] = room
        session['room'] = room
        print("CREATE ROOM", room)
        print(random_que)
        return jsonify({"ok": True, "type": "create", "room": room, "username": username})



@socketio.on("link_start", namespace="/random")
def go_random(data):
    if session['room'] == data['room']:
        join_room(data['room'])
        if data['type'] == "join":
            emit("random_system", {
                "ok": True, "join": True, "room": data["room"], "username": data["username"]}, room=data["room"])
        elif data['type'] == "create":
            emit("random_system", {"ok": True, "create": True,
                                   "room": data["room"], "username": data["username"]}, room=data["room"])
        elif data['type'] == "back":
            emit("random_system", {
                "ok": True, "back": True, "room": data["room"], "username": data["username"]}, room=data["room"])
        else:
            print("bad random que")
            emit("random_system", {"error": True, "message": "go random fail"})



@socketio.on("chats", namespace="/random")
def chat(data):
    #quiz
    username = session.get('username')
    room = session.get('room')
    print(username, room)
    data = {"say": data["message"], "username": username}
    print("聊天get", data)
    emit("talk", data, room=room)


@socketio.on('left', namespace="/random")
def left(message):
    print("LEAVE!")
    print(message['username'], session.get("username"))
    room = session.get('room')
    username = session.get('username')
    print("username", username, "room", room, "session name",
          session['username'], "session room", session["room"])
    print(type(room))
    if room in random_que:
        print(random_que, "kill")
        random_que.pop(room)
        print(random_que, "result")
    leave_room(room)
    session.clear()#此事件無法被正確執行
    print(session.get("username"), session.get("room"))
    emit('random_system', {'leave': True, 'msg': username + ' has left the room.', 'username': username}, room=room)

@socketio.on("drawing",namespace="/random")
def drawing(data):
    print(data)
    username = session.get('username')
    room = session.get('room')
    emit("drawing",data,room=room)




if __name__ == '__main__':
    socketio.run(app,debug=True,host="0.0.0.0",port=5005)

# uwsgi --http :5001 --gevent 1000 --http-websockets --master --wsgi-file app.py --callable app