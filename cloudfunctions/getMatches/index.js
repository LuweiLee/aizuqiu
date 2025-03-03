const cloud = require('wx-server-sdk')
const fetch = require('node-fetch')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 格式化日期为YYYYMMDD格式
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 转换比赛状态为中文
function translateStatus(status) {
  const statusMap = {
    'NS': '未开始',
    '1H': '上半场',
    'HT': '中场休息',
    '2H': '下半场',
    'FT': '完赛',
    'PST': '推迟',
    'CANC': '取消',
    'ABD': '中断',
    'LIVE': '进行中'
  }
  return statusMap[status] || status
}

exports.main = async (event, context) => {
  try {
    // 获取请求的日期，如果没有提供则使用当天
    const requestDate = event.date ? new Date(event.date) : new Date()
    const formattedDate = formatDate(requestDate)

    // 在发送请求前验证日期格式
    console.log('请求日期格式:', formattedDate)
    if (!/^\d{8}$/.test(formattedDate)) {
      throw new Error(`日期格式错误: ${formattedDate}`)
    }

    // API配置
    const API_HOST = 'footapi7.p.rapidapi.com'
    const API_KEY = '4e2309ed46msh9a6f99c7d4af123p1b5e86jsn34b25ddd387b'
    const API_URL = `https://${API_HOST}/api/matches/live`

    console.log('开始请求API数据...')
    const response = await fetch(`${API_URL}?date=${formattedDate}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP错误! 状态: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data || !data.events) {
      console.error('API返回数据格式不正确')
      return {
        success: true,
        data: []
      }
    }

    // 使用events数组作为比赛数据
    const matchesData = data.events
    
    // 处理返回的比赛数据
    const matches = matchesData.map(match => ({
      id: match.id || String(Date.now()),
      league: match.tournament?.name || '未知联赛',
      time: match.startTimestamp ? new Date(match.startTimestamp * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '待定',
      status: match.status?.type || 'NS',
      statusText: match.status?.description || translateStatus(match.status?.type || 'NS'),
      homeTeam: match.homeTeam?.name || '主队',
      awayTeam: match.awayTeam?.name || '客队',
      homeTeamLogo: match.homeTeam?.logo || 'https://example.com/default-logo.png',
      awayTeamLogo: match.awayTeam?.logo || 'https://example.com/default-logo.png',
      score: {
        home: match.homeScore?.current || '-',
        away: match.awayScore?.current || '-'
      }
    }))

    // 按时间排序
    matches.sort((a, b) => {
      if (a.time === '待定') return 1
      if (b.time === '待定') return -1
      return a.time.localeCompare(b.time)
    })

    return {
      success: true,
      data: matches
    }

  } catch (error) {
    console.error('获取比赛数据失败:', error.message)
    return {
      success: false,
      error: `获取比赛数据失败: ${error.message}`
    }
  }
}
