const fetch = require('node-fetch')

const { fakeUserAgent } = require('./constant')

function _fetch (addr, token, options) {
  if (!options) options = {}
  if (!options.headers) options.headers = {}

  if (token.length > 0) options.headers.Authorization = token
  options.headers['User-Agent'] = fakeUserAgent
  options.headers['X-Requested-With'] = 'XMLHttpRequest'

  return fetch(addr, options)
}

module.exports = _fetch
