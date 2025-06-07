<template>
	<view class="consult-container":class="{ 'dark-theme': isDarkTheme }">
		<view class="page-header">
			<text class="page-title">睡眠咨询</text>
			<view class="theme-switch" @tap="toggleTheme">
				<text class="theme-icon">{{ isDarkTheme ? '🌞' : '🌙' }}</text>
			</view>
		</view>
		<view class="chat-container">
			<scroll-view class="chat-scroll" scroll-y="true" :scroll-top="scrollTop" @scrolltoupper="loadMoreMessages">
				<view class="message-list">
					<view v-for="(message, index) in messages" :key="index" 
						:class="['message-item', message.role === 'user' ? 'user-message' : 'ai-message']">
						<view class="message-content">
							<text>{{ message.content }}</text>
						</view>
						<text class="message-time">{{ message.time }}</text>
					</view>
					<view v-if="isLoading" class="message-item ai-message loading-message">
						<view class="message-content loading-content">
							<view class="typing-indicator">
								<span class="dot"></span>
								<span class="dot"></span>
								<span class="dot"></span>
							</view>
						</view>
						<text class="message-time">{{ formatTime(new Date()) }}</text>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<view class="input-container">
			<input class="message-input" 
				v-model="inputMessage" 
				placeholder="请输入您的睡眠问题..." 
				@confirm="sendMessage"
				:disabled="isLoading"/>
			<button class="send-button" 
				@click="sendMessage" 
				:disabled="isLoading || !inputMessage.trim()">
				<text v-if="isLoading" class="loading-icon"></text>
				<text v-else>发送</text>
			</button>
		</view>
	</view>
</template>

<script>
	const API_KEY = "sk-dec348849b6f408c9fb451d14ec996ad";
	const API_URL = "https://api.deepseek.com/v1/chat/completions";
	
	export default {
		data() {
			return {
				messages: [],
				inputMessage: '',
				isLoading: false,
				scrollTop: 0,
				isDarkTheme: false,
				systemPrompt: `你是一个专业的睡眠顾问，具有丰富的睡眠医学知识。你的主要职责是：
1. 解答用户关于睡眠的问题
2. 提供改善睡眠质量的建议
3. 解释睡眠相关的生理现象
4. 在必要时建议用户就医

请用专业但易懂的语言回答，并注意：
- 保持友好和同理心
- 不要给出具体的医疗诊断
- 对于严重问题，建议及时就医
- 回答要简洁明了，突出重点
- 回答时不要用markdown格式来编辑字体加粗和标题等级,请用纯文本描述`
			}
		},
		onLoad() {
			// 从本地存储中读取主题设置
			const savedTheme = uni.getStorageSync('theme');
			this.isDarkTheme = savedTheme === 'dark';
			
			// 添加欢迎消息
			this.messages.push({
				role: 'assistant',
				content: '您好！我是您的AI睡眠顾问，请问有什么可以帮助您的吗？',
				time: this.formatTime(new Date())
			});
		},
		methods: {
			async sendMessage() {
				if (!this.inputMessage.trim() || this.isLoading) return;
				
				// 添加用户消息
				const userMessage = this.inputMessage.trim();
				this.messages.push({
					role: 'user',
					content: userMessage,
					time: this.formatTime(new Date())
				});
				
				this.inputMessage = '';
				this.isLoading = true;
				this.scrollToBottom();
				
				try {
					const response = await this.callAIAPI(userMessage);
					
					// 添加AI回复
					this.messages.push({
						role: 'assistant',
						content: response,
						time: this.formatTime(new Date())
					});
				} catch (error) {
					console.error('API调用错误:', error);
					
					// 根据错误类型显示不同的错误信息
					let errorMessage = '抱歉，我遇到了一些问题，请稍后再试。';
					if (error.status === 401) {
						errorMessage = 'API密钥无效，请联系管理员。';
					} else if (error.status === 402) {
						errorMessage = '服务暂时不可用，请联系管理员充值或更换API密钥。';
						// 显示一个更详细的提示框
						setTimeout(() => {
							uni.showModal({
								title: '服务提示',
								content: '当前API账户余额不足，无法继续提供服务。\n\n请联系管理员：\n1. 为当前账户充值\n2. 更换新的API密钥\n3. 使用其他AI服务提供商',
								showCancel: false,
								confirmText: '我知道了'
							});
						}, 500);
					} else if (error.status === 429) {
						errorMessage = '请求过于频繁，请稍后再试。';
					} else if (error.status === 500) {
						errorMessage = '服务器错误，请稍后再试。';
					}
					
					this.messages.push({
						role: 'assistant',
						content: errorMessage,
						time: this.formatTime(new Date())
					});
				} finally {
					this.isLoading = false;
					this.scrollToBottom();
				}
			},
			
			async callAIAPI(message) {
				if (!API_KEY) {
					throw new Error('API密钥未配置');
				}
				
				const response = await uni.request({
					url: API_URL,
					method: 'POST',
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${API_KEY}`
					},
					data: {
						model: 'deepseek-chat',
						messages: [
							{
								role: 'system',
								content: this.systemPrompt
							},
							...this.messages.map(msg => ({
								role: msg.role,
								content: msg.content
							})),
							{
								role: 'user',
								content: message
							}
						],
						temperature: 0.7,
						max_tokens: 1000
					}
				});
				
				if (response.statusCode !== 200) {
					throw {
						status: response.statusCode,
						message: response.data.error?.message || '请求失败'
					};
				}
				
				return response.data.choices[0].message.content.trim();
			},
			
			formatTime(date) {
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				return `${hours}:${minutes}`;
			},
			
			scrollToBottom() {
				setTimeout(() => {
					this.scrollTop = 9999999;
				}, 100);
			},
			
			loadMoreMessages() {
				// 实现加载更多历史消息的逻辑
				console.log('加载更多消息');
			},

			toggleTheme() {
				this.isDarkTheme = !this.isDarkTheme;
				uni.setStorageSync('theme', this.isDarkTheme ? 'dark' : 'light');
			}
		}
	}
</script>

<style>
	.consult-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f5f5f5;
		transition: background-color 0.3s ease;
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #ffffff;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.page-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
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
	
	.theme-icon {
		font-size: 40rpx;
	}
	
	/* 深色模式样式 */
	.consult-container.dark-theme {
		background-color: #1a1a1a;
	}
	
	.dark-theme .page-header {
		background-color: #2c2c2c;
	}
	
	.dark-theme .page-title {
		color: #ffffff;
	}
	
	.dark-theme .theme-switch {
		background-color: #3a3a3a;
	}
	
	.dark-theme .message-time {
		color: #888;
	}
	
	.dark-theme .user-message .message-content {
		background-color: #0A84FF;
		color: #ffffff;
	}
	
	.dark-theme .ai-message .message-content {
		background-color: #2c2c2c;
		color: #ffffff;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.2);
	}
	
	.dark-theme .input-container {
		background-color: #2c2c2c;
		border-top: 1rpx solid #3a3a3a;
	}
	
	.dark-theme .message-input {
		background-color: #3a3a3a;
		color: #ffffff;
	}
	
	.dark-theme .message-input::placeholder {
		color: #888;
	}
	
	.dark-theme .send-button {
		background-color: #0A84FF;
	}
	
	.dark-theme .send-button[disabled] {
		background-color: #4a4a4a;
	}
	
	.dark-theme .loading-content {
		background-color: #2c2c2c !important;
	}
	
	.dark-theme .typing-indicator .dot {
		background-color: #888;
	}
	
	.dark-theme .typing-indicator .dot:nth-child(1),
	.dark-theme .typing-indicator .dot:nth-child(2),
	.dark-theme .typing-indicator .dot:nth-child(3) {
		background-color: #0A84FF;
	}
	
	.chat-container {
		flex: 1;
		padding: 20rpx;
		overflow: hidden;
	}
	
	.chat-scroll {
		height: 100%;
	}
	
	.message-list {
		padding: 20rpx 0;
	}
	
	.message-item {
		margin-bottom: 30rpx;
		display: flex;
		flex-direction: column;
	}
	
	.user-message {
		align-items: flex-end;
	}
	
	.ai-message {
		align-items: flex-start;
	}
	
	.message-content {
		max-width: 70%;
		padding: 20rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
		line-height: 1.5;
		word-break: break-all;
		min-height: 40rpx;
		display: flex;
		align-items: center;
		position: relative;
	}
	
	.message-time {
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
	}
	
	.user-message .message-content {
		background-color: #007AFF;
		color: #fff;
	}
	
	.ai-message .message-content {
		background-color: #fff;
		color: #333;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
		min-width: 80rpx;
	}
	
	.input-container {
		padding: 20rpx;
		background-color: #fff;
		border-top: 1rpx solid #eee;
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}
	
	.message-input {
		flex: 1;
		height: 80rpx;
		background-color: #f5f5f5;
		border-radius: 40rpx;
		padding: 0 30rpx;
		font-size: 28rpx;
	}
	
	.send-button {
		width: 160rpx;
		height: 80rpx;
		background-color: #007AFF;
		color: #fff;
		border-radius: 40rpx;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.send-button[disabled] {
		background-color: #ccc;
	}
	
	.loading-icon {
		width: 32rpx;
		height: 32rpx;
		border: 4rpx solid #fff;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	/* 修改打字机动画样式 */
	.loading-message {
		z-index: 1;
	}
	
	.loading-content {
		background-color: #f0f0f0 !important;
		min-width: 120rpx !important;
		justify-content: center;
	}
	
	.typing-indicator {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;
		padding: 16rpx 24rpx;
	}
	
	.typing-indicator .dot {
		width: 12rpx;
		height: 12rpx;
		background-color: #666;
		border-radius: 50%;
		display: inline-block;
		animation: typing 1.4s infinite ease-in-out;
		opacity: 0.6;
	}
	
	.typing-indicator .dot:nth-child(1) {
		animation-delay: 0s;
		background-color: #007AFF;
	}
	
	.typing-indicator .dot:nth-child(2) {
		animation-delay: 0.2s;
		background-color: #007AFF;
	}
	
	.typing-indicator .dot:nth-child(3) {
		animation-delay: 0.4s;
		background-color: #007AFF;
	}
	
	@keyframes typing {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.4;
		}
		30% {
			transform: translateY(-8rpx);
			opacity: 1;
		}
	}
	
</style> 