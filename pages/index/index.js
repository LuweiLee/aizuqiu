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
    this.fetchMatches()
  },

  // 获取比赛数据
  async fetchMatches() {
    this.setData({ loading: true })

    try {
      // 获取当前日期
      const today = new Date().toISOString().split('T')[0]
      console.log('请求日期:', today)
      
      const requestTask = wx.request({
        url: `https://h.jsty.com/api/v4/game/schedule/page/1/${today}/0/1/0/0`,
        method: 'GET',
        timeout: 10000, // 设置10秒超时
        success: (response) => {
          console.log('API响应:', response)
          
          if (response.statusCode === 200 && response.data) {
            // 检查返回的数据格式
            if (response.data.error !== 0 || !response.data.data) {
              console.error('API返回错误:', response.data)
              throw new Error(response.data.message || 'API返回错误')
            }

            const matchData = response.data.data
            console.log('比赛数据:', matchData)

            // 从 list 中获取比赛数据
            const matches = matchData.list || []
            console.log('比赛列表:', matches)

            // 筛选未开始的比赛（status === 1 表示未开赛）
            let upcomingMatches = matches.filter(match => match.status === 1)
            console.log('筛选后的比赛数:', upcomingMatches.length)
            
            // 按比赛开始时间排序
            upcomingMatches.sort((a, b) => {
              const timeA = new Date(a.start_time * 1000).getTime()  // 转换时间戳
              const timeB = new Date(b.start_time * 1000).getTime()
              return timeA - timeB
            })

            // 只保留最近的两场比赛
            upcomingMatches = upcomingMatches.slice(0, 2)

            // 处理比赛数据，确保所有必要的字段都存在
            const processedMatches = upcomingMatches.map(match => {
              // 将时间戳转换为可读时间
              const matchTime = new Date(match.start_time * 1000)
              const hours = matchTime.getHours().toString().padStart(2, '0')
              const minutes = matchTime.getMinutes().toString().padStart(2, '0')
              
              return {
                id: match.id,
                league: match.league_name,
                time: `${hours}:${minutes}`,
                homeTeam: match.home_name,
                awayTeam: match.away_name,
                homeTeamLogo: match.home_logo,
                awayTeamLogo: match.away_logo,
                status: 'NS', // 未开始的比赛
                score: {
                  home: 0,
                  away: 0
                }
              }
            })

            this.setData({
              matches: processedMatches.length > 0 ? processedMatches : []
            })
          } else {
            console.error('API请求失败:', response.statusCode, response.data)
            throw new Error(`API请求失败: ${response.statusCode}`)
          }
        },
        fail: (error) => {
          console.error('请求失败:', error)
          throw error
        }
      })

      // 添加请求中断处理
      this.currentRequest = requestTask
    } catch (error) {
      console.error('获取比赛数据失败:', error)
      wx.showToast({
        title: error.message || '获取比赛数据失败',
        icon: 'none',
        duration: 2000
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
