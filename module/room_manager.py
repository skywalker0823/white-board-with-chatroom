from flask import Blueprint, jsonify, request, session
from flask_socketio import emit, send, disconnect
from flask_socketio import join_room, leave_room
from app import socketio
room_manager = Blueprint("room_manager",__name__,template_folder="template")


#房間表 將來以redis取代
#{使用者名稱(username):所在房間}
#{使用者:None}
#房間大致已完成
rooms = {}


@room_manager.route('/roomchecker', methods=['GET', 'POST', 'DELETE'])
def chat():
    try:
        print(rooms)
        if(request.method == 'POST'):
            data = request.get_json()
            username = data["username"]
            room = data["room"]
            # leave_room(room)
            session['username'] = username
            session['room'] = room
            print("username", username, "room", room, "session name",
                  session['username'], "session room", session["room"])
            return jsonify({"ok": True, "route": 1})
            # return render_template('chat.html', session = session)
        elif(request.method == 'DELETE'):
            print("DELETE!")
            session.clear()
            return jsonify({"ok": True})
        elif(request.method == 'GET'):
            # #GET
            # #確認狀態之用
            # #重新整理也能回到原本房間
            # #可確認目前使用者在的房 與狀態 避免重複姓名username產生
            # #若有session
            # print("2!")
            # print("rooms",rooms)
            # #這裡沒資料？？？
            username = request.args.get("username")
            # print("username",username,"session name",session['username'],"session room",session["room"])
            # #查有無在字典
            # if username in rooms:
            #     return jsonify({"error":"already have this user"})
            # return jsonify({"ok":True,"route":2,"message":"name is ok"})
            if session.get("username"):
                #這是已登入使用者，同時意味著線上字典有該使用者的名稱
                return jsonify({"ok": True, "message": "此使用者已登入 放行", "username": session['username']})
            else:
                #這是未登入者，檢查名稱有無重複，無則登入session及放入字典後放行
                if username in rooms:
                    return jsonify({"error": True, "message": "已有相同名稱"})
                else:
                    session['username'] = username
                    rooms[username] = None
                    print(rooms)
                    return jsonify({"ok": True, "message": "名稱登入完成", "room": None})

        else:
            print("something bad at room manage")
            return jsonify({'error': True, 'message': 'room error'})
    except Exception as e:
        print("type error: " + str(e))
        return jsonify({"error": True})


#name space?
@socketio.on('join', namespace="/room")
def join(message):
    try:
        room = message['room']
        username = message['username']
        join_room(room)
        rooms[username] = room
        session['room'] = room
        print("username", username, "room", room, "session name",
              session["username"], "session room", session["room"])
        emit('status', {'join': True,
             'username':  session.get('username')}, room=room)
    except Exception as e:
        print("type error: " + str(e))
        return jsonify({"error": True})


@socketio.on('text',namespace="/room")
def text(message):
    room = session.get('room')
    say = message['message']
    username = message['username']
    print("username", username, "room", room, "session name",
          session['username'], "session room", session["room"])
    print({'ok': True, 'id': request.sid, "name": username, 'say': say})
    emit('message', {'ok': True, 'id': request.sid,
         "name": username, 'say': say}, room=room)
