// Menu Data Loader
async function loadMenuData() {
    try {
        console.log('Attempting to fetch menu.json...');
        const response = await fetch('menu.json');
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to load menu data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Menu data loaded successfully');
        return data;
    } catch (error) {
        console.error('Error loading menu data:', error);
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack
        });
        return null;
    }
}

// Telegram WebApp Integration
let webapp = null;
let cart = [];

function initializeTelegramWebApp() {
    webapp = window.Telegram.WebApp;
    
    // Set viewport heights
    const setViewportHeight = () => {
        const vh = webapp.viewportHeight;
        const stableVh = webapp.viewportStableHeight;
        document.documentElement.style.setProperty('--tg-viewport-height', `${vh}px`);
        document.documentElement.style.setProperty('--tg-viewport-stable-height', `${stableVh}px`);
        
        // Force layout recalculation
        document.body.style.height = `${vh}px`;
        document.querySelector('.container').style.minHeight = `${stableVh}px`;
    };

    // Set platform-specific colors
    const initializeColors = () => {
        if (webapp.platform === 'android' || webapp.platform === 'ios') {
            webapp.setBackgroundColor('#0a0a0a');
            webapp.setHeaderColor('#1b3c55');
        }
    };

    // Initialize back button handling
    const backButton = webapp.BackButton;
    backButton.onClick(() => {
        if (document.querySelector('.cart-modal')) {
            document.body.removeChild(document.querySelector('.cart-modal'));
            webapp.HapticFeedback.impactOccurred('medium');
            return;
        }
        
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu.classList.contains('active')) {
            toggleMenu();
            webapp.HapticFeedback.impactOccurred('medium');
            return;
        }
        
        webapp.close();
    });

    // Set up event listeners
    webapp.onEvent('viewportChanged', setViewportHeight);
    webapp.onEvent('themeChanged', initializeColors);

    // Initialize
    setViewportHeight();
    initializeColors();
    webapp.expand();
    webapp.ready();

    return webapp;
}

// Menu Toggle Function
function toggleMenu(event) {
    const clickedOption = event.target.closest('.menu-option');
    console.log('[Menu Toggle] Toggle menu called:', {
        clickedOption: clickedOption?.className,
        eventTarget: event.target.className,
        currentActiveMenu: document.querySelector('.menu-container.active, .menu-page.active')?.id
    });
    
    if (!clickedOption) {
        console.log('[Menu Toggle] No menu option clicked, returning');
        return;
    }

    const switchElement = document.querySelector('.menu-switch');
    const specialMenu = document.getElementById('cocktail-menu');
    const mainMenu = document.getElementById('main-menu');
    const foodMenu = document.getElementById('food-menu');
    const vipMenu = document.getElementById('vip-menu');
    
    console.log('[Menu Toggle] Menu elements state:', {
        special: specialMenu?.classList.contains('active'),
        main: mainMenu?.classList.contains('active'),
        food: foodMenu?.classList.contains('active'),
        vip: vipMenu?.classList.contains('active')
    });
    
    // Hide all menus first
    [specialMenu, mainMenu, foodMenu, vipMenu].forEach(menu => {
        if (menu) {
            menu.classList.remove('active');
            console.log(`[Menu Toggle] Removed active class from ${menu.id}`);
        }
    });
    
    // Show the selected menu
    if (clickedOption.classList.contains('special-option')) {
        console.log('[Menu Toggle] Activating special menu');
        specialMenu?.classList.add('active');
        switchElement.setAttribute('data-menu', 'special');
    } else if (clickedOption.classList.contains('main-option')) {
        console.log('[Menu Toggle] Activating main menu');
        mainMenu?.classList.add('active');
        switchElement.setAttribute('data-menu', 'main');
    } else if (clickedOption.classList.contains('food-option')) {
        console.log('[Menu Toggle] Activating food menu');
        foodMenu?.classList.add('active');
        switchElement.setAttribute('data-menu', 'food');
    } else if (clickedOption.classList.contains('vip-option')) {
        console.log('[Menu Toggle] Activating vip menu');
        vipMenu?.classList.add('active');
        switchElement.setAttribute('data-menu', 'vip');
    }
    
    console.log('[Menu Toggle] Final menu state:', {
        activeMenu: document.querySelector('.menu-container.active, .menu-page.active')?.id,
        switchState: switchElement.getAttribute('data-menu')
    });
    
    // Add haptic feedback
    if (webapp?.HapticFeedback) {
        webapp.HapticFeedback.impactOccurred('heavy');
    }
}

