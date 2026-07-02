/**
 * SoundMax Pro - Three.js 3D耳机展示
 * 首页以模型为主体，大尺寸展示，垂直入场动画
 * 其他页面纯美化，不显示模型
 */

let scene, camera, renderer, earphoneGroup;
let modelBaseX = -0.3, modelBaseY = 0.3, modelBaseZ = 0;
let modelCurrentX = 0, modelCurrentY = 0.3, modelCurrentZ = 0;
let modelCurrentScale = 0.01, modelTargetScale = 3.5;
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;
let lastMouseMoveTime = 0;
let autoRotateAngle = 0;
let isModelLoaded = false;
let modelMeshes = [];
let isHeroVisible = true;
let isDesignVisible = false;
let heroVisibility = 1;
let designVisibility = 0;

// 入场动画
let entranceStartTime = null;
let entranceComplete = false;
let entranceProgress = 0;
const ENTRANCE_DURATION = 1800; // 1.8秒

/**
 * 加载本地Three.js
 */
function loadThreeJS() {
    const script = document.createElement('script');
    script.src = 'vendor/three.min.js';
    script.onload = function () {
        const loaderScript = document.createElement('script');
        loaderScript.src = 'vendor/GLTFLoader.js';
        loaderScript.onload = function () {
            initThreeJS();
        };
        document.head.appendChild(loaderScript);
    };
    document.head.appendChild(script);
}

/**
 * 初始化Three.js场景
 */
function initThreeJS() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    scene = new THREE.Scene();

    // 相机
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.3, 1);
    camera.lookAt(0, 0.3, 0);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: canvas, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    // 灯光
    setupLights();

    // 创建耳机模型组
    earphoneGroup = new THREE.Group();
    scene.add(earphoneGroup);

    // 初始位置：屏幕下方
    earphoneGroup.position.set(0, -8, 0);
    earphoneGroup.scale.set(0.01, 0.01, 0.01);

    // 加载模型
    loadModel();

    // 启动入场动画
    setTimeout(startEntrance, 500);

    // 监听鼠标和滚动
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // 初始化颜色选择器
    initColorSelector();

    // 启动渲染循环
    animate();
}

/**
 * 设置灯光
 */
function setupLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 主方向光
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // 补光
    const fillLight = new THREE.DirectionalLight(0xa78bfa, 0.6);
    fillLight.position.set(-3, 1, 3);
    scene.add(fillLight);

    // 底部补光
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.5);
    rimLight.position.set(0, -2, 4);
    scene.add(rimLight);

    // 顶部点光源
    const topLight = new THREE.PointLight(0x8b5cf6, 0.4, 10);
    topLight.position.set(0, 3, 2);
    scene.add(topLight);
}

/**
 * 加载3D模型
 */
function loadModel() {
    const loader = new THREE.GLTFLoader();
    const modelUrl = 'models/earphone_model/scene.gltf';

    loader.load(
        modelUrl,
        function (gltf) {
            const model = gltf.scene;
            model.position.set(0, 0, 0);

            model.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.roughness = 0.25;
                        child.material.metalness = 0.6;
                        child.material.needsUpdate = true;
                        if (child.material.map) {
                            child.material.map.encoding = THREE.sRGBEncoding;
                            child.material.map.needsUpdate = true;
                        }
                        if (child.material.normalMap) {
                            child.material.normalMap.encoding = THREE.LinearEncoding;
                            child.material.normalMap.needsUpdate = true;
                        }
                        if (child.material.roughnessMap) {
                            child.material.roughnessMap.encoding = THREE.LinearEncoding;
                            child.material.roughnessMap.needsUpdate = true;
                        }
                        if (child.material.metalnessMap) {
                            child.material.metalnessMap.encoding = THREE.LinearEncoding;
                            child.material.metalnessMap.needsUpdate = true;
                        }
                    }
                    modelMeshes.push(child);
                }
            });

            earphoneGroup.add(model);
            isModelLoaded = true;
            console.log('模型加载成功');
        },
        function (progress) {
            if (progress.total > 0) {
                const pct = Math.round((progress.loaded / progress.total) * 100);
                console.log('模型加载中: ' + pct + '%');
            }
        },
        function (error) {
            console.error('模型加载失败:', error);
            createFallbackModel();
        }
    );
}

/**
 * 备用模型
 */
function createFallbackModel() {
    console.log('使用备用几何体模型');
    const headband = new THREE.TorusGeometry(1.2, 0.08, 32, 64, Math.PI);
    const headbandMesh = new THREE.Mesh(headband, new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.8
    }));
    earphoneGroup.add(headbandMesh);

    const leftEar = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 32);
    const leftMesh = new THREE.Mesh(leftEar, new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.3,
        metalness: 0.9
    }));
    leftMesh.position.set(-1.2, 0, 0);
    earphoneGroup.add(leftMesh);

    const rightEar = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 32);
    const rightMesh = new THREE.Mesh(rightEar, new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.3,
        metalness: 0.9
    }));
    rightMesh.position.set(1.2, 0, 0);
    earphoneGroup.add(rightMesh);

    isModelLoaded = true;
}

/**
 * 启动入场动画
 */
function startEntrance() {
    entranceStartTime = performance.now();
    entranceComplete = false;
    entranceProgress = 0;
    earphoneGroup.position.set(0, -8, 0);
    earphoneGroup.scale.set(0.01, 0.01, 0.01);
    modelCurrentScale = 0.01;
    modelCurrentX = 0;
    modelCurrentY = -8;
}

