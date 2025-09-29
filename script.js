// 全局变量
let currentVideo = null;
let isFullscreen = false;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    setupVideoEvents();
    setupFullscreenEvents();
    preloadVideos();
    setupResponsiveHandlers();
}

// 设置视频事件监听
function setupVideoEvents() {
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
        // 视频加载事件
        video.addEventListener('loadstart', showLoading);
        video.addEventListener('loadeddata', hideLoading);
        video.addEventListener('error', handleVideoError);
        
        // 视频播放事件
        video.addEventListener('play', onVideoPlay);
        video.addEventListener('pause', onVideoPause);
        video.addEventListener('ended', onVideoEnd);
    });
}

// 设置全屏事件监听
function setupFullscreenEvents() {
    const modal = document.getElementById('fullscreen-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');
    
    // 点击背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeFullscreen();
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isFullscreen) {
            closeFullscreen();
        }
    });
    
    // 全屏视频事件 - 每次播放时重新绑定
    // 注意：事件监听器在 playFullscreen 函数中动态添加
}

// 全屏播放视频
function playFullscreen(videoElement) {
    if (!videoElement) return;
    
    const modal = document.getElementById('fullscreen-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');
    
    // 设置视频源
    const source = videoElement.querySelector('source');
    if (source) {
        fullscreenVideo.src = source.src;
        fullscreenVideo.type = source.type;
    } else {
        fullscreenVideo.src = videoElement.src;
    }
    
    // 重新绑定事件监听器
    fullscreenVideo.addEventListener('loadstart', showFullscreenLoading);
    fullscreenVideo.addEventListener('loadeddata', hideFullscreenLoading);
    fullscreenVideo.addEventListener('error', handleFullscreenVideoError);
    
    // 显示模态框
    modal.classList.add('active');
    isFullscreen = true;
    
    // 显示加载状态
    showFullscreenLoading();
    
    // 尝试播放
    fullscreenVideo.play().catch(error => {
        console.log('自动播放被阻止:', error);
        hideFullscreenLoading();
    });
    
    // 记录当前视频
    currentVideo = fullscreenVideo;
}

// 关闭全屏
function closeFullscreen() {
    const modal = document.getElementById('fullscreen-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');
    
    // 先设置标志，避免错误处理函数执行
    isFullscreen = false;
    
    // 暂停视频
    if (fullscreenVideo) {
        fullscreenVideo.pause();
        fullscreenVideo.currentTime = 0;
        
        // 移除所有事件监听器，避免触发错误事件
        fullscreenVideo.removeEventListener('error', handleFullscreenVideoError);
        fullscreenVideo.removeEventListener('loadstart', showFullscreenLoading);
        fullscreenVideo.removeEventListener('loadeddata', hideFullscreenLoading);
        
        // 清除视频源 - 使用更安全的方式，避免触发错误事件
        try {
            // 先移除src属性，避免触发error事件
            fullscreenVideo.removeAttribute('src');
            fullscreenVideo.load(); // 重新加载以清除状态
        } catch (e) {
            console.log('清除视频源时出现错误:', e);
        }
    }
    
    // 隐藏模态框
    modal.classList.remove('active');
    
    // 隐藏加载状态
    hideFullscreenLoading();
    
    currentVideo = null;
}

// 显示加载状态
function showLoading() {
    // 可以在这里添加全局加载指示器
    console.log('视频开始加载...');
}

// 隐藏加载状态
function hideLoading() {
    console.log('视频加载完成');
}

// 显示全屏加载状态
function showFullscreenLoading() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.style.display = 'block';
    }
}

// 隐藏全屏加载状态
function hideFullscreenLoading() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// 处理视频错误
function handleVideoError(e) {
    console.error('视频加载错误:', e);
    hideLoading();
    // 只在真正需要时显示错误提示
    if (e.target && e.target.src) {
        console.log('视频文件路径:', e.target.src);
        showError('视频加载失败，请检查文件是否存在');
    }
}

// 处理全屏视频错误
function handleFullscreenVideoError(e) {
    console.error('全屏视频加载错误:', e);
    hideFullscreenLoading();
    // 只有在真正播放时才显示错误，关闭时不显示
    if (isFullscreen && e.target && e.target.src) {
        console.log('全屏视频文件路径:', e.target.src);
        showError('视频播放失败，请检查文件是否存在');
    }
}

// 显示错误信息
function showError(message) {
    // 使用更友好的错误提示方式
    console.warn('用户提示:', message);
    
    // 创建自定义错误提示
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        errorDiv.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 300);
    }, 3000);
}

// 视频播放事件
function onVideoPlay(e) {
    console.log('视频开始播放');
    // 可以添加播放统计等逻辑
}

// 视频暂停事件
function onVideoPause(e) {
    console.log('视频暂停');
}

// 视频结束事件
function onVideoEnd(e) {
    console.log('视频播放结束');
    // 如果是全屏播放，可以自动关闭
    if (isFullscreen) {
        setTimeout(() => {
            closeFullscreen();
        }, 2000); // 2秒后自动关闭
    }
}

// 预加载视频
function preloadVideos() {
    const videos = document.querySelectorAll('video[preload="metadata"]');
    
    videos.forEach(video => {
        // 预加载视频元数据
        video.load();
        
        // 确保视频显示第一帧
        video.addEventListener('loadeddata', function() {
            this.currentTime = 0.1; // 设置到0.1秒，确保显示第一帧
        });
    });
}

// 响应式处理
function setupResponsiveHandlers() {
    let resizeTimer;
    
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 250);
    });
}

// 处理窗口大小变化
function handleResize() {
    // 重新计算视频布局
    const videoGrid = document.querySelector('.video-grid');
    if (videoGrid) {
        // 可以在这里添加响应式调整逻辑
        console.log('窗口大小变化，重新调整布局');
    }
}

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 工具函数：节流
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 检测设备类型
function isMobile() {
    return window.innerWidth <= 767;
}

function isTablet() {
    return window.innerWidth >= 768 && window.innerWidth <= 1023;
}

function isDesktop() {
    return window.innerWidth >= 1024;
}

// 添加触摸反馈
document.addEventListener('DOMContentLoaded', function() {
    const videoItems = document.querySelectorAll('.video-item, .video-container');
    
    videoItems.forEach(item => {
        item.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        item.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isFullscreen) {
        // 页面隐藏时暂停视频
        const fullscreenVideo = document.getElementById('fullscreen-video');
        if (fullscreenVideo && !fullscreenVideo.paused) {
            fullscreenVideo.pause();
        }
    }
});

// 图片全屏功能
function openImageFullscreen(imageSrc) {
    const modal = document.getElementById('image-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');
    
    if (!modal || !fullscreenImage) return;
    
    // 设置图片源
    fullscreenImage.src = imageSrc;
    
    // 显示模态框
    modal.classList.add('active');
    
    // 添加点击背景关闭功能
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageFullscreen();
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeImageFullscreen();
        }
    });
}

// 关闭图片全屏
function closeImageFullscreen() {
    const modal = document.getElementById('image-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');
    
    if (!modal) return;
    
    // 隐藏模态框
    modal.classList.remove('active');
    
    // 清除图片源
    if (fullscreenImage) {
        fullscreenImage.src = '';
    }
}

// 导出函数供全局使用
window.playFullscreen = playFullscreen;
window.closeFullscreen = closeFullscreen;
window.openImageFullscreen = openImageFullscreen;
window.closeImageFullscreen = closeImageFullscreen;
