// 全屏视频和图片控制 - 微信返回键优化版
// 全局变量
let currentVideo = null;
let isFullscreen = false;
let backButtonHandler = null;
let isBackButtonEnabled = false;
let historyStateAdded = false;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，初始化应用');
    initializeApp();
});

// 初始化应用
function initializeApp() {
    console.log('开始初始化应用');
    setupVideoEvents();
    setupFullscreenEvents();
    setupLazyLoading();
    setupResponsiveHandlers();
    preloadCriticalImages();
    console.log('应用初始化完成');
}

// 设置视频事件监听
function setupVideoEvents() {
    const videos = document.querySelectorAll('video');
    console.log('找到视频数量:', videos.length);
    
    videos.forEach((video, index) => {
        console.log(`设置视频 ${index} 事件监听`);
        
        // 视频加载事件
        video.addEventListener('loadstart', showLoading);
        video.addEventListener('loadeddata', hideLoading);
        video.addEventListener('error', handleVideoError);
        
        // 视频播放事件
        video.addEventListener('play', onVideoPlay);
        video.addEventListener('pause', onVideoPause);
        video.addEventListener('ended', onVideoEnd);
        
        // 添加点击事件用于全屏播放
        video.addEventListener('click', function() {
            console.log('视频被点击，准备全屏播放');
            playFullscreen(video);
        });
        
        // 添加触摸反馈
        video.style.transition = 'transform 0.2s ease';
        video.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        video.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// 设置全屏事件监听
function setupFullscreenEvents() {
    console.log('设置全屏事件监听');
    
    const modal = document.getElementById('fullscreen-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');
    
    if (!modal) {
        console.error('未找到全屏模态框元素');
        return;
    }
    
    // 点击背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            console.log('点击背景关闭全屏');
            closeFullscreen();
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isFullscreen) {
            console.log('ESC键关闭全屏');
            closeFullscreen();
        }
    });
    
    // 全屏视频事件
    if (fullscreenVideo) {
        fullscreenVideo.addEventListener('ended', function() {
            console.log('全屏视频播放结束');
            setTimeout(() => {
                closeFullscreen();
            }, 1000);
        });
    }
}

// 全屏播放视频
function playFullscreen(videoElement) {
    if (!videoElement) {
        console.error('视频元素不存在');
        return;
    }
    
    console.log('开始全屏播放视频');
    
    const modal = document.getElementById('fullscreen-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');
    
    if (!modal || !fullscreenVideo) {
        console.error('全屏元素未找到');
        return;
    }
    
    // 设置视频源（兼容 data-src 与 src）
    // 先尝试从 <source> 标签读取
    const source = videoElement.querySelector('source'); // 查找子级的 <source> 标签
    let resolvedSrc = '';
    let resolvedType = '';
    if (source) { // 如果存在 <source>
        // 优先读取 data-src，其次读取 src
        resolvedSrc = source.getAttribute('data-src') || source.getAttribute('src') || '';
        resolvedType = source.getAttribute('type') || '';
    }
    // 如果没有从 <source> 解析到地址，再尝试从 <video> 本身读取
    if (!resolvedSrc) { // 如果还没有拿到地址
        resolvedSrc = videoElement.getAttribute('data-src') || videoElement.getAttribute('src') || '';
    }
    // 如果仍然没有可用地址，直接提示错误并返回
    if (!resolvedSrc) { // 无可用视频地址
        console.warn('未能解析到视频地址，请检查 data-src/src 配置');
        showError('未找到可播放的视频地址');
        return;
    }
    // 清空旧的子节点，避免残留 <source>
    fullscreenVideo.innerHTML = '';
    // 统一采用直接设置 video.src 的方式，兼容性更好
    fullscreenVideo.setAttribute('src', resolvedSrc); // 设置解析到的视频地址
    // 如有类型信息可附带，但不是必须
    if (resolvedType) { // 如果存在 MIME 类型
        const typeSource = document.createElement('source'); // 创建一个 <source> 节点
        typeSource.setAttribute('src', resolvedSrc); // 赋值地址
        typeSource.setAttribute('type', resolvedType); // 赋值类型
        fullscreenVideo.appendChild(typeSource); // 附加到视频元素
    }
    // 绑定一次错误事件，便于提示
    fullscreenVideo.removeEventListener('error', handleFullscreenVideoError); // 移除可能的旧监听
    fullscreenVideo.addEventListener('error', handleFullscreenVideoError, { once: false }); // 添加错误监听
    // 为了更稳妥，主动调用 load()
    try { // 尝试触发加载
        fullscreenVideo.load(); // 显式触发加载流程
    } catch (e) { // 捕获可能的异常
        console.log('调用全屏视频 load() 出错:', e); // 打印错误日志
    }
    
    // 显示模态框
    modal.classList.add('active');
    isFullscreen = true;
    
    // 显示加载状态
    showFullscreenLoading();
    
    // 尝试播放
    const playPromise = fullscreenVideo.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('全屏视频开始播放');
            hideFullscreenLoading();
        }).catch(error => {
            console.log('自动播放被阻止:', error);
            hideFullscreenLoading();
            // 显示播放按钮让用户手动点击
        });
    }
    
    // 记录当前视频
    currentVideo = fullscreenVideo;
    
    // 启用返回键处理
    enableBackButtonHandler();
    
    console.log('全屏播放设置完成');
}

