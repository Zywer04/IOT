<template>
	<view class="recorder-card" :class="{ 'dark-theme': isDarkTheme }">
		<view class="recorder-header">
			<text class="recorder-title">睡眠录音</text>
		</view>
		
		<view class="recorder-controls">
			<view class="recorder-status">
				<view class="status-indicator" :style="{ backgroundColor: statusColor }">
					<view class="status-dot" :class="{ 'recording': isRecording, 'waiting': isWaitingForData }"></view>
				</view>
				<text class="status-text">{{ getStatusText() }}</text>
			</view>
			
			<view class="recorder-button" 
				:class="{ 'recording': isRecording }" 
				@click="toggleRecording"
			>
				<view class="button-inner">
					<view class="button-icon" :class="{ 'recording': isRecording }">
						<view class="icon-circle"></view>
					</view>
				</view>
			</view>
			
			<view class="recorder-info" v-if="isRecording">
				<text class="time-display">{{ formatTime(recordingDuration) }}</text>
			</view>
		</view>
		
		<view class="recorder-tips">
			<text class="tip-text">• 最长记录时间：10小时</text>
			<text class="tip-text">• 录音完毕后进行鼾声分析</text>
			<text class="tip-text">• 点击按钮开始/停止记录</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'AudioRecorder',
		props: {
			isDarkTheme: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isRecording: false,
				recordingDuration: 0, // 记录时长（秒）
				durationTimer: null, // 用于更新时长的定时器
				startTime: null, // 记录开始时间
				maxDuration: 10 * 60 * 60 * 1000, // 最大记录时长10小时
				statusText: '点击开始记录',
				statusColor: '#1890ff',
				isWaitingForData: false // 是否正在等待数据
			}
		},
		methods: {
			toggleRecording() {
				if (this.isRecording) {
					this.stopRecording();
				} else {
							this.startRecording();
				}
			},
			
			startRecording() {
				this.isRecording = true;
				this.recordingDuration = 0;
				this.startTime = Date.now();
				
				// 启动定时器更新时长
				this.durationTimer = setInterval(() => {
					this.recordingDuration = Math.floor((Date.now() - this.startTime) / 1000);
				}, 1000);
				
				// 录音状态
				this.statusText = '正在记录';
				this.statusColor = '#ff4d4f';
			},
			
			async stopRecording() {
				if (this.isRecording) {
					this.isRecording = false;
					clearInterval(this.durationTimer);
					
					// 计算最终时长
					const endTime = Date.now();
					this.recordingDuration = Math.floor((endTime - this.startTime) / 1000);
					
					// 更新状态为等待数据
					this.isWaitingForData = true;
					this.statusText = '正在获取数据...';
					this.statusColor = '#faad14';
					
					// 延迟5秒后获取数据
					setTimeout(async () => {
						try {
							// 从局域网获取鼾声数据
							const response = await uni.request({
								url: 'http://192.168.207.129:3000/productdata',
								method: 'GET',
								timeout: 5000 // 5秒超时
							});
							
							if (response.statusCode === 200 && response.data) {
								// 解析返回的数据格式 {"inputNumber":"1"}
								const snoreCount = parseInt(response.data.inputNumber) || 0;
								
								// 生成完整的录音数据
								const snoreData = {
									count: snoreCount,
									averageIntensity: Math.floor(Math.random() * 20) + 40, // 40-60分贝
									duration: this.recordingDuration
								};
								
								// 发送录音完成事件
								this.$emit('recording-complete', {
									timestamp: this.startTime,
									duration: this.recordingDuration,
									snoreData
								});
								
								// 显示成功提示
								uni.showToast({
									title: `检测到${snoreCount}次鼾声`,
									icon: 'success',
									duration: 2000
								});
							} else {
								throw new Error('获取数据失败');
							}
						} catch (error) {
							console.error('获取鼾声数据失败:', error);
							// 获取失败时使用默认数据
							const snoreData = {
								count: 0,
								averageIntensity: 0,
								duration: this.recordingDuration
							};
							
							this.$emit('recording-complete', {
								timestamp: this.startTime,
								duration: this.recordingDuration,
								snoreData
							});
							
							uni.showToast({
								title: '获取数据失败',
								icon: 'none',
								duration: 2000
							});
						} finally {
							// 重置状态
							this.isWaitingForData = false;
							this.statusText = '点击开始记录';
							this.statusColor = '#1890ff';
							this.startTime = null;
						}
					}, 5000);
				}
			},
			
			formatTime(seconds) {
				const hours = Math.floor(seconds / 3600);
				const minutes = Math.floor((seconds % 3600) / 60);
				const secs = seconds % 60;
				
				if (hours > 0) {
					return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
				}
				return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
			},
			
			// 格式化状态文本
			getStatusText() {
				if (this.isWaitingForData) {
					return '正在获取数据...';
				}
				return this.isRecording ? '正在记录' : '点击开始记录';
			}
		},
		beforeDestroy() {
			// 组件销毁前清理定时器
			if (this.durationTimer) {
				clearInterval(this.durationTimer);
			}
		}
	}
