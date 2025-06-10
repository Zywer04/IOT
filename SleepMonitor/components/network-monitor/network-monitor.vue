<template>
	<view class="network-monitor" :class="{ 'dark-theme': isDarkTheme }">
		<view class="monitor-card">
			<view class="monitor-header">
				<text class="monitor-title">网络监控</text>
				<text class="monitor-subtitle">云端分析数据</text>
			</view>
			
			<view class="monitor-controls">
				<!-- <view class="input-group">
					<view class="input-row">
						<input 
							class="ip-input" 
							type="text" 
							v-model="ipAddress" 
							placeholder="输入IP地址" 
							:disabled="isMonitoring"
							@input="validateIpAddress"
						/>
						<input 
							class="port-input" 
							type="number" 
							v-model="port" 
							placeholder="端口" 
							:disabled="isMonitoring"
							@input="validatePort"
						/>
					</view>
					<text v-if="ipError" class="error-text">{{ ipError }}</text>
					<text v-if="portError" class="error-text">{{ portError }}</text>
				</view> -->
				
				<view class="button-group">
					<button 
						class="action-button" 
						:class="{ 'monitoring': isMonitoring }"
						@click="toggleMonitoring"
						
					>
						{{ isMonitoring ? '停止监控' : '开始监控' }}
					</button>
					<button 
						class="action-button"
						@click="saveData"
						:disabled="collectedData.length === 0"
					>
						保存数据
					</button>
				</view>
			</view>
			
			<view class="monitor-status" v-if="isMonitoring">
				<view class="status-indicator" :class="{ 'active': isConnected }">
					<view class="status-dot"></view>
				</view>
				<text class="status-text">{{ statusText }}</text>
				<text class="last-update" v-if="lastUpdateTime">
					最后更新: {{ formatTime(lastUpdateTime) }}
				</text>
			</view>
			
			<view class="data-display" v-if="hasData">
				<scroll-view class="data-content" scroll-y>
					<view class="data-item" v-for="(item, index) in displayData" :key="index">
						<text class="data-time">{{ formatTime(item.timestamp) }}</text>
						<text class="data-value">{{ item.value }}</text>
					</view>
				</scroll-view>
			</view>
			
			<view class="monitor-tips">
				<text class="tip-text">• 确保设备接入云端</text>
				<text class="tip-text">• 数据将保存在本地存储中</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'NetworkMonitor',
	props: {
		isDarkTheme: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			ipAddress: '',
			port: '3000',
			ipError: '',
			portError: '',
			isMonitoring: false,
			isConnected: false,
			monitorTimer: null,
			monitorInterval: 1000*60*10, // 5秒更新一次
			lastUpdateTime: null,
			collectedData: [],
			maxDataPoints: 100,
			errorCount: 0,
			maxRetries: 3,
			chartData: {
				timePoints: [],
				heartRate: [],
				temperature: [],
				bloodOxygen: []
			}
		}
	},
	computed: {
		statusText() {
			if (!this.isMonitoring) return '未开始监控';
			return this.isConnected ? '已连接' : '连接中...';
		},
		hasData() {
			return this.collectedData.length > 0;
		},
		displayData() {
			// 只显示最新的20条数据
			return this.collectedData.slice(-20).reverse();
		},
		isValidInput() {
			return !this.ipError && !this.portError && 
				this.ipAddress.trim() !== '' && 
				this.port.trim() !== '';
		}
	},
	methods: {
		// validateIpAddress() {
		// 	const ip = this.ipAddress.trim();
		// 	if (!ip) {
		// 		this.ipError = '请输入IP地址';
		// 		return;
		// 	}
			
		// 	// IP地址格式验证
		// 	const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
		// 	if (!ipPattern.test(ip)) {
		// 		this.ipError = 'IP地址格式不正确';
		// 		return;
		// 	}
			
		// 	// 验证每个数字段是否在0-255范围内
		// 	const segments = ip.split('.');
		// 	const isValid = segments.every(segment => {
		// 		const num = parseInt(segment);
		// 		return num >= 0 && num <= 255;
		// 	});
			
		// 	if (!isValid) {
		// 		this.ipError = 'IP地址数值超出范围';
		// 		return;
		// 	}
			
		// 	this.ipError = '';
		// },
		
		// validatePort() {
		// 	const port = this.port.trim();
		// 	if (!port) {
		// 		this.portError = '请输入端口号';
		// 		return;
		// 	}
			
		// 	const portNum = parseInt(port);
		// 	if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
		// 		this.portError = '端口号必须在1-65535之间';
		// 		return;
		// 	}
			
		// 	this.portError = '';
		// },
		
		toggleMonitoring() {
			// if (!this.isValidInput) {
			// 	uni.showToast({
			// 		title: '请先输入正确的IP地址和端口',
			// 		icon: 'none',
			// 		duration: 2000
			// 	});
			// 	return;
			// }
			
			if (this.isMonitoring) {
				this.stopMonitoring();
			} else {
				this.startMonitoring();
			}
		},
		
		async startMonitoring() {
			this.isMonitoring = true;
			this.errorCount = 0;
			this.collectedData = [];
			
			// 立即执行一次数据获取
			await this.fetchData();
			
			// 设置定时器定期获取数据
			this.monitorTimer = setInterval(async () => {
				await this.fetchData();
			}, this.monitorInterval);
		},
		
		stopMonitoring() {
			this.isMonitoring = false;
			this.isConnected = false;
			if (this.monitorTimer) {
				clearInterval(this.monitorTimer);
				this.monitorTimer = null;
			}
		},
		
		async fetchData() {
			try {
				const url = `http://192.168.47.129:3000/db-get`;
				console.log('正在获取数据:', url);
				
				const response = await new Promise((resolve, reject) => {
					uni.request({
						url: url,
						method: 'GET',
						timeout: 5000,
						success: (res) => {
							if (res.statusCode === 200) {
								resolve(res);
							} else {
								reject(new Error(`HTTP错误: ${res.statusCode}`));
							}
						},
						fail: (err) => {
							console.error('请求失败:', err);
							reject(err);
						}
					});
				});
				
				// 处理API返回的数据
				const apiData = response.data.data;
				console.log('获取到的数据:', apiData);
				
				if (!Array.isArray(apiData)) {
					throw new Error('返回数据格式不正确');
				}
				
				this.processApiData(apiData);
				this.isConnected = true;
				this.errorCount = 0;
				this.lastUpdateTime = Date.now();
				
				// 触发数据更新事件
				this.$emit('data-updated', {
					...this.chartData,
					rawData: apiData
				});
				
			} catch (error) {
				console.error('获取数据失败:', error);
				this.isConnected = false;
				this.errorCount++;
				
				if (this.errorCount >= this.maxRetries) {
					uni.showToast({
						title: '连接失败，请检查网络',
						icon: 'none',
						duration: 2000
					});
					this.stopMonitoring();
				}
			}
		},
		
		processApiData(apiData) {
			// 清空现有数据
			this.chartData = {
				timePoints: [],
				heartRate: [],
				temperature: [],
				bloodOxygen: []
			};
			
			// 处理每条数据
			apiData.forEach(item => {
				try {
					// 解析时间字符串 (格式: "2025-06-05-20")
					const timeParts = item.time.split('-');
					if (timeParts.length !== 4) {
						console.warn('无效的时间格式:', item.time);
						return;
					}
					
					// 提取小时部分并格式化为 "HH:00"
					const hour = timeParts[3].padStart(2, '0');
					const timeStr = `${hour}:00`;
					
					this.chartData.timePoints.push(timeStr);
					
					// 添加各项数据，如果为0则使用null
					this.chartData.heartRate.push(item.hrate || null);
					this.chartData.temperature.push(item.temper || null);
					this.chartData.bloodOxygen.push(item.bo2 || null);
				} catch (error) {
					console.error('处理数据时出错:', error, item);
				}
			});
			
			// 更新收集的数据用于显示
			this.collectedData = apiData.map(item => {
				try {
					// 将时间字符串转换为时间戳
					const [year, month, day, hour] = item.time.split('-');
					const date = new Date(year, month - 1, day, hour);
					
					return {
						timestamp: date.getTime(),
						value: `心率: ${item.hrate || 'N/A'} | 血氧: ${item.bo2 || 'N/A'} | 温度: ${item.temper || 'N/A'}`
					};
				} catch (error) {
					console.error('转换时间戳时出错:', error, item);
					return {
						timestamp: Date.now(),
						value: '数据格式错误'
					};
				}
			});
			
			// 保持数据量在限制范围内
			if (this.collectedData.length > this.maxDataPoints) {
				this.collectedData = this.collectedData.slice(-this.maxDataPoints);
			}
			
			console.log('处理后的图表数据:', this.chartData);
		},
		
		async saveData() {
			if (!this.hasData) {
				uni.showToast({
					title: '没有数据可保存',
					icon: 'none'
				});
				return;
			}
			
			try {
				const fileName = `sleep_data_${new Date().getTime()}.json`;
				
				const saveData = {
					ipAddress: this.ipAddress,
					port: this.port,
					timestamp: Date.now(),
					chartData: this.chartData,
					rawData: this.collectedData
				};
				
				// 保存到本地存储
				const savedFiles = uni.getStorageSync('network_data_files') || [];
				savedFiles.push({
					fileName,
					timestamp: Date.now(),
					dataPoints: this.collectedData.length
				});
				uni.setStorageSync('network_data_files', savedFiles);
				
				// 保存数据文件
				// #ifdef APP-PLUS
				const filePath = `_doc/network_data/${fileName}`;
				await this.saveToFile(filePath, JSON.stringify(saveData, null, 2));
				// #endif
				
				// #ifdef H5
				// H5环境下下载文件
				const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = fileName;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
				// #endif
				
				uni.showToast({
					title: '数据已保存',
					icon: 'success'
				});
				
			} catch (error) {
				console.error('保存数据失败:', error);
				uni.showModal({
					title: '保存失败',
					content: '保存数据时出错，请重试',
					showCancel: false
				});
			}
		},
		
		async saveToFile(filePath, content) {
			return new Promise((resolve, reject) => {
				// 确保目录存在
				const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
				plus.io.resolveLocalFileSystemURL('_doc', (entry) => {
					entry.getDirectory('network_data', { create: true }, (dirEntry) => {
						// 创建文件
						dirEntry.getFile(filePath.substring(filePath.lastIndexOf('/') + 1), 
							{ create: true }, 
							(fileEntry) => {
								fileEntry.createWriter((writer) => {
									writer.onwrite = () => resolve();
									writer.onerror = (error) => reject(error);
									writer.write(new Blob([content], { type: 'application/json' }));
								}, reject);
							}, 
							reject
						);
					}, reject);
				}, reject);
			});
		},
		
		formatTime(timestamp) {
			const date = new Date(timestamp);
			return date.toLocaleTimeString('zh-CN', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			});
		}
	},
	beforeDestroy() {
		this.stopMonitoring();
	}
}
</script>