/**
 * 入场动画缓动函数
 */
function entranceEasing(t) {
    if (t >= 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return 1 - Math.pow(1 - t, 3) * Math.cos(t * 3 * c4);
}

/**
 * 更新入场动画
 */
function updateEntrance(now) {
    if (entranceComplete) return;
    if (!entranceStartTime) return;

    const elapsed = now - entranceStartTime;
    const rawProgress = Math.min(elapsed / ENTRANCE_DURATION, 1);
    entranceProgress = entranceEasing(rawProgress);

    const targetY = modelBaseY;
    const currentY = -8 + (targetY - (-8)) * entranceProgress;
    modelCurrentY = currentY;
    modelCurrentScale = 0.01 + (modelTargetScale - 0.01) * entranceProgress;

    if (rawProgress >= 1) {
        entranceComplete = true;
        modelCurrentY = targetY;
        modelCurrentScale = modelTargetScale;
    }
}

/**
 * 鼠标移动
 */
function onMouseMove(event) {
    targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    lastMouseMoveTime = performance.now();
}

/**
 * 滚动事件：检测Hero区域可见性
 */
function onScroll() {
    const hero = document.getElementById('hero');
    const design = document.getElementById('design');

    if (hero) {
        const rect = hero.getBoundingClientRect();
        const viewHeight = window.innerHeight;

        if (rect.bottom < 0 || rect.top > viewHeight) {
            isHeroVisible = false;
            heroVisibility = 0;
        } else {
            isHeroVisible = true;
            heroVisibility = Math.max(0, Math.min(rect.bottom / viewHeight, 1));
        }
    }

    if (design) {
        const rect = design.getBoundingClientRect();
        const viewHeight = window.innerHeight;
        const visibleStart = viewHeight * 0.2;
        const visibleEnd = viewHeight * 0.8;

        if (rect.top < visibleEnd && rect.bottom > visibleStart) {
            isDesignVisible = true;
            const sectionCenter = (rect.top + rect.bottom) / 2;
            const distFromCenter = Math.abs(sectionCenter - viewHeight / 2);
            const maxDist = viewHeight / 2;
            designVisibility = Math.max(0, 1 - distFromCenter / maxDist);
        } else {
            isDesignVisible = false;
            designVisibility = 0;
        }
    }
}

/**
 * 窗口大小变化
 */
function onResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

/**
 * 渲染循环
 */
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();

    // 入场动画
    if (!entranceComplete) {
        updateEntrance(now);
    }

    // 鼠标平滑跟随
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    if (earphoneGroup) {
        let targetX = modelBaseX;
        let targetY = modelBaseY;
        let targetScale = modelTargetScale;

        if (entranceComplete) {
            if (isHeroVisible) {
                targetScale = modelTargetScale * heroVisibility;
                targetX = modelBaseX;
                targetY = modelBaseY;
            } else if (isDesignVisible) {
                // 根据展示框实际屏幕位置计算3D坐标
                const modelArea = document.querySelector('.design-model-area');
                if (modelArea && camera) {
                    const rect = modelArea.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const ndcX = (cx / window.innerWidth) * 2 - 1;
                    const ndcY = -(cy / window.innerHeight) * 2 + 1;
                    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
                    const halfW = halfH * camera.aspect;
                    targetX = ndcX * halfW;
                    targetY = ndcY * halfH + 0.3;
                }
                targetScale = 3.5 * designVisibility;
            } else {
                targetScale = 0.01;
                targetX = 0;
                targetY = 0.8;
            }
        }

        // 平滑过渡
        const lerpSpeed = 0.08;
        modelCurrentX += (targetX - modelCurrentX) * lerpSpeed;
        modelCurrentY += (targetY - modelCurrentY) * lerpSpeed;
        modelCurrentScale += (targetScale - modelCurrentScale) * lerpSpeed;

        earphoneGroup.position.set(modelCurrentX, modelCurrentY, modelBaseZ);
        earphoneGroup.scale.setScalar(modelCurrentScale);

        // 鼠标旋转 / 自动旋转
        if (modelCurrentScale > 0.1) {
            const now = performance.now();
            const idleTime = now - lastMouseMoveTime;
            const isIdle = idleTime > 1500;

            if (isIdle) {
                // 鼠标静止：自动水平旋转
                autoRotateAngle += 0.005;
                const targetRY = autoRotateAngle;
                earphoneGroup.rotation.y += (targetRY - earphoneGroup.rotation.y) * 0.03;
            } else {
                // 鼠标移动：跟随鼠标
                earphoneGroup.rotation.y += (mouseX * 1.5 - earphoneGroup.rotation.y) * 0.06;
            }
            earphoneGroup.rotation.x += (mouseY * 0.6 - earphoneGroup.rotation.x) * 0.06;
        }
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

/**
 * 切换模型颜色
 */
function changeModelColor(hexColor) {
    const color = new THREE.Color(hexColor);
    modelMeshes.forEach(function (mesh) {
        if (mesh.material && mesh.material.color) {
            mesh.material.color.set(color);
        }
    });
}

/**
 * 初始化颜色选择器
 */
function initColorSelector() {
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            colorBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            const color = btn.getAttribute('data-color');
            changeModelColor(color);
        });
    });
}

// 页面加载完成后启动
window.addEventListener('DOMContentLoaded', loadThreeJS);