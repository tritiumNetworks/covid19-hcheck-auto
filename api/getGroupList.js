const { constant, fetch } = require('../utils')

module.exports = async (url, token) => {
  const result = await fetch('https://' + url + '/v2/selectUserGroup', token, {
    method: 'POST',
    headers: { 'Content-Type': constant.jsonContentType },
    body: '{}'
  }).then(res => res.json())
    .then(json => {
      const list = json.map(item => {
        return {
          name: item.userNameEncpt,
          userNo: item.userPNo,
          token: item.token
        }
      })
      return list
    })

  return result
}
