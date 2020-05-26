const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { DBURL, PORT, SECRET_TOKEN } = require("./config");
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const app = express();
const { Users } = require('./models/user-model');
const { Posts } = require('./models/post-model');
const { Comments } = require("./models/comments-model");
const fetch = require("node-fetch");

const jsonParser = bodyParser.json();

app.use(express.static("public"));

// Application routing
app.get("/", (_, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/about", (_, res) => {
    res.sendFile(__dirname + "/public/pages/about.html");
});

app.get("/login", (_, res) => {
    res.sendFile(__dirname + "/public/pages/login.html");
});

app.get("/register", (_, res) => {
    res.sendFile(__dirname + "/public/pages/register.html");
});

app.get("/createPost", (_, res) => {
    res.sendFile(__dirname + "/public/pages/createPost.html");
});

app.get("/validate-token", (req, res) => {
    let token = req.headers.sessiontoken;
    jsonwebtoken.verify(token, SECRET_TOKEN, (err, decoded) => {
        if (err) {
            res.statusMessage = "Your session expired";
            return res.status(409).end();
        }
        return res.status(200).json({
            userName: decoded.userName
        });
    });
});

app.get("/genAccessToken", (req, res) => {
    let myHeaders = new fetch.Headers();
    myHeaders.append("Authorization", "Basic ZTZiOWUwNDdjMjY1NGFmZDgzYTUyZDVkNjY2NmM2NzI6YjRmMmNhNmQxNmM0NDRhYmIxODg0MzQ5MjQ5N2MwNjc=");
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    let urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");

    let requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
    };

    fetch("https://accounts.spotify.com/api/token", requestOptions)
        .then(response => response.json())
        .then(result => { return res.status(200).json(result) })
        .catch(error => {
            throw new Error(error);
        });
});

app.post('/login', jsonParser, (req, res) => {
    let { userName, password } = req.body;
    if (!userName || !password) {
        res.statusMessage = "Parameter missing in the body of the request.";
        return res.status(406).end();
    }

    Users
        .getUserByUserName(userName)
        .then(user => {
            bcrypt.compare(password, user.password)
                .then(result => {
                    if (result) {
                        let userData = {
                            userName: user.userName
                        };
                        jsonwebtoken.sign(userData, SECRET_TOKEN, { expiresIn: '1h' }, (err, token) => {
                            if (err) {
                                res.statusMessage = err.message;
                                return res.status(400).end();
                            }
                            console.log(token);
                            return res.status(200).json({ token });
                        });
                    } else {
                        res.statusMessage = "Wrong credentials";
                        return res.status(409).end();
                    }
                })
                .catch(err => {
                    res.statusMessage = err.message;
                    return res.status(400).end();
                });
        })
        .catch(err => {
            res.statusMessage = "User not found";
            return res.status(400).end();
        });

})

app.post('/register', jsonParser, (req, res) => {
    let { userName, password } = req.body;

    if (!userName || !password) {
        res.statusMessage = "Parameter missing in the body of the request.";
        return res.status(406).end();
    }
    bcrypt.hash(password, 10)
        .then(hashedPassword => {
            const newUser = {
                userName,
                password: hashedPassword
            };

            Users
                .createUser(newUser)
                .then(result => {
                    return res.status(201).json(result);
                })
                .catch(err => {
                    res.statusMessage = err.message;
                    return res.status(400).end();
                });
        })
        .catch(err => {
            res.statusMessage = err.message;
            return res.status(400).end();
        });
});


app.post('/posts', jsonParser, (req, res) => {
    const {description, song, username} = req.body;

    if (!song || !description || !username) {
        res.statusMessage = "Field or fields missing in request body";
        return res.status(406).end();
    }

    Users
        .getUserByUserName(username)
        .then(userJSON => {
            const newPost = {
                description: description,
                song : song,
                user : userJSON._id
            };
            Posts
                .createPost(newPost)
                .then(post => {
                    console.log("New Post", newPost);
                    return res.status(201).json(post);
                })
                .catch(_ => {
                    res.statusMessage = "Something went wrong";
                    return res.status(500).end();
                });
        })
        .catch(_ => {
            res.statusMessage = "Something went wrong";
            return res.status(500).end();
        })
  });

app.get("/allPosts", (_, res) => {
    Posts
        .getAllPosts()
        .then(posts => {
            return res.status(200).json(posts);
        })
        .catch(_ => {
            res.statusMessage = "Something went wrong";
            return res.status(500).end();
        })
});

app.post("/addComment", jsonParser, (req, res) => {
    const {postID, comment, username} = req.body;

    const newComment = {
        comment: comment,
        username: username,
        approved: true
    }

    Comments
        .createComment(newComment)
        .then(comment => {
            Posts
                .updatePostComments(postID, comment._id)
                .then(updatedPost => {
                    return res.status(201).json(updatedPost);
                })
                .catch(_ => {
                    res.statusMessage = "Something went wrong when updating post comments";
                    return res.status(500).end();
                });
        })
        .catch(err => {
            res.statusMessage = "Something went wrong when adding comment.";
            return res.status(500).end();
        })

});

app.listen(PORT, () => {
    console.log("Server running on localhost:8080");
    new Promise((resolve, reject) => {
        mongoose.connect(DBURL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log("Connected to db successfully");
                return resolve();
            }
        });
    })
        .catch(err => {
            mongoose.disconnect();
            console.log(err);
        });
});