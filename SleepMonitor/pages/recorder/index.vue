<template>
	<view class="recorder-container" :class="{ 'dark-theme': isDarkTheme }">
		<view class="recorder-header">
			<text class="recorder-title">睡眠录音</text>
			<view class="header-actions">
				<button class="action-button" @tap="toggleTheme">
					{{ isDarkTheme ? '🌙' : '☀️' }}
				</button>
			</view>
		</view>
		
		<view class="recorder-content">
			<!-- 鼾声数据图表 -->
			<view class="snore-chart-section">
				<view class="chart-header">
					<text class="chart-title">鼾声数据</text>
					<view class="chart-actions">
						<button class="refresh-button" @tap="refreshSnoreData">
							<text class="refresh-icon">🔄</text>
						</button>
					</view>
				</view>
				<view class="chart-container">
					<qiun-data-charts 
						type="line"
						:opts="snoreChartOpts"
						:chartData="snoreChartData"
						:ontouch="true"
						:canvas2d="true"
						:enableScroll="true"
					/>
				</view>
			</view>
			
			<!-- 录音组件 -->
			<view class="recorder-section">
				<audio-recorder 
					@recording-complete="handleRecordingComplete" 
					@recording-error="handleRecordingError"
					:isDarkTheme="isDarkTheme"
				/>
			</view>
			
			<!-- 录音历史 -->
			<view class="history-section">
				<view class="section-header">
					<text class="section-title">记录历史</text>
					<text class="section-subtitle">最近{{ maxDisplayRecords }}次记录</text>
				</view>
				
				<view class="recording-list" v-if="recordings.length > 0">
					<view 
						class="recording-item"
						v-for="(recording, index) in recordings.slice(0, maxDisplayRecords)"
						:key="recording.timestamp"
					>
						<view class="recording-info">
							<view class="recording-header">
								<text class="recording-date">{{ formatRecordingInfo(recording).date }}</text>
								<view class="recording-actions">
									<view class="action-button delete" @tap="deleteRecording(index)">
										<text class="action-icon">🗑️</text>
									</view>
								</view>
							</view>
							<view class="recording-details">
								<view class="detail-item">
									<text class="detail-label">记录时长</text>
									<text class="detail-value">{{ formatRecordingInfo(recording).duration }}</text>
								</view>
								<view class="detail-item">
									<text class="detail-label">鼾声统计</text>
									<text class="detail-value">{{ formatRecordingInfo(recording).snoreInfo }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
				<view class="empty-state" v-else>
					<text class="empty-text">暂无记录</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import AudioRecorder from '@/components/audio-recorder/audio-recorder.vue';
	
	export default {
		components: {
			AudioRecorder
		},
		data() {
			return {
				isDarkTheme: false,
				recordings: [],
				audioContext: null,
				maxDisplayRecords: 5,
				mockData: {
					snoreFrequency: {
						min: 2,
						max: 8
					},
					snoreIntensity: {
						min: 45,
						max: 75
					},
					snoreDuration: {
						min: 1,
						max: 5
					}
				},
				snoreChartData: {
					categories: [],
					series: [{
						name: "鼾声",
						data: []
					}]
				},
				snoreChartOpts: {
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
				allSnoreData: []
			}
		},
		onLoad() {
			// 从本地存储读取主题设置
			const theme = uni.getStorageSync('theme');
			this.isDarkTheme = theme === 'dark';
			
			// 初始化音频上下文
			this.audioContext = uni.createInnerAudioContext();
			// 加载历史录音
			this.loadRecordings();
			
			// 初始化图表数据
			this.initSnoreChartData();
		},
		methods: {
			// 加载录音记录
			loadRecordings() {
				try {
					const savedRecordings = uni.getStorageSync('sleep_recordings');
					if (savedRecordings) {
						this.recordings = savedRecordings;
					}
				} catch (error) {
					console.error('加载录音记录失败:', error);
				}
			},
			
			// 保存录音记录
			saveRecordings() {
				try {
					uni.setStorageSync('sleep_recordings', this.recordings);
				} catch (error) {
					console.error('保存录音记录失败:', error);
					uni.showToast({
						title: '保存记录失败',
						icon: 'none'
					});
				}
			},
			
			// 处理录音完成事件
			handleRecordingComplete(recording) {
				// 添加新记录到列表开头
				this.recordings.unshift({
					timestamp: recording.timestamp,
					duration: recording.duration,
					snoreData: recording.snoreData
				});
				
				// 保持最多显示 maxDisplayRecords 条记录
				if (this.recordings.length > this.maxDisplayRecords) {
					this.recordings = this.recordings.slice(0, this.maxDisplayRecords);
				}
				
				// 保存到本地存储
				this.saveRecordings();
				
				// 更新图表数据
				this.updateSnoreChartData(recording);
				
				uni.showToast({
					title: '记录已保存',
					icon: 'success',
					duration: 2000
				});
			},
			
			// 处理录音错误
			handleRecordingError(error) {
				console.error('录音错误：', error);
				uni.showToast({
					title: '录音失败：' + error.message,
					icon: 'error'
				});
			},
			
			// 生成模拟的鼾声数据
			generateMockSnoreData(duration) {
				const minutes = duration / 60;
				const snoreCount = Math.floor(minutes * (Math.random() * (this.mockData.snoreFrequency.max - this.mockData.snoreFrequency.min) + this.mockData.snoreFrequency.min));
				
				const snoreEvents = [];
				let totalIntensity = 0;
				
				for (let i = 0; i < snoreCount; i++) {
					const intensity = Math.random() * (this.mockData.snoreIntensity.max - this.mockData.snoreIntensity.min) + this.mockData.snoreIntensity.min;
					const snoreDuration = Math.random() * (this.mockData.snoreDuration.max - this.mockData.snoreDuration.min) + this.mockData.snoreDuration.min;
					const time = Math.random() * duration;
					
					snoreEvents.push({
						time,
						intensity,
						duration: snoreDuration
					});
					
					totalIntensity += intensity;
				}
				
				return {
					count: snoreCount,
					details: snoreEvents,
					averageIntensity: snoreCount > 0 ? totalIntensity / snoreCount : 0
				};
			},
			
			// 格式化时间
			formatTime(seconds) {
				const hours = Math.floor(seconds / 3600);
				const minutes = Math.floor((seconds % 3600) / 60);
				const remainingSeconds = Math.floor(seconds % 60);
				
				if (hours > 0) {
					return `${hours}小时${minutes}分${remainingSeconds}秒`;
				} else if (minutes > 0) {
					return `${minutes}分${remainingSeconds}秒`;
				} else {
					return `${remainingSeconds}秒`;
				}
			},
			
			// 格式化日期
			formatDate(timestamp) {
				const date = new Date(timestamp);
				const month = date.getMonth() + 1;
				const day = date.getDate();
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				return `${month}月${day}日 ${hours}:${minutes}`;
			},
			
			// 格式化录音信息
			formatRecordingInfo(recording) {
				const date = this.formatDate(recording.timestamp);
				const duration = this.formatTime(recording.duration);
				const snoreCount = recording.snoreData?.count || 0;
				const avgIntensity = recording.snoreData?.averageIntensity.toFixed(1) || 0;
				
				return {
					date,
					duration,
					snoreInfo: `${snoreCount}次 (平均${avgIntensity}分贝)`
				};
			},
			
			// 播放录音
			playRecording(recording) {
				if (this.audioContext) {
					this.audioContext.stop();
					this.audioContext.src = recording.tempFilePath;
					this.audioContext.play();
				}
			},
			
			// 删除录音
			deleteRecording(index) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这条记录吗？',
					success: (res) => {
						if (res.confirm) {
									// 从列表中移除
									this.recordings.splice(index, 1);
									// 更新存储
									this.saveRecordings();
						}
					}
				});
			},
			
			// 切换主题
			toggleTheme() {
				this.isDarkTheme = !this.isDarkTheme;
				uni.setStorageSync('theme', this.isDarkTheme ? 'dark' : 'light');
				
				// 更新图表主题
				this.updateChartOptions();
			},
			
			initSnoreChartData() {
				// 生成24小时的时间点
				const timePoints = Array.from({length: 24}, (_, i) => {
					return `${i.toString().padStart(2, '0')}:00`;
				});
				
				// 生成模拟数据
				const snoreData = Array.from({length: 24}, () => {
					return Math.floor(Math.random() * 100);
				});
				
				// 保存完整数据
				this.allSnoreData = snoreData;
				
				// 设置完整的数据集
				this.snoreChartData = {
					categories: timePoints,
					series: [{
						name: "鼾声",
						data: snoreData,
						type: 'line',
						style: 'curve',
						color: '#1890FF'
					}]
				};
				
				// 更新图表配置
				this.updateChartOptions();
			},
			
			updateChartOptions() {
				const options = {
					...this.snoreChartOpts,
					enableScroll: true,
					xAxis: {
						...this.snoreChartOpts.xAxis,
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
						min: 0,
						max: 100,
						format: (val) => {
							return val.toFixed(0);
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
				
				this.snoreChartOpts = options;
			},
			
			refreshSnoreData() {
				// 重新生成数据
				this.initSnoreChartData();
				
				uni.showToast({
					title: '数据已更新',
					icon: 'none',
					duration: 2000
				});
			},
			
			// 更新鼾声图表数据
			updateSnoreChartData(recording) {
				// 获取当前时间点
				const now = new Date();
				const hour = now.getHours();
				
				// 更新对应时间点的数据
				if (this.snoreChartData.series[0].data[hour] !== undefined) {
					this.snoreChartData.series[0].data[hour] = recording.snoreData.averageIntensity;
				}
				
				// 刷新图表
				this.refreshSnoreData();
			}
		},
		onUnload() {
			// 停止播放
			if (this.audioContext) {
				this.audioContext.stop();
				this.audioContext.destroy();
			}
		}
	}
</script>

<style>
	.recorder-container {
		min-height: 100vh;
		background-color: #f5f5f5;
		transition: background-color 0.3s ease;
	}
	
	.dark-theme {
		background-color: #1a1a1a;
	}
	
	.recorder-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #ffffff;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.dark-theme .recorder-header {
		background-color: #2c2c2c;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.2);
	}
	
	.recorder-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
	
	.dark-theme .recorder-title {
		color: #ffffff;
	}
	
	.header-actions {
		display: flex;
		gap: 10rpx;
	}
	
	.action-button {
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
	
	.dark-theme .action-button {
		background-color: #3a3a3a;
	}
	
	.recorder-content {
		display: flex;
		flex-direction: column;
		margin-bottom: 30rpx;
	}
	
	.snore-chart-section {
		margin: 20rpx;
		background-color: #fff;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}
	
	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx;
		border-bottom: 1px solid #eee;
	}
	
	.chart-title {
		font-size: 28rpx;
		font-weight: 500;
		color: #333;
	}
	
	.chart-actions {
		display: flex;
		gap: 10rpx;
	}
	
	.refresh-button {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0;
	}
	
	.refresh-icon {
		font-size: 32rpx;
	}
	
	.chart-container {
		width: 100%;
		height: 400rpx;
		padding: 20rpx;
	}
	
	.dark-theme .snore-chart-section {
		background-color: #1c1c1c;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.2);
	}
	
	.dark-theme .chart-header {
		border-bottom-color: #333;
	}
	
	.dark-theme .chart-title {
		color: #fff;
	}
	
	.dark-theme .refresh-icon {
		color: #fff;
	}
	
	.recorder-section {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
		width: auto;
		display: inline-block;
	}
	
	.recorder-section :deep(.audio-recorder) {
		width: 100%;
		display: inline-block;
	}
	
	.recorder-section :deep(.recorder-container) {
		width: 100%;
		display: inline-block;
		background-color: #f5f5f5;
		border-radius: 12rpx;
		padding: 20rpx;
	}
	
	.dark-theme .recorder-section :deep(.recorder-container) {
		background-color: #2c2c2c;
	}
	
	.dark-theme .recorder-section {
		background-color: #1c1c1c;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.history-section {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.dark-theme .history-section {
		background-color: #2c2c2c;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}
	
	.section-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}
	
	.dark-theme .section-title {
		color: #fff;
	}
	
	.section-subtitle {
		font-size: 24rpx;
		color: #999;
	}
	
	.dark-theme .section-subtitle {
		color: #666;
	}
	
	.recording-list {
		display: flex;
		flex-direction: column;
		margin-bottom: 20rpx;
	}
	
	.recording-item {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.dark-theme .recording-item {
		background-color: #2c2c2c;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.recording-info {
		flex: 1;
	}
	
	.recording-header {
		margin-bottom: 16rpx;
	}
	
	.recording-date {
		font-size: 28rpx;
		color: #333;
		font-weight: bold;
	}
	
	.dark-theme .recording-date {
		color: #ffffff;
	}
	
	.recording-details {
		display: flex;
		flex-direction: column;
		margin-bottom: 12rpx;
	}
	
	.detail-item {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
	}
	
	.detail-label {
		font-size: 24rpx;
		color: #666;
	}
	
	.dark-theme .detail-label {
		color: #999;
	}
	
	.detail-value {
		font-size: 24rpx;
		color: #333;
	}
	
	.dark-theme .detail-value {
		color: #ffffff;
	}
	
	.empty-state {
		padding: 60rpx 0;
		text-align: center;
	}
	
	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
	
	.dark-theme .empty-text {
		color: #666;
	}
	
	.recording-actions {
		display: flex;
		gap: 10rpx;
	}
	
	.action-button {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 30rpx;
		background-color: #f5f5f5;
		transition: all 0.3s ease;
	}
	
	.action-button.delete {
		background-color: #fff2f0;
	}
	
	.action-button.delete:active {
		background-color: #ffccc7;
	}
	
	.dark-theme .action-button {
		background-color: #2c2c2c;
	}
	
	.dark-theme .action-button.delete {
		background-color: #3a1a1a;
	}
	
	.dark-theme .action-button.delete:active {
		background-color: #4a2a2a;
	}
	
	.action-icon {
		font-size: 32rpx;
	}
</style> 