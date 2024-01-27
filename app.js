const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const verifyPassword = (password) => {
  return password.length > 4;
};
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    const createNewQuery = `
    INSERT INTO 
        user (username,name,password,gender,location) 
    VALUES
       (
            '${username}',
            '${name}',
            '${password}',
            '${gender}',
            '${location}'
       )`;

    if (verifyPassword(password)) {
      await db.run(createNewQuery);
      response.send("User created Successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    isPasswordMatch = await bcrypt.compare(oldPassword, dbPath.password);
    if (isPasswordMatch === true) {
      if (verifyPassword(password)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
        UPDATE user 
        SET 
          password='${hashedPassword}' 
        WHERE 
           username='${username}'`;
        const user = await db.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
