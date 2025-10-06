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
        // 补齐移动端与微信/X5兼容属性
        try {
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('x5-playsinline', '');
            video.setAttribute('x5-video-player-type', 'h5');
            video.setAttribute('x5-video-orientation', 'portrait');
            if (!video.hasAttribute('preload')) {
                video.setAttribute('preload', 'metadata');
            }
        } catch (_) {}

        // 视频加载事件
        video.addEventListener('loadstart', showLoading);
        video.addEventListener('loadeddata', hideLoading);
        video.addEventListener('error', handleVideoError);

        // 视频播放事件
        video.addEventListener('play', onVideoPlay);
        video.addEventListener('pause', onVideoPause);
        video.addEventListener('ended', onVideoEnd);

        // 添加点击事件用于全屏播放（保留现有行为）
        video.addEventListener('click', function() {
            console.log('视频被点击，准备全屏播放');
            playFullscreen(video);
        });

        // 添加触摸反馈（保留现有行为）
        video.style.transition = 'transform 0.2s ease';
        video.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        video.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });

        // 挂载移动端加载兜底（重试/超时）
        attachMobileVideoGuards(video);
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

    // 设置视频源
    const source = videoElement.querySelector('source');
    if (source) {
        fullscreenVideo.innerHTML = '';
        const newSource = document.createElement('source');
        newSource.src = source.src;
        newSource.type = source.type;
        fullscreenVideo.appendChild(newSource);
    } else {
        fullscreenVideo.src = videoElement.src;
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

    if (!window.IntersectionObserver) {
        console.log('浏览器不支持 IntersectionObserver，跳过懒加载');
        loadAllMedia();
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

    // 观察所有视频和图片元素
    const videos = document.querySelectorAll('video[data-src]');
    const images = document.querySelectorAll('img[data-src]');

    console.log('找到懒加载视频:', videos.length);
    console.log('找到懒加载图片:', images.length);

    videos.forEach(video => observer.observe(video));
    images.forEach(img => observer.observe(img));
}

function loadVideoLazily(video) {
    const dataSrc = video.getAttribute('data-src');
    console.log('懒加载视频:', dataSrc);
    if (dataSrc) {
        // 设置视频源到 <video>
        video.src = dataSrc;
        // 同步更新 <source>
        const source = video.querySelector('source');
        const sourceDataSrc = source && (source.getAttribute('data-src') || source.getAttribute('src'));
        if (source) {
            source.src = dataSrc || sourceDataSrc || '';
        }
        // 预加载元数据并触发加载
        video.preload = 'metadata';
        try { video.load(); } catch (_) {}
        // 监听一次 loadeddata
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

    const videos = document.querySelectorAll('video[data-src]');
    const images = document.querySelectorAll('img[data-src]');

    videos.forEach(video => {
        const dataSrc = video.getAttribute('data-src');
        if (dataSrc) {
            video.src = dataSrc;
        }
    });

    images.forEach(img => {
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
            img.src = dataSrc;
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

// 移动端视频加载兜底：超时与重试
function attachMobileVideoGuards(video) {
    // 避免重复挂载
    if (video.__guardsAttached) return;
    video.__guardsAttached = true;

    let retryCount = 0;
    const maxRetries = 2; // 最多重试2次
    let timeoutId = null;
    const startTimeout = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            if (video.readyState < 2) { // HAVE_CURRENT_DATA 之前认为超时
                console.warn('视频加载超时，准备重试:', video.src);
                retryLoad();
            }
        }, 8000); // 8秒超时
    };

    const clearAll = () => {
        clearTimeout(timeoutId);
    };

    const retryLoad = () => {
        if (retryCount >= maxRetries) {
            console.error('视频重试次数已达上限:', video.src);
            clearAll();
            return;
        }
        retryCount += 1;
        try {
            const base = video.getAttribute('data-src') || video.src;
            const url = new URL(base, window.location.href);
            url.searchParams.set('_v', String(Date.now()));
            console.log(`第${retryCount}次重试加载视频:`, url.toString());
            // 同步到 source
            const source = video.querySelector('source');
            if (source) {
                source.src = url.toString();
            }
            video.src = url.toString();
            video.load();
            // 在微信/X5上有时需要主动 play 一次以触发加载
            if (video.muted) {
                video.play().catch(() => {});
            }
            startTimeout();
        } catch (e) {
            console.error('视频重试异常:', e);
        }
    };

    video.addEventListener('loadstart', startTimeout);
    video.addEventListener('loadeddata', clearAll);
    video.addEventListener('error', retryLoad);
}

// 初始化微信处理
setupWechatHandlers();

// 导出函数供全局使用
window.playFullscreen = playFullscreen;
window.closeFullscreen = closeFullscreen;
window.openImageFullscreen = openImageFullscreen;
window.closeImageFullscreen = closeImageFullscreen;

console.log('全屏控制模块加载完成');