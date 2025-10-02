// 全局变量
let currentVideo = null;
let isFullscreen = false;
let isWeChatBrowser = false; // 微信浏览器标识

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    // 基础哨兵：确保非全屏时返回键为正常返回（非微信浏览器）
    if (!isWeChatBrowser) {
        try {
            if (window.history && window.history.replaceState) {
                history.replaceState({ base: true }, '', window.location.href);
            }
        } catch (_) {}
    }
});

// 初始化应用
function initializeApp() {
    detectWeChatBrowser(); // 检测微信浏览器
    setupVideoEvents();
    setupFullscreenEvents();
    setupLazyLoading();  // 替换preloadVideos为懒加载
    setupResponsiveHandlers();
    preloadCriticalImages();  // 预加载关键图片
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
    
    // 初始化完成
    
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
    
    // 设置返回键拦截（非微信浏览器）
    if (!isWeChatBrowser) {
        setupBackButton();
    } else {
        // 微信浏览器：在进入全屏时添加历史记录
        history.pushState({ fullscreen: true }, '', window.location.href);
        console.log('微信浏览器：已添加全屏历史记录');
    }
}

// 关闭全屏
function closeFullscreen() {
    const modal = document.getElementById('fullscreen-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');
    
    console.log('开始关闭全屏视频');
    
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
    
    // 移除返回键拦截（非微信浏览器）
    if (!isWeChatBrowser) {
        removeBackButton();
    }
    
    currentVideo = null;
    
    console.log('全屏视频已关闭');
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

// 设置懒加载
function setupLazyLoading() {
    // 创建Intersection Observer用于懒加载
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                if (element.tagName === 'VIDEO') {
                    loadVideoLazily(element);
                } else if (element.tagName === 'IMG') {
                    loadImageLazily(element);
                }
                observer.unobserve(element); // 加载后停止观察
            }
        });
    }, {
        rootMargin: '50px' // 提前50px开始加载
    });

    // 观察所有视频和图片元素
    const videos = document.querySelectorAll('video[data-src]');
    const images = document.querySelectorAll('img[data-src]');
    
    console.log('Found videos:', videos.length); // 调试信息
    console.log('Found images:', images.length); // 调试信息
    
    videos.forEach(video => {
        observer.observe(video);
    });
    
    images.forEach(img => {
        observer.observe(img);
    });
    
    // 立即检查可见元素
    setTimeout(() => {
        videos.forEach(video => {
            const rect = video.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                loadVideoLazily(video);
            }
        });
        
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                loadImageLazily(img);
            }
        });
    }, 100);
}

// 懒加载视频
function loadVideoLazily(video) {
    const dataSrc = video.getAttribute('data-src');
    console.log('Loading video:', dataSrc); // 调试信息
    if (dataSrc) {
        // 设置视频源
        video.src = dataSrc;
        
        // 设置source标签
        const source = video.querySelector('source');
        if (source) {
            source.src = dataSrc;
        }
        
        // 预加载元数据
        video.preload = 'metadata';
        video.load();
        
        // 确保视频显示第一帧
        video.addEventListener('loadeddata', function() {
            this.currentTime = 0.1;
            console.log('Video loaded successfully:', dataSrc); // 调试信息
        }, { once: true });
        
        // 添加错误处理
        video.addEventListener('error', function(e) {
            console.error('Video loading error:', dataSrc, e); // 调试信息
        }, { once: true });
    } else {
        console.error('No data-src found for video:', video); // 调试信息
    }
}

// 懒加载图片
function loadImageLazily(img) {
    const dataSrc = img.getAttribute('data-src');
    console.log('Loading image:', dataSrc); // 调试信息
    if (dataSrc) {
        img.src = dataSrc;
        img.classList.remove('lazy-image');
        img.classList.add('loaded');
        console.log('Image loaded successfully:', dataSrc); // 调试信息
    } else {
        console.error('No data-src found for image:', img); // 调试信息
    }
}

// 预加载关键图片（头像和模卡1）
function preloadCriticalImages() {
    const criticalImages = [
        'assets/images/avatar.jpg',
        'pictures/模卡1.jpg'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
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
    
    // 设置返回键拦截（非微信浏览器）
    if (!isWeChatBrowser) {
        setupBackButton();
    } else {
        // 微信浏览器：在进入全屏时添加历史记录
        history.pushState({ fullscreen: true }, '', window.location.href);
        console.log('微信浏览器：已添加全屏历史记录');
    }
}

// 关闭图片全屏
function closeImageFullscreen() {
    const modal = document.getElementById('image-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');
    
    console.log('开始关闭全屏图片');
    
    if (!modal) return;
    
    // 隐藏模态框
    modal.classList.remove('active');
    
    // 移除返回键拦截（非微信浏览器）
    if (!isWeChatBrowser) {
        removeBackButton();
    }
    
    // 清除图片源
    if (fullscreenImage) {
        fullscreenImage.src = '';
    }
    
    console.log('全屏图片已关闭');
}

// 导出函数供全局使用
window.playFullscreen = playFullscreen;
window.closeFullscreen = closeFullscreen;
window.openImageFullscreen = openImageFullscreen;
window.closeImageFullscreen = closeImageFullscreen;

// 微信浏览器检测
function detectWeChatBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    isWeChatBrowser = ua.includes('micromessenger');
    console.log('微信浏览器检测结果:', isWeChatBrowser);
    
    if (isWeChatBrowser) {
        console.log('检测到微信浏览器，启用用户体验优化');
        // 微信浏览器需要特殊处理
        setupWeChatUserExperience();
    }
}