// Template Functions
function createSignatureCocktailItem(item) {
    return `
        <div class="menu-item" data-id="${item.id}">
            <div class="item-header">
                <span class="item-name">${item.name}</span>
                <span class="item-price">${item.price} ${item.currency}</span>
            </div>
            <div class="item-description">${item.description}</div>
            <div class="item-ingredients">${item.ingredients}</div>
            ${item.volume ? `<div class="item-volume">${item.volume}</div>` : ''}
            <button class="add-to-cart" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;
}

function createMainMenuItem(item) {
    return `
        <div class="menu-item" data-id="${item.id}">
            <div class="item-header">
                <span class="item-name">${item.name}</span>
                <span class="item-price">${item.price} ${item.currency}</span>
            </div>
            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            ${item.ingredients ? `<div class="item-ingredients">${item.ingredients}</div>` : ''}
            ${item.volume ? `<div class="item-volume">${item.volume}</div>` : ''}
            <button class="add-to-cart" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;
}

// Render Functions
function renderSignatureMenu(menuData) {
    const container = document.getElementById('cocktail-menu');
    if (!container) return;
    
    const signatureSection = menuData.menu.signature;
    container.innerHTML = `
        <h1 class="subtitle">${signatureSection.title}</h1>
        <div class="menu-items">
            ${signatureSection.items.map(item => createSignatureCocktailItem(item)).join('')}
        </div>
    `;
}

