import chooseImg from './chooseImg.js'

const onPaste = (e, maxsize = 200 * 1024) => {
  if (!(e.clipboardData && e.clipboardData.items)) {
    return
  }
  return new Promise((resolve, reject) => {
    for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
      const item = e.clipboardData.items[i]
      if (item.kind === 'file') {
        const pasteFile = item.getAsFile()
        const imgEvent = {
          target: {
            files: [pasteFile]
          }
        }
        chooseImg(imgEvent, (url, fileName) => {
          resolve({ url, fileName })
        }, maxsize)
      } else {
        reject(new Error('Not allow to paste this type!'))
      }
    }
  })
}

export default onPaste
