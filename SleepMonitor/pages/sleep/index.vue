<template>
	<view class="sleep-container" :class="{ 'dark-theme': isDarkTheme }">
		
		<!-- 添加网络监控组件
		<network-monitor
			:isDarkTheme="isDarkTheme"
			@data-updated="handleDataUpdated"
			class="network-monitor-section"
		/> -->
		
		<!-- 错误信息窗口 -->
		<view class="error-panel" v-if="showErrorPanel" :class="{ 'dark-theme': isDarkTheme }">
			<view class="error-header">
				<text class="error-title">调试信息</text>
				<view class="error-actions">
					<view class="error-action" @tap="clearErrors">
						<text class="action-icon">🗑️</text>
					</view>
					<view class="error-action" @tap="toggleErrorPanel">
						<text class="action-icon">✕</text>
					</view>
		</view>
	  </view>
			<scroll-view class="error-content" scroll-y>
				<view v-for="(log, index) in errorLogs" :key="index" class="error-item" :class="log.type">
					<text class="error-time">{{ formatTime(log.timestamp) }}</text>
					<text class="error-message">{{ log.message }}</text>
					<text v-if="log.details" class="error-details">{{ log.details }}</text>
				</view>
			</scroll-view>
		</view>

		<view class="page-header">
			<text class="page-title">睡眠记录</text>
			<view class="header-actions">

				<!-- <view class="action-button" @tap="goToNetworkTest">
					<text class="action-icon">📡</text>
				</view> -->
				
				<view class="action-button" @tap="handleDataUpdated">
					<text class="action-icon">🔄</text>
				</view>
				<view class="action-button" @tap="toggleTheme">
					<text class="action-icon">{{ isDarkTheme ? '🌙' : '☀️' }}</text>
				</view>
			</view>
		</view>
  
		<view class="page-content">
			<view class="chart-section">
				<view class="chart-card">
					<text class="chart-title heart-rate">心率变化</text>
					<view class="chart-box">
						<qiun-data-charts 
							type="line"
							:opts="heartRateOptions"
							:chartData="heartRateData"
							:ontouch="true"
							:canvas2d="true"
							:enableScroll="true"
						/>
					</view>
				</view>

				<view class="chart-card">
					<text class="chart-title blood-oxygen">血氧饱和度</text>
					<view class="chart-box">
						<qiun-data-charts 
							type="line"
							:opts="bloodOxygenOptions"
							:chartData="bloodOxygenData"
							:ontouch="true"
							:canvas2d="true"
							:enableScroll="true"
						/>
					</view>
				</view>

				<view class="chart-card">
					<text class="chart-title temperature">体温变化</text>
					<view class="chart-box">
						<qiun-data-charts 
							type="line"
							:opts="temperatureOptions"
							:chartData="temperatureData"
							:ontouch="true"
							:canvas2d="true"
							:enableScroll="true"
						/>
					</view>
				</view>

				
		</view>
		
		<!-- 添加睡眠报告组件 -->
		<sleep-report
			:isDarkTheme="isDarkTheme"
			:heartRateData="heartRateData.series[0].data"
			:bloodOxygenData="bloodOxygenData.series[0].data"
			:temperatureData="temperatureData.series[0].data"
		/>
	  </view>
  
		<!-- 网络监控组件 -->
		<view class="network-section" :class="{ 'collapsed': isNetworkCollapsed }">
			<view class="network-header" @tap="toggleNetworkSection">
				<text class="network-title">网络连接</text>
				<text class="collapse-icon">{{ isNetworkCollapsed ? '▼' : '▲' }}</text>
			</view>
			<view class="network-content" v-show="!isNetworkCollapsed">
				<network-monitor
					:isDarkTheme="isDarkTheme"
					@data-updated="handleDataUpdated"
					class="monitor-component"
				/>
		</view>
	  </view>
	</view>
  </template>
  
  <script>
  import AudioRecorder from '@/components/audio-recorder/audio-recorder.vue';
  import NetworkMonitor from '@/components/network-monitor/network-monitor.vue';
  import SleepReport from '@/components/sleep-report/sleep-report.vue';
  
  export default {
		components: {
			AudioRecorder,
			NetworkMonitor,
			SleepReport
		},
	data() {
	  return {
		        isDarkTheme: false,
				currentTime: '',
				showErrorPanel: false,
				errorLogs: [],
				hasErrors: false,
				errorCount: 0,
		        //totalHours: 24,
				//displayHours: 8,
				//startTimeIndex: 0,
				
				// 图表数据
				heartRateData: {
					categories: [],
					series: [{
						name: '心率',
						data: []
					}]
				},
				bloodOxygenData: {
					categories: [],
					series: [{
						name: '血氧',
						data: []
					}]
				},
				temperatureData: {
					categories: [],
					series: [{
						name: '体温',
						data: []
					}]
				},

				// 图表配置
				chartOpts: {
					color: ["#1890FF"],
					padding: [15, 15, 0, 15],
					legend: {
						show: false
					},
					enableScroll: true,
					xAxis: {
						disableGrid: true,
						scrollShow: true,
						scrollAlign: 'left',
						scrollColor: '#CCCCCC',
						scrollBackgroundColor: '#F5F5F5',
						itemCount: 8,
						labelCount: 8,
						format: (val) => {
							return val.split(':')[0] + '时';
						},
						boundaryGap: 'justify'
					},
					yAxis: {
						gridType: 'dash',
						dashLength: 2,
						gridColor: '#CCCCCC',
						gridCount: 5,
						format: (val) => {
							return val.toFixed(0);
						}
					},
					extra: {
						line: {
							type: "curve",
							width: 2,
							activeType: "hollow"
						}
					}
				},
				isNetworkCollapsed: true, // 默认折叠状态
				allData: {
					heartRate: [],
					bloodOxygen: [],
					temperature: []
				},
				currentDataIndex: 0,
				statusBarHeight: 0,
	  };
	},
	onLoad() {
	  // 获取状态栏高度
	  this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight;
	  this.loadData();
	},
	methods: {
			// 生成时间点数据
			generateTimePoints() {
				const points = [];
				const now = new Date();
				now.setHours(0, 0, 0, 0);
				
				for (let i = 0; i < 24; i++) {
					const hour = i.toString().padStart(2, '0');
					points.push(`${hour}:00`);
				}
				return points;
			},

			// 计算数据的最大最小值
			calculateDataRange(data) {
				const values = data.map(item => typeof item === 'object' ? item.value : item);
				const max = Math.max(...values);
				const min = Math.min(...values);
				// 添加一些边距，使图表显示更美观
				const padding = (max - min) * 0.1;
				return {
					min: Math.floor((min - padding) * 10) / 10,
					max: Math.ceil((max + padding) * 10) / 10
				};
			},

			// 加载数据
			loadData() {
				try {
					// 生成或获取完整数据
					const data = this.generateData();
					
					// 设置完整的数据集
					this.heartRateData = {
						categories: data.categories,
						series: [{
							name: '心率',
							data: data.series[0].data,
							type: 'line',
							style: 'curve',
							color: '#FF4D4F'
						}]
					};
					
					this.bloodOxygenData = {
						categories: data.categories,
						series: [{
							name: '血氧',
							data: data.series[1].data,
							type: 'line',
							style: 'curve',
							color: '#69C0FF'
						}]
					};
					
					this.temperatureData = {
						categories: data.categories,
						series: [{
							name: '体温',
							data: data.series[2].data,
							type: 'line',
							style: 'curve',
							color: '#FFA940'
						}]
					};
					
					// 更新图表配置
					this.updateChartOptions();
					
				} catch (error) {
					this.logError('数据加载失败', error);
				}
			},

			// 新增：更新图表数据的方法
			updateChartData(startIndex) {
				const itemCount = 8; // 每次显示的数据点数量
				const categories = this.generateTimePoints();
				
				// 确保索引在有效范围内
				startIndex = Math.max(0, Math.min(startIndex, categories.length - itemCount));
				this.currentDataIndex = startIndex;
				
				// 获取当前要显示的数据片段
				const getDataSlice = (data) => {
					return data.slice(startIndex, startIndex + itemCount);
				};
				
				// 更新心率数据
				this.heartRateData = {
					categories: categories.slice(startIndex, startIndex + itemCount),
					series: [{
						name: '心率',
						data: getDataSlice(this.allData.heartRate),
						type: 'line',
						style: 'curve',
						color: '#FF4D4F'
					}]
				};
				
				// 更新血氧数据
				this.bloodOxygenData = {
					categories: categories.slice(startIndex, startIndex + itemCount),
					series: [{
						name: '血氧',
						data: getDataSlice(this.allData.bloodOxygen),
						type: 'line',
						style: 'curve',
						color: '#69C0FF'
					}]
				};
				
				// 更新体温数据
				this.temperatureData = {
					categories: categories.slice(startIndex, startIndex + itemCount),
					series: [{
						name: '体温',
						data: getDataSlice(this.allData.temperature),
						type: 'line',
						style: 'curve',
						color: '#FFA940'
					}]
				};
				
				// 更新图表配置
				this.updateChartOptions();
			},
			
			// 修改图表配置更新方法
			updateChartOptions() {
				const createChartOptions = (series, gridEval = 1) => {
					const options = {
						...this.chartOpts,
						enableScroll: true,
						xAxis: {
							...this.chartOpts.xAxis,
							scrollShow: true,
							scrollAlign: 'left',
							itemCount: 8,
							labelCount: 8,
							format: (val) => val,
							boundaryGap: 'justify'
						},
						yAxis: {
							disabled: false,
							disableGrid: false,
							splitNumber: 5,
							gridType: 'dash',
							gridColor: 'rgba(204,204,204,0.3)',
							dashLength: 2,
							gridEval,
							min: series.range.min,
							max: series.range.max,
							format: (val) => {
								return val.toFixed(1);
							}
						}
					};
					
					// 根据主题设置颜色
					if (this.isDarkTheme) {
						options.xAxis.axisLineColor = '#FFFFFF';
						options.xAxis.axisGridColor = '#FFFFFF';
						options.xAxis.gridColor = '#FFFFFF';
						options.xAxis.scrollColor = '#FFFFFF';
						options.xAxis.scrollBackgroundColor = '#2a2a2a';
						options.fontColor = '#FFFFFF';
					}
					
					return options;
				};
				
				// 计算每个数据集的范围
				const heartRateRange = this.calculateDataRange(this.heartRateData.series[0].data);
				const bloodOxygenRange = this.calculateDataRange(this.bloodOxygenData.series[0].data);
				const temperatureRange = this.calculateDataRange(this.temperatureData.series[0].data);
				
				// 更新各个图表的配置
				this.heartRateOptions = createChartOptions({
					name: '心率',
					data: this.heartRateData.series[0].data,
					range: heartRateRange
				});
				
				this.bloodOxygenOptions = createChartOptions({
					name: '血氧',
					data: this.bloodOxygenData.series[0].data,
					range: bloodOxygenRange
				});
				
				this.temperatureOptions = createChartOptions({
					name: '体温',
					data: this.temperatureData.series[0].data,
					range: temperatureRange
				}, 0.1);
			},
			
			// 添加图表触摸事件处理方法
			onChartTouch(e) {
				const { type, index } = e.detail;
				if (type === 'scroll') {
					// 根据滚动位置更新数据
					const newIndex = Math.floor(index);
					if (newIndex !== this.currentDataIndex) {
						this.updateChartData(newIndex);
					}
				}
			},

			// 切换主题
			toggleTheme() {
				this.isDarkTheme = !this.isDarkTheme;
				this.chartOpts.fontColor = this.isDarkTheme ? '#FFFFFF' : '#666666';
				this.chartOpts.xAxis.axisLineColor = this.isDarkTheme ? '#FFFFFF' : '#CCCCCC';
				this.chartOpts.xAxis.axisGridColor = this.isDarkTheme ? '#FFFFFF' : '#CCCCCC';
				this.chartOpts.xAxis.gridColor = this.isDarkTheme ? '#FFFFFF' : '#CCCCCC';
				this.refreshChartData();
	  },

			// 切换错误面板
			toggleErrorPanel() {
				this.showErrorPanel = !this.showErrorPanel;
			},

			// 清除错误日志
			clearErrors() {
				this.errorLogs = [];
				this.hasErrors = false;
				this.errorCount = 0;
			},

			// 记录错误
			logError(message, error) {
				const errorLog = {
					timestamp: new Date(),
					message,
					details: error?.message || error?.toString() || '',
					type: 'error'
				};
				this.errorLogs.unshift(errorLog);
				this.hasErrors = true;
				this.errorCount = this.errorLogs.length;
			},

			// 格式化时间
			formatTime(date) {
				return new Date(date).toLocaleTimeString('zh-CN', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false
		});
	  },

			onTouchStart(e) {
				console.log('touch start', e);
			},
			onTouchMove(e) {
				console.log('touch move', e);
	  },
			onTouchEnd(e) {
				console.log('touch end', e);
			},

			// 添加处理网络数据更新的方法
			handleDataUpdated(chartData) {
				try {
					// 更新心率数据
					this.heartRateData = {
						categories: chartData.timePoints,
						series: [{
							name: '心率',
							data: chartData.heartRate,
							type: 'line',
							style: 'curve',
							color: '#FF4D4F'
						}]
					};
					
					// 更新体温数据
					this.temperatureData = {
						categories: chartData.timePoints,
						series: [{
							name: '体温',
							data: chartData.temperature,
							type: 'line',
							style: 'curve',
							color: '#FFA940'
						}]
					};
					
					// 更新血氧数据
					this.bloodOxygenData = {
						categories: chartData.timePoints,
						series: [{
							name: '血氧',
							data: chartData.bloodOxygen,
							type: 'line',
							style: 'curve',
							color: '#69C0FF'
						}]
					};
					
					// 更新图表配置
					this.updateChartOptions();
					
				} catch (error) {
					this.logError('更新图表数据失败', error);
				}
			},
			
			// 修改生成数据的方法
			generateData() {
				const categories = this.generateTimePoints();
				
				// 生成心率数据
				const heartRateData = Array(24).fill(0).map(() => {
					const baseValue = 75;
					const randomValue = Math.random() * 20 - 10;
					return Number((baseValue + randomValue).toFixed(1));
				});
				
				// 生成血氧数据
				const bloodOxygenData = Array(24).fill(0).map(() => {
					const baseValue = 98;
					const randomValue = Math.random() * 2 - 1;
					return Number((baseValue + randomValue).toFixed(1));
				});
				
				// 生成体温数据
				const temperatureData = Array(24).fill(0).map(() => {
					const baseValue = 36.5;
					const randomValue = Math.random() * 0.3 - 0.15;
					return Number((baseValue + randomValue).toFixed(1));
				});
				
				// 保存完整数据
				this.allData = {
					heartRate: heartRateData,
					bloodOxygen: bloodOxygenData,
					temperature: temperatureData
				};
				
				// 返回完整的数据集
				return {
					categories,
					series: [
						{
							name: '心率',
							data: heartRateData,
							range: this.calculateDataRange(heartRateData)
						},
						{
							name: '血氧',
							data: bloodOxygenData,
							range: this.calculateDataRange(bloodOxygenData)
						},
						{
							name: '体温',
							data: temperatureData,
							range: this.calculateDataRange(temperatureData)
						}
					]
				};
			},


			toggleNetworkSection() {
				this.isNetworkCollapsed = !this.isNetworkCollapsed;
			},
			
			handleNetworkData(data) {
				console.log('收到网络数据:', data);
				// 这里可以处理网络监控组件传来的数据
			}
		}
	}
  </script>
  