<style>
.network-monitor {
	padding: 20rpx;
}

.monitor-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

.dark-theme .monitor-card {
	background: #2c2c2c;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.2);
}

.monitor-header {
	margin-bottom: 30rpx;
}

.monitor-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.dark-theme .monitor-title {
	color: #fff;
}

.monitor-subtitle {
	font-size: 24rpx;
	color: #666;
}

.dark-theme .monitor-subtitle {
	color: #999;
}

.monitor-controls {
	margin-bottom: 30rpx;
}

.input-group {
	width: 100%;
	margin-bottom: 10px;
}

.input-row {
	display: flex;
	gap: 10px;
	margin-bottom: 5px;
}

.ip-input {
	flex: 3;
	height: 40px;
	padding: 0 10px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
}

.port-input {
	flex: 1;
	height: 40px;
	padding: 0 10px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
}

.error-text {
	color: #ff4d4f;
	font-size: 12px;
	margin-top: 2px;
}

.dark-theme .ip-input,
.dark-theme .port-input {
	background-color: #2c2c2c;
	border-color: #444;
	color: #fff;
}

.dark-theme .ip-input:disabled,
.dark-theme .port-input:disabled {
	background-color: #1c1c1c;
	color: #666;
}

.button-group {
	display: flex;
	gap: 10px;
	margin-top: 10px;
}