</script>

<style>
	.recorder-card {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
		transition: all 0.3s ease;
		width: 100%;
		box-sizing: border-box;
	}
	
	.recorder-card.dark-theme {
		background: #2c2c2c;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.2);
	}
	
	.recorder-header {
		margin-bottom: 30rpx;
	}
	
	.recorder-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
		transition: color 0.3s ease;
	}
	
	.dark-theme .recorder-title {
		color: #fff;
	}
	
	.recorder-subtitle {
		font-size: 24rpx;
		color: #666;
		transition: color 0.3s ease;
	}
	
	.dark-theme .recorder-subtitle {
		color: #999;
	}
	
	.recorder-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 30rpx;
		padding: 20rpx 0;
		border-top: 2rpx solid #f5f5f5;
		border-bottom: 2rpx solid #f5f5f5;
		transition: border-color 0.3s ease;
	}
	
	.dark-theme .recorder-controls {
		border-color: #333;
	}
	
	.recorder-status {
		display: flex;
		align-items: center;
		flex: 1;
	}
	
	.status-indicator {
		width: 24rpx;
		height: 24rpx;
		border-radius: 12rpx;
		background: #f5f5f5;
		margin-right: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}
	
	.status-indicator.recording {
		background: #ff4d4f;
		animation: pulse 1.5s infinite;
	}
	
	.status-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #ffffff;
		transition: all 0.3s ease;
	}
	
	.status-dot.recording {
		animation: pulse 1s infinite;
	}
	
	.status-dot.waiting {
		animation: rotate 1s infinite linear;
	}
	
	.status-text {
		font-size: 28rpx;
		color: #666;
		transition: color 0.3s ease;
	}
	
	.dark-theme .status-text {
		color: #999;
	}
	
	.recorder-button {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		background: #f5f5f5;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		margin: 0 40rpx;
	}
	
	.dark-theme .recorder-button {
		background: #333;
	}
	
	.button-inner {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50rpx;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}
	
	.dark-theme .button-inner {
		background: #2c2c2c;
	}
	
	.button-icon {
		width: 40rpx;
		height: 40rpx;
		border-radius: 20rpx;
		background: #ff4d4f;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.button-icon.recording {
		width: 32rpx;
		height: 32rpx;
		border-radius: 6rpx;
	}
	
	.icon-circle {
		width: 24rpx;
		height: 24rpx;
		border-radius: 12rpx;
		background: #fff;
		transition: all 0.3s ease;
	}
	
	.button-icon.recording .icon-circle {
		width: 16rpx;
		height: 16rpx;
		border-radius: 2rpx;
	}
	
	.recorder-info {
		flex: 1;
		text-align: right;
	}
	
	.time-display {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
		transition: color 0.3s ease;
	}
	
	.dark-theme .time-display {
		color: #fff;
	}
	
	.recorder-tips {
		margin-top: 20rpx;
	}
	
	.tip-text {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin-bottom: 8rpx;
		transition: color 0.3s ease;
	}
	
	.dark-theme .tip-text {
		color: #666;
	}
	
	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.8;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	
	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style> 