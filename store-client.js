// --- store-client.js ---
// Lógica da Loja (Cliente), Menu, Modal e Carrinho

function applyStoreSettings() {
    if(!storeData) return;
    const s = storeData.settings;
    document.title = s.name;
    
    const logoEl = document.querySelector('.logo');
    const bannerEl = document.querySelector('.banner-img');
    const nameEl = document.querySelector('.store-info h1');
    
    const headerContainer = document.querySelector('.header-content');
    if(headerContainer) {
        headerContainer.classList.remove('layout-left', 'layout-center');
        const alignMode = s.logoAlign || 'left'; 
        headerContainer.classList.add(`layout-${alignMode}`);
    }

    if (logoEl && s.logo) logoEl.src = s.logo;
    if (bannerEl && s.banner) bannerEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${s.banner}')`;
    if (nameEl) nameEl.innerText = s.name;

    // Promo Bar
    const promoBar = document.getElementById('promoBar');
    const defaultP = { enabled: true, text: "Oferta", icon: "moped", targetCat: "", bgColor: "#ff0000", textColor: "#ffffff", iconColor: "#ffffff", btnEnabled: true };
    const p = { ...defaultP, ...(s.promoBar || {}) };

    if(promoBar) {
        if(p.enabled === true || p.enabled === "true") {
            promoBar.style.display = 'flex';
            promoBar.style.backgroundColor = p.bgColor;
            const iconEl = promoBar.querySelector('i');
            if(iconEl) { iconEl.innerText = p.icon; iconEl.style.color = p.iconColor; }
            const spanEl = promoBar.querySelector('.promo-content span');
            if(spanEl) { spanEl.innerText = p.text; spanEl.style.color = p.textColor; }
            const btnEl = promoBar.querySelector('.promo-btn');
            if(btnEl) {
                if(p.btnEnabled === false || p.btnEnabled === "false") { btnEl.style.display = 'none'; } 
                else {
                    btnEl.style.display = 'block';
                    btnEl.onclick = function() {
                        if(p.targetCat) {
                            const target = document.getElementById(p.targetCat);
                            if(target) {
                                const offset = 120; 
                                const bodyRect = document.body.getBoundingClientRect().top;
                                const elementRect = target.getBoundingClientRect().top;
                                const elementPosition = elementRect - bodyRect;
                                const offsetPosition = elementPosition - offset;
                                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                            }
                        } else { window.scrollTo({top: 0, behavior: 'smooth'}); }
                    };
                }
            }
        } else { promoBar.style.display = 'none'; }
    }

    if (s.pixel && s.pixel.length > 5 && !window.pixelInjected) {
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', s.pixel);
        fbq('track', 'PageView');
        window.pixelInjected = true; 
    }


    // Exibe o tempo de entrega no topo do cardápio
const storeMeta = document.querySelector('.store-meta');
if (storeMeta && s.feeDesc) {
    if (!document.getElementById('storeTimeIndicator')) {
        const timeHtml = `<span id="storeTimeIndicator" style="display:flex; align-items:center; gap:4px; margin-left:10px; color: #777;">
                            <i class="material-icons" style="font-size:1rem;">schedule</i> ${s.feeDesc}
                          </span>`;
        storeMeta.innerHTML += timeHtml;
    }
}


}

function initHome() { renderMenuClient(); setupScrollSpy(); checkActiveOrder(); }

function checkActiveOrder() { 
    if(localStorage.getItem('bh_last_active_order')) { 
        const alert = document.getElementById("activeOrderAlert"); 
        if(alert) alert.style.display = "flex"; 
    }
    const history = JSON.parse(localStorage.getItem('bh_user_history')) || [];
    const btnHistory = document.getElementById("btnHistory");
    if(btnHistory) {
        if(history.length > 0) btnHistory.classList.add("active-orange");
        else btnHistory.classList.remove("active-orange");
    }
}

function goToActiveOrder() { window.location.href = `status.html?id=${localStorage.getItem('bh_last_active_order')}&loja=${currentSlug}`; }