.action-button {
	flex: 1;
	height: 40px;
	line-height: 40px;
	text-align: center;
	background-color: #007AFF;
	color: #fff;
	border-radius: 4px;
	font-size: 14px;
}

.action-button:disabled {
	background-color: #ccc;
	color: #666;
}

.dark-theme .action-button {
	background-color: #0A84FF;
}

.dark-theme .action-button:disabled {
	background-color: #444;
	color: #666;
}

.monitor-status {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
	padding: 20rpx 0;
	border-top: 2rpx solid #f5f5f5;
	border-bottom: 2rpx solid #f5f5f5;
}

.dark-theme .monitor-status {
	border-color: #333;
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
}

.status-indicator.active {
	background: #52c41a;
	animation: pulse 1.5s infinite;
}

.status-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 6rpx;
	background: #fff;
	opacity: 0;
}

.status-indicator.active .status-dot {
	opacity: 1;
}

.status-text {
	font-size: 28rpx;
	color: #666;
	flex: 1;
}

.dark-theme .status-text {
	color: #999;
}

.last-update {
	font-size: 24rpx;
	color: #999;
}

.data-display {
	height: 400rpx;
	margin-bottom: 30rpx;
	border: 2rpx solid #f5f5f5;
	border-radius: 12rpx;
	overflow: hidden;
}

.dark-theme .data-display {
	border-color: #333;
}

.data-content {
	height: 100%;
	padding: 20rpx;
}

.data-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 2rpx solid #f5f5f5;
}

.dark-theme .data-item {
	border-color: #333;
}

.data-time {
	font-size: 24rpx;
	color: #999;
}

.data-value {
	font-size: 28rpx;
	color: #333;
	font-family: monospace;
}

.dark-theme .data-value {
	color: #fff;
}

.monitor-tips {
	margin-top: 20rpx;
}

.tip-text {
	font-size: 24rpx;
	color: #999;
	display: block;
	margin-bottom: 8rpx;
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
</style> 