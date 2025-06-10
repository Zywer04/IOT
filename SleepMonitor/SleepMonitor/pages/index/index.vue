<!-- <template>
	<view class="content">
		<view class="header">
			<text class="title">睡眠监测数据</text>
		</view>
		
		<view class="charts-container">
			<view class="chart-item">
				<text class="chart-title">心率数据 (次/分)</text>
				<view class="chart-box">
					<view class="echarts" id="heartRateChart"></view>
				</view>
			</view>
			
			<view class="chart-item">
				<text class="chart-title">血氧数据 (%)</text>
				<view class="chart-box">
					<view class="echarts" id="oxygenChart"></view>
				</view>
			</view>
			
			<view class="chart-item">
				<text class="chart-title">温度数据 (°C)</text>
				<view class="chart-box">
					<view class="echarts" id="temperatureChart"></view>
				</view>
			</view>
			
			<view class="chart-item">
				<text class="chart-title">鼾声数据 (dB)</text>
				<view class="chart-box">
					<view class="echarts" id="snoreChart"></view>
				</view>
			</view>
		</view>
		
		<view class="recorder-section">
			<audio-recorder @recording-complete="handleRecordingComplete" />
		</view>
		
		<view class="nav-button" @click="goToConsult">
			<text>睡眠咨询</text>
		</view>
	</view>
</template>

<script>
	import * as echarts from 'echarts';
	import AudioRecorder from '@/components/audio-recorder/audio-recorder.vue';
	
	export default {
		components: {
			AudioRecorder
		},
		data() {
			return {
				charts: {},
				chartData: {
					heartRate: {
						times: [],
						values: []
					},
					oxygen: {
						times: [],
						values: []
					},
					temperature: {
						times: [],
						values: []
					},
					snore: {
						times: [],
						values: []
					}
				},
				lastRecording: null
			}
		},
		onLoad() {
			// 先加载数据
			this.loadData();
		},
		onReady() {
			// 确保DOM已经渲染完成后再初始化图表
			setTimeout(() => {
				this.initCharts();
				// 初始化后立即更新数据
				this.updateCharts();
			}, 300);
		},
		methods: {
			loadData() {
				// 生成更真实的模拟数据
				const generateData = (base, range, count) => {
					return Array.from({length: count}, () => 
						Math.round((base + (Math.random() - 0.5) * range) * 10) / 10
					);
				};
				
				const timePoints = Array.from({length: 24}, (_, i) => 
					`${String(i).padStart(2, '0')}:00`
				);
				
				// 更新数据
				this.chartData.heartRate = {
					times: timePoints,
					values: generateData(75, 10, 24) // 心率在65-85之间波动
				};
				
				this.chartData.oxygen = {
					times: timePoints,
					values: generateData(98, 2, 24) // 血氧在97-99之间波动
				};
				
				this.chartData.temperature = {
					times: timePoints,
					values: generateData(36.5, 0.5, 24) // 体温在36.2-36.7之间波动
				};
				
				this.chartData.snore = {
					times: timePoints,
					values: generateData(30, 15, 24) // 鼾声在22.5-37.5之间波动
				};
			},
			
			initCharts() {
				const chartConfig = {
					grid: {
						top: 40,
						right: 20,
						bottom: 40,
						left: 60,
						containLabel: true
					},
					tooltip: {
						trigger: 'axis',
						axisPointer: {
							type: 'cross',
							label: {
								backgroundColor: '#6a7985'
							}
						}
					},
					xAxis: {
						type: 'category',
						boundaryGap: false,
						data: [],
						axisLine: {
							lineStyle: {
								color: '#999'
							}
						},
						axisLabel: {
							color: '#666',
							rotate: 45
						}
					},
					yAxis: {
						type: 'value',
						axisLine: {
							show: true,
							lineStyle: {
								color: '#999'
							}
						},
						axisLabel: {
							color: '#666'
						},
						splitLine: {
							lineStyle: {
								type: 'dashed',
								color: '#ddd'
							}
						}
					},
					series: [{
						type: 'line',
						smooth: true,
						symbol: 'circle',
						symbolSize: 6,
						data: [],
						areaStyle: {
							opacity: 0.1
						},
						lineStyle: {
							width: 2
						}
					}]
				};
				
				// 初始化四个图表
				const initChart = (id, name, color) => {
					const chart = echarts.init(document.getElementById(id));
					chart.setOption({
						...chartConfig,
						series: [{
							...chartConfig.series[0],
							name: name,
							itemStyle: {
								color: color
							}
						}]
					});
					return chart;
				};
				
				this.charts.heartRate = initChart('heartRateChart', '心率', '#1890FF');
				this.charts.oxygen = initChart('oxygenChart', '血氧', '#91CB74');
				this.charts.temperature = initChart('temperatureChart', '温度', '#FAC858');
				this.charts.snore = initChart('snoreChart', '鼾声', '#EE6666');
				
				// 监听窗口大小变化，调整图表大小
				window.addEventListener('resize', this.resizeCharts);
			},
			
			updateCharts() {
				// 更新心率图表
				this.charts.heartRate.setOption({
					xAxis: {
						data: this.chartData.heartRate.times
					},
					series: [{
						data: this.chartData.heartRate.values
					}]
				});
				
				// 更新血氧图表
				this.charts.oxygen.setOption({
					xAxis: {
						data: this.chartData.oxygen.times
					},
					series: [{
						data: this.chartData.oxygen.values
					}]
				});
				
				// 更新温度图表
				this.charts.temperature.setOption({
					xAxis: {
						data: this.chartData.temperature.times
					},
					series: [{
						data: this.chartData.temperature.values
					}]
				});
				
				// 更新鼾声图表
				this.charts.snore.setOption({
					xAxis: {
						data: this.chartData.snore.times
					},
					series: [{
						data: this.chartData.snore.values
					}]
				});
			},
			
			resizeCharts() {
				Object.values(this.charts).forEach(chart => {
					chart && chart.resize();
				});
			},
			
			goToConsult() {
				uni.navigateTo({
					url: '/pages/consult/consult'
				});
			},
			
			handleRecordingComplete(recording) {
				console.log('录音完成:', recording);
				this.lastRecording = recording;
				
				// 这里可以添加录音完成后的处理逻辑
				// 例如：上传到服务器、分析音频等
			}
		},
		onUnload() {
			// 页面卸载时移除事件监听
			window.removeEventListener('resize', this.resizeCharts);
			// 销毁图表实例
			Object.values(this.charts).forEach(chart => {
				chart && chart.dispose();
			});
		}
	}
</script>

<style>
	.content {
		padding: 30rpx;
		min-height: 100vh;
		background-color: #f8f8f8;
		box-sizing: border-box;
		padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
	}
	
	.header {
		text-align: center;
		padding: 30rpx 0;
		margin-bottom: 20rpx;
	}
	
	.title {
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
	}
	
	.charts-container {
		display: flex;
		flex-direction: column;
		gap: 40rpx;
		margin-bottom: 40rpx;
	}
	
	.chart-item {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
		transition: transform 0.3s ease;
	}
	
	.chart-item:active {
		transform: scale(0.98);
	}
	
	.chart-title {
		font-size: 32rpx;
		color: #333;
		margin-bottom: 30rpx;
		font-weight: 500;
	}
	
	.chart-box {
		width: 100%;
		height: 50vw;
		max-height: 500rpx;
		min-height: 400rpx;
	}
	
	.echarts {
		width: 100%;
		height: 100%;
	}
	
	.recorder-section {
		margin: 40rpx 0;
		padding: 0 20rpx;
		margin-bottom: calc(40rpx + env(safe-area-inset-bottom));
	}
	
	.nav-button {
		position: fixed;
		bottom: calc(40rpx + env(safe-area-inset-bottom));
		left: 50%;
		transform: translateX(-50%);
		background: linear-gradient(135deg, #007AFF, #0056b3);
		color: #fff;
		padding: 24rpx 80rpx;
		border-radius: 50rpx;
		font-size: 34rpx;
		font-weight: 500;
		box-shadow: 0 6rpx 20rpx rgba(0,122,255,0.3);
		transition: all 0.3s ease;
		-webkit-tap-highlight-color: transparent;
	}
	
	.nav-button:active {
		transform: translateX(-50%) scale(0.95);
		box-shadow: 0 4rpx 12rpx rgba(0,122,255,0.2);
	}
	
	@media (prefers-color-scheme: dark) {
		.content {
			background-color: #1a1a1a;
		}
		
		.title {
			color: #fff;
		}
		
		.chart-item {
			background-color: #2c2c2c;
			box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.2);
		}
		
		.chart-title {
			color: #fff;
		}
	}
</style> -->

<template>
	<view class="content" :class="{ 'dark-theme': isDarkTheme }">
		<view class="page-header">
			<text class="page-title">睡眠监测数据</text>
			<view class="theme-switch" @tap="toggleTheme">
				<text class="theme-icon">{{ isDarkTheme ? '🌞' : '🌙' }}</text>
			</view>
		</view>
		
		<view class="charts-container">
			<view class="chart-item">
				<text class="chart-title">心率数据 (次/分)</text>
				<view class="chart-box">
					<view class="echarts" id="heartRateChart"></view>
				</view>
			</view>
			
			<view class="chart-item">
				<text class="chart-title">血氧数据 (%)</text>
				<view class="chart-box">
					<view class="echarts" id="oxygenChart"></view>
				</view>
			</view>
			
			<view class="chart-item">
				<text class="chart-title">温度数据 (°C)</text>
				<view class="chart-box">
					<view class="echarts" id="temperatureChart"></view>
				</view>
			</view>
			
			<view class="chart-item">
				<text class="chart-title">鼾声数据 (dB)</text>
				<view class="chart-box">
					<view class="echarts" id="snoreChart"></view>
				</view>
			</view>
		</view>
		
		<view class="recorder-section">
			<audio-recorder @recording-complete="handleRecordingComplete" />
		</view>
		
		<view class="nav-button" @click="goToConsult">
			<text>睡眠咨询</text>
		</view>
	</view>
</template>

<script>
	import * as echarts from 'echarts';
	import AudioRecorder from '@/components/audio-recorder/audio-recorder.vue';
	
	export default {
		components: {
			AudioRecorder
		},
		data() {
			return {
				isDarkTheme: false,
				charts: {},
				chartData: {
					heartRate: {
						times: [],
						values: []
					},
					oxygen: {
						times: [],
						values: []
					},
					temperature: {
						times: [],
						values: []
					},
					snore: {
						times: [],
						values: []
					}
				},
				lastRecording: null
			}
		},
		onLoad() {
			// 从本地存储读取主题设置
			const theme = uni.getStorageSync('theme');
			this.isDarkTheme = theme === 'dark';
			
			// 先加载数据
			this.loadData();
		},
		onReady() {
			// 确保DOM已经渲染完成后再初始化图表
			setTimeout(() => {
				this.initCharts();
				// 初始化后立即更新数据
				this.updateCharts();
			}, 300);
		},
		methods: {
			toggleTheme() {
				this.isDarkTheme = !this.isDarkTheme;
				uni.setStorageSync('theme', this.isDarkTheme ? 'dark' : 'light');
				this.updateChartsTheme();
			},
			
			updateChartsTheme() {
				const textColor = this.isDarkTheme ? '#fff' : '#333';
				const gridColor = this.isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
				const splitLineColor = this.isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
				
				Object.entries(this.charts).forEach(([type, chart]) => {
					if (!chart) return;
					
					chart.setOption({
						title: {
							textStyle: {
								color: textColor
							}
						},
						xAxis: {
							axisLine: {
								lineStyle: {
									color: gridColor
								}
							},
							axisLabel: {
								color: textColor
							}
						},
						yAxis: {
							axisLine: {
								lineStyle: {
									color: gridColor
								}
							},
							axisLabel: {
								color: textColor
							},
							splitLine: {
								lineStyle: {
									color: splitLineColor
								}
							}
						}
					});
				});
			},
			loadData() {
				// 生成更真实的模拟数据
				const generateData = (base, range, count) => {
					return Array.from({length: count}, () => 
						Math.round((base + (Math.random() - 0.5) * range) * 10) / 10
					);
				};
				
				const timePoints = Array.from({length: 24}, (_, i) => 
					`${String(i).padStart(2, '0')}:00`
				);
				
				// 更新数据
				this.chartData.heartRate = {
					times: timePoints,
					values: generateData(75, 10, 24) // 心率在65-85之间波动
				};
				
				this.chartData.oxygen = {
					times: timePoints,
					values: generateData(98, 2, 24) // 血氧在97-99之间波动
				};
				
				this.chartData.temperature = {
					times: timePoints,
					values: generateData(36.5, 0.5, 24) // 体温在36.2-36.7之间波动
				};
				
				this.chartData.snore = {
					times: timePoints,
					values: generateData(30, 15, 24) // 鼾声在22.5-37.5之间波动
				};
			},
			
			initCharts() {
				const chartConfig = {
					grid: {
						top: 40,
						right: 20,
						bottom: 40,
						left: 60,
						containLabel: true
					},
					tooltip: {
						trigger: 'axis',
						axisPointer: {
							type: 'cross',
							label: {
								backgroundColor: '#6a7985'
							}
						}
					},
					xAxis: {
						type: 'category',
						boundaryGap: false,
						data: [],
						axisLine: {
							lineStyle: {
								color: '#999'
							}
						},
						axisLabel: {
							color: '#666',
							rotate: 45
						}
					},
					yAxis: {
						type: 'value',
						axisLine: {
							show: true,
							lineStyle: {
								color: '#999'
							}
						},
						axisLabel: {
							color: '#666'
						},
						splitLine: {
							lineStyle: {
								type: 'dashed',
								color: '#ddd'
							}
						}
					},
					series: [{
						type: 'line',
						smooth: true,
						symbol: 'circle',
						symbolSize: 6,
						data: [],
						areaStyle: {
							opacity: 0.1
						},
						lineStyle: {
							width: 2
						}
					}]
				};
				
				// 初始化四个图表
				const initChart = (id, name, color) => {
					const chart = echarts.init(document.getElementById(id));
					chart.setOption({
						...chartConfig,
						series: [{
							...chartConfig.series[0],
							name: name,
							itemStyle: {
								color: color
							}
						}]
					});
					return chart;
				};
				
				this.charts.heartRate = initChart('heartRateChart', '心率', '#1890FF');
				this.charts.oxygen = initChart('oxygenChart', '血氧', '#91CB74');
				this.charts.temperature = initChart('temperatureChart', '温度', '#FAC858');
				this.charts.snore = initChart('snoreChart', '鼾声', '#EE6666');
				
				// 监听窗口大小变化，调整图表大小
				window.addEventListener('resize', this.resizeCharts);
			},
			
			updateCharts() {
				// 更新心率图表
				this.charts.heartRate.setOption({
					xAxis: {
						data: this.chartData.heartRate.times
					},
					series: [{
						data: this.chartData.heartRate.values
					}]
				});
				
				// 更新血氧图表
				this.charts.oxygen.setOption({
					xAxis: {
						data: this.chartData.oxygen.times
					},
					series: [{
						data: this.chartData.oxygen.values
					}]
				});
				
				// 更新温度图表
				this.charts.temperature.setOption({
					xAxis: {
						data: this.chartData.temperature.times
					},
					series: [{
						data: this.chartData.temperature.values
					}]
				});
				
				// 更新鼾声图表
				this.charts.snore.setOption({
					xAxis: {
						data: this.chartData.snore.times
					},
					series: [{
						data: this.chartData.snore.values
					}]
				});
			},
			
			resizeCharts() {
				Object.values(this.charts).forEach(chart => {
					chart && chart.resize();
				});
			},
			
			goToConsult() {
				uni.navigateTo({
					url: '/pages/consult/consult'
				});
			},
			
			handleRecordingComplete(recording) {
				console.log('录音完成:', recording);
				this.lastRecording = recording;
				
				// 这里可以添加录音完成后的处理逻辑
				// 例如：上传到服务器、分析音频等
			}
		},
		onUnload() {
			// 页面卸载时移除事件监听
			window.removeEventListener('resize', this.resizeCharts);
			// 销毁图表实例
			Object.values(this.charts).forEach(chart => {
				chart && chart.dispose();
			});
		}
	}
</script>

<style>
	.content {
		min-height: 100vh;
		background-color: #f5f5f5;
		transition: background-color 0.3s ease;
	}
	
	.dark-theme {
		background-color: #1a1a1a;
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #ffffff;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.dark-theme .page-header {
		background-color: #2c2c2c;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.2);
	}
	
	.page-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
	
	.dark-theme .page-title {
		color: #ffffff;
	}
	
	.theme-switch {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		border-radius: 50%;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}
	
	.dark-theme .theme-switch {
		background-color: #3a3a3a;
	}
	
	.theme-icon {
		font-size: 40rpx;
	}
	
	.chart-item {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.dark-theme .chart-item {
		background-color: #2c2c2c;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.chart-title {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 20rpx;
	}
	
	.dark-theme .chart-title {
		color: #ffffff;
	}
	
	.charts-container {
		display: flex;
		flex-direction: column;
		gap: 40rpx;
		margin-bottom: 40rpx;
	}
	
	.recorder-section {
		margin: 40rpx 0;
		padding: 0 20rpx;
		margin-bottom: calc(40rpx + env(safe-area-inset-bottom));
	}
	
	.nav-button {
		position: fixed;
		bottom: calc(40rpx + env(safe-area-inset-bottom));
		left: 50%;
		transform: translateX(-50%);
		background: linear-gradient(135deg, #007AFF, #0056b3);
		color: #fff;
		padding: 24rpx 80rpx;
		border-radius: 50rpx;
		font-size: 34rpx;
		font-weight: 500;
		box-shadow: 0 6rpx 20rpx rgba(0,122,255,0.3);
		transition: all 0.3s ease;
		-webkit-tap-highlight-color: transparent;
	}
	
	.nav-button:active {
		transform: translateX(-50%) scale(0.95);
		box-shadow: 0 4rpx 12rpx rgba(0,122,255,0.2);
	}
</style>
