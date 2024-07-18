const express = require('express')

const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'userData.db')

const app = express()
app.use(express.json())
let db = null
const bcrypt = require('bcrypt')

const serverside = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running properly')
    })
  } catch (err) {
    console.log(err.message)
  }
}
serverside()

// API 1
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  console.log(hashedPassword)
  const identify_user = `select * from user where username = "${username}"`
  const matched_user = await db.get(identify_user)

  if (matched_user === undefined) {
    // create account
    const account = `INSERT INTO user (username, name, password, gender, location)
        VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}')`

    if (request.body.password.length < 5) {
      response.status(400)
      response.send(`Password is too short`)
    } else {
      const registed = await db.run(account)
      const lastId = registed.lastId
      response.status(200)
      response.send(`User created successfully`)
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// API 2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const query = `select * from user where username = "${username}"`
  const get_user = await db.get(query)
  if (get_user === undefined) {
    response.status(400)
    response.send(`Invalid user`)
  } else {
    const matched_password = await bcrypt.compare(password, get_user.password)

    if (matched_password === true) {
      response.status(200)
      response.send(`Login success!`)
    } else {
      response.status(400)
      response.send(`Invalid password`)
    }
  }
})

// API 3
app.put('/change-password', async (request, response) => {
  const {username, oldpassword, newpassword} = request.body
  const query = `select * from user where username = "${username}"`
  const get_q = await db.get(query)

  if (get_q === undefined) {
    response.status(400)
    response.send(`User not Registered`)
  } else {
    const comp_pass = await bcrypt.compare(
      oldpassword,
      get_q.password,
    )
    if (comp_pass === true) {
      const length_pass = newpassword.length
      if (length_pass < 5) {
        response.status(400)
        response.send(`Password is too short`)
      } else {
        const hash_newpassword = await bcrypt.hash(request.body.newpassword, 10)
        const update_pass = `update user set oldpassword = "${hash_newpassword}" where username = "${username}"`
        await db.run(update_pass)
        response.send(`Password updated`)
      }
    } else {
      response.status(400)
      response.send(`Invalid current password`)
    }
  }
})

module.exports = app
