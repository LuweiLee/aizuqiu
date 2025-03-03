// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
        env: 'cloud1-3g2xm2b840e7062d'  // 云环境ID
      })
    }
  },
  globalData: {
    userInfo: null
  }
})
