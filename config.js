const DBURL = process.env.DBURL || "mongodb://localhost/musicAppdb";
const PORT = process.env.PORT || "8080";
const SECRET_TOKEN = process.env.SECRET_TOKEN || "secret";
const SPOTIFY_KEY = process.env.SPOTIFY_KEY || "ZTZiOWUwNDdjMjY1NGFmZDgzYTUyZDVkNjY2NmM2NzI6YjRmMmNhNmQxNmM0NDRhYmIxODg0MzQ5MjQ5N2MwNjc=";
module.exports = {DBURL, PORT, SECRET_TOKEN, SPOTIFY_KEY};