<style lang="scss">
  .sleep-container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx;
	box-sizing: border-box;
	
	&.dark-theme {
		background-color: #1a1a1a;
		color: #ffffff;
  }
}

  .page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 30rpx;
	padding-top: calc(var(--status-bar-height) + 20rpx);
	background-color: #ffffff;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	
  .page-title {
	font-size: 36rpx;
	font-weight: bold;
	}
	
	.header-actions {
		display: flex;
		gap: 20rpx;
		
		.action-button {
 width: 80rpx;
 height: 80rpx;
			border-radius: 50%;
			background-color: #ffffff;
 display: flex;
	align-items: center;
	justify-content: center;
			box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
			
			.action-icon {
				font-size: 40rpx;
			}
			
			&:active {
				transform: scale(0.95);
			}
		}
	}
}

.dark-theme .header-actions .action-button {
	background-color: #2a2a2a;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.2);
}

.chart-section {
	display: flex;
	flex-direction: column;
	gap: 30rpx;
	
	.chart-card {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		
		.chart-title {
			font-size: 32rpx;
			font-weight: bold;
			margin-bottom: 20rpx;
			
			&.heart-rate {
				color: #FF4D4F;
			}
			
			&.blood-oxygen {
				color: #69C0FF;
			}
			
			&.temperature {
				color: #FFA940;
			}
			
			&.snore {
				color: #9254DE;
			}
		}
		
		.chart-box {
			width: 100%;
			height: 400rpx;
			position: relative;
			overflow: hidden;
			touch-action: pan-x;
			background: transparent;
			
			:deep(.qiun-charts) {
 position: relative;
				touch-action: pan-x;
				-webkit-tap-highlight-color: transparent;
				user-select: none;
				-webkit-user-select: none;
				cursor: grab;
				
				&:active {
					cursor: grabbing;
  }
			}
			
			:deep(canvas) {
				touch-action: pan-x;
  }
		}
	}
}