function renderMenuClient() {
    const container = document.getElementById("menuContainer"); 
    container.innerHTML = "";
    const nav = document.getElementById("categoryList"); 
    nav.innerHTML = "";

    const featuredContainer = document.getElementById("featuredContainer");
    const featuredList = document.getElementById("featuredCarouselList");
    
    let allFeatured = [];
    storeData.menu.forEach(cat => {
        cat.items.forEach(item => { if(item.isFeatured) allFeatured.push(item); });
    });

    if(featuredContainer && featuredList) {
        if(allFeatured.length > 0) {
            featuredList.innerHTML = ""; 
            allFeatured.forEach(item => {
                const itemStr = encodeURIComponent(JSON.stringify(item)).replace(/'/g, "%27");
                let badgeHtml = "";
                if(item.isBestSeller) {
                    badgeHtml = `<div class="bestseller-tag"><i class="material-icons">local_fire_department</i><span>Mais pedido</span></div>`;
                }
                featuredList.innerHTML += `<div class="featured-card" onclick="openModal('${itemStr}')">${badgeHtml} <img src="${item.img}" class="featured-img"><div class="featured-info"><div class="featured-name">${item.name}</div><div class="featured-price">R$ ${item.price.toFixed(2)}</div></div></div>`;
            });
            featuredContainer.style.display = "block";
        } else { featuredContainer.style.display = "none"; }
    }

    storeData.menu.forEach((cat, idx) => {
        if(cat.items.length > 0) {
            nav.innerHTML += `<li><a href="#${cat.id}" class="${idx===0?'active':''}">${cat.name}</a></li>`;
            let itemsHtml = cat.items.map(i => createProductCard(i)).join('');
            container.innerHTML += `<section id="${cat.id}" class="category-section"><h2 class="category-title">${cat.name}</h2><div class="products-grid">${itemsHtml}</div></section>`;
        }
    });
}

function createProductCard(item) {
    const itemStr = encodeURIComponent(JSON.stringify(item)).replace(/'/g, "%27");
    let priceHtml = "";
    let discountBadge = "";
    if(item.originalPrice && item.originalPrice > item.price) {
        const percent = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
        priceHtml = `<div class="price-container"><span class="old-price-strike">R$ ${item.originalPrice.toFixed(2)}</span><span class="price">R$ ${item.price.toFixed(2)}</span></div>`;
        discountBadge = `<div class="tag-badge green" style="position:absolute; bottom:5px; left:50%; transform:translateX(-50%); width:max-content; box-shadow:0 2px 4px rgba(0,0,0,0.3); z-index:10;">${percent}% OFF</div>`;
    } else { priceHtml = `<span class="price">R$ ${item.price.toFixed(2)}</span>`; }

    let fireBadge = "";
    if(item.isBestSeller) {
        fireBadge = `<div class="tag-badge dark" style="position:absolute; top:-8px; right:-8px; box-shadow:0 2px 5px rgba(0,0,0,0.3); z-index:11;"><i class="material-icons" style="font-size:0.8rem; color:#FF5722;">local_fire_department</i> Mais pedido</div>`;
    }

    return `<div class="product-card" onclick="openModal('${itemStr}')"><div style="position:relative; width:100px; height:100px; flex-shrink:0;"><img src="${item.img}" class="prod-img" style="width:100%; height:100%; border-radius:8px; object-fit:cover;">${fireBadge}${discountBadge}</div><div class="prod-info"><h3>${item.name}</h3><p class="prod-desc">${item.desc}</p><div class="prod-footer">${priceHtml}<button class="add-btn-mini"><i class="material-icons">add</i></button></div></div></div>`;
}

function openModal(itemStr) {
    currentProduct = JSON.parse(decodeURIComponent(itemStr));
    currentQty = 1; tempComplements = [];
    document.getElementById("modalImg").src = currentProduct.img;
    document.getElementById("modalTitle").innerText = currentProduct.name;
    document.getElementById("modalDesc").innerText = currentProduct.desc;
    document.getElementById("modalPrice").innerText = `R$ ${currentProduct.price.toFixed(2)}`;
    document.getElementById("modalQty").innerText = 1;
    document.getElementById("modalBtnPrice").innerText = `R$ ${currentProduct.price.toFixed(2)}`;
    
    let compArea = document.getElementById('client-comps-area');
    if (!compArea) {
        const obsTextArea = document.getElementById('modalObs');
        const targetParent = document.querySelector('.options-section') || obsTextArea.parentNode;
        compArea = document.createElement('div');
        compArea.id = 'client-comps-area';
        if(document.querySelector('.options-section')) targetParent.parentNode.insertBefore(compArea, targetParent);
        else targetParent.insertBefore(compArea, obsTextArea.previousElementSibling || obsTextArea);
    }
    let html = "";
    if (currentProduct.complements && currentProduct.complements.length > 0) {
        html += `<div style="margin:10px 0; border-bottom:1px solid #eee; padding-bottom:10px;"><h3 style="font-size:0.9rem; margin-bottom:5px;">Adicionais</h3>`;
        currentProduct.complements.forEach((c, i) => { html += `<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>${c.name} (+R$ ${c.price.toFixed(2)})</span><input type="checkbox" onchange="toggleClientComp(${c.price}, this)"></div>`; });
        html += `</div>`;
    }
    compArea.innerHTML = html;
    document.getElementById("productModal").classList.add("active");
}

function toggleClientComp(price, el) {
    let totalExtras = 0;
    const checks = document.querySelectorAll('#client-comps-area input:checked');
    checks.forEach(chk => {
        try { const val = parseFloat(chk.previousElementSibling.innerText.split('+R$')[1].replace(')', '')); if(!isNaN(val)) totalExtras += val; } catch(e){}
    });
    const final = (currentProduct.price + totalExtras) * currentQty;
    document.getElementById("modalBtnPrice").innerText = `R$ ${final.toFixed(2)}`;
}

function changeQty(d) {
    if(currentQty+d > 0) { currentQty += d; document.getElementById("modalQty").innerText = currentQty; toggleClientComp(0, null); }
}

function confirmAdd() {
    let totalExtras = 0; 
    let addonsList = []; 
    let obsLegacy = "";  
    document.querySelectorAll('#client-comps-area input:checked').forEach(chk => {
        const txt = chk.previousElementSibling.innerText; 
        try { 
            const val = parseFloat(txt.split('+R$')[1].replace(')', '')); 
            const name = txt.split(' (+')[0];
            if(!isNaN(val)) { 
                totalExtras += val; 
                addonsList.push({ name: name, price: val });
                obsLegacy += ` + ${name}`;
            } 
        } catch(e){}
    });
    const userNote = document.getElementById("modalObs").value.trim();
    const finalObs = userNote + (obsLegacy ? ` (${obsLegacy})` : "");
    cart.push({ 
        ...currentProduct, 
        qty: currentQty, 
        obs: finalObs,          
        userNote: userNote,     
        addons: addonsList,     
        price: currentProduct.price + totalExtras, 
        total: (currentProduct.price + totalExtras) * currentQty 
    });
    if(typeof fbq === 'function') {
        fbq('track', 'AddToCart', { content_name: currentProduct.name, value: (currentProduct.price + totalExtras) * currentQty, currency: 'BRL' });
    }
    localStorage.setItem('bh_cart', JSON.stringify(cart)); 
    updateCartUI(); 
    closeModal(); 
    document.getElementById("modalObs").value = "";
}

function closeModal() { document.getElementById("productModal").classList.remove("active"); }
function goToCheckout() { window.location.href = `checkout.html?loja=${currentSlug}`; }
function updateCartUI() {
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalVal = cart.reduce((acc, item) => acc + item.total, 0);
    const float = document.getElementById("cartFloat");
    if(float) { document.getElementById("cartCount").innerText = totalQty; document.getElementById("cartTotalFloat").innerText = `R$ ${totalVal.toFixed(2)}`; float.style.display = totalQty > 0 ? "flex" : "none"; }
    updateGlobalCartCount();
}
function updateGlobalCartCount() {
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById("headerCartCount");
    if(badge) { badge.innerText = count; badge.style.display = count > 0 ? "flex" : "none"; }
    const btnCart = document.getElementById("btnCart");
    if(btnCart) {
        if(count > 0) btnCart.classList.add("active-orange");
        else btnCart.classList.remove("active-orange");
    }
}
function setupScrollSpy() { /* ... */ }

function openOrderHistory() {
    const history = JSON.parse(localStorage.getItem('bh_user_history')) || [];
    const container = document.getElementById("orderHistoryList");
    loadStoreContext(); 
    if (history.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#777; padding:20px;'>Você ainda não fez pedidos nesta loja.</p>";
    } else {
        container.innerHTML = "";
        [...history].reverse().forEach(id => {
            const order = storeData.orders ? storeData.orders.find(o => o.id === id) : null;
            if (order) {
                let statusTxt = "Recebido"; let statusClass = "st-pending"; 
                if(order.status === 'preparing') { statusTxt = "Preparando"; statusClass = "st-preparing"; }
                else if(order.status === 'delivery') { statusTxt = "Saiu p/ Entrega"; statusClass = "st-delivery"; }
                else if(order.status === 'done') { statusTxt = "Entregue"; statusClass = "st-delivery"; }
                const dateObj = new Date(order.timestamp);
                const date = dateObj.toLocaleDateString('pt-BR');
                const time = dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                container.innerHTML += `<div class="history-item" onclick="window.location.href='status.html?id=${id}&loja=${currentSlug}'"><div class="history-info"><strong>Pedido #${id}</strong><span>${date} às ${time} • R$ ${order.total.toFixed(2)}</span></div><div class="history-status ${statusClass}">${statusTxt}</div></div>`;
            }
        });
    }
    document.getElementById("historyModal").classList.add("active");
}
function closeOrderHistory() { document.getElementById("historyModal").classList.remove("active"); }

// Lógica de Busca
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            const termo = e.target.value.toLowerCase();
            const produtos = document.querySelectorAll('.product-card');
            produtos.forEach(prod => {
                const nome = prod.querySelector('h3').innerText.toLowerCase();
                const desc = prod.querySelector('.prod-desc').innerText.toLowerCase();
                if (nome.includes(termo) || desc.includes(termo)) { prod.style.display = "flex"; } else { prod.style.display = "none"; }
            });
            document.querySelectorAll('.category-section').forEach(sec => {
                const totalItems = sec.querySelectorAll('.product-card');
                let temVisivel = false;
                totalItems.forEach(i => { if(i.style.display !== 'none') temVisivel = true; });
                sec.style.display = temVisivel ? "block" : "none";
            });
        });
    }
});