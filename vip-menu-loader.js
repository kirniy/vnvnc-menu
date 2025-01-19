// VIP Menu Data Loader
async function loadVipMenuData() {
    try {
        console.log('Attempting to fetch vipmenu.json...');
        const response = await fetch('vipmenu.json');
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to load VIP menu data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('VIP menu data loaded successfully');
        return data;
    } catch (error) {
        console.error('Error loading VIP menu data:', error);
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack
        });
        return null;
    }
}

// Template Functions
function createVipMenuItem(item) {
    return `
        <div class="menu-item vip-item" data-id="${item.id}">
            <div class="item-header">
                <span class="item-name">${item.name}</span>
                <span class="item-price">${item.price} ${item.currency}</span>
            </div>
            ${item.ingredients ? `<div class="item-ingredients">${item.ingredients}</div>` : ''}
            <button class="add-to-cart" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;
}

// Render Functions
function renderVipMenu(menuData) {
    const container = document.getElementById('vip-menu');
    if (!container) return;

    let html = `
        <h1 class="subtitle">VIP МЕНЮ</h1>
        <nav class="menu-nav">
            ${menuData.navigation[0].sections.map(nav => `
                <a href="#${nav.id}" class="nav-item">
                    ${nav.title}
                </a>
            `).join('')}
        </nav>
    `;

    menuData.menu.main.forEach(section => {
        html += `
            <section id="${section.id}" class="menu-section">
                <h2 class="menu-section-title">${section.title}</h2>
                <div class="menu-items">
                    ${section.items.map(item => createVipMenuItem(item)).join('')}
                </div>
            </section>
        `;
    });

    container.innerHTML = html;
    
    // Initialize scroll handling and navigation for VIP menu
    initializeVipMenuNavigation();
}

// Navigation Functions
function initializeVipMenuNavigation() {
    const menuNav = document.querySelector('#vip-menu .menu-nav');
    const navItems = document.querySelectorAll('#vip-menu .nav-item');
    const sections = document.querySelectorAll('#vip-menu .menu-section');
    const container = document.querySelector('.container');

    function setActiveNavItem() {
        if (!menuNav) return;
        
        const scrollPosition = container.scrollTop;
        const menuHeight = menuNav.offsetHeight;
        
        const activeSection = [...sections].reverse().find(section => {
            const sectionTop = section.offsetTop - menuHeight - 10;
            return scrollPosition >= sectionTop;
        });

        if (activeSection) {
            navItems.forEach(item => {
                const isActive = item.getAttribute('href').slice(1) === activeSection.id;
                item.classList.toggle('active', isActive);
            });
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').slice(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const menuHeight = menuNav?.offsetHeight || 0;
                const targetPosition = targetSection.offsetTop - menuHeight - 10;
                
                container.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                if (window.webapp?.HapticFeedback) {
                    window.webapp.HapticFeedback.impactOccurred('light');
                }
            }
        });
    });

    // Initialize first nav item as active
    if (navItems.length > 0) {
        navItems[0].classList.add('active');
    }

    // Add scroll handler
    container.addEventListener('scroll', () => {
        if (document.querySelector('#vip-menu.active')) {
            setActiveNavItem();
            menuNav?.classList.toggle('floating', container.scrollTop > 100);
        }
    });
}

// Export functions for use in main loader
window.loadVipMenuData = loadVipMenuData;
window.renderVipMenu = renderVipMenu;

// Initialize VIP menu when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing VIP menu...');
    const vipMenuData = await loadVipMenuData();
    if (vipMenuData) {
        console.log('VIP menu data loaded, rendering...');
        renderVipMenu(vipMenuData);
    }
}); 