.error-panel {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 80%;
	max-height: 80vh;
	background-color: #ffffff;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.2);
	z-index: 1000;
	
	&.dark-theme {
		background-color: #2a2a2a;
		color: #ffffff;
  }
	
	.error-header {
 display: flex;
	justify-content: space-between;
	align-items: center;
	 padding: 20rpx 30rpx;
		border-bottom: 2rpx solid #eeeeee;
		
		.error-title {
 font-size: 32rpx;
 font-weight: bold;
  }
		
		.error-actions {
			display: flex;
			gap: 20rpx;
			
			.error-action {
				width: 60rpx;
				height: 60rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				
				.action-icon {
	font-size: 32rpx;
  }
			}
		}
	}
	
	.error-content {
		padding: 20rpx 30rpx;
		max-height: calc(80vh - 100rpx);
		
		.error-item {
			margin-bottom: 20rpx;
			padding: 20rpx;
			border-radius: 10rpx;
			background-color: #f8f8f8;
			
			&.error {
				background-color: #fff2f0;
				border: 2rpx solid #ffccc7;
			}
			
			&.warning {
				background-color: #fffbe6;
				border: 2rpx solid #ffe58f;
  }
			
			&.info {
				background-color: #e6f7ff;
				border: 2rpx solid #91d5ff;
			}
			
			.error-time {
 font-size: 24rpx;
				color: #999999;
				margin-bottom: 10rpx;
  }
			
			.error-message {
 font-size: 28rpx;
				color: #333333;
				margin-bottom: 10rpx;
  }
			
			.error-details {
	font-size: 24rpx;
				color: #666666;
				word-break: break-all;
  }
		}
	}
}

