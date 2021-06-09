const PORT = process.env.port || 8080
const path = require('path').resolve()

const http = require('http')
const knex = require('knex')
const express = require('express')
const socketio = require('socket.io')
const schedule = require('node-schedule')
const { renderFile: render } = require('ejs')

const { constant } = require(path + '/utils')
const { getSchoolData, getUserToken, getGroupList, getSurveyToken, sendSurveyData, checkPassword } = require('./api')

const app = express()
const srv = http.createServer(app)
const socket = socketio(srv)

let schedules = []

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
    let data, search
    try { search = await getSchoolData({ region: args[0], level: args[1], name: args[2].split('$')[0] }, args[2].split('$')[1]) } catch (err) { data = err.message }
    session.emit('checkschool', data, search)
  })
})

// --- http

app.get('/', async (_, res) => res.send(await render(path + '/page/index.ejs')))
app.get('/apply', async (_, res) => res.send(await render(path + '/page/apply.ejs', { constant })))
app.get('/disapply', async (_, res) => res.send(await render(path + '/page/disapply.ejs')))

app.use('/api', express.urlencoded({ extended: true }))
app.post('/api', async (req, res) => {
  const { region, level, name, studentName: sname, birth, password } = req.body

  let data
  try { data = await getSchoolData({ region, level, name }) } catch (err) { return res.send('<script>alert("어.. 이게 아닌데..\\n' + err.message + '");window.location.replace("/")</script>') }

  const { orgCode: school, atptOfcdcConctUrl: url } = data
  const rendered = { school, url, name: sname, birth, password }

  try { await db.insert(rendered).into('userdata') } catch (err) { return res.send('<script>alert("어.. 이게 아닌데..\\n' + err.message + '");window.location.replace("/")</script>') }
  res.send('<script>alert("등록 완료! 내일을 기대하세요 :)");window.location.replace("/")</script>')

  schedules.push(schedule.scheduleJob('30 7 * * *', hcheck(rendered)))
})

app.post('/api/disapply', async (req, res) => {
  const { studentName: name, birth, password } = req.body

  const [user] = await db.select('*').where({ name, birth, password }).from('userdata')
  if (!user) return res.send('<script>alert("해당 사용자를 찾을 수 없습니다.");window.location.replace("/")</script>')

  await db.delete().where({ name, birth, password }).from('userdata')
  res.send('<script>alert("성공적으로 탈퇴처리 되었습니다.\\n이에 따라 제공하신 개인정보가 성공적으로 파기되었습니다.");window.location.replace("/")</script>')

  schedules.forEach((sch) => sch.cancel())
  loadhc()
})

app.use('/', express.static(path + '/public'))
app.use((_, res) => res.redirect('/'))

srv.listen(PORT, () => console.log('Server at port:', PORT))

// --- fn

loadhc()
async function loadhc () {
  schedules = []
  const datas = await db.select('*').from('userdata')
  datas.forEach((data) => {
    schedules.push(schedule.scheduleJob('30 7 * * *', hcheck(data)))
  })
}

function hcheck ({ school, url, name, birth, password }) {
  return () => {
    setTimeout(async () => {
      try {
        const token = await getUserToken(url, school, name, birth)
        const token2 = await checkPassword(url, token, password)
        const users = await getGroupList(url, token2)
        const userf = users.find(item => item.name === name)
        const stokn = await getSurveyToken(url, school, userf, token2)

        await sendSurveyData(url, stokn, userf.name)
      } catch (_) {}
    }, Math.floor(Math.random() * 1200000))
  }
}
