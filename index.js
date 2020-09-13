const PORT = process.env.port || 8080
const path = require('path').resolve()

const http = require('http')
const knex = require('knex')
const express = require('express')
const socketio = require('socket.io')
const schedule = require('node-schedule')
const { renderFile: render } = require('ejs')

const { constant } = require(path + '/utils')
const { getSchoolData, getUserToken, getGroupList, getSurveyToken, sendSurveyData } = require('./api')

const app = express()
const srv = http.createServer(app)
const socket = socketio(srv)

// --- db

const db = knex({
  client: 'mysql',
  connection: {
    user: 'covidauto',
    host: 'localhost',
    database: 'covidauto'
  }
})

// --- ws

socket.on('connection', (session) => {
  session.on('checkschool', async (args) => {
    let data
    try { await getSchoolData({ region: args[0], level: args[1], name: args[2] }) } catch (err) { data = err.message }
    session.emit('checkschool', data)
  })
})

// --- http

app.get('/', async (_, res) => res.send(await render(path + '/page/index.ejs', { constant })))

app.use('/api', express.urlencoded({ extended: true }))
app.post('/api', async (req, res) => {
  const { region, level, name, studentName: sname, birth } = req.body

  let data
  try { data = await getSchoolData({ region, level, name }) } catch (err) { return res.send('<script>alert("어.. 이게 아닌데..\\n' + err.message + '");window.location.replace("/")</script>') }

  const { schoolCode: school, requestUrl: url } = data
  const rendered = { school, url, name: sname, birth }

  try { await db.insert(rendered).into('userdata') } catch (err) { return res.send('<script>alert("어.. 이게 아닌데..\\n' + err.message + '");window.location.replace("/")</script>') }
  res.send('<script>alert("등록 완료! 내일을 기대하세요 :)");window.location.replace("/")</script>')

  schedule.scheduleJob('30 7 * * *', hcheck(rendered))
})

app.use('/', express.static(path + '/public'))
app.use((_, res) => res.redirect('/'))

srv.listen(PORT, () => console.log('Server at port:', PORT))

// --- fn

loadhc()
async function loadhc () {
  const datas = await db.select('*').from('userdata')
  datas.forEach((data) => {
    schedule.scheduleJob('30 7 * * *', hcheck(data))
  })
}

function hcheck ({ school, url, name, birth }) {
  return () => {
    setTimeout(async () => {
      try {
        const token = await getUserToken(url, school, name, birth)
        const users = await getGroupList(url, token)
        const userf = users.find(item => item.name === name)
        const stokn = await getSurveyToken(url, school, userf, token)

        await sendSurveyData(url, stokn)
      } catch (_) {}
    }, Math.floor(Math.random() * 1200000))
  }
}
