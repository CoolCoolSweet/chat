import React from 'react';
import ReactDOM from 'react-dom';
import firebase from 'firebase';

// Initialize Firebase
const config = {
  apiKey: "AIzaSyASfvYRiRTud5_cdIHtNTILMiEIEwReG7Q",
  authDomain: "project5-chat.firebaseapp.com",
  databaseURL: "https://project5-chat.firebaseio.com",
  projectId: "project5-chat",
  storageBucket: "project5-chat.appspot.com",
  messagingSenderId: "59144337106"
};
firebase.initializeApp(config);


class App extends React.Component {
  constructor() {
    super();
    this.state = {
      userName: "",
      userID: "",
      userRoom: "",
      userMessage: "",
      createRoom: "",
      roomList: [],
      chatMessages: [],
      userList: [],
      joinInject: 0,
    }

    this.handleInput = this.handleInput.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.createRoom = this.createRoom.bind(this);
    this.joinRoom = this.joinRoom.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }
  componentDidMount() {
    console.log("It's Alive!")
    // Set Firebase user persistence to NONE so that every reload/new page gets a new userID
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
  }

  // Methods (Are these called methods? ^_^)
  handleInput (e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  handleLogin (e) {
    e.preventDefault();
    if (!(this.state.userName)) {
      alert('Please enter a name!');
    } else {
      // Push a unique ID to the state.userID when they choose a name
      firebase.auth().signInAnonymously().then((snapshot) => {
      this.setState({
        userID: snapshot.user.uid
        });

        // Push the user data to the onlineUsers part of the Firebase DB
        firebase.database().ref(`onlineUsers/${this.state.userID}`).set({
          userName: this.state.userName,
          userID: this.state.userID
        })

        // Set the onDisconnect to remove the user when they leave
        firebase.database().ref(`onlineUsers/${this.state.userID}`).onDisconnect().remove()

        // Load roomList from server and convert to and array to setState
        firebase.database().ref(`rooms`).on("value", (snapshot) => {
          let tempArray = [];
          for (let room in snapshot.val()) {
            tempArray.push(room);
          };
          this.setState({
            roomList: tempArray
          });
        })
      });
    }
  }

  createRoom (e) {
    e.preventDefault();
    if (!(this.state.createRoom)) {
      alert('Cannot create a room with no name!');
    } else if (this.state.roomList.includes(this.state.createRoom)) {
      alert('A room with that name already exists!');
    } else {
      // Push the room to the FirebaseDB
      firebase.database().ref(`rooms/${this.state.createRoom}`).set({
        roomCreator: {
          [this.state.userName]: this.state.userID
        }
      });
      // Remove rooms created by the user on disconnect
      firebase.database().ref(`rooms/${this.state.createRoom}`).onDisconnect().remove()
    }
  }

  joinRoom (e) {
    // Remove the user from any existing room
    firebase.database().ref(`rooms/${this.state.userRoom}/userList/${this.state.userID}`).remove();
    // setState to the room chosen to join
    this.setState({
      userRoom: e.target.getAttribute('name')
    }, () => {
      // find out where in the messages array the user joins the room and setState that value
      firebase.database().ref(`rooms/${this.state.userRoom}/messages`).once("value").then((snapshot) => {
        let tempVal = snapshot.val() === null ? 0 : Object.keys(snapshot.val()).length;
        this.setState({
          joinInject: tempVal
        });
      
      // pull chat for room from Firebase DB and setState of chatMessages
        firebase.database().ref(`rooms/${this.state.userRoom}/messages`).on("value", (snapshot) => {
          let tempArray = [];
          for (let messageKey in snapshot.val()) {
            tempArray.push(snapshot.val()[messageKey]);
          };
          // inject user join message at correct spot in the array before setting state
          tempArray.splice(this.state.joinInject,0,{ userMessage: `You have joined the "${this.state.userRoom}" room.`, userID: "injectJoin" });
          this.setState({
            chatMessages: tempArray
          }, () => {
            let scrollBot = document.getElementsByClassName("messageWindow")[0];
            scrollBot.scrollTop = scrollBot.scrollHeight - scrollBot.clientHeight;
          });  
        });
      });

      // add the user to the list of users in the room
      firebase.database().ref(`rooms/${this.state.userRoom}/userList/${this.state.userID}`).set({
        userName: this.state.userName,
        userID: this.state.userID
      });

      // remove the user from the list of users on disconnect
      firebase.database().ref(`rooms/${this.state.userRoom}/userList/${this.state.userID}`).onDisconnect().remove();


      firebase.database().ref(`rooms/${this.state.userRoom}/userList`).on("value", (snapshot) => {
        let tempArray = [];
        for (let userID in snapshot.val()) {
          tempArray.push(snapshot.val()[userID].userName);
        }
        this.setState({
          userList: tempArray
        });
      });
    });
  }

  sendMessage (e) {
    e.preventDefault();
    if (!(this.state.userRoom)) {
      alert('Please join a room before sending a message!');
    } else {
      // Push the message to the room on Firebase DB
      firebase.database().ref(`rooms/${this.state.userRoom}/messages`).push({
        userName: this.state.userName,
        userID: this.state.userID,
        userMessage: this.state.userMessage
      });
    }
  }

  render() {
    return (
      <div className="wrapper">
        <div className="chatArea">
          <ul className="messageWindow">
            {this.state.chatMessages.map((message, i) => {
              // Conditional Rendering to see if the message was 1) sent by the user 2) sent from the joinInject
              return <li className={message.userID === this.state.userID ? "chatMessage ownMessage" : message.userID === "injectJoin" ? "injectJoin" : "chatMessage"} key={message.userID + i}><p>{message.userMessage}</p></li>
            })}
          </ul>
          <form action="" onSubmit={this.sendMessage}>
            <input type="text" name="userMessage" value={this.state.userMessage} onChange={this.handleInput} className="messageInput" placeholder="Enter your message ..."/>
            <button type="submit" className="sendButton">Send</button>
          </form>
        </div>
        <div className="otherArea">
          <form action="" onSubmit={this.handleLogin}>
            <input type="text" name="userName" value={this.state.userName} onChange={this.handleInput} className={this.state.userID == "" ? "loginInput" : "loginInput loggedIn"} readOnly={this.state.userID == "" ? false : true} placeholder="Choose a name ..."/>
            <button className={this.state.userID == "" ? "loginButton" : "loginButton loggedInButton"} type="submit">Login</button>
          </form>
          <ul className="userList">
            {this.state.userList.map((user, i) => {
              return <li name={user} key={user + i}><p>{user}</p></li>
            })}
          </ul>
          <form action="" onSubmit={this.createRoom}>
            <input type="text" name="createRoom" value={this.state.createRoom} onChange={this.handleInput} className="roomInput" placeholder="Create a room ..."/>
            <button className="roomButton" type="submit">Create</button>
          </form>
          <ul className="roomList">
            {this.state.roomList.map((room, i) => {
              return <li name={room} className={this.state.userRoom === room ? "selectedRoom" : ""} onClick={this.joinRoom} key={room + i}>{room}</li>
            })}
          </ul>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
