<template>
  <view class="sleep-report" :class="{ 'dark-theme': isDarkTheme }">
    <view class="report-card">
      <view class="report-header">
        <text class="report-title">睡眠分析报告</text>
        <view class="report-actions">
          <view class="action-button" @tap="refreshReport">
            <text class="action-icon">🔄</text>
          </view>
        </view>
      </view>
      
      <view class="report-content">
        <view class="loading" v-if="isLoading">
          <text class="loading-text">正在生成报告...</text>
        </view>
        
        <view class="report-section" v-else>
          <view class="data-summary">
            <view class="summary-item">
              <text class="summary-label">平均心率</text>
              <text class="summary-value">{{ averageHeartRate }} bpm</text>
            </view>
            <view class="summary-item">
              <text class="summary-label">平均血氧</text>
              <text class="summary-value">{{ averageBloodOxygen }}%</text>
            </view>
            <view class="summary-item">
              <text class="summary-label">平均体温</text>
              <text class="summary-value">{{ averageTemperature }}°C</text>
            </view>
          </view>
          
          <view class="ai-analysis">
            <text class="analysis-title">AI 睡眠分析</text>
            <text class="analysis-content">{{ aiAnalysis }}</text>
          </view>
          
          <view class="suggestions">
            <text class="suggestions-title">改善建议</text>
            <view class="suggestion-list">
              <view class="suggestion-item" v-for="(suggestion, index) in suggestions" :key="index">
                <text class="suggestion-icon">💡</text>
                <text class="suggestion-text">{{ suggestion }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SleepReport',
  props: {
    isDarkTheme: {
      type: Boolean,
      default: false
    },
    heartRateData: {
      type: Array,
      default: () => []
    },
    bloodOxygenData: {
      type: Array,
      default: () => []
    },
    temperatureData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      isLoading: false,
      aiAnalysis: '',
      suggestions: [],
      API_KEY: "sk-dec348849b6f408c9fb451d14ec996ad",
      API_URL: "https://api.deepseek.com/v1/chat/completions"
    }
  },
  computed: {
    averageHeartRate() {
      if (!this.heartRateData.length) return '--';
      const sum = this.heartRateData.reduce((acc, val) => acc + val, 0);
      return (sum / this.heartRateData.length).toFixed(1);
    },
    averageBloodOxygen() {
      if (!this.bloodOxygenData.length) return '--';
      const sum = this.bloodOxygenData.reduce((acc, val) => acc + val, 0);
      return (sum / this.bloodOxygenData.length).toFixed(1);
    },
    averageTemperature() {
      if (!this.temperatureData.length) return '--';
      const sum = this.temperatureData.reduce((acc, val) => acc + val, 0);
      return (sum / this.temperatureData.length).toFixed(1);
    }
  },
  methods: {
    async refreshReport() {
      this.isLoading = true;
      try {
        await this.generateAIReport();
      } catch (error) {
        console.error('生成报告失败:', error);
        uni.showToast({
          title: '生成报告失败',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },
    
    async generateAIReport() {
      const prompt = this.generatePrompt();
      
      try {
        const response = await uni.request({
          url: this.API_URL,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`
          },
          data: {
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: "你是一个专业的睡眠健康顾问，请根据提供的睡眠数据进行分析，给出专业的睡眠质量评估和改进建议。请不要使用markdown格式输出，这样会产生'#'和'*'字符，导致显示错误。"
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          }
        });
        
        if (response.statusCode === 200 && response.data.choices && response.data.choices[0]) {
          const analysis = response.data.choices[0].message.content;
          this.parseAIResponse(analysis);
        } else {
          throw new Error('API 响应格式错误');
        }
      } catch (error) {
        console.error('AI 分析请求失败:', error);
        throw error;
      }
    },
    
    generatePrompt() {
      return `你是一位经验丰富的睡眠健康分析师，擅长从生理数据中评估个体的睡眠质量与健康状况。请基于下列结构化数据，提供**全面且具体**的分析报告，包括但不限于以下几个方面：

1. **整体睡眠趋势分析**：根据心率（hrate）、血氧饱和度（bo2）和体温（temper）的变化趋势，判断受试者是否存在明显的生理波动、异常状态或阶段性变化。
2. **睡眠阶段推测**：结合心率和体温变化，推测何时进入浅睡、深睡、快速眼动（REM）等阶段，并解释依据。
3. **健康预警信号**：如有异常体征（如高心率波动、低血氧、体温异常等），请指出具体时段并评估可能风险。
4. **改善建议**：如果有发现睡眠质量欠佳的迹象，请从环境调节、作息建议、运动饮食等方面给出针对性建议。


平均心率：${this.averageHeartRate} bpm
平均血氧：${this.averageBloodOxygen}%
平均体温：${this.averageTemperature}°C

心率数据：${JSON.stringify(this.heartRateData)}
血氧数据：${JSON.stringify(this.bloodOxygenData)}
体温数据：${JSON.stringify(this.temperatureData)}

请从以下几个方面进行分析：
1. 整体睡眠质量评估
2. 各项指标的具体分析
3. 可能存在的问题
4. 具体的改善建议

请用专业但易懂的语言回答，并给出具体的建议，请不要使用markdown格式输出，这样会产生'#'和'*'字符，导致显示错误。`;
    },
    
    parseAIResponse(response) {
      try {
        // 简单的响应解析，实际应用中可能需要更复杂的解析逻辑
        const sections = response.split('\n\n');
        this.aiAnalysis = sections[0] || '暂无分析数据';
        this.suggestions = sections.slice(1).filter(section => section.trim());
      } catch (error) {
        console.error('解析 AI 响应失败:', error);
        this.aiAnalysis = '分析数据解析失败';
        this.suggestions = ['请稍后重试'];
      }
    }
  },
  watch: {
    heartRateData: {
      handler() {
        this.refreshReport();
      },
      deep: true
    },
    bloodOxygenData: {
      handler() {
        this.refreshReport();
      },
      deep: true
    },
    temperatureData: {
      handler() {
        this.refreshReport();
      },
      deep: true
    }
  },
  mounted() {
    this.refreshReport();
  }
}
</script>

<style lang="scss">
.sleep-report {
  margin: 20rpx;
  
  .report-card {
    background-color: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
    
    &.dark-theme {
      background-color: #2a2a2a;
      color: #ffffff;
    }
  }
  
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .report-title {
      font-size: 36rpx;
      font-weight: bold;
    }
    
    .report-actions {
      display: flex;
      gap: 20rpx;
      
      .action-button {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .action-icon {
          font-size: 32rpx;
        }
        
        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
  
  .report-content {
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40rpx 0;
      
      .loading-text {
        font-size: 28rpx;
        color: #999999;
      }
    }
    
    .report-section {
      .data-summary {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30rpx;
        padding: 20rpx;
        background-color: #f8f8f8;
        border-radius: 15rpx;
        
        .summary-item {
          text-align: center;
          
          .summary-label {
            font-size: 24rpx;
            color: #666666;
            margin-bottom: 10rpx;
            display: block;
          }
          
          .summary-value {
            font-size: 32rpx;
            font-weight: bold;
            color: #333333;
          }
        }
      }
      
      .ai-analysis {
        margin-bottom: 30rpx;
        
        .analysis-title {
          font-size: 32rpx;
          font-weight: bold;
          margin-bottom: 20rpx;
          display: block;
        }
        
        .analysis-content {
          font-size: 28rpx;
          line-height: 1.6;
          color: #333333;
        }
      }
      
      .suggestions {
        .suggestions-title {
          font-size: 32rpx;
          font-weight: bold;
          margin-bottom: 20rpx;
          display: block;
        }
        
        .suggestion-list {
          .suggestion-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20rpx;
            padding: 20rpx;
            background-color: #f8f8f8;
            border-radius: 15rpx;
            
            .suggestion-icon {
              font-size: 32rpx;
              margin-right: 20rpx;
            }
            
            .suggestion-text {
              flex: 1;
              font-size: 28rpx;
              line-height: 1.6;
              color: #333333;
            }
          }
        }
      }
    }
  }
}

.dark-theme {
  .report-card {
    .data-summary {
      background-color: #333333;
      
      .summary-item {
        .summary-label {
          color: #999999;
        }
        
        .summary-value {
          color: #ffffff;
        }
      }
    }
    
    .ai-analysis {
      .analysis-content {
        color: #ffffff;
      }
    }
    
    .suggestions {
      .suggestion-item {
        background-color: #333333;
        
        .suggestion-text {
          color: #ffffff;
        }
      }
    }
  }
}
</style> 