function renderMainMenu(menuData) {
    const container = document.getElementById('main-menu');
    if (!container) return;

    let html = `
        <h1 class="subtitle">ОСНОВНОЕ МЕНЮ</h1>
        <nav class="menu-nav">
            <a href="#signature" class="nav-item signature">АВТОРСКИЕ</a>
            ${menuData.navigation[1].sections.map(nav => `
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
                <div class="menu-items">`;
        
        if (section.type === 'main' && section.id === 'spirits') {
            // Group items by subtype
            const groupedSpirits = section.items.reduce((acc, item) => {
                const subtype = item.subtype || 'other';
                if (!acc[subtype]) {
                    acc[subtype] = [];
                }
                acc[subtype].push(item);
                return acc;
            }, {});

            // Render each subtype group
            Object.entries(groupedSpirits).forEach(([subtype, items]) => {
                if (subtype !== 'other') {
                    html += `<h3 class="subtype-title">${getSubtypeTitle(subtype)}</h3>`;
                }
                items.forEach(item => {
                    html += createMainMenuItem(item);
                });
            });
        } else {
            // Regular section rendering
            html += section.items.map(item => createMainMenuItem(item)).join('');
        }
        
        html += `
                </div>
            </section>
        `;
    });

    container.innerHTML = html;
}

// Helper function to get formatted subtype titles
function getSubtypeTitle(subtype) {
    const titles = {
        'vodka': 'ВОДКА',
        'gin': 'ДЖИН',
        'rum': 'РОМ',
        'tequila': 'ТЕКИЛА',
        'whiskey': 'ВИСКИ',
        'other': 'ДРУГОЕ'
    };
    return titles[subtype] || subtype.toUpperCase();
}

// Navigation Helper Functions
function setActiveNavItem() {
    const activeMenu = document.querySelector('.menu-container.active, .menu-page.active');
    if (!activeMenu || (activeMenu.id !== 'main-menu' && activeMenu.id !== 'cocktail-menu')) return;
    
    const menuNav = document.querySelector(`#${activeMenu.id} .menu-nav`);
    const navItems = menuNav?.querySelectorAll('.nav-item');
    const sections = activeMenu.querySelectorAll('.menu-section');
    const container = document.querySelector('.container');
    
    if (!menuNav || !navItems.length || !sections.length) return;
    
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

// Event Listeners
function initializeEventListeners() {
    const menuNav = document.querySelector('.menu-nav');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.menu-section');
    const backToTopButton = document.getElementById('backToTop');
    const menuItems = document.querySelectorAll('.menu-item');
    const container = document.querySelector('.container');

    // Add click handlers for menu items
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            if (webapp?.HapticFeedback) {
                webapp.HapticFeedback.selectionChanged();
            }
        });
    });

    function handleScroll() {
        setActiveNavItem();
        
        requestAnimationFrame(() => {
            if (container.scrollTop > 100) {
                menuNav?.classList.add('floating');
                backToTopButton.style.opacity = '0.4';
                backToTopButton.style.pointerEvents = 'auto';
            } else {
                menuNav?.classList.remove('floating');
                backToTopButton.style.opacity = '0';
                backToTopButton.style.pointerEvents = 'none';
            }
        });
    }

    container.addEventListener('scroll', handleScroll);
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const mainMenu = document.getElementById('main-menu');
            const foodMenu = document.getElementById('food-menu');
            
            // Special handling for signature cocktails button
            if (this.classList.contains('signature')) {
                const menuSwitch = document.querySelector('.menu-switch');
                const specialOption = menuSwitch.querySelector('.special-option');
                if (specialOption) {
                    specialOption.click(); // Trigger click on the special menu option
                }
                if (webapp?.HapticFeedback) {
                    webapp.HapticFeedback.impactOccurred('medium');
                }
                return;
            }
            
            // Skip menu switching if we're in food menu
            if (foodMenu?.classList.contains('active')) {
                return;
            }
            
            // Regular section navigation for main menu
            if (!mainMenu.classList.contains('active')) {
                const menuSwitch = document.querySelector('.menu-switch');
                const mainOption = menuSwitch.querySelector('.main-option');
                if (mainOption) {
                    mainOption.click(); // Trigger click on the main menu option
                }
            }
            
            const targetId = this.getAttribute('href').slice(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                setTimeout(() => {
                    const menuHeight = menuNav?.offsetHeight || 0;
                    const targetPosition = targetSection.offsetTop - menuHeight - 10;
                    
                    container.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    if (webapp?.HapticFeedback) {
                        webapp.HapticFeedback.impactOccurred('light');
                    }
                }, 300);
            }
        });
    });

    backToTopButton.addEventListener('click', () => {
        container.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        if (webapp?.HapticFeedback) {
            webapp.HapticFeedback.impactOccurred('medium');
        }
    });

    // Initialize first nav item as active
    if (navItems.length > 0) {
        navItems[0].classList.add('active');
    }
}

// Shopping Cart Functionality
function createCartButton() {
    const cartButton = document.createElement('button');
    cartButton.className = 'shopping-cart';
    cartButton.innerHTML = '<i class="fas fa-clipboard-list"></i> <span class="cart-count">0</span>';
    document.body.appendChild(cartButton);
    return cartButton;
}

function updateCartButton() {
    const cartButton = document.querySelector('.shopping-cart');
    if (!cartButton) return;
    
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartButton.querySelector('.cart-count').textContent = count;
    cartButton.classList.toggle('has-items', count > 0);
}

function addToCart(item) {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
        existingItem.quantity += 1;
        if (webapp?.HapticFeedback) {
            webapp.HapticFeedback.notificationOccurred('success');
        }
    } else {
        cart.push({ ...item, quantity: 1 });
        if (webapp?.HapticFeedback) {
            webapp.HapticFeedback.impactOccurred('medium');
        }
    }
    updateCartButton();
    animateCartAdd(item);
}

