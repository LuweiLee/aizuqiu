// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { homeTeam, awayTeam, league } = event

  try {
    // 构建提示词
    const prompt = `请分析一场${league}足球比赛：${homeTeam} vs ${awayTeam}。
    请提供以下内容：
    1. 详细分析双方实力对比、近期状态、历史交锋等因素
    2. 预测比赛结果，并给出主队胜、平局、客队胜的概率`

    const response = await axios({
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-514a7d2f5a7f407fbb5b2d03df28289d'
      },
      data: {
        model: "deepseek-chat",
        messages: [
          {
            "role": "user",
            "content": prompt
          }
        ]
      }
    })

    const aiResponse = response.data.choices[0].message.content

    // 解析AI返回的内容
    const parts = aiResponse.split('2.')
    const analysis = parts[0].replace('1.', '').trim()
    
    // 从预测部分提取概率数据
    const predictionText = parts[1]
    const homeWinMatch = predictionText.match(/主队胜.*?(\d+)%/)
    const drawMatch = predictionText.match(/平局.*?(\d+)%/)
    const awayWinMatch = predictionText.match(/客队胜.*?(\d+)%/)

    return {
      success: true,
      data: {
        analysis: analysis,
        prediction: {
          homeWin: homeWinMatch ? homeWinMatch[1] + '%' : '33%',
          draw: drawMatch ? drawMatch[1] + '%' : '34%',
          awayWin: awayWinMatch ? awayWinMatch[1] + '%' : '33%'
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