// 关闭全屏
function closeFullscreen() {
    console.log('开始关闭全屏');
    
    const modal = document.getElementById('fullscreen-modal');
    const fullscreenVideo = document.getElementById('fullscreen-video');
    
    if (!modal) {
        console.error('全屏模态框未找到');
        return;
    }
    
    // 先设置标志
    isFullscreen = false;
    
    // 暂停视频
    if (fullscreenVideo) {
        console.log('暂停全屏视频');
        fullscreenVideo.pause();
        fullscreenVideo.currentTime = 0;
        
        // 清除视频源
        try {
            fullscreenVideo.removeAttribute('src');
            fullscreenVideo.load();
        } catch (e) {
            console.log('清除视频源时出错:', e);
        }
    }
    
    // 隐藏模态框
    modal.classList.remove('active');
    
    // 隐藏加载状态
    hideFullscreenLoading();
    
    // 禁用返回键处理
    disableBackButtonHandler();
    
    currentVideo = null;
    
    console.log('全屏关闭完成');
}

// 启用返回键处理
function enableBackButtonHandler() {
    if (isBackButtonEnabled) {
        console.log('返回键处理已启用，跳过');
        return;
    }
    
    console.log('启用返回键处理');
    isBackButtonEnabled = true;
    
    // 方法1: 使用 history.pushState 添加历史记录
    try {
        if (window.history && window.history.pushState) {
            // 添加一个历史记录条目
            history.pushState({
                fullscreen: true,
                timestamp: Date.now(),
                type: 'fullscreen-video'
            }, '', window.location.href);
            
            historyStateAdded = true;
            console.log('历史记录条目添加成功');
        }
    } catch (e) {
        console.warn('添加历史记录失败:', e);
    }
    
    // 方法2: 监听 popstate 事件
    backButtonHandler = function(event) {
        console.log('返回键被按下，当前全屏状态:', isFullscreen);
        console.log('事件详情:', event);
        
        const videoModal = document.getElementById('fullscreen-modal');
        const imageModal = document.getElementById('image-modal');
        
        let shouldPreventDefault = false;
        
        // 检查视频全屏
        if (videoModal && videoModal.classList.contains('active')) {
            console.log('检测到视频全屏打开，关闭视频全屏');
            closeFullscreen();
            shouldPreventDefault = true;
        }
        // 检查图片全屏
        else if (imageModal && imageModal.classList.contains('active')) {
            console.log('检测到图片全屏打开，关闭图片全屏');
            closeImageFullscreen();
            shouldPreventDefault = true;
        }
        
        // 如果处理了全屏关闭，阻止默认返回行为
        if (shouldPreventDefault) {
            console.log('阻止默认返回行为');
            
            // 再次 pushState 来保持当前页面
            try {
                if (window.history && window.history.pushState) {
                    setTimeout(() => {
                        history.pushState({
                            fullscreen: false,
                            timestamp: Date.now()
                        }, '', window.location.href);
                    }, 10);
                }
            } catch (e) {
                console.warn('再次添加历史记录失败:', e);
            }
            
            if (event && event.preventDefault) {
                event.preventDefault();
            }
            
            // 对于微信浏览器，可能需要额外的处理
            if (window.WeixinJSBridge) {
                console.log('检测到微信环境，使用微信特定处理');
                // 微信环境下的特殊处理
            }
            
            return false;
        }
    };
    
    // 添加事件监听
    window.addEventListener('popstate', backButtonHandler);
    console.log('popstate 事件监听器已添加');
}

