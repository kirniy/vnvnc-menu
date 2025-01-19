// Food Menu Data Loader
async function loadFoodMenuData() {
    try {
        console.log('Attempting to fetch foodmenu.json...');
        const response = await fetch('foodmenu.json');
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to load food menu data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Food menu data loaded successfully');
        return data;
    } catch (error) {
        console.error('Error loading food menu data:', error);
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack
        });
        return null;
    }
}

// Template Functions
function createFoodMenuItem(item) {
    return `
        <div class="menu-item" data-id="${item.id}">
            <div class="item-header">
                <span class="item-name">${item.name}</span>
                <span class="item-price">${item.price} ${item.currency}</span>
            </div>
            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            ${item.ingredients ? `<div class="item-ingredients">${item.ingredients}</div>` : ''}
            ${item.weight ? `<div class="item-weight">${item.weight}</div>` : ''}
            ${item.portions ? `<div class="item-portions">${item.portions}</div>` : ''}
            <button class="add-to-cart" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;
}

// Render Functions
function renderFoodMenu(menuData) {
    const container = document.getElementById('food-menu');
    if (!container) return;

    let html = `
        <h1 class="subtitle">МЕНЮ КУХНИ</h1>
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
                    ${section.items.map(item => createFoodMenuItem(item)).join('')}
                </div>
            </section>
        `;
    });

    container.innerHTML = html;
    
    // Initialize scroll handling and navigation for food menu
    initializeFoodMenuNavigation();
}

// Navigation Functions
function initializeFoodMenuNavigation() {
    const menuNav = document.querySelector('#food-menu .menu-nav');
    const navItems = document.querySelectorAll('#food-menu .nav-item');
    const sections = document.querySelectorAll('#food-menu .menu-section');
    const container = document.querySelector('.container');
    const foodMenu = document.getElementById('food-menu');

    console.log('[Food Menu Nav] Initializing with:', {
        menuNav: menuNav ? 'Found' : 'Not found',
        navItemsCount: navItems.length,
        sectionsCount: sections.length,
        container: container ? 'Found' : 'Not found',
        foodMenu: foodMenu ? 'Found' : 'Not found'
    });

    function setActiveNavItem() {
        if (!menuNav || !foodMenu.classList.contains('active')) {
            console.log('[Food Menu Nav] Skipping setActiveNavItem - menu not active or nav not found');
            return;
        }
        
        const scrollPosition = container.scrollTop;
        const menuHeight = menuNav.offsetHeight;
        
        console.log('[Food Menu Nav] Checking active section:', {
            scrollPosition,
            menuHeight,
            isMenuActive: foodMenu.classList.contains('active')
        });
        
        const activeSection = [...sections].reverse().find(section => {
            const sectionTop = section.offsetTop - menuHeight - 10;
            console.log('[Food Menu Nav] Section check:', {
                id: section.id,
                sectionTop,
                isVisible: scrollPosition >= sectionTop
            });
            return scrollPosition >= sectionTop;
        });

        if (activeSection) {
            console.log('[Food Menu Nav] Found active section:', activeSection.id);
            navItems.forEach(item => {
                const isActive = item.getAttribute('href').slice(1) === activeSection.id;
                item.classList.toggle('active', isActive);
            });
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('[Food Menu Nav] Nav item clicked:', {
                href: this.getAttribute('href'),
                isMenuActive: foodMenu.classList.contains('active'),
                currentActiveMenu: document.querySelector('.menu-container.active, .menu-page.active')?.id
            });
            
            // Only handle click if food menu is active
            if (!foodMenu.classList.contains('active')) {
                console.log('[Food Menu Nav] Click ignored - food menu not active');
                return;
            }
            
            const targetId = this.getAttribute('href').slice(1);
            const targetSection = document.getElementById(targetId);
            
            console.log('[Food Menu Nav] Scrolling to section:', {
                targetId,
                targetFound: targetSection ? 'Yes' : 'No',
                menuHeight: menuNav?.offsetHeight
            });
            
            if (targetSection) {
                const menuHeight = menuNav?.offsetHeight || 0;
                const targetPosition = targetSection.offsetTop - menuHeight - 10;
                
                console.log('[Food Menu Nav] Scroll details:', {
                    targetPosition,
                    sectionOffset: targetSection.offsetTop,
                    menuHeight
                });

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
        console.log('[Food Menu Nav] Initialized first nav item as active');
    }

    // Add scroll handler
    container.addEventListener('scroll', () => {
        if (foodMenu.classList.contains('active')) {
            console.log('[Food Menu Nav] Container scrolled:', {
                scrollTop: container.scrollTop,
                isMenuActive: foodMenu.classList.contains('active')
            });
            setActiveNavItem();
            menuNav?.classList.toggle('floating', container.scrollTop > 100);
        }
    });
}

// Export functions for use in main loader
window.loadFoodMenuData = loadFoodMenuData;
window.renderFoodMenu = renderFoodMenu;

// Initialize food menu when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Food Menu] DOM loaded, initializing...');
    const foodMenuData = await loadFoodMenuData();
    if (foodMenuData) {
        console.log('[Food Menu] Data loaded, rendering menu');
        renderFoodMenu(foodMenuData);
        console.log('[Food Menu] Menu rendered');
    }
}); 