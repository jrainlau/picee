function toPreviewer (dataUrl, fileName, cb) {
  cb && cb(dataUrl, fileName)
}

function compress (img, fileType, maxWidth) {
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')

  const proportion = img.width / img.height
  const width = maxWidth
  const height = maxWidth / proportion

  canvas.width = width
  canvas.height = height

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, width, height)

  // 压缩
  const base64data = canvas.toDataURL(fileType, 0.75)
  canvas = ctx = null

  return base64data
}

function chooseImg (e, cb, maxsize = 0) {
  const file = e.target.files[0]

  if (!file) {
    return
  }

  if (!/\/(?:jpeg|jpg|png|gif)/i.test(file.type)) {
    return
  }

  const reader = new FileReader()
  reader.onload = function () {
    const result = this.result
    let img = new Image()

    // 如果图片小于 200kb，不压缩
    if (maxsize === null || result.length <= maxsize) {
      toPreviewer(result, file.name, cb)
      return
    }

    img.onload = function () {
      const compressedDataUrl = compress(img, file.type, maxsize / 1024)
      toPreviewer(compressedDataUrl, file.name, cb)
      img = null
    }

    img.src = result
  }

  reader.readAsDataURL(file)
}

export default chooseImg