// 禁用返回键处理
function disableBackButtonHandler() {
    if (!isBackButtonEnabled) {
        return;
    }
    
    console.log('禁用返回键处理');
    isBackButtonEnabled = false;
    
    // 移除事件监听
    if (backButtonHandler) {
        window.removeEventListener('popstate', backButtonHandler);
        backButtonHandler = null;
        console.log('popstate 事件监听器已移除');
    }
    
    // 如果添加了历史记录，尝试返回
    if (historyStateAdded) {
        try {
            if (window.history && window.history.state && window.history.state.fullscreen) {
                console.log('返回历史记录');
                history.back();
            }
        } catch (e) {
            console.warn('返回历史记录失败:', e);
        }
        historyStateAdded = false;
    }
}

// 图片全屏功能
function openImageFullscreen(imageSrc) {
    console.log('打开图片全屏:', imageSrc);
    
    const modal = document.getElementById('image-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');
    
    if (!modal || !fullscreenImage) {
        console.error('图片全屏元素未找到');
        return;
    }
    
    // 设置图片源
    fullscreenImage.src = imageSrc;
    
    // 显示模态框
    modal.classList.add('active');
    
    // 添加点击背景关闭功能
    const clickHandler = function(e) {
        if (e.target === modal) {
            console.log('点击背景关闭图片全屏');
            closeImageFullscreen();
        }
    };
    
    // 移除旧的事件监听器，添加新的
    modal.removeEventListener('click', clickHandler);
    modal.addEventListener('click', clickHandler);
    
    // ESC键关闭
    const keyHandler = function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            console.log('ESC键关闭图片全屏');
            closeImageFullscreen();
        }
    };
    
    document.removeEventListener('keydown', keyHandler);
    document.addEventListener('keydown', keyHandler);
    
    // 启用返回键处理
    enableBackButtonHandler();
    
    console.log('图片全屏打开完成');
}

// 关闭图片全屏
function closeImageFullscreen() {
    console.log('关闭图片全屏');
    
    const modal = document.getElementById('image-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');
    
    if (!modal) {
        console.error('图片模态框未找到');
        return;
    }
    
    // 隐藏模态框
    modal.classList.remove('active');
    
    // 禁用返回键处理
    disableBackButtonHandler();
    
    // 清除图片源
    if (fullscreenImage) {
        setTimeout(() => {
            fullscreenImage.src = '';
        }, 300);
    }
    
    console.log('图片全屏关闭完成');
}

// 加载状态管理
function showLoading() {
    console.log('视频开始加载...');
}

function hideLoading() {
    console.log('视频加载完成');
}

function showFullscreenLoading() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.style.display = 'block';
        console.log('显示全屏加载指示器');
    }
}

function hideFullscreenLoading() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.style.display = 'none';
        console.log('隐藏全屏加载指示器');
    }
}

// 错误处理
function handleVideoError(e) {
    console.error('视频加载错误:', e);
    hideLoading();
    
    if (e.target && e.target.src) {
        console.log('视频文件路径:', e.target.src);
        showError('视频加载失败，请检查网络连接');
    }
}

function handleFullscreenVideoError(e) {
    console.error('全屏视频加载错误:', e);
    hideFullscreenLoading();
    
    if (isFullscreen && e.target && e.target.src) {
        console.log('全屏视频文件路径:', e.target.src);
        showError('视频播放失败，请检查文件是否存在');
    }
}

