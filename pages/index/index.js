// 获取应用实例
const app = getApp()

Page({
  data: {
    dates: [],
    currentDateIndex: 0,
    matches: [],
    loading: false
  },

  onLoad() {
    this.initializeDates()
    this.fetchMatches()
  },

  // 初始化日期选择器
  initializeDates() {
    const dates = []
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      
      dates.push({
        date: date.getDate(),
        day: dayNames[date.getDay()],
        fullDate: date.toISOString().split('T')[0]
      })
    }
    
    this.setData({ dates })
  },

  // 选择日期
  selectDate(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ 
      currentDateIndex: index,
      matches: [] // 清空当前比赛数据
    })
    this.fetchMatches()
  },

  // 获取比赛数据
  async fetchMatches() {
    this.setData({ loading: true })

    try {
      const selectedDate = this.data.dates[this.data.currentDateIndex].fullDate
      
      const { result } = await wx.cloud.callFunction({
        name: 'getMatches',
        data: {
          date: selectedDate
        }
      })

      if (result.success) {
        this.setData({
          matches: result.data
        })
      } else {
        throw new Error(result.error || '获取比赛数据失败')
      }
    } catch (error) {
      console.error('获取比赛数据失败:', error)
      wx.showToast({
        title: '获取比赛数据失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 跳转到预测页面
  navigateToPrediction(e) {
    const match = e.currentTarget.dataset.match
    wx.navigateTo({
      url: '/pages/prediction/prediction',
      success: (res) => {
        res.eventChannel.emit('matchData', match)
      }
    })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.fetchMatches()
    wx.stopPullDownRefresh()
  }
})
