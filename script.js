/**
 * SoundMax 有线耳机产品发布会网站交互脚本
 * 实现所有要求的鼠标动态交互效果
 */

// 全局变量
let modal = null;
let navbar = null;
let heroImage = null;
let designImage = null;

/**
 * 初始化函数，页面加载完成后执行
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    modal = document.getElementById('purchaseModal');
    navbar = document.getElementById('navbar');
    // 一些页面可能没有特定 id，使用更稳健的选择并允许为 null
    heroImage = document.getElementById('heroImage') || document.querySelector('.hero-section .hero-content') || null;
    designImage = document.getElementById('designImage') || document.querySelector('.design-image') || null;
    
    // 初始化滚动淡入效果
    initScrollAnimation();
    
    // 初始化图片视差效果
    initParallaxEffect();
    
    // 初始化文字高亮效果
    initTextHighlightEffect();
    
    // 初始化导航栏滚动效果
    initNavbarScrollEffect();
    
    // 点击模态框外部关闭
    initModalOutsideClick();
});

/**
 * 初始化滚动淡入动画效果
 * 当元素进入视口时，平滑淡入出现
 */
function initScrollAnimation() {
    const scrollElements = document.querySelectorAll('[data-scroll]');
    let ticking = false;
    let lastStates = new Map();

    scrollElements.forEach((el, i) => {
        lastStates.set(el, false);
    });

    function checkVisibility() {
        let changed = false;

        scrollElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const isVisible = rect.top < windowHeight * 0.85 && rect.bottom > windowHeight * 0.15;

            const wasVisible = lastStates.get(el);

            if (isVisible && !wasVisible) {
                // 元素进入视口：先移除再添加，触发动画
                el.classList.remove('visible');
                void el.offsetWidth;
                el.classList.add('visible');
                lastStates.set(el, true);
                changed = true;
            } else if (!isVisible && wasVisible) {
                // 元素离开视口
                el.classList.remove('visible');
                lastStates.set(el, false);
                changed = true;
            }
        });

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(checkVisibility);
            ticking = true;
        }
    }, { passive: true });

    // 初始检查
    checkVisibility();
}

/**
 * 初始化图片鼠标跟随视差效果
 * 鼠标移动时，图片轻微跟随移动，产生深度感
 */
function initParallaxEffect() {
    // Hero区域图片视差
    if (heroImage) {
        heroImage.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            // 轻微视差偏移
            this.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
        });

        heroImage.addEventListener('mouseleave', function() {
            // 鼠标离开时恢复原位
            this.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
        });
    }
    
    // 设计区域图片视差
    if (designImage) {
        designImage.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            this.style.transform = `perspective(1000px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg) scale(1.05)`;
        });

        designImage.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
        });
    }
}

/**
 * 初始化文字区块高亮效果
 * 鼠标移入文字区块时，文字缓慢高亮
 */
function initTextHighlightEffect() {
    // 为所有段落和标题添加高亮效果
    const textElements = document.querySelectorAll('p, h3, h4');
    
    textElements.forEach(el => {
        // 添加高亮类
        el.classList.add('text-highlight');
        
        // 添加鼠标移入动画
        el.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.5s ease';
        });
    });
}

/**
 * 初始化导航栏滚动效果
 * 页面滚动时导航栏背景变化 + 高亮当前区块
 */
function initNavbarScrollEffect() {
    const sections = document.querySelectorAll('section[data-section]');
    const navLinks = document.querySelectorAll('.nav-menu a');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 更新活跃导航项
        let currentSection = 'hero';
        const viewMiddle = window.innerHeight / 3;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= viewMiddle && rect.bottom >= viewMiddle) {
                currentSection = section.getAttribute('data-section');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('active');
            }
        });
    });
}

/**
 * 点击模态框外部关闭弹窗
 */
function initModalOutsideClick() {
    window.addEventListener('click', function(e) {
        if (modal && modal.style.display === 'block' && e.target === modal) {
            closePurchaseModal();
        }
    });
}

/**
 * 打开购买弹窗
 * @param {string} productName - 产品名称（可选）
 */
function openPurchaseModal(productName = '') {
    if (!modal) return;
    
    const modalText = document.getElementById('modalText');
    
    if (productName) {
        modalText.textContent = `感谢您选择 SoundMax ${productName}！`;
    } else {
        modalText.textContent = '感谢您对 SoundMax 的关注！';
    }
    
    // 显示弹窗
    modal.style.display = 'block';
    
    // 添加背景模糊效果
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭购买弹窗
 */
function closePurchaseModal() {
    if (!modal) return;
    
    // 隐藏弹窗
    modal.style.display = 'none';
    
    // 移除背景模糊效果
    document.body.style.overflow = 'auto';
}

/**
 * 平滑滚动到指定区域
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

/**
 * 页面加载完成后的淡入效果
 */
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

/**
 * 添加数字动画效果（可选增强效果）
 */
function animateNumbers() {
    const priceElements = document.querySelectorAll('.price');
    
    priceElements.forEach(el => {
        const originalText = el.textContent;
        const match = originalText.match(/(\d+)/);
        
        if (match) {
            const targetNumber = parseInt(match[1]);
            let currentNumber = 0;
            
            const interval = setInterval(() => {
                currentNumber += Math.ceil(targetNumber / 20);
                
                if (currentNumber >= targetNumber) {
                    currentNumber = targetNumber;
                    clearInterval(interval);
                }
                
                el.textContent = originalText.replace(/(\d+)/, currentNumber.toString());
            }, 30);
        }
    });
}

// 当价格卡片进入视口时触发数字动画
const priceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateNumbers();
            priceObserver.disconnect(); // 只执行一次
        }
    });
}, { threshold: 0.5 });

const pricingSection = document.querySelector('.pricing-section');
if (pricingSection) {
    priceObserver.observe(pricingSection);
}