Page({
  data: {
    match: null,
    analysis: '',
    prediction: {
      homeWin: '',
      draw: '',
      awayWin: ''
    }
  },

  onLoad(options) {
    const match = JSON.parse(options.match)
    this.setData({ match })
    this.getAIPrediction()
  },

  // 获取AI预测结果
  getAIPrediction() {
    const { homeTeam, awayTeam, league } = this.data.match
    
    wx.showLoading({
      title: '分析中...',
      mask: true  // 添加遮罩，防止用户重复操作
    })

    wx.cloud.callFunction({
      name: 'getPrediction',
      data: {
        homeTeam,
        awayTeam,
        league
      }
    })
    .then(res => {
      wx.hideLoading()  // 成功后隐藏loading
      if (res.result && res.result.success) {
        const { analysis, prediction } = res.result.data
        this.setData({
          analysis,
          prediction
        })
      } else {
        throw new Error('获取预测失败')
      }
    })
    .catch(error => {
      wx.hideLoading()  // 失败后隐藏loading
      console.error('获取AI预测失败:', error)
      wx.showToast({
        title: '获取预测失败',
        icon: 'none',
        duration: 2000
      })
    })
  }
})