.debug-button {
	position: fixed;
	right: 30rpx;
	bottom: 30rpx;
	width: 100rpx;
	height: 100rpx;
	background-color: #ff4d4f;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
	z-index: 999;
	
	.debug-icon {
		font-size: 48rpx;
	}
	
	.debug-count {
		position: absolute;
		top: -10rpx;
		right: -10rpx;
		min-width: 40rpx;
		height: 40rpx;
		padding: 0 10rpx;
		background-color: #ffffff;
		border-radius: 20rpx;
		font-size: 24rpx;
		color: #ff4d4f;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  }
}

.dark-theme {
	.chart-card {
		background-color: #2a2a2a;
		
  .chart-title {
			color: #ffffff;
		}
	}
	
	.error-item {
		background-color: #333333 !important;
		
		.error-time {
			color: #999999;
  }
		
		.error-message {
 color: #ffffff;
  }
		
		.error-details {
			color: #cccccc;
		}
		
		&.error {
			background-color: #3a1a1a !important;
			border-color: #4a2a2a !important;
		}
		
		&.warning {
			background-color: #3a3a1a !important;
			border-color: #4a4a2a !important;
		}
		
		&.info {
			background-color: #1a3a4a !important;
			border-color: #2a4a5a !important;
		}
	}
  }

.network-monitor-section {
	margin-bottom: 30rpx;
}

.network-section {
	margin: 20rpx;
	background-color: #fff;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	overflow: hidden;
	transition: all 0.3s ease;
}

.network-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	background-color: #f5f5f5;
	cursor: pointer;
}

.network-title {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
}

.collapse-icon {
	font-size: 24rpx;
	color: #666;
	transition: transform 0.3s ease;
}

.network-content {
	padding: 20rpx;
	transition: all 0.3s ease;
}

.monitor-component {
	width: 100%;
}

/* 深色主题样式 */
.dark-theme .network-section {
	background-color: #1c1c1c;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.2);
}

.dark-theme .network-header {
	background-color: #2c2c2c;
}

.dark-theme .network-title {
	color: #fff;
}

.dark-theme .collapse-icon {
	color: #999;
}

/* 折叠状态样式 */
.network-section.collapsed .network-content {
	display: none;
}

.network-section.collapsed .network-header {
	border-bottom: none;
}

/* 确保图表容器有合适的底部间距 */
.charts-container {
	margin-bottom: 20rpx;
  }

.page-content {
	.chart-section {
		margin-bottom: 30rpx;
	}
}
  </style>