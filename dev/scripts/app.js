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
    }

    this.handleInput = this.handleInput.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
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
      });
    }
  }

  render() {
    return (
      <div className="wrapper">
        <div className="chatArea">
          <ul className="messageWindow">
          </ul>
          <form action="">
            <input type="text" name="userMessage" value={this.state.userMessage} onChange={this.handleInput} className="messageInput" placeholder="Enter your message ..."/>
            <button type="submit" className="sendButton">Send</button>
          </form>
        </div>
        <div className="otherArea">
          <form action="" onSubmit={this.handleLogin}>
            <input type="text" name="userName" value={this.state.userName} onChange={this.handleInput} className={this.state.userID == "" ? "loginInput" : "loginInput loggedIn"} readOnly={this.state.userID == "" ? false : true} placeholder="Choose a name ..."/>
            <button className={this.state.userID == "" ? "loginButton" : "loginButton loggedInButton"} type="submit">Login</button>
          </form>
          <form action="">
            <input type="text" name="userRoom" value={this.state.userRoom} onChange={this.handleInput} className="roomInput" placeholder="Create a room ..."/>
            <button className="roomButton" type="submit">Create</button>
          </form>
          <ul className="roomList">
          </ul>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
