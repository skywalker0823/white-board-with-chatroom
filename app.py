

from flask import Flask, session, request, Response, jsonify, render_template as rt
from flask_socketio import SocketIO
from flask_socketio import emit, send, disconnect
from flask_socketio import join_room, leave_room
from flask_session import Session
from os import urandom
from random import randint,random,choice
# import cv2
import os
import string

# from itsdangerous import json



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
        session.clear()
        return jsonify({"ok":True})
    else:
        return jsonify({"error":True})


@app.route("/back_checker")
def back_check():
    if session.get("room") != None:
        return jsonify({"ok": True, "type": "back", "room": session.get('room'), "username": session.get('username')})
    else:
        return jsonify({"ok":True,"type":"new"})



@app.route("/roll")
def check_random_status():
    username = request.args.get("username")
    session['username'] = username
    if bool(random_que) == True:
        lucky = choice(list(random_que))
        random_que.pop(lucky)
        session['room'] = lucky
        return jsonify({"ok": True, "type": "join", "room": lucky, "username": username})
    else:
        room = ''.join(choice(string.ascii_letters + string.digits)
                       for x in range(5))
        random_que[room] = room
        session['room'] = room
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
            emit("random_system", {"error": True, "message": "go random fail"})



@socketio.on("chats", namespace="/random")
def chat(data):
    #quiz
    username = session.get('username')
    room = session.get('room')
    data = {"say": data["message"], "username": username}
    emit("talk", data, room=room)


@socketio.on('left', namespace="/random")
def left(message):
    room = session.get('room')
    username = session.get('username')
    if room in random_que:
        print(random_que, "kill")
        random_que.pop(room)
        print(random_que, "result")
    leave_room(room)
    session.clear()#此事件無法被正確執行
    emit('random_system', {'leave': True, 'msg': username + ' has left the room.', 'username': username}, room=room)

@socketio.on("drawing",namespace="/random")
def drawing(data):
    username = session.get('username')
    room = session.get('room')
    emit("drawing",data,room=room)




if __name__ == '__main__':
    socketio.run(app,debug=True,host="0.0.0.0",port=5005)

# uwsgi --http :5001 --gevent 1000 --http-websockets --master --wsgi-file app.py --callable app

# develop change