// 微信浏览器用户体验优化
function setupWeChatUserExperience() {
    console.log('微信浏览器：设置简单返回键处理');
    
    // 微信浏览器特殊处理：页面加载时添加基础历史记录
    try {
        history.replaceState({ wechatBase: true, timestamp: Date.now() }, '', window.location.href);
        console.log('微信浏览器：已添加基础历史记录');
    } catch (e) {
        console.log('微信浏览器：添加基础历史记录失败', e);
    }
    
    // 设置简单的返回键处理
    setupSimpleBackButtonHandler();
}

// 简单返回键处理（微信浏览器专用）
function setupSimpleBackButtonHandler() {
    console.log('设置简单返回键处理');
    
    // 监听返回键事件
    window.addEventListener('popstate', function(event) {
        console.log('返回键被触发');
        
        // 检查视频全屏状态
        const videoModal = document.getElementById('fullscreen-modal');
        if (videoModal && videoModal.classList.contains('active')) {
            console.log('关闭视频全屏');
            closeFullscreen();
            // 立即重新添加历史记录
            setTimeout(() => {
                history.pushState({ fullscreen: true }, '', window.location.href);
            }, 10);
            return;
        }
        
        // 检查图片全屏状态
        const imageModal = document.getElementById('image-modal');
        if (imageModal && imageModal.classList.contains('active')) {
            console.log('关闭图片全屏');
            closeImageFullscreen();
            // 立即重新添加历史记录
            setTimeout(() => {
                history.pushState({ fullscreen: true }, '', window.location.href);
            }, 10);
            return;
        }
        
        console.log('没有全屏状态，允许正常返回');
    });
}

// 返回键处理 - 优化版本
let backButtonHandler = null;
let isBackButtonActive = false;

// 设置返回键拦截
function setupBackButton() {
    // 微信浏览器使用特殊处理，不需要这个函数
    if (isWeChatBrowser) {
        console.log('微信浏览器环境，跳过标准返回键拦截');
        return;
    }
    
    // 如果已经激活，直接返回
    if (isBackButtonActive) {
        return;
    }
    
    // 移除之前的监听器（安全措施）
    if (backButtonHandler) {
        window.removeEventListener('popstate', backButtonHandler);
    }
    
    // 添加历史记录，标记全屏状态
    history.pushState({ fullscreen: true, timestamp: Date.now() }, '', window.location.href);
    
    // 创建返回键处理函数
    backButtonHandler = function(event) {
        console.log('返回键被触发，当前状态:', {
            videoModal: document.getElementById('fullscreen-modal')?.classList.contains('active'),
            imageModal: document.getElementById('image-modal')?.classList.contains('active'),
            isFullscreen: isFullscreen
        });
        
        // 检查视频全屏状态
        const videoModal = document.getElementById('fullscreen-modal');
        if (videoModal && videoModal.classList.contains('active')) {
            console.log('关闭视频全屏');
            closeFullscreen();
            // 阻止默认的返回行为
            event.preventDefault();
            return false;
        }
        
        // 检查图片全屏状态
        const imageModal = document.getElementById('image-modal');
        if (imageModal && imageModal.classList.contains('active')) {
            console.log('关闭图片全屏');
            closeImageFullscreen();
            // 阻止默认的返回行为
            event.preventDefault();
            return false;
        }
        
        // 如果没有全屏状态，允许正常返回
        console.log('没有全屏状态，允许正常返回');
    };
    
    // 添加事件监听器
    window.addEventListener('popstate', backButtonHandler);
    isBackButtonActive = true;
    
    console.log('返回键拦截已激活');
}

// 移除返回键拦截
function removeBackButton() {
    // 微信浏览器使用特殊处理，不需要这个函数
    if (isWeChatBrowser) {
        console.log('微信浏览器环境，跳过标准返回键拦截移除');
        return;
    }
    
    // 移除事件监听器
    if (backButtonHandler) {
        window.removeEventListener('popstate', backButtonHandler);
        backButtonHandler = null;
    }
    
    // 重置状态
    isBackButtonActive = false;
    
    // 清理历史记录，恢复到基础状态
    try {
        history.replaceState({ base: true, timestamp: Date.now() }, '', window.location.href);
    } catch (e) {
        console.log('清理历史记录时出现错误:', e);
    }
    
    console.log('返回键拦截已移除');
}

// 简单方案：移除复杂的微信浏览器样式和提示