function showError(message) {
    console.warn('显示错误信息:', message);
    
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 12px 18px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        max-width: 280px;
        animation: errorSlideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

// 视频事件处理
function onVideoPlay(e) {
    console.log('视频开始播放');
}

function onVideoPause(e) {
    console.log('视频暂停');
}

function onVideoEnd(e) {
    console.log('视频播放结束');
}

// 懒加载设置
function setupLazyLoading() {
    console.log('设置懒加载');
    
    // 为了保证移动端视频能尽快显示封面和可播放，视频不再使用懒加载，直接加载 metadata
    loadAllVideosImmediately();
    
    if (!window.IntersectionObserver) {
        console.log('浏览器不支持 IntersectionObserver，图片改为直接加载');
        loadAllImagesImmediately();
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                if (element.tagName === 'VIDEO') {
                    loadVideoLazily(element);
                } else if (element.tagName === 'IMG') {
                    loadImageLazily(element);
                }
                observer.unobserve(element);
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    // 仅对图片做懒加载，视频已即时加载
    const images = document.querySelectorAll('img[data-src]');
    console.log('找到懒加载图片:', images.length);
    images.forEach(img => observer.observe(img));
}

function loadVideoLazily(video) {
    const dataSrc = video.getAttribute('data-src');
    console.log('懒加载视频:', dataSrc);
    
    if (dataSrc) {
        video.src = dataSrc;
        video.preload = 'metadata';
        video.load();
        
        video.addEventListener('loadeddata', function() {
            console.log('视频懒加载成功:', dataSrc);
        }, { once: true });
    }
}

function loadImageLazily(img) {
    const dataSrc = img.getAttribute('data-src');
    console.log('懒加载图片:', dataSrc);
    
    if (dataSrc) {
        img.src = dataSrc;
        img.classList.remove('lazy-image');
        img.classList.add('loaded');
    }
}

function loadAllMedia() {
    console.log('加载所有媒体资源');
    
    loadAllVideosImmediately();
    loadAllImagesImmediately();
}

// 立即为所有视频设置 src 并加载 metadata，提升手机端首帧显示与可播放性
function loadAllVideosImmediately() {
    const videos = document.querySelectorAll('video');
    console.log('立即加载视频数量:', videos.length);
    videos.forEach((video, index) => {
        // 优先从 <source> data-src/src 获取地址
        const source = video.querySelector('source');
        let src = '';
        if (source) {
            src = source.getAttribute('data-src') || source.getAttribute('src') || '';
        }
        if (!src) {
            src = video.getAttribute('data-src') || video.getAttribute('src') || '';
        }
        
        console.log(`视频 ${index} 解析到的地址:`, src);
        
        if (src) {
            // 设置必要属性，保证移动端内联播放
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('x5-playsinline', '');
            video.setAttribute('muted', '');
            video.setAttribute('preload', 'metadata');
            
            // 添加加载事件监听
            video.addEventListener('loadstart', () => {
                console.log(`视频 ${index} 开始加载:`, src);
            });
            
            video.addEventListener('loadedmetadata', () => {
                console.log(`视频 ${index} 元数据加载完成:`, src);
            });
            
            video.addEventListener('canplay', () => {
                console.log(`视频 ${index} 可以播放:`, src);
            });
            
            video.addEventListener('error', (e) => {
                console.error(`视频 ${index} 加载失败:`, src, e);
                console.error('错误详情:', e.target.error);
            });
            
            // 直接设置 video.src 并触发 load()
            video.src = src;
            try { 
                video.load(); 
                console.log(`视频 ${index} 调用 load() 成功:`, src);
            } catch (e) { 
                console.error(`视频 ${index} load() 异常:`, src, e); 
            }
        } else {
            console.warn(`视频 ${index} 没有找到有效地址`);
        }
    });
}

// 立即加载所有图片（当不支持 IntersectionObserver 时使用）
function loadAllImagesImmediately() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
            img.src = dataSrc;
            img.classList.remove('lazy-image');
            img.classList.add('loaded');
        }
    });
}

// 预加载关键图片
function preloadCriticalImages() {
    console.log('预加载关键图片');
    
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
    console.log('设置响应式处理');
    
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 250);
    });
}

function handleResize() {
    console.log('窗口大小变化，当前宽度:', window.innerWidth);
}

// 设备检测
function isMobile() {
    return window.innerWidth <= 767;
}

function isTablet() {
    return window.innerWidth >= 768 && window.innerWidth <= 1023;
}

function isDesktop() {
    return window.innerWidth >= 1024;
}

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    console.log('页面可见性变化:', document.hidden ? '隐藏' : '显示');
    
    if (document.hidden) {
        // 页面隐藏时暂停全屏视频
        if (isFullscreen && currentVideo) {
            console.log('页面隐藏，暂停全屏视频');
            currentVideo.pause();
        }
        
        // 关闭所有全屏模式
        const videoModal = document.getElementById('fullscreen-modal');
        const imageModal = document.getElementById('image-modal');
        
        if (videoModal && videoModal.classList.contains('active')) {
            console.log('页面隐藏，关闭视频全屏');
            closeFullscreen();
        }
        
        if (imageModal && imageModal.classList.contains('active')) {
            console.log('页面隐藏，关闭图片全屏');
            closeImageFullscreen();
        }
    }
});

// 微信环境检测和特殊处理
function setupWechatHandlers() {
    if (typeof WeixinJSBridge !== 'undefined') {
        console.log('检测到微信环境，设置特殊处理');
        
        // 微信返回键特殊处理
        document.addEventListener('WeixinJSBridgeReady', function() {
            WeixinJSBridge.invoke('getNetworkType', {}, function() {
                console.log('微信JSBridge准备就绪');
            });
        });
    }
}

// 工具函数
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

// 初始化微信处理
setupWechatHandlers();

// 导出函数供全局使用
window.playFullscreen = playFullscreen;
window.closeFullscreen = closeFullscreen;
window.openImageFullscreen = openImageFullscreen;
window.closeImageFullscreen = closeImageFullscreen;

console.log('全屏控制模块加载完成');