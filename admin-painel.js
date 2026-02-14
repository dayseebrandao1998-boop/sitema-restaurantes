// --- admin-panel.js ---
// Configurações, Produtos e Histórico

// Antes: index.html... Agora: loja.html
function openMyStore() { 
    window.open(`loja.html?loja=${currentSlug}`, '_blank'); 
}

async function saveNewProduct() {
    const name = document.getElementById('newProdName').value;
    const desc = document.getElementById('newProdDesc').value;
    const price = parseFloat(document.getElementById('newProdPrice').value);
    const originalPrice = parseFloat(document.getElementById('newProdOriginalPrice').value) || 0;
    const catId = document.getElementById('newProdCat').value;
    const fileInput = document.getElementById('newProdFile');
    const galleryUrl = document.getElementById('selectedGalleryUrl').value;
    let finalImg = "https://via.placeholder.com/100"; 

    if(typeof editingProductContext !== 'undefined' && editingProductContext) {
         const oldCat = storeData.menu.find(c => c.id === editingProductContext.catId);
         if(oldCat) {
             const oldItem = oldCat.items.find(i => i.id === editingProductContext.itemId);
             if(oldItem) finalImg = oldItem.img;
         }
    }
    if (fileInput.files.length > 0) {
         try { finalImg = await fileToBase64(fileInput.files[0]); } catch(e){}
    } else if (galleryUrl) { finalImg = galleryUrl; }

    if (!name || isNaN(price) || !catId) return alert("Preencha nome, preço e categoria!");

    const targetCat = storeData.menu.find(c => c.id === catId);
    if (!targetCat) return alert("Categoria não encontrada!");

    if(typeof editingProductContext !== 'undefined' && editingProductContext) {
        const oldCat = storeData.menu.find(c => c.id === editingProductContext.catId);
        if(oldCat) { oldCat.items = oldCat.items.filter(i => i.id !== editingProductContext.itemId); }
        var finalId = editingProductContext.itemId; 
        editingProductContext = null; 
    } else { var finalId = Date.now(); }

    const newItem = {
        id: finalId || Date.now(),
        name: name, desc: desc, price: price, originalPrice: originalPrice,
        img: finalImg, isFeatured: false, isBestSeller: false,
        complements: typeof tempComplements !== 'undefined' ? tempComplements : []
    };

    targetCat.items.push(newItem);
    DB.saveStoreData(currentSlug, storeData);
    closeAdminModal();
    loadAdminMenu();
    // Tenta atualizar a loja se estiver aberta em outra aba (opcional)
    if(typeof renderMenuClient === 'function') renderMenuClient();
}

function renderGallery() {
    const grid = document.getElementById("systemGalleryGrid");
    if(!grid) return;
    grid.innerHTML = "";
    STOCK_IMAGES.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.className = "gallery-item";
        img.onclick = function() { selectStockImage(this, url); };
        grid.appendChild(img);
    });
}

function selectStockImage(el, url) {
    const all = document.getElementById("systemGalleryGrid").querySelectorAll("img");
    all.forEach(i => i.classList.remove('selected'));
    el.classList.add('selected'); 
    document.getElementById("selectedGalleryUrl").value = url;
    document.getElementById("newProdFile").value = ""; 
}

function clearGallerySelection() {
    const all = document.getElementById("systemGalleryGrid").querySelectorAll("img");
    all.forEach(i => i.classList.remove('selected'));
    if(document.getElementById("selectedGalleryUrl")) document.getElementById("selectedGalleryUrl").value = "";
}

function openAddProductModal() {
    editingProductContext = null; 
    document.querySelector('#adminProductModal .confirm-order-btn').innerText = "Salvar Produto";
    const sel = document.getElementById('newProdCat'); 
    sel.innerHTML = "";
    storeData.menu.forEach(c => sel.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    tempComplements = []; 
    renderTempComplements();
    if(document.getElementById("newProdName")) document.getElementById("newProdName").value = "";
    if(document.getElementById("newProdDesc")) document.getElementById("newProdDesc").value = "";
    if(document.getElementById("newProdPrice")) document.getElementById("newProdPrice").value = "";
    if(document.getElementById("newProdFile")) document.getElementById("newProdFile").value = "";
    if(document.getElementById("selectedGalleryUrl")) document.getElementById("selectedGalleryUrl").value = "";
    renderGallery(); 
    document.getElementById("adminProductModal").classList.add("active");
}

async function saveSettings() {
    storeData.settings.name = document.getElementById('confName').value;
    storeData.settings.logoAlign = document.getElementById('confLogoAlign').value;
    storeData.settings.address = document.getElementById('confAddress').value;
    storeData.settings.pixel = document.getElementById('confPixel').value;
    storeData.settings.feeType = document.getElementById('confFeeType').value;
    storeData.settings.ownerPhone = document.getElementById('confOwnerPhone').value;
    storeData.settings.feeValue = parseFloat(document.getElementById('confFeeValue').value) || 0;
    storeData.settings.freeShippingMin = parseFloat(document.getElementById('confFreeShippingMin').value) || 0;
    if(document.getElementById('confFeeDesc')) { storeData.settings.feeDesc = document.getElementById('confFeeDesc').value; } 
    else { storeData.settings.feeDesc = ""; }

    storeData.settings.neighborhoods = tempNeighborhoods;

    const logoFile = document.getElementById('confLogoInput').files[0];
    const bannerFile = document.getElementById('confBannerInput').files[0];
    if (logoFile) { try { storeData.settings.logo = await fileToBase64(logoFile); } catch(e){} }
    if (bannerFile) { try { storeData.settings.banner = await fileToBase64(bannerFile); } catch(e){} }

    const selectedIcon = document.querySelector('input[name="promoIconGroup"]:checked');
    const iconValue = selectedIcon ? selectedIcon.value : "moped";
    
    storeData.settings.promoBar = {
        enabled: document.getElementById('confPromoEnabled').value === 'true',
        text: document.getElementById('confPromoText').value,
        targetCat: document.getElementById('confPromoLink').value,
        bgColor: document.getElementById('confPromoColor').value,
        textColor: document.getElementById('confPromoTextColor').value,
        iconColor: document.getElementById('confPromoIconColor').value,
        btnEnabled: document.getElementById('confPromoBtnEnabled').value === 'true',
        icon: iconValue
    };

    DB.saveStoreData(currentSlug, storeData);
    updateSettingsViewUI();
    document.getElementById('settingsFormMode').style.display = 'none';
    document.getElementById('settingsViewMode').style.display = 'block';
    loadStoreContext(); 
    alert("Configurações Salvas!");
}

function updateSettingsViewUI() {
    const s = storeData.settings;
    document.getElementById('viewStoreName').innerText = s.name;
    document.getElementById('viewLogoPreview').src = s.logo;
    document.getElementById('viewStoreAddress').innerText = s.address;
    document.getElementById('viewPixel').innerText = s.pixel ? "Ativo" : "Inativo";
    document.getElementById('viewFee').innerText = s.feeType === 'fixed' ? `R$ ${s.feeValue.toFixed(2)}` : "Bairros";
}
function enableSettingsEdit() {
    document.getElementById('settingsViewMode').style.display = 'none';
    document.getElementById('settingsFormMode').style.display = 'block';
}

function initAdmin() {
    // Carrega dados na tela
    if(document.getElementById('adminStoreNameDisplay')) document.getElementById('adminStoreNameDisplay').innerText = storeData.settings.name;
    
    document.getElementById('confName').value = storeData.settings.name;
    document.getElementById('confAddress').value = storeData.settings.address;
    document.getElementById('confOwnerPhone').value = storeData.settings.ownerPhone || "";
    document.getElementById('confPixel').value = storeData.settings.pixel || "";
    if(document.getElementById('confLogoAlign')) { document.getElementById('confLogoAlign').value = storeData.settings.logoAlign || 'left'; }
    document.getElementById('confFeeType').value = storeData.settings.feeType;
    document.getElementById('confFeeValue').value = storeData.settings.feeValue;
    if(document.getElementById('confFreeShippingMin')) { document.getElementById('confFreeShippingMin').value = storeData.settings.freeShippingMin || ""; }
    if(document.getElementById('confFeeDesc')) { document.getElementById('confFeeDesc').value = storeData.settings.feeDesc || ""; }
    
    if (storeData.settings.name && storeData.settings.name !== "") {
        updateSettingsViewUI();
        document.getElementById('settingsFormMode').style.display = 'none';
        document.getElementById('settingsViewMode').style.display = 'block';
    } else { document.getElementById('settingsFormMode').style.display = 'block'; }
    
    toggleFeeInputs(); 
    tempNeighborhoods = storeData.settings.neighborhoods || [];
    renderNeighborhoodsAdmin();
    
    const linkSel = document.getElementById('confPromoLink');
    if(linkSel) {
        linkSel.innerHTML = '<option value="">(Nenhum - Topo)</option>';
        storeData.menu.forEach(c => { linkSel.innerHTML += `<option value="${c.id}">${c.name}</option>`; });
    }

    const defaultPromo = { enabled: true, text: "Frete Grátis", icon: "moped", targetCat: "", bgColor: "#ff0000", textColor: "#ffffff", iconColor: "#ffffff", btnEnabled: true };
    const p = { ...defaultPromo, ...(storeData.settings.promoBar || {}) };

    if(document.getElementById('confPromoEnabled')) document.getElementById('confPromoEnabled').value = p.enabled.toString();
    if(document.getElementById('confPromoText')) document.getElementById('confPromoText').value = p.text;
    if(document.getElementById('confPromoLink')) document.getElementById('confPromoLink').value = p.targetCat;
    if(document.getElementById('confPromoColor')) document.getElementById('confPromoColor').value = p.bgColor || "#ff0000";
    if(document.getElementById('confPromoTextColor')) document.getElementById('confPromoTextColor').value = p.textColor || "#ffffff";
    if(document.getElementById('confPromoIconColor')) document.getElementById('confPromoIconColor').value = p.iconColor || "#ffffff";
    if(document.getElementById('confPromoBtnEnabled')) document.getElementById('confPromoBtnEnabled').value = p.btnEnabled !== false ? "true" : "false";

    const iconRadio = document.querySelector(`input[name="promoIconGroup"][value="${p.icon}"]`);
    if(iconRadio) iconRadio.checked = true;
    else { const first = document.querySelector('input[name="promoIconGroup"]'); if(first) first.checked = true; }

    loadAutomationsConfig();
    loadAdminOrders();
    loadAdminMenu();

    // Ativa o clique do botão de Inteligência Artificial
    const btnIA = document.getElementById('btnConnectWhatsapp');
    if(btnIA) {
    btnIA.addEventListener('click', handleConnectIAWhatsApp);
}

}

function loadAdminMenu() {
    const container = document.getElementById("adminMenuList");
    container.innerHTML = "";
    storeData.menu.forEach((cat, idx) => {
        const moveButtons = `
            <div style="display:inline-flex; gap:2px; vertical-align:middle; margin-left:10px;">
                <button onclick="moveCategory(${idx}, -1)" title="Subir Categoria" style="cursor:pointer; border:1px solid #ddd; background:#fff; border-radius:4px; padding:2px;"><i class="material-icons" style="font-size:1.2rem; color:#555;">arrow_upward</i></button>
                <button onclick="moveCategory(${idx}, 1)" title="Descer Categoria" style="cursor:pointer; border:1px solid #ddd; background:#fff; border-radius:4px; padding:2px;"><i class="material-icons" style="font-size:1.2rem; color:#555;">arrow_downward</i></button>
            </div>`;
        container.innerHTML += `<div style="display:flex; align-items:center; margin-top:20px; border-bottom:1px solid #ddd; padding-bottom:5px;"><h3 style="margin:0;">${cat.name}</h3>${moveButtons} </div>`;
        
        cat.items.forEach(item => {
            const starColor = item.isFeatured ? '#FFD700' : '#ccc';
            const starIcon = item.isFeatured ? 'star' : 'star_border';
            const fireColor = item.isBestSeller ? '#FF5722' : '#ccc'; 
            const fireIcon = item.isBestSeller ? 'local_fire_department' : 'local_fire_department';

             container.innerHTML += `
                <div class="admin-menu-item">
                    <div class="menu-item-left">
                        <img src="${item.img}" class="menu-thumb">
                        <div>
                            <strong>${item.name}</strong> <br>
                            ${item.originalPrice > item.price ? `<small style="text-decoration:line-through; color:#999">R$ ${item.originalPrice.toFixed(2)}</small> ` : ''}
                            <small>R$ ${item.price.toFixed(2)}</small>
                        </div>
                    </div>
                    <div style="display:flex; gap:5px; align-items:center;">
                        <button onclick="toggleBestSeller('${cat.id}', ${item.id})" title="Mais Pedido" style="background:none; border:none; cursor:pointer;"><i class="material-icons" style="color:${fireColor}; font-size:1.4rem;">${fireIcon}</i></button>
                        <button onclick="toggleFeatured('${cat.id}', ${item.id})" title="Destacar" style="background:none; border:none; cursor:pointer;"><i class="material-icons" style="color:${starColor}; font-size:1.4rem;">${starIcon}</i></button>
                        <button class="delete-btn" style="background:#e3f2fd; color:#2196f3; border:none; border-radius:4px; cursor:pointer; padding:5px;" onclick="editProduct('${cat.id}', ${item.id})"><i class="material-icons">edit</i></button>
                        <button class="delete-btn" style="background:#ffebee; color:#d32f2f; border:none; border-radius:4px; cursor:pointer; padding:5px;" onclick="deleteProduct('${cat.id}', ${item.id})"><i class="material-icons">delete</i></button>
                    </div>
                </div>`;
        });
    });
}

function deleteProduct(catId, itemId) {
    if(!confirm("Tem certeza que deseja excluir este item?")) return;
    const cat = storeData.menu.find(c => c.id === catId);
    if(cat) {
        cat.items = cat.items.filter(i => i.id !== itemId);
        DB.saveStoreData(currentSlug, storeData);
        loadAdminMenu();
    }
}

function editProduct(catId, itemId) {
    const cat = storeData.menu.find(c => c.id === catId);
    if(cat) {
        const item = cat.items.find(i => i.id === itemId);
        if(item) {
            openAddProductModal(); 
            editingProductContext = { catId: catId, itemId: itemId };
            document.querySelector('#adminProductModal .confirm-order-btn').innerText = "Atualizar Produto";
            document.getElementById('newProdName').value = item.name;
            document.getElementById('newProdDesc').value = item.desc;
            document.getElementById('newProdPrice').value = item.price;
            if(document.getElementById('newProdOriginalPrice')) { document.getElementById('newProdOriginalPrice').value = item.originalPrice || ""; }
            document.getElementById('newProdCat').value = catId;
            document.getElementById('selectedGalleryUrl').value = item.img;
            // Se tiver complementos, carrega (aqui simplificado)
            if(typeof tempComplements !== 'undefined') {
                tempComplements = item.complements || [];
                renderTempComplements();
            }
        }
    }
}

function addCategoryPrompt() {
    const name = prompt("Nome da categoria:");
    if(name) { storeData.menu.push({ id: 'c'+Date.now(), name, items: [] }); DB.saveStoreData(currentSlug, storeData); loadAdminMenu(); }
}
function addTempComplement() {
    const n = document.getElementById('newCompName').value; const p = parseFloat(document.getElementById('newCompPrice').value)||0;
    if(n){ tempComplements.push({name:n, price:p}); renderTempComplements(); document.getElementById('newCompName').value=""; document.getElementById('newCompPrice').value=""; }
}
function renderTempComplements() {
    document.getElementById('complementsContainer').innerHTML = tempComplements.map(c=>`<span style="background:#eee;padding:2px 5px;margin-right:5px;border-radius:4px">${c.name} (+R$${c.price})</span>`).join('');
}

function toggleFeatured(catId, itemId) {
    const cat = storeData.menu.find(c => c.id === catId);
    if(cat) {
        const item = cat.items.find(i => i.id === itemId);
        if(item) { item.isFeatured = !item.isFeatured; DB.saveStoreData(currentSlug, storeData); loadAdminMenu(); }
    }
}
function toggleBestSeller(catId, itemId) {
    const cat = storeData.menu.find(c => c.id === catId);
    if(cat) {
        const item = cat.items.find(i => i.id === itemId);
        if(item) { item.isBestSeller = !item.isBestSeller; DB.saveStoreData(currentSlug, storeData); loadAdminMenu(); }
    }
}

function toggleFeeInputs() {
    const type = document.getElementById('confFeeType').value;
    document.getElementById('feeFixedGroup').style.display = 'none';
    document.getElementById('feeNeighGroup').style.display = 'none';
    if (type === 'fixed') { document.getElementById('feeFixedGroup').style.display = 'block'; } 
    else if (type === 'neighborhood') { document.getElementById('feeNeighGroup').style.display = 'block'; } 
}

// --- FUNÇÃO CRUCIAL PARA AS ABAS FUNCIONAREM ---
function switchTab(tab) {
    // Esconde todas
    document.querySelectorAll('.active-section').forEach(el => { 
        el.classList.remove('active-section'); 
        el.classList.add('hidden-section'); 
    });
    // Mostra a selecionada
    const target = document.getElementById(`tab-${tab}`);
    if(target) {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
    }
    // Atualiza botões
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // Tenta achar o botão que foi clicado ou similar
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(b => {
        if(b.getAttribute('onclick') && b.getAttribute('onclick').includes(tab)) {
            b.classList.add('active');
        }
    });
}

function closeAdminModal() { document.getElementById("adminProductModal").classList.remove("active"); }

function renderNeighborhoodsAdmin() {
    const list = document.getElementById("neighborhoodList");
    if(!list) return;
    list.innerHTML = "";
    tempNeighborhoods.forEach((n, index) => {
        list.innerHTML += `<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #eee; align-items:center;"><span><strong>${n.name}</strong>: R$ ${parseFloat(n.price).toFixed(2)}</span><button onclick="removeNeighborhood(${index})" style="color:red; background:none; border:none; cursor:pointer;">&times;</button></div>`;
    });
}
function addNeighborhood() {
    const name = document.getElementById("newNeighName").value;
    const price = parseFloat(document.getElementById("newNeighPrice").value);
    if(name && !isNaN(price)) { tempNeighborhoods.push({ name, price }); renderNeighborhoodsAdmin(); document.getElementById("newNeighName").value = ""; document.getElementById("newNeighPrice").value = ""; } 
    else { alert("Preencha nome e valor corretamente."); }
}
function removeNeighborhood(index) { tempNeighborhoods.splice(index, 1); renderNeighborhoodsAdmin(); }

function moveCategory(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= storeData.menu.length) return;
    const temp = storeData.menu[index];
    storeData.menu[index] = storeData.menu[newIndex];
    storeData.menu[newIndex] = temp;
    DB.saveStoreData(currentSlug, storeData);
    loadAdminMenu(); 
}

function saveAutomations() {
    if(!storeData.settings.automations) storeData.settings.automations = {};
    storeData.settings.automations = {
        received: document.getElementById('autoMsgReceived').value,
        preparing: document.getElementById('autoMsgPreparing').value,
        delivery: document.getElementById('autoMsgDelivery').value
    };
    DB.saveStoreData(currentSlug, storeData);
    alert("Mensagens de automação salvas!");
}

function loadAutomationsConfig() {
    const aut = storeData.settings.automations || {};
    if(document.getElementById('autoMsgReceived')) {
        document.getElementById('autoMsgReceived').value = aut.received || "Olá {nome}, recebemos seu pedido #{id}! Total: {total}.";
        document.getElementById('autoMsgPreparing').value = aut.preparing || "Ótima notícia {nome}! Seu pedido #{id} já está sendo preparado.";
        document.getElementById('autoMsgDelivery').value = aut.delivery || "Seu pedido #{id} saiu para entrega! O motoboy já está a caminho.";
    }
}

function sendAutomatedWhatsApp(orderId, type) {
    const order = storeData.orders.find(o => o.id === orderId);
    const aut = storeData.settings.automations || {};
    if(!order) return;
    let msgBase = aut[type] || "";
    if(!msgBase) return; 
    const resumoItens = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
    const linkStatus = `http://seu-ip-vps/status.html?id=${order.id}&loja=${currentSlug}`;
    let msgFinal = msgBase.replace(/{nome}/g, order.customerName).replace(/{id}/g, order.id).replace(/{total}/g, `R$ ${order.total.toFixed(2)}`).replace(/{resumo}/g, resumoItens).replace(/{link_status}/g, linkStatus);
    const phone = order.customerPhone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msgFinal)}`, '_blank');
}

// Histórico e Gráficos
let chartRev = null; let chartDay = null; let chartHour = null;

function loadAdminHistory(days = 7) {
    if(!storeData.orders) return;
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - days);
    const filteredOrders = storeData.orders.filter(o => {
        const oDate = new Date(o.timestamp);
        const isValidStatus = (o.status === 'delivery' || o.status === 'done');
        return oDate >= pastDate && oDate <= now && isValidStatus && o.total < 5000;
    }).reverse();

    let totalRev = 0; let totalCount = 0;
    const revByDate = {}; const ordersByDay = [0,0,0,0,0,0,0]; const ordersByHour = new Array(24).fill(0);

    filteredOrders.forEach(o => {
        totalRev += o.total; totalCount++;
        const d = new Date(o.timestamp);
        const dateKey = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
        if(!revByDate[dateKey]) revByDate[dateKey] = 0;
        revByDate[dateKey] += o.total;
        ordersByDay[d.getDay()]++;
        ordersByHour[d.getHours()]++;
    });

    const ticketMedio = totalCount > 0 ? (totalRev / totalCount) : 0;
    if(document.getElementById("histTotalRevenue")) {
        document.getElementById("histTotalRevenue").innerText = `R$ ${totalRev.toFixed(2)}`;
        document.getElementById("histTotalOrders").innerText = totalCount;
        document.getElementById("histTicket").innerText = `R$ ${ticketMedio.toFixed(2)}`;
    }

    const tbody = document.getElementById("historyTableBody");
    if(tbody) {
        tbody.innerHTML = "";
        filteredOrders.forEach(o => {
            const dateObj = new Date(o.timestamp);
            const dateStr = dateObj.toLocaleDateString('pt-BR');
            const timeStr = dateObj.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
            const count = storeData.orders.filter(x => x.customerName === o.customerName).length;
            const loyaltyBadge = count > 1 ? `<span style="color:#e65100; background:#fff3e0; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold;">${count}º Pedido</span>` : `<span style="color:#1565c0; background:#e3f2fd; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold;">Novo</span>`;
            const phoneDisplay = o.customerPhone || "<span style='color:#ccc'>--</span>";
            const addressDisplay = o.address || "Retirada";
            const emailDisplay = o.customerEmail ? `<span style="color:#28a745; font-weight:bold;">${o.customerEmail}</span>` : "<span style='color:#ccc'>--</span>";
            tbody.innerHTML += `<tr style="border-bottom: 1px solid #f1f1f1;"><td style="padding: 12px; color:#555; font-size:0.85rem;">${dateStr}</td><td style="padding: 12px; color:#555; font-size:0.85rem;">${timeStr}</td><td style="padding: 12px; font-weight:600; color:#333;">${o.customerName}</td><td style="padding: 12px; font-size:0.85rem;">${phoneDisplay}</td><td style="padding: 12px; font-size:0.8rem;">${emailDisplay}</td> <td style="padding: 12px; font-size:0.8rem; color:#666; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${addressDisplay}</td><td style="padding: 12px; text-align:center;">${loyaltyBadge}</td><td style="padding: 12px; text-align:right; font-weight:bold; color:var(--primary-color);">R$ ${o.total.toFixed(2)}</td></tr>`;
        });
    }
    if(typeof renderAllCharts === 'function') renderAllCharts(revByDate, ordersByDay, ordersByHour);
}

