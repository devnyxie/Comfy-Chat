import "./App.css";
import { io } from "socket.io-client";
import { Button, Form, InputGroup, ListGroup } from "react-bootstrap";
import { useEffect, useState } from "react";
import { GoPrimitiveDot } from "react-icons/go";
import { AiOutlineInfoCircle } from "react-icons/ai";
import notification from "./Sounds/notification.mp3";

let socket = io("https://comfy-chat-be-production.up.railway.app/", {
  autoConnect: false,
});
function App() {
  const [username, setUsername] = useState("");
  const [usernameAlreadySelected, setUsernameAlreadySelected] = useState(false);
  const [Users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(false);
  const [message, setMessage] = useState("");

  const initReactiveProperties = (user) => {
    user.connected = true;
    user.messages = [];
    user.hasNewMessages = false;
  };

  useEffect(() => {
    socket.on("connectStatus", (status) => {
      socket.on("user connected", (user) => {
        initReactiveProperties(user);
        setUsers((current) => [...current, user]);
        dataToTransfer = [...dataToTransfer, user];
      });
      socket.on("private message", ({ content, from, createdAt }) => {
        socket.emit("giveUsers");
        console.log("you've got new message");
        const audio = new Audio(notification);
        audio.play();
        for (let i = 0; i < dataToTransfer.length; i++) {
          const user = dataToTransfer[i];

          if (user.userID === from) {
            user.messages.push({
              content,
              fromSelf: false,
              createdAt,
            });

            setUsers([...new Set(dataToTransfer, user)]);
            setUsernameAlreadySelected(user);

            if (user !== selectedUser) {
              user.hasNewMessages = true;
            }
            break;
          }
        }
      });
    });
    socket.on("users", (props_users) => {
      props_users.forEach((user) => {
        user.self = user.userID === socket.id;
        initReactiveProperties(user);
      });
      props_users.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
      });
      setUsers(props_users);

      dataToTransfer = props_users;
    });

    let dataToTransfer = [];
  }, [Users]);

  const onUsernameSelection = (e) => {
    e.preventDefault();
    setUsernameAlreadySelected(true);
    socket.auth = { username };
    socket.connect();
  };

  let onMessage = (content) => {
    if (selectedUser) {
      socket.emit("private message", {
        content,
        to: selectedUser.userID,
        createdAt: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      });
      console.log("message sent!");
      selectedUser.messages.push({
        content,
        fromSelf: true,
        createdAt: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      });

      setUsers([...new Set(Users, selectedUser)]);
    }
  };

  const handleKeypress = (e) => {
    if (e.keyCode === 13) {
      sendMessage();
    }
  };

  const handleKeypressLogin = (e) => {
    if (e.keyCode === 13) {
      onUsernameSelection(e);
    }
  };

  const sendMessage = () => {
    onMessage(message);
    setMessage("");
  };

  socket.on("connect", () => {
    setUsers(
      Users.forEach((user) => {
        if (user.self) {
          user.connected = true;
        }
      })
    );
  });

  socket.on("disconnect", () => {
    setUsers(
      Users.forEach((user) => {
        if (user.self) {
          user.connected = false;
        }
      })
    );
  });

  const onChangeHandler = (value, fieldToSet) => {
    fieldToSet(value);
  };

  useEffect(() => {
    try {
      console.log(Users);
    } catch (error) {
      console.log(error);
    }
  });
  return (
    <>
      {usernameAlreadySelected ? (
        <div
          className="d-flex justify-content-center align-items-center w-100 "
          style={{
            height: "100vh",
            backgroundImage: `url(https://i.imgur.com/A4grpNB.png)`,
          }}
        >
          <div className="w-100 h-100" style={{ backdropFilter: "blur(2px)" }}>
            <div className="d-flex text-light " id="center">
              <div
                className="h-100 w-25 glass p-2"
                style={{
                  borderTopLeftRadius: "5px",
                  borderBottomLeftRadius: "5px",
                  borderRight: "1px solid white",
                }}
              >
                <ListGroup style={{ maxHeight: "100%", overflow: "hidden" }}>
                  {Users === undefined ? (
                    <>
                      <div className="w-100 h-100 d-flex justify-content-center align-items-center">
                        Connecting...
                      </div>
                    </>
                  ) : (
                    <>
                      {Users.map((user, index) => {
                        const startChat = () => {
                          setSelectedUser(user);
                        };
                        return (
                          <ListGroup.Item
                            key={index}
                            className=" text-dark d-flex align-items-center"
                            onClick={startChat}
                            style={{ maxHeight: "60px" }}
                          >
                            <div className="me-2">
                              <img
                                src={user.pfp}
                                style={{ width: "40px", borderRadius: "50%" }}
                              />
                            </div>
                            <div>
                              {index === 0 ? (
                                <div>{user.username} (yourself)</div>
                              ) : (
                                <div>{user.username}</div>
                              )}

                              <div className="d-flex align-items-center">
                                <GoPrimitiveDot
                                  style={{ color: "green" }}
                                  size={20}
                                />
                                Online
                              </div>
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </>
                  )}
                </ListGroup>
              </div>
              <div
                className="w-75 h-100 glass overflow-hidden"
                style={{
                  borderTopRightRadius: "5px",
                  borderBottomRightRadius: "5px",
                  maxHeight: "100%",
                }}
              >
                {selectedUser ? (
                  <div className="h-100 position-relative">
                    <div
                      className="sticky-top border-bottom text-light d-flex align-items-center justify-content-between pe-3 px-3"
                      style={{ height: "8%" }}
                    >
                      <span>to: {selectedUser?.username}</span>
                      <span>
                        <AiOutlineInfoCircle size={25} />
                      </span>
                    </div>
                    <div
                      className=" text-dark pe-3 px-3"
                      style={{
                        overflow: "auto",
                        height: "92%",
                        paddingBottom: "40px",
                      }}
                    >
                      {selectedUser.messages.map((message, index) => {
                        if (message.fromSelf !== true) {
                          return (
                            <>
                              <div className=" p-1 pt-2 pb-2" key={index}>
                                <div className="w-100 d-flex justify-content-start">
                                  <div
                                    className="text-muted"
                                    style={{ fontSize: "12px" }}
                                  >
                                    {message.createdAt}
                                  </div>
                                </div>
                                <div
                                  className="w-100 d-flex justify-content-start"
                                  key={index}
                                >
                                  <div
                                    className="bg-light text-dark p-2 rounded-3 mt-1 mb-1 text-center"
                                    style={{ width: "auto", minWidth: "50px" }}
                                  >
                                    {message.content}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <div className=" p-1 pt-2 pb-2">
                                <div className="w-100 d-flex justify-content-end">
                                  <div
                                    className="text-muted"
                                    style={{ fontSize: "12px" }}
                                  >
                                    {message.createdAt}
                                  </div>
                                </div>
                                <div
                                  className="w-100 d-flex justify-content-end"
                                  key={index}
                                >
                                  <div
                                    className="bg-light text-dark p-2 rounded-3 mt-1 mb-1 text-center"
                                    style={{ width: "auto", minWidth: "50px" }}
                                  >
                                    {message.content}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        }
                      })}
                    </div>
                    <div className="position-absolute bottom-0 w-100">
                      <InputGroup style={{ height: "40px" }}>
                        <Form.Control
                          placeholder="Enter your message"
                          aria-label="Enter your message"
                          className="rounded-0"
                          onKeyDown={handleKeypress}
                          value={message}
                          onChange={(e) =>
                            onChangeHandler(e.target.value, setMessage)
                          }
                        />
                        <Button
                          variant="light"
                          className="border"
                          onClick={sendMessage}
                        >
                          Send
                        </Button>
                      </InputGroup>
                    </div>
                  </div>
                ) : (
                  <div className="text-light w-100 h-100 d-flex align-items-center justify-content-center">
                    <div className=" ">Choose user to start chatting!</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-dark">
            <header className="App-header">
              <p>
                <code>Chattin'</code>
              </p>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Control
                  onKeyDown={handleKeypressLogin}
                  value={username}
                  onChange={(e) => onChangeHandler(e.target.value, setUsername)}
                  type="username"
                  placeholder="Enter username"
                />
              </Form.Group>
              {username.length > 2 ? (
                <Button
                  className=" border-0"
                  style={{ backgroundColor: "#D63384" }}
                  onClick={onUsernameSelection}
                >
                  Join
                </Button>
              ) : (
                <>
                  <Button
                    data-toggle="tooltip"
                    data-placement="bottom"
                    title="Enter at least 3 characters"
                    className=" border-0"
                    style={{ backgroundColor: "#a8306a" }}
                  >
                    Join
                  </Button>
                </>
              )}
            </header>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
