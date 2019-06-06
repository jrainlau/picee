import $fetch from './fetch.js'
import chooseImg from './chooseImg.js'
import paste from './paste.js'

const CHECK_TOKEN = 'https://api.github.com'
const UPLOAD = 'https://api.github.com/repos'

const uploadUrl = (repo, folder, file) => {
  return `${UPLOAD}/${repo}/contents/${folder ? folder + '/' : ''}${file}`
}

new Vue({
  el: '#app',
  data () {
    return {
      // auth
      loginMode: true,
      authMode: 'token',
      githubToken: '',
      githubAccount: '',
      githubPassword: '',

      // upload
      repoName: '',
      folderPath: '',
      isRepoNameCorrect: false,
      previewImg: '',
      imgBase64: '',
      imgLink: '',
      fileName: '',
      ableToUpload: true,

      // config
      autoUpload: false,
      uploaderFocus: false,
      uploadProgress: 0,
      compressSize: 0,
      showConfig: false,
      setMaxSize: false,
      copyAsMarkdown: false,
      renameWithHash: true,

      // history
      historyMode: false,
      uploadHistory: []
    }
  },
  async mounted () {
    const token = localStorage.getItem('picee_token')
    if (token) {
      this.accessToken = token
      this.loginMode = false
    }

    const repoName = localStorage.getItem('picee_repo')
    if (repoName) {
      this.isRepoNameCorrect = true
      this.repoName = repoName
    }

    const folderPath = localStorage.getItem('picee_folder')
    if (folderPath) {
      this.folderPath = folderPath
    }

    const autoUpload = localStorage.getItem('picee_auto_upload')
    if (autoUpload) {
      this.autoUpload = true
    } else {
      this.autoUpload = false
    }

    const compressSize = localStorage.getItem('picee_compress_size')
    if (compressSize) {
      this.compressSize = Number(compressSize)
      this.setMaxSize = true
    }

    const uploadHistory = localStorage.getItem('picee_history')
    if (uploadHistory) {
      this.uploadHistory = JSON.parse(uploadHistory)
    }

    const copyAsMarkdown = localStorage.getItem('picee_copy_as_markdown')
    if (copyAsMarkdown) {
      this.copyAsMarkdown = true
    } else {
      this.copyAsMarkdown = false
    }

    const renameWithHash = localStorage.getItem('picee_rename_with_hash')
    if (renameWithHash) {
      this.renameWithHash = true
    } else {
      this.renameWithHash = false
    }
  },
  watch: {
    autoUpload (val) {
      if (val) {
        localStorage.setItem('picee_auto_upload', true)
      } else {
        localStorage.removeItem('picee_auto_upload')
      }
    },
    setMaxSize (val) {
      if (!val) {
        localStorage.removeItem('picee_compress_size')
      } else {
        localStorage.setItem('picee_compress_size', this.compressSize)
      }
    },
    compressSize (val) {
      if (this.setMaxSize) {
        this.compressSize = val
        localStorage.setItem('picee_compress_size', val)
      }
    },
    copyAsMarkdown (val) {
      if (val) {
        localStorage.setItem('picee_copy_as_markdown', true)
      } else {
        localStorage.removeItem('picee_copy_as_markdown')
      }
    },
    renameWithHash (val) {
      if (val) {
        localStorage.setItem('picee_rename_with_hash', true)
      } else {
        localStorage.removeItem('picee_rename_with_hash')
      }
    }
  },
  methods: {
    // auth
    changeAuthMode (mode) {
      this.authMode = mode
    },
    logout () {
      localStorage.removeItem('picee_token')
      localStorage.removeItem('picee_repo')
      localStorage.removeItem('picee_folder')
      localStorage.removeItem('picee_compress_size')
      localStorage.removeItem('picee_history')
      this.resetAuth()
    },
    resetAuth () {
      this.loginMode = true
      this.githubToken = ''
      this.githubPassword = ''
      this.githubAccount = ''
    },
    async submitAuth () {
      if (this.authMode === 'token') {
        localStorage.setItem('picee_token', 'Bearer ' + this.githubToken)
      } else {
        localStorage.setItem('picee_token', 'Basic ' + btoa(this.githubAccount + ':' + this.githubPassword))
      }

      const { status } = await $fetch({
        url: CHECK_TOKEN
      })
      
      if (status > 400) {
        alert('Unauthorized identify, please take a check and try again.')
        localStorage.removeItem('picee_token')
        this.resetAuth()
        return
      }

      this.loginMode = false
    },

    // upload
    setRepoName () {
      if (this.repoName.split('/').length === 2) {
        this.isRepoNameCorrect = true
        localStorage.setItem('picee_repo', this.repoName)
        localStorage.setItem('picee_folder', this.folderPath.replace(/\/$/g, ''))
      } else {
        alert('Illegal project name!')
        this.repoName = localStorage.getItem('picee_repo') || ''
      }
    },
    refresh () {
      this.imgBase64 = ''
      this.previewImg = ''
      this.imgLink = ''
      this.ableToUpload = true
    },
    onUploaderFocus (e) {
      this.uploaderFocus = e.target.classList.contains('target')
    },
    getImage (url, fileName) {
      this.ableToUpload = false
      this.imgLink = ''
      this.imgBase64 = url
      this.previewImg = url
      this.fileName = this.renameWithHash ? fileName.replace('.', `.${Math.random().toString(36).substr(2)}.`) : fileName

      if (this.autoUpload) {
        this.upload()
      }
    },
    onDrop (e) {
      this.uploaderFocus = true
      const imgEvent = {
        target: {
          files: e.dataTransfer.files
        }
      }
      chooseImg(imgEvent, (url, fileName) => {
        this.getImage(url, fileName)
      }, this.setMaxSize ? this.compressSize * 1024 : null)
    },
    onFileChange (e) {
      chooseImg(e, (url, fileName) => {
        this.getImage(url, fileName)
      }, this.setMaxSize ? this.compressSize * 1024 : null)
    },
    async onPaste (e) {
      const { url, fileName } = await paste(e, this.setMaxSize ? this.compressSize * 1024 : null)
      this.getImage(url, fileName)
    },
    copyUrl (e, name = 'imgLink') {
      let refItem = this.$refs[name]
      if (refItem instanceof Array) {
        refItem = refItem[0]
      }
      refItem.select()
      document.execCommand('copy')
    },
    async upload () {
      if (this.ableToUpload) {
        return
      }

      this.ableToUpload = true

      this.uploadProgress = parseInt(Math.random() * 20)
      const result = await $fetch({
        url: uploadUrl(this.repoName, this.folderPath, this.fileName),
        method: 'PUT',
        body: {
          message: 'upload from Picee',
          content: this.imgBase64.split(',')[1]
        }
      }).catch(e => e)

      if (result.status === 422) {
        this.uploadProgress = 0
        alert(`It\'s not allow to upload an exists image named "${this.fileName}"\nYou could check the "Rename the image with a hash" option to avoid this error.`)
        return
      }

      if (result.data) {
        this.uploadProgress = 100
        setTimeout(() => {
          this.uploadProgress = 0
        }, 2000)

        this.imgLink = result.data.content.download_url
        this.uploaderFocus = false

        this.uploadHistory.unshift({
          time: (new Date()).toLocaleString(),
          imgLink: result.data.content.download_url
        })

        localStorage.setItem('picee_history', JSON.stringify(this.uploadHistory))

        chrome.notifications && chrome.notifications.create(null, {
          type: 'basic',
          iconUrl: this.imgBase64,
          title: 'Upload success',
          message: 'Image has been uploaded.'
        });
      } else {
        this.uploadProgress = 0
        alert(`errCode: ${result.status}\nPlease check the repo name or your network and try again.`)
      }
    }
  }
})