function filterHistory(days, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => { b.style.background = 'transparent'; b.style.color = '#555'; b.style.border = '1px solid #ddd'; });
    if(btn) { btn.style.background = '#555'; btn.style.color = 'white'; btn.style.border = '1px solid #555'; }
    loadAdminHistory(days);
}

function renderAllCharts(revData, dayData, hourData) {
    const ctxRev = document.getElementById('revenueChart');
    if(ctxRev) {
        if(chartRev) chartRev.destroy();
        const sortedKeys = Object.keys(revData).sort((a,b) => {
            const [da, ma] = a.split('/').map(Number);
            const [db, mb] = b.split('/').map(Number);
            return new Date(2025, ma-1, da) - new Date(2025, mb-1, db);
        });
        const valuesRev = sortedKeys.map(k => revData[k]);
        chartRev = new Chart(ctxRev, {
            type: 'bar', 
            data: { labels: sortedKeys, datasets: [{ type: 'line', label: 'Tendência', data: valuesRev, borderColor: '#FF3B30', borderWidth: 3, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#fff', pointBorderColor: '#FF3B30', fill: false, order: 1 }, { type: 'bar', label: 'Faturamento', data: valuesRev, backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1, borderRadius: 4, barPercentage: 0.6, order: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { borderDash: [5, 5] } }, x: { grid: { display: false } } } }
        });
    }
    const ctxDay = document.getElementById('peakDayChart');
    if(ctxDay) {
        if(chartDay) chartDay.destroy();
        chartDay = new Chart(ctxDay, {
            type: 'bar',
            data: { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], datasets: [{ label: 'Pedidos', data: dayData, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'], borderRadius: 5 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
        });
    }
    const ctxHour = document.getElementById('peakHourChart');
    if(ctxHour) {
        if(chartHour) chartHour.destroy();
        const hourLabels = Array.from({length: 24}, (_, i) => `${i}h`);
        chartHour = new Chart(ctxHour, {
            type: 'line',
            data: { labels: hourLabels, datasets: [{ label: 'Pedidos', data: hourData, borderColor: '#4BC0C0', backgroundColor: 'rgba(75, 192, 192, 0.2)', tension: 0.4, fill: true, pointRadius: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
        });
    }
}






// --- Lógica de Conexão com Inteligência Artificial ---

async function handleConnectIAWhatsApp() {
    const btn = document.getElementById('btnConnectWhatsapp');
    const qrArea = document.getElementById('qrCodeArea');
    const qrImg = document.getElementById('qrCodeImage');
    const statusText = document.getElementById('connectionStatus');
    const apiKey = "P@ssw0rd!0809"; // Sua chave mestre

    // Feedback visual de carregamento
    btn.disabled = true;
    btn.innerHTML = '<i class="material-icons">sync</i> Gerando Conexão...';

    try {
        // 1. Solicita o QR Code para a instância da loja atual
        const response = await fetch(`https://zap.recursosaladeaula.com.br/instance/connect/${currentSlug}`, {
            method: 'GET',
            headers: { 'apikey': apiKey }
        });
        
        const data = await response.json();

        // 2. Se a API devolver a imagem, exibe na tela
        if (data.base64) {
            qrImg.src = data.base64;
            qrArea.style.display = 'inline-block';
            qrArea.scrollIntoView({ behavior: 'smooth' });
            btn.innerHTML = '<i class="material-icons">qr_code_2</i> QR Code Gerado';
            
            // 3. Inicia o monitoramento para saber quando o cliente escaneou
            startWhatsAppStatusMonitor(apiKey);
        } else if (data.instance && data.instance.state === 'open') {
            statusText.innerHTML = '<i class="material-icons">check_circle</i> Este WhatsApp já está conectado e pronto!';
            statusText.style.color = "#28a745";
            btn.innerHTML = '<i class="material-icons">done_all</i> IA Ativa';
        }
    } catch (error) {
        console.error("Erro ao conectar WhatsApp:", error);
        alert("Não foi possível gerar o QR Code. Verifique se o servidor de Zap está online.");
        btn.disabled = false;
        btn.innerHTML = '<i class="material-icons">sync</i> Tentar Novamente';
    }
}

// Função que fica "vigiando" o status da conexão a cada 5 segundos
function startWhatsAppStatusMonitor(apiKey) {
    const statusText = document.getElementById('connectionStatus');
    
    const checkInterval = setInterval(async () => {
        try {
            const resp = await fetch(`https://zap.recursosaladeaula.com.br/instance/connectionState/${currentSlug}`, {
                method: 'GET',
                headers: { 'apikey': apiKey }
            });
            const data = await resp.json();
            
            // Se o estado mudar para 'open', o WhatsApp foi conectado com sucesso
            if (data.instance && data.instance.state === 'open') {
                statusText.innerHTML = '<i class="material-icons" style="vertical-align:middle">check_circle</i> CONECTADO! Sua IA já está atendendo.';
                statusText.style.color = "#28a745";
                document.getElementById('qrCodeImage').style.opacity = "0.3";
                clearInterval(checkInterval); // Para de vigiar
            }
        } catch (e) {
            console.log("Aguardando leitura do QR Code...");
        }
    }, 5000);
}