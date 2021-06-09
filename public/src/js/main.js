/* global io */
const socket = io()

// eslint-disable-next-line no-unused-vars
function check () {
  let hasvalue = true
  document.forms[0].elements.forEach((e) => { if (!e.value) hasvalue = false })
  if (!hasvalue) return false
  return confirm('이 서비스의 이용자는 만 14세 이상이며\n이 서비스를 사용함에 있어 생기는 방역적 문제는 사용자가 전적 책임지는데 동의 하십니까?')
}

document.forms[0].addEventListener('input', () => {
  let hasvalue = true
  Array.prototype.slice.call(document.forms[0].elements).slice(0, 2).forEach((e) => { if (!e.value) hasvalue = false })
  document.forms[0].elements[2].disabled = !hasvalue
})

document.forms[0].elements[2].addEventListener('input', query)

function query () {
  const values = []
  Array.prototype.slice.call(document.forms[0].elements).slice(0, 3).forEach((e) => values.push(e.value))
  setTimeout(() => {
    if (values[2] === document.forms[0].elements[2].value) socket.emit('checkschool', values)
  }, 500)
}

socket.on('checkschool', (err, search) => {
  if (!err) {
    if (search.length > 1) {
      document.getElementsByClassName('notify')[0].innerHTML = '검색결과가 많습니다. 해당하는 학교명을 선택해주세요'
      document.getElementsByClassName('notify')[0].style.color = 'skyblue'
      document.getElementById('selschool').classList.remove('d-none')
      document.forms[0].elements[2].style.color = '#a3be8c'
      document.forms[0].elements[4].disabled = true
      document.forms[0].elements[5].disabled = true
      document.forms[0].elements[6].disabled = true

      /**
       * @type {HTMLTableElement}
       */
      const table = document.getElementById('schoolstable')
      while (table.rows.length > 0) table.deleteRow(0)
      for (const school of search) {
        const row = table.insertRow()
        const namecell = row.insertCell()
        const selectcell = row.insertCell()

        namecell.innerHTML = `<h4>${school.kraOrgNm}</h4><p>${school.addres}</p>`
        selectcell.innerHTML = `<button onclick="document.forms[0].elements[2].value='${school.kraOrgNm}$${school.orgCode}';query()" class="btn btn-primary" data-dismiss="modal">선택</button>`
      }
    } else {
      document.getElementById('selschool').classList.add('d-none')
      document.getElementsByClassName('notify')[0].innerHTML = '검색 성공: ' + search[0].kraOrgNm + ' ' + search[0].addres
      document.getElementsByClassName('notify')[0].style.color = '#a3be8c'
      document.forms[0].elements[2].style.color = '#a3be8c'
      document.forms[0].elements[4].disabled = false
      document.forms[0].elements[5].disabled = false
      document.forms[0].elements[6].disabled = false
    }
  } else {
    document.getElementById('selschool').classList.add('d-none')
    document.getElementsByClassName('notify')[0].innerHTML = '검색 실패: ' + err
    document.getElementsByClassName('notify')[0].style.color = '#bf616a'
    document.forms[0].elements[2].style.color = '#bf616a'
    document.forms[0].elements[4].disabled = true
    document.forms[0].elements[5].disabled = true
    document.forms[0].elements[6].disabled = true
  }
})