function animateCartAdd(item) {
    const menuItem = document.querySelector(`[data-id="${item.id}"]`);
    if (!menuItem) return;

    menuItem.classList.add('shake');
    setTimeout(() => menuItem.classList.remove('shake'), 500);

    const addButton = menuItem.querySelector('.add-to-cart');
    const priceElement = menuItem.querySelector('.item-price');
    
    if (addButton) {
        addButton.classList.add('added');
        setTimeout(() => addButton.classList.remove('added'), 300);
    }
    
    if (priceElement) {
        priceElement.classList.add('added');
        setTimeout(() => priceElement.classList.remove('added'), 300);
    }
}

function showCart() {
    const existingModal = document.querySelector('.cart-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }

    const cartModal = document.createElement('div');
    cartModal.className = 'cart-modal';
    let cartContent = '<h2>Ваш выбор</h2>';
    
    // Separate food and drinks items
    const foodItems = cart.filter(item => item.type === 'food');
    const drinkItems = cart.filter(item => item.type !== 'food');
    let foodTotal = 0;
    let drinksTotal = 0;

    if (cart.length === 0) {
        cartContent += '<p class="cart-empty">Список пуст</p>';
    } else {
        // Add drinks section if there are any drink items
        if (drinkItems.length > 0) {
            cartContent += `<p class="cart-subtitle drinks-subtitle">Сделайте скрин и покажите бармену</p>`;
            drinkItems.forEach(item => {
                const itemIndex = cart.indexOf(item);
                cartContent += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <span class="cart-item-name">${item.name}</span>
                            ${item.ingredients ? `<div class="cart-item-ingredients">${item.ingredients}</div>` : ''}
                        </div>
                        <div class="cart-item-controls">
                            <button class="remove-item" data-index="${itemIndex}"><i class="fas fa-minus"></i></button>
                            <span class="cart-item-quantity">${item.quantity}</span>
                            <button class="add-item" data-index="${itemIndex}"><i class="fas fa-plus"></i></button>
                        </div>
                        <span class="cart-item-price">${item.price * item.quantity} ${item.currency}</span>
                    </div>`;
                drinksTotal += item.price * item.quantity;
            });
            // Only show drinks subtotal if there are also food items
            if (foodItems.length > 0) {
                cartContent += `<p class="cart-subtotal">Напитки: ${drinksTotal} ₽</p>`;
            }
        }

        // Add food section if there are any food items
        if (foodItems.length > 0) {
            const foodSubtitle = drinkItems.length > 0 
                ? '... а эту часть официанту'
                : 'Сделайте скрин и покажите официанту';
            cartContent += `<p class="cart-subtitle food-subtitle">${foodSubtitle}</p>`;
            foodItems.forEach((item, index) => {
                const itemIndex = cart.indexOf(item);
                cartContent += `
                    <div class="cart-item food-item">
                        <div class="cart-item-info">
                            <span class="cart-item-name">${item.name}</span>
                            ${item.ingredients ? `<div class="cart-item-ingredients truncated" onclick="toggleIngredients(this)">${item.ingredients}</div>` : ''}
                        </div>
                        <div class="cart-item-controls">
                            <button class="remove-item" data-index="${itemIndex}"><i class="fas fa-minus"></i></button>
                            <span class="cart-item-quantity">${item.quantity}</span>
                            <button class="add-item" data-index="${itemIndex}"><i class="fas fa-plus"></i></button>
                        </div>
                        <span class="cart-item-price">${item.price * item.quantity} ${item.currency}</span>
                    </div>`;
                foodTotal += item.price * item.quantity;
            });
            cartContent += `<p class="cart-subtotal">Кухня: ${foodTotal} ₽</p>`;
        }

        const total = foodTotal + drinksTotal;
        cartContent += `<p class="cart-total">Итого: ${total} ₽</p>`;
    }
    
    cartContent += '<div class="cart-buttons">';
    if (cart.length > 0) {
        cartContent += '<button class="clear-cart">Очистить</button>';
    }
    cartContent += '<button class="close-cart">Закрыть</button>';
    cartContent += '</div>';

    cartModal.innerHTML = cartContent;
    document.body.appendChild(cartModal);

    // Event Listeners for cart modal
    cartModal.querySelector('.close-cart').addEventListener('click', () => {
        document.body.removeChild(cartModal);
        if (webapp?.HapticFeedback) {
            webapp.HapticFeedback.impactOccurred('medium');
        }
    });

    const removeButtons = cartModal.querySelectorAll('.remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.remove-item').getAttribute('data-index'));
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                if (webapp?.HapticFeedback) {
                    webapp.HapticFeedback.impactOccurred('light');
                }
            } else {
                cart.splice(index, 1);
                if (webapp?.HapticFeedback) {
                    webapp.HapticFeedback.notificationOccurred('warning');
                }
            }
            updateCartButton();
            showCart();
        });
    });

    const addButtons = cartModal.querySelectorAll('.add-item');
    addButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.add-item').getAttribute('data-index'));
            cart[index].quantity += 1;
            if (webapp?.HapticFeedback) {
                webapp.HapticFeedback.impactOccurred('light');
            }
            updateCartButton();
            showCart();
        });
    });

    const clearCartButton = cartModal.querySelector('.clear-cart');
    if (clearCartButton) {
        clearCartButton.addEventListener('click', () => {
            cart = [];
            updateCartButton();
            document.body.removeChild(cartModal);
            if (webapp?.HapticFeedback) {
                webapp.HapticFeedback.notificationOccurred('warning');
            }
        });
    }
}

// Add the toggle function at the end of the file
function toggleIngredients(element) {
    element.classList.toggle('truncated');
    if (webapp?.HapticFeedback) {
        webapp.HapticFeedback.impactOccurred('light');
    }
}

// Initialize Menu
async function initializeMenu() {
    const menuData = await loadMenuData();
    if (!menuData) return;

    // Initialize Telegram WebApp
    webapp = initializeTelegramWebApp();

    // Render menu sections
    renderSignatureMenu(menuData);
    renderMainMenu(menuData);
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Set up menu switch click handler
    const menuSwitch = document.querySelector('.menu-switch');
    if (menuSwitch) {
        menuSwitch.removeEventListener('click', toggleMenu); // Remove any existing handlers
        menuSwitch.addEventListener('click', (event) => {
            console.log('Menu switch clicked:', event.target);
            console.log('Clicked option:', event.target.closest('.menu-option'));
            toggleMenu(event);
        });
    }
    
    // Initialize navigation
    const container = document.querySelector('.container');
    if (container) {
        container.addEventListener('scroll', () => {
            const menuNav = document.querySelector('.menu-nav');
            if (menuNav) {
                menuNav.classList.toggle('floating', container.scrollTop > 100);
            }
            
            // Check which menu is active and use appropriate navigation
            const activeMenu = document.querySelector('.menu-container.active, .menu-page.active');
            if (activeMenu) {
                if (activeMenu.id === 'food-menu' || activeMenu.id === 'vip-menu') {
                    // Food and VIP menu navigation is handled by their respective loaders
                    return;
                }
                // For main menu and cocktail menu, use our navigation
                const mainMenuNav = document.querySelector('#main-menu .menu-nav');
                if (mainMenuNav) {
                    setActiveNavItem();
                }
            }
        });
    }

    // Initialize cart button
    const cartButton = createCartButton();
    cartButton.addEventListener('click', showCart);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeMenu);

// Clean up event listeners when closing
window.addEventListener('unload', () => {
    if (webapp) {
        webapp.offEvent('viewportChanged');
        webapp.offEvent('themeChanged');
        webapp.BackButton.offClick();
    }
}); 