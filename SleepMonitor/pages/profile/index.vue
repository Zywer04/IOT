<template>
	<view class="profile-container" :class="{ 'dark-theme': isDarkTheme }">
		<view class="page-header">
			<text class="page-title">个人中心</text>
			<view class="theme-switch" @tap="toggleTheme">
				<text class="theme-icon">{{ isDarkTheme ? '🌞' : '🌙' }}</text>
			</view>
		</view>
		
		<view class="profile-content">
			<!-- 用户信息卡片 -->
			<view class="profile-card">
				<view class="avatar-section">
					<image class="avatar" src="/static/default-avatar.png" mode="aspectFill"></image>
					<view class="user-info">
						<text class="username">用户名</text>
						<text class="user-id">ID: 123456</text>
					</view>
				</view>
			</view>
			
			<!-- 设置列表 -->
			<view class="settings-list">
				<view class="settings-group">
					<view class="settings-item">
						<text class="item-label">睡眠目标</text>
						<text class="item-value">8小时</text>
					</view>
					<view class="settings-item">
						<text class="item-label">提醒时间</text>
						<text class="item-value">22:00</text>
					</view>
				</view>
				
				<view class="settings-group">
					<view class="settings-item">
						<text class="item-label">关于我们</text>
						<text class="item-arrow">></text>
					</view>
					<view class="settings-item">
						<text class="item-label">隐私政策</text>
						<text class="item-arrow">></text>
					</view>
					<view class="settings-item">
						<text class="item-label">版本信息</text>
						<text class="item-value">v1.0.0</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				isDarkTheme: false
			}
		},
		onLoad() {
			// 从本地存储读取主题设置
			const theme = uni.getStorageSync('theme');
			this.isDarkTheme = theme === 'dark';
		},
		methods: {
			toggleTheme() {
				this.isDarkTheme = !this.isDarkTheme;
				uni.setStorageSync('theme', this.isDarkTheme ? 'dark' : 'light');
			}
		}
	}
</script>

<style>
	.profile-container {
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
	
	.profile-content {
		display: flex;
		flex-direction: column;
		margin-bottom: 30rpx;
	}
	
	.profile-card {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.dark-theme .profile-card {
		background-color: #2c2c2c;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.avatar-section {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}
	
	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		background-color: #f0f0f0;
	}
	
	.user-info {
		display: flex;
		flex-direction: column;
		margin-bottom: 8rpx;
	}
	
	.username {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}
	
	.dark-theme .username {
		color: #fff;
	}
	
	.user-id {
		font-size: 24rpx;
		color: #999;
	}
	
	.dark-theme .user-id {
		color: #666;
	}
	
	.settings-list {
		display: flex;
		flex-direction: column;
		margin-bottom: 20rpx;
	}
	
	.settings-group {
		background-color: #fff;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.dark-theme .settings-group {
		background-color: #2c2c2c;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.settings-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}
	
	.dark-theme .settings-item {
		border-bottom-color: #333;
	}
	
	.settings-item:last-child {
		border-bottom: none;
	}
	
	.item-label {
		font-size: 28rpx;
		color: #333;
	}
	
	.dark-theme .item-label {
		color: #fff;
	}
	
	.item-value {
		font-size: 28rpx;
		color: #999;
	}
	
	.dark-theme .item-value {
		color: #666;
	}
	
	.item-arrow {
		font-size: 28rpx;
		color: #999;
	}
	
	.dark-theme .item-arrow {
		color: #666;
	}
</style> 