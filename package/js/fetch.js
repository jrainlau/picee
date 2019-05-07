const $fetch = (options) => {
  return window.fetch(options.url, {
    method: options.method || 'GET',
    headers: {
      "Content-Type": "application/json",
      "Authorization": localStorage.getItem('picee_token')
    },
    body: JSON.stringify(options.body) || null,
    mode: 'cors'
  })
    .then(async res => {
      if (res.status >= 200 && res.status < 400) {
        return {
          status: res.status,
          data: await res.json()
        }
      } else {
        return {
          status: res.status,
          data: null
        }
      }
    })
    .catch(e => e)
}

export default $fetch
