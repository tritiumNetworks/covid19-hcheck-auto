const { constant, fetch } = require('../utils')

module.exports = async (url, schoolCode, user, token) => {
  const surveyToken = await fetch('https://' + url + '/v2/getUserInfo', token, {
    method: 'POST',
    headers: { 'Content-Type': constant.jsonContentType },
    body: JSON.stringify({
      orgCode: schoolCode,
      userPNo: user.userNo
    })
  }).then(res => res.json())
    .then(json => json.token)

  return surveyToken
}
