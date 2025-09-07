/**
 * Güncellenmiş Component Loader
 * Dinamik path çözünürlüğü ile
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Component Loader başlatılıyor...');

    // Navigation Manager Class
    class NavigationManager {
        constructor() {
            this.initRoutes();
            this.init();
        }

        initRoutes() {
            // Ana URL'i belirle
            const protocol = window.location.protocol;
            const host = window.location.host;
            
            // Eğer localhost:8000'de çalışıyorsak
            if (host.includes('localhost') || host.includes('127.0.0.1')) {
                this.baseUrl = `${protocol}//${host}/`;
            } else {
                this.baseUrl = `${protocol}//${host}/`;
            }
            
            console.log('Base URL set to:', this.baseUrl);
        }

        init() {
            // Component'ler yüklendikten sonra navigation'ı başlat
            setTimeout(() => {
                this.attachNavigationListeners();
            }, 500);
        }

        attachNavigationListeners() {
            // Tüm data-nav-to linklerini yakala
            const navLinks = document.querySelectorAll('[data-nav-to]');
            
            console.log(`${navLinks.length} navigation link found`);
            
            navLinks.forEach(link => {
                // Önceki listener'ları temizle
                link.replaceWith(link.cloneNode(true));
            });

            // Yeni listener'ları ekle
            const refreshedNavLinks = document.querySelectorAll('[data-nav-to]');
            
            refreshedNavLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = link.getAttribute('data-nav-to');
                    this.navigateTo(target);
                });
            });
        }

        navigateTo(target) {
            console.log('Navigating to:', target);
            
            if (!target || target === '#') {
                console.warn('Empty navigation target');
                return;
            }

            let targetUrl;
            
            // Home page özel durumu
            if (target === 'home') {
                targetUrl = this.baseUrl + 'index.html';
            } 
            // Normal path
            else {
                // Eğer / ile başlamıyorsa ekle
                const cleanTarget = target.startsWith('/') ? target.substring(1) : target;
                targetUrl = this.baseUrl + cleanTarget;
            }
            
            console.log('Final target URL:', targetUrl);
            
            // Yönlendir
            window.location.href = targetUrl;
        }

        goBack() {
            if (history.length > 1) {
                const referrer = document.referrer;
                console.log('Referrer:', referrer);
                
                // Referrer varsa ve aynı domain'den ise
                if (referrer && referrer.startsWith(this.baseUrl)) {
                    history.back();
                } else {
                    this.goHome();
                }
            } else {
                this.goHome();
            }
        }

        goHome() {
            window.location.href = this.baseUrl + 'index.html';
        }
    }

    // Component yükleme fonksiyonu
    async function loadComponent(containerId, componentPath) {
        console.log(`${containerId} için component yükleniyor: ${componentPath}`);
        
        try {
            const response = await fetch(componentPath);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${componentPath}`);
            }
            
            const html = await response.text();
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.error(`Container '${containerId}' bulunamadı!`);
                return false;
            }
            
            container.innerHTML = html;
            console.log(`${containerId} başarıyla yüklendi`);
            
            // Header veya Footer yüklendiyse resim path'lerini düzelt
            if (containerId === 'header-container' || containerId === 'footer-container') {
                console.log(`${containerId} yüklendi, resim path\'leri düzeltiliyor...`);
                console.log('Container içeriği:', container.innerHTML.substring(0, 200) + '...');
                fixImagePaths(container);
            }
            
            // Script'leri çalıştır
            const scripts = container.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                
                if (script.innerHTML.trim()) {
                    newScript.innerHTML = script.innerHTML;
                }
                
                script.parentNode.replaceChild(newScript, script);
            });
            
            return true;
            
        } catch (error) {
            console.error(`Component yükleme hatası ${componentPath}:`, error);
            return false;
        }
    }

    // Header'daki resim path'lerini düzelt
    function fixImagePaths(container) {
        const currentPath = window.location.pathname;
        let imageBasePath = '';
        
        console.log('fixImagePaths çağrıldı, currentPath:', currentPath);
        
        // Ana sayfa
        if (currentPath === '/' || currentPath === '/index.html') {
            imageBasePath = 'assets/';
        }
        // pages/ klasöründe
        else if (currentPath.includes('/pages/')) {
            imageBasePath = '../assets/';
        }
        // pages/blog/ klasöründe
        else if (currentPath.includes('/pages/blog/')) {
            imageBasePath = '../../assets/';
        }
        
        console.log('Image base path:', imageBasePath);
        
        // Tüm img src'lerini düzelt
        const images = container.querySelectorAll('img[src^="assets/"]');
        console.log(`${images.length} resim bulundu`);
        
        images.forEach(img => {
            const originalSrc = img.getAttribute('src');
            const newSrc = imageBasePath + originalSrc.replace('assets/', '');
            img.setAttribute('src', newSrc);
            console.log(`Resim path düzeltildi: ${originalSrc} -> ${newSrc}`);
        });
        
        // Tüm a href'lerini düzelt (gallery thumbnails için)
        const links = container.querySelectorAll('a[href^="assets/"]');
        console.log(`${links.length} link bulundu`);
        
        links.forEach(link => {
            const originalHref = link.getAttribute('href');
            const newHref = imageBasePath + originalHref.replace('assets/', '');
            link.setAttribute('href', newHref);
            console.log(`Link path düzeltildi: ${originalHref} -> ${newHref}`);
        });
    }

    // Path belirleme fonksiyonu
    function determineBasePath() {
        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath);
        
        const pathParts = currentPath.split('/').filter(part => part.length > 0 && !part.includes('.html'));
        console.log('Path parts:', pathParts);
        
        let basePath = '';
        
        // Ana sayfa
        if (pathParts.length === 0) {
            basePath = '';
        }
        // pages/blog/
        else if (pathParts.includes('pages') && pathParts.includes('blog')) {
            basePath = '../../';
        }
        // pages/
        else if (pathParts.includes('pages')) {
            basePath = '../';
        }
        // Diğer
        else {
            basePath = '../'.repeat(pathParts.length);
        }
        
        console.log('Calculated base path:', basePath);
        return basePath;
    }

    // Container'ları hazırla
    function prepareContainers() {
        // Sadece mevcut container'ları kontrol et, yeni oluşturma
        const headerContainer = document.getElementById('header-container');
        const footerContainer = document.getElementById('footer-container');
        
        if (!headerContainer) {
            console.warn('Header container bulunamadı!');
        }
        
        if (!footerContainer) {
            console.warn('Footer container bulunamadı!');
        }
    }

    // Ana yükleme fonksiyonu
    async function loadAllComponents() {
        try {
            prepareContainers();
            
            const basePath = determineBasePath();
            const headerPath = `${basePath}components/header.html`;
            const footerPath = `${basePath}components/footer.html`;
            
            console.log('Loading paths:', { headerPath, footerPath });
            
            const [headerSuccess, footerSuccess] = await Promise.all([
                loadComponent('header-container', headerPath),
                loadComponent('footer-container', footerPath)
            ]);
            
            if (headerSuccess || footerSuccess) {
                console.log('Component loading completed');
                
                // Navigation manager'ı başlat
                window.navManager = new NavigationManager();
                
                // Global fonksiyonları ayarla
                window.goBack = () => window.navManager.goBack();
                window.goHome = () => window.navManager.goHome();
                window.navigateTo = (target) => window.navManager.navigateTo(target);
                
                console.log('Navigation system ready');
            }
            
        } catch (error) {
            console.error('Component loading error:', error);
        }
    }

    // Component'leri yükle
    loadAllComponents();
});