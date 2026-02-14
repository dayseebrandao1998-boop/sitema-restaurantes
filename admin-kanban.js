// --- admin-kanban.js ---
// Quadro de Pedidos, Drag&Drop e Motoboys

// --- admin-kanban.js (ATUALIZADO COM TRAVA DE SEGURANÇA) ---

function loadAdminOrders() {
    const pendList = document.getElementById("list-pending"); 
    const prepList = document.getElementById("list-preparing"); 
    const readyList = document.getElementById("list-ready"); 
    const delivContainer = document.getElementById("list-delivery"); 
    
    if(pendList) {
        pendList.innerHTML = ""; prepList.innerHTML = ""; readyList.innerHTML = ""; delivContainer.innerHTML = "";
        const drivers = storeData.settings.drivers || [];
        const driverQueues = {}; 
        let columnsHTML = "";
        
        if(drivers.length > 0) {
            drivers.forEach(d => {
                driverQueues[d] = { active: [] }; 
                const isActive = driversStatus[d] ? 'active' : ''; 
                const rowStyle = isActive ? 'background:#fff3cd; color:#856404; border:1px solid #ffeeba; padding:2px 8px; border-radius:6px; margin-bottom:8px;' : 'padding:5px 0; margin-bottom:5px; color:#333;';
                const statusText = isActive ? '<span class="typewriter-text">- ENTREGANDO...</span>' : '';
                
                const displaySair = driversStatus[d] ? 'none' : 'inline-flex';
                const displayConfirmar = driversStatus[d] ? 'inline-flex' : 'none';

                columnsHTML += `
                    <div class="driver-column ${isActive}" id="col-${d}" ondragover="allowDrop(event)" ondrop="dropOrder(event, '${d}')">
                        <div class="driver-col-header">
                            <div style="display:flex; justify-content:space-between; font-weight:bold; align-items:center; ${rowStyle}">
                                <span style="display:flex; align-items:center; white-space:nowrap; overflow:hidden;"><i class="material-icons" style="vertical-align:middle; margin-right:5px; font-size:1rem;">two_wheeler</i> ${d} ${statusText}</span>
                            </div>
                            <div class="driver-actions">
                                <button class="btn-fleet btn-print-batch" onclick="printDriverBatch('${d}')" title="Imprimir Rota"><i class="material-icons">print</i></button>
                                <button class="btn-fleet btn-go" style="display: ${displaySair}" onclick="setDriverState('${d}', true)">SAIR <i class="material-icons">near_me</i></button>
                                <button class="btn-fleet btn-back" style="display: ${displayConfirmar}; background:#455a64; padding: 2px 0; font-size: 0.7rem;" onclick="setDriverState('${d}', false)">CONFIRMAR ENTREGAS</button>
                            </div>
                        </div>
                        <div class="driver-drop-zone" id="zone-${d}"></div>
                    </div>`;
            });
        } else { columnsHTML = `<div style="padding:20px; color:#777; font-style:italic;">Cadastre motoboys na engrenagem acima.</div>`; }
        delivContainer.innerHTML = columnsHTML;

        const orders = [...storeData.orders].reverse();
        orders.forEach(order => {
             if(order.status === 'cancelled') return;
             if(order.status === 'done') return; 
             
             const card = createAdminOrderCard(order); 
             
             // --- TRAVA DE ARRASTAR (UX) ---
             // Se o pedido tem um motoboy e esse motoboy está na rua, desativa o arrastar
             const isDriverOnRoad = order.driverName && driversStatus[order.driverName] === true;
             
             if (isDriverOnRoad) {
                 card.setAttribute('draggable', 'false');
                 card.style.cursor = "default";
                 card.title = "Não é possível mover: Motoboy já saiu para entrega.";
             } else {
                 card.setAttribute('draggable', 'true');
                 card.setAttribute('ondragstart', `dragStart(event, ${order.id})`);
                 card.style.cursor = "grab";
             }
             
             card.id = `card-${order.id}`;

             if(order.status === 'pending') pendList.appendChild(card);
             else if(order.status === 'preparing') prepList.appendChild(card);
             else if(order.status === 'ready') readyList.appendChild(card);
             else if(order.status === 'delivery') {
                 const dName = order.driverName;
                 if(dName && driverQueues[dName]) {
                     driverQueues[dName].active.push(card);
                     const badge = card.querySelector('.driver-badge');
                     if(badge) badge.style.display = 'none';
                 } else { readyList.appendChild(card); }
             }
        });
        drivers.forEach(d => {
            const zone = document.getElementById(`zone-${d}`);
            if(zone && driverQueues[d]) { driverQueues[d].active.forEach(c => zone.appendChild(c)); }
        });
    }
}

// --- TRAVA DE SOLTAR (SEGURANÇA) ---
function dropOrder(ev, driverName) {
    ev.preventDefault();
    document.querySelectorAll('.driver-drop-zone').forEach(z => z.classList.remove('drag-over'));
    
    // Bloqueia se o motoboy de DESTINO estiver na rua
    if (driversStatus[driverName] === true) { 
        return alert(`O motoboy ${driverName} está na rua!\nAguarde ele retornar e confirme a chegada para enviar novos pedidos.`); 
    }
    
    const orderId = parseInt(ev.dataTransfer.getData("text/plain"));
    if(!orderId) return;
    
    const order = storeData.orders.find(o => o.id === orderId);
    if(order) {
        // Bloqueia se o motoboy de ORIGEM já estiver na rua (O que você pediu)
        if(order.driverName && driversStatus[order.driverName] === true) {
            return alert(`Este pedido já saiu para entrega com ${order.driverName} e não pode ser movido para outro entregador!`);
        }

        order.status = 'delivery';
        order.driverName = driverName;
        DB.saveStoreData(currentSlug, storeData);
        loadAdminOrders(); 
    }
}










function dragStart(ev, id) { ev.dataTransfer.setData("text/plain", id); ev.dataTransfer.effectAllowed = "move"; }
function allowDrop(ev) { ev.preventDefault(); ev.dataTransfer.dropEffect = "move"; const zone = ev.currentTarget.querySelector('.driver-drop-zone'); if(zone) zone.classList.add('drag-over'); }
function dropOrder(ev, driverName) {
    ev.preventDefault();
    document.querySelectorAll('.driver-drop-zone').forEach(z => z.classList.remove('drag-over'));
    if (driversStatus[driverName] === true) { return alert(`O motoboy ${driverName} está na rua!\nAguarde ele retornar e confirme a chegada para enviar novos pedidos.`); }
    const orderId = parseInt(ev.dataTransfer.getData("text/plain"));
    if(!orderId) return;
    const order = storeData.orders.find(o => o.id === orderId);
    if(order) {
        order.status = 'delivery';
        order.driverName = driverName;
        DB.saveStoreData(currentSlug, storeData);
        loadAdminOrders(); 
    }
}

function setDriverState(driverName, isLeaving) {
    if(isLeaving) {
        const zone = document.getElementById(`zone-${driverName}`);
        const hasOrders = zone && zone.children.length > 0;
        if(!hasOrders && !confirm(`O motoboy ${driverName} não tem pedidos. Sair vazio?`)) return;
        driversStatus[driverName] = true;
    } else {
        if(confirm(`O motoboy ${driverName} retornou. Deseja CONCLUIR (Finalizar) todos os pedidos dele?`)) { concludeDriverBatch(driverName); }
        driversStatus[driverName] = false;
    }
    localStorage.setItem('bh_drivers_status', JSON.stringify(driversStatus));
    loadAdminOrders();
}

function concludeDriverBatch(driverName) {
    let count = 0;
    storeData.orders.forEach(o => {
        if(o.status === 'delivery' && o.driverName === driverName) { o.status = 'done'; count++; }
    });
    if(count > 0) { DB.saveStoreData(currentSlug, storeData); alert(`${count} entregas concluídas com sucesso!`); } 
    else { alert("Nenhum pedido pendente para este motoboy."); }
}

function distributeOrdersSmart() {
    const allDrivers = storeData.settings.drivers || [];
    if(allDrivers.length === 0) return alert("Cadastre motoboys na engrenagem primeiro!");
    const availableDrivers = allDrivers.filter(d => !driversStatus[d]);
    if (availableDrivers.length === 0) { return alert("Todos os motoboys estão na rua!\nConfirme o retorno de alguém (botão 'Confirmar Entregas') antes de distribuir novos pedidos."); }
    const candidates = storeData.orders.filter(o => o.status === 'ready' || (o.status === 'delivery' && !o.driverName));
    if(candidates.length === 0) return alert("Não há pedidos disponíveis para distribuir.");
    const groups = {}; const singles = []; 
    candidates.forEach(o => {
        const neighRaw = (o.metaData && o.metaData.neigh) ? o.metaData.neigh.trim() : "";
        if (neighRaw.length > 2) {
            const key = neighRaw.toLowerCase(); 
            if (!groups[key]) groups[key] = [];
            groups[key].push(o);
        } else { singles.push(o); }
    });
    const tasks = [...Object.values(groups), ...singles.map(o => [o])];
    let log = "";
    tasks.forEach((taskBatch, index) => {
        const driverIndex = index % availableDrivers.length;
        const selectedDriver = availableDrivers[driverIndex];
        taskBatch.forEach(order => {
            order.status = 'delivery';
            order.driverName = selectedDriver;
        });
        const desc = taskBatch.length > 1 ? `${taskBatch.length} pedidos (${taskBatch[0].metaData.neigh})` : `Pedido #${taskBatch[0].id}`;
        log += `- ${desc} -> ${selectedDriver}\n`;
    });
    DB.saveStoreData(currentSlug, storeData);
    loadAdminOrders();
    alert(`Distribuição realizada entre ${availableDrivers.length} motoboys disponíveis!\n\n${log}`);
}

function printDriverBatch(driverName) {
    const orders = storeData.orders.filter(o => o.status === 'delivery' && o.driverName === driverName);
    if(orders.length === 0) return alert("Sem pedidos para imprimir.");
    const printArea = document.getElementById('printArea');
    const now = new Date().toLocaleString('pt-BR');
    let contentHTML = `<div class="print-receipt" style="width: 100%; max-width: 300px; margin: 0; padding: 0;"><div class="print-header" style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;"><h2 style="margin:0; font-size: 16px;">ROTA DE ENTREGA</h2><h3 style="margin:5px 0; font-size: 14px;">MOTOBOY: ${driverName.toUpperCase()}</h3><div style="font-size:12px;">Saída: ${now}</div><div style="font-size:12px; font-weight:bold;">Qtd: ${orders.length} Pedidos</div></div>`;
    orders.forEach((o, idx) => {
        let itensResumo = o.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        let addressDisplay = o.address;
        let bairro = (o.metaData && o.metaData.neigh) ? o.metaData.neigh : "";
        if (!bairro && o.address.includes(' - ')) { try { bairro = o.address.split(' - ')[1].split(',')[0]; } catch(e) {} }
        if (bairro) { const regex = new RegExp(bairro, "ig"); addressDisplay = addressDisplay.replace(regex, `<b style="font-size:1.1em; text-transform:uppercase;">${bairro}</b>`); }
        contentHTML += `<div style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px dashed #000;"><div style="display:flex; justify-content:space-between; font-size:14px;"><span>#${idx+1} - Pedido ${o.id}</span><span style="font-weight:800;">R$ ${o.total.toFixed(2)}</span></div><div style="font-size:14px; margin:5px 0; font-weight:800;">${o.customerName}</div><div style="font-size:12px; line-height:1.4;">${addressDisplay}</div><div style="font-size:12px; margin-top:2px;">Tel: ${o.customerPhone}</div><div style="font-size:11px; margin-top:4px; color:#000;">Item: ${itensResumo}</div><div style="font-size:13px; margin-top:4px; text-align:right;">PGTO: ${o.payment}</div></div>`;
    });
    contentHTML += `<div class="print-footer" style="margin-top:30px; border-top:1px solid #000; padding-top:5px; text-align:center;">Assinatura do Motoboy</div></div>`;
    printArea.innerHTML = contentHTML;
    setTimeout(() => window.print(), 200);
}

function loadDeliveriesTab() {
    const container = document.getElementById("deliveries-board");
    if(!container) return;
    container.innerHTML = "";
    const drivers = storeData.settings.drivers || [];
    if (drivers.length === 0) { container.innerHTML = "<p style='padding:20px; color:#777;'>Nenhum motoboy cadastrado.</p>"; return; }
    const today = new Date().setHours(0,0,0,0);

    drivers.forEach(d => {
        const historyOrders = storeData.orders.filter(o => {
            const orderDate = new Date(o.timestamp).setHours(0,0,0,0);
            return o.driverName === d && o.status === 'done' && orderDate === today; 
        }).reverse();

        let cardsHTML = "";
        let totalCash = 0; 
        let totalFees = 0; 

        if(historyOrders.length === 0) { cardsHTML = `<div style="text-align:center; padding:15px; color:#999; font-size:0.8rem;">Nenhuma entrega hoje.</div>`; } 
        else {
            historyOrders.forEach(o => {
                totalCash += o.total;
                let fee = o.deliveryFee;
                if (fee === undefined || fee === null) { const itemsTotal = o.items.reduce((acc, i) => acc + i.total, 0); fee = o.total - itemsTotal; }
                if(fee < 0) fee = 0;
                totalFees += fee; 
                const time = new Date(o.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
                const itemsList = o.items.map(i => `${i.qty}x ${i.name}`).join('<br>');
                cardsHTML += `<div style="background:#fff; border:1px solid #eee; border-left:4px solid #4caf50; border-radius:6px; padding:10px; margin-bottom:10px; box-shadow:0 1px 2px rgba(0,0,0,0.05);"><div style="display:flex; justify-content:space-between; margin-bottom:5px;"><strong style="color:#333;">#${o.id}</strong><span style="font-size:0.75rem; color:#777;">${time}</span></div><div style="font-size:0.85rem; font-weight:bold; margin-bottom:2px;">${o.customerName}</div><div style="font-size:0.8rem; color:#555; margin-bottom:8px;">${o.address}</div><div style="background:#f9f9f9; padding:5px; border-radius:4px; font-size:0.75rem; color:#444; margin-bottom:8px;">${itemsList}</div><div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #eee; padding-top:5px; font-size:0.8rem;"><span>Taxa: <strong>R$ ${fee.toFixed(2)}</strong></span><span style="font-size:0.9rem; font-weight:bold; color:#28a745;">Total: R$ ${o.total.toFixed(2)}</span></div></div>`;
            });
        }
        const colDiv = document.createElement("div");
        colDiv.className = "driver-column";
        colDiv.innerHTML = `<div class="driver-col-header" style="background:#e8f5e9; border-bottom:2px solid #c8e6c9;"><div style="display:flex; justify-content:space-between; align-items:center;"><span style="font-weight:bold; color:#2e7d32;"><i class="material-icons" style="vertical-align:middle; font-size:1.1rem;">sports_motorsports</i> ${d}</span><span style="font-size:0.8rem; background:#fff; padding:2px 6px; border-radius:4px; border:1px solid #c8e6c9;">${historyOrders.length} Entregas</span></div><div style="margin-top:8px; padding-top:5px; border-top:1px solid rgba(0,0,0,0.05);"><div style="font-size:0.8rem; color:#1b5e20; display:flex; justify-content:space-between;"><span>Movimentado:</span><strong>R$ ${totalCash.toFixed(2)}</strong></div><div style="font-size:0.8rem; color:#0d47a1; display:flex; justify-content:space-between; margin-top:2px;"><span>Total Taxas:</span><strong>R$ ${totalFees.toFixed(2)}</strong></div></div></div><div class="driver-drop-zone" style="background:#f4f4f4;">${cardsHTML}</div>`;
        container.appendChild(colDiv);
    });
}

function printOrder(id) {
    const order = storeData.orders.find(o => o.id === id);
    if(!order) return;
    const printArea = document.getElementById('printArea');
    const dateObj = new Date(order.timestamp);
    let itemsHtml = "";
    order.items.forEach(i => {
        itemsHtml += `<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;"><span>${i.qty}x ${i.name}</span><span>R$ ${(i.price * i.qty).toFixed(2)}</span></div>${i.userNote ? `<div style="font-size:10px; color:#555; margin-bottom:2px;">(Obs: ${i.userNote})</div>` : ''}${i.addons ? i.addons.map(a => `<div style="font-size:10px; color:#555;">+ ${a.name}</div>`).join('') : ''}`;
    });
    let bairroLine = (order.metaData && order.metaData.neigh) ? `<div style="font-size:13px; font-weight:bold; margin-top:4px;">BAIRRO: ${order.metaData.neigh}</div>` : "";
    printArea.innerHTML = `<div class="print-receipt" style="width: 100%; max-width: 300px; margin: 0; padding: 0;"><div class="print-header" style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;"><h2 style="margin:0; font-size: 16px;">${storeData.settings.name}</h2><div style="font-size:12px;">Pedido #${order.id}</div><div style="font-size:12px;">${dateObj.toLocaleString()}</div></div><div style="margin-bottom:10px; padding-bottom:10px; border-bottom:1px dashed #000;"><div style="font-size:14px; font-weight:bold; margin-bottom:4px;">${order.customerName}</div><div style="font-size:12px;">${order.address}</div>${bairroLine}<div style="font-size:12px; margin-top:2px;">Tel: ${order.customerPhone}</div></div><div style="margin-bottom:10px; padding-bottom:10px; border-bottom:1px dashed #000;">${itemsHtml}</div><div style="display:flex; justify-content:space-between; font-size:14px; margin-top:5px;"><span>TOTAL</span><span style="font-weight:bold;">R$ ${order.total.toFixed(2)}</span></div><div style="text-align:center; margin-top:5px; font-size:13px;">Pagamento: ${order.payment}</div>${order.driverName ? `<div style="text-align:center; margin-top:8px; border:1px solid #000; font-size:12px; padding:4px;">Motoboy: ${order.driverName}</div>` : ''}<div class="print-footer" style="margin-top:15px; text-align:center; font-size:12px;">Obrigado pela preferência!</div></div>`;
    window.print();
}

function openDriverModal() { document.getElementById('driverModal').classList.add('active'); renderDriversList(); }
function renderDriversList() {
    const list = document.getElementById('driversList');
    list.innerHTML = "";
    if(!storeData.settings.drivers) storeData.settings.drivers = [];
    const drivers = storeData.settings.drivers;
    if (drivers.length === 0) { list.innerHTML = "<div style='text-align:center; color:#999; padding:10px;'>Nenhum motoboy cadastrado.</div>"; return; }
    drivers.forEach((d, idx) => { list.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee; background:#fff;"><span style="font-weight:bold; color:#333;"><i class="material-icons" style="vertical-align:middle; font-size:1rem; color:#555; margin-right:5px;">two_wheeler</i>${d}</span><button onclick="removeDriver(${idx})" style="color:#d32f2f; background:none; border:none; cursor:pointer;" title="Remover"><i class="material-icons">delete</i></button></div>`; });
}
function addDriver() {
    const input = document.getElementById('newDriverName');
    const name = input.value.trim();
    if(!name) return alert("Digite o nome do entregador!");
    if(!storeData.settings.drivers) storeData.settings.drivers = [];
    storeData.settings.drivers.push(name);
    DB.saveStoreData(currentSlug, storeData);
    input.value = "";
    renderDriversList(); 
    loadAdminOrders();   
}
function removeDriver(index) {
    if(!confirm("Tem certeza que deseja remover este motoboy?")) return;
    storeData.settings.drivers.splice(index, 1);
    DB.saveStoreData(currentSlug, storeData);
    renderDriversList();
    loadAdminOrders();
}

function createAdminOrderCard(order) {
    const div = document.createElement("div"); 
    div.className = `order-card-admin s-${order.status}`;
    let deliveryFee = order.deliveryFee;
    if (deliveryFee === undefined || deliveryFee === null) { const itemsTotal = order.items.reduce((acc, i) => acc + i.total, 0); deliveryFee = order.total - itemsTotal; }
    deliveryFee = Math.round(deliveryFee * 100) / 100;
    if(deliveryFee < 0) deliveryFee = 0;

    let pText = order.payment || "A Definir"; 
    pText = pText.charAt(0).toUpperCase() + pText.slice(1);
    let payIcon = "attach_money"; let payColor = "#555";
    const pCheck = pText.toLowerCase();
    if(pCheck.includes('pix')) { payIcon = "qr_code_2"; payColor = "#28a745"; } 
    else if(pCheck.includes('dinheiro')) { payIcon = "payments"; payColor = "#856404"; } 
    else if(pCheck.includes('cart') || pCheck.includes('card') || pCheck.includes('crédito') || pCheck.includes('débito')) { payIcon = "credit_card"; payColor = "#007bff"; }

    const time = new Date(order.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    const firstName = order.customerName.split(' ')[0]; 
    const loyaltyCount = storeData.orders.filter(o => o.customerName === order.customerName).length;
    const badgeHtml = loyaltyCount === 1 ? `<span style="background:#e3f2fd; color:#1565c0; padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.65rem;">Novo</span>` : `<span style="background:#fff3e0; color:#ef6c00; padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.65rem;">${loyaltyCount}º</span>`;
    let driverHtml = "";
    if(order.driverName) { driverHtml = `<div class="driver-badge"><i class="material-icons" style="font-size:0.9rem;">two_wheeler</i> ${order.driverName}</div>`; }

    let itemsHtml = "";
    order.items.forEach(item => {
        let detailsHtml = "";
        if (item.userNote) detailsHtml += `<div style="color:#d32f2f; font-size:0.75rem;">OBS: ${item.userNote}</div>`;
        if (item.addons) item.addons.forEach(add => detailsHtml += `<div style="color:#1976d2; font-size:0.75rem;">+ ${add.name}</div>`);
        itemsHtml += `<div class="k-item-row"><div class="k-item-desc"><span class="k-qty">${item.qty}x</span> ${item.name} ${detailsHtml}</div><div class="k-price">R$ ${(item.price * item.qty).toFixed(2)}</div></div>`;
    });

    const btnStyle = "width:100%; padding:6px; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-size:0.85rem; margin-top:5px; color:#fff;";
    let btnAction = "";
    if(order.status === 'pending') { btnAction = `<button onclick="event.stopPropagation(); changeStatus(${order.id}, 'preparing')" style="${btnStyle} background:#555;">Aceitar & Preparar</button>`; } 
    else if(order.status === 'preparing') { btnAction = `<button onclick="event.stopPropagation(); changeStatus(${order.id}, 'ready')" style="${btnStyle} background:#FF9800;">Marcar como Pronto</button>`; } 

    div.innerHTML = `<div class="k-header" onclick="this.parentElement.classList.toggle('expanded')"><div class="k-header-left"><button class="btn-trash-icon" onclick="event.stopPropagation(); openCancelPopup(${order.id})"><i class="material-icons" style="font-size:1rem;">delete</i></button><button class="btn-print-mini" onclick="event.stopPropagation(); printOrder(${order.id})" title="Imprimir"><i class="material-icons" style="font-size:1rem;">print</i></button><span style="color:#ccc">|</span><span>#${order.id}</span><span style="margin:0 4px; color:#ccc">•</span><strong>${firstName}</strong></div>${badgeHtml}</div><div class="k-body" onclick="this.parentElement.classList.toggle('expanded')">${itemsHtml}<div style="border-top:1px solid #f5f5f5; margin-top:5px; padding-top:4px;"><div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#999; margin-bottom:2px;"><span>Taxa Entrega:</span><span>R$ ${deliveryFee.toFixed(2)}</span></div><div style="display:flex; justify-content:space-between; align-items:center;"><div style="font-size:0.75rem; color:${payColor}; display:flex; align-items:center; gap:4px; font-weight:700;"><i class="material-icons" style="font-size:1.1rem;">${payIcon}</i><span>${pText}</span> </div><div class="k-total-display" style="border:none; margin:0; padding:0;">Total: R$ ${order.total.toFixed(2)}</div></div></div>${driverHtml}</div><div class="k-expand-trigger" onclick="this.parentElement.classList.toggle('expanded')"><i class="material-icons">expand_more</i></div><div class="k-details-hidden"><div class="k-details-row" style="align-items:center;"><div class="k-detail-name" style="flex:1; min-width:0; overflow:hidden; display:flex; align-items:center;"><i class="material-icons" style="color:#555; margin-right:4px; font-size:1rem;">person</i> <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display:block; font-size:0.8rem; color:#333;">${order.customerName}</strong></div><div class="k-detail-phone" style="margin-left:10px; flex-shrink:0; display:flex; align-items:center;"><i class="material-icons" style="color:#28a745; font-size:0.9rem; margin-right:2px;">whatsapp</i> <span>${order.customerPhone || '--'}</span></div></div><div class="k-address-row"><i class="material-icons" style="color:#d32f2f;">location_on</i> <span style="white-space:normal; line-height:1.2;">${order.address || 'Retirada'}</span></div>${order.metaData && order.metaData.neigh ? `<div style="font-size:0.75rem; color:#666; margin-top:2px;">Bairro: <strong>${order.metaData.neigh}</strong></div>` : ''}</div><div class="k-actions-footer">${btnAction}</div><div id="cancel-popup-${order.id}" class="cancel-popup-overlay" onclick="event.stopPropagation()"><h4>Deseja cancelar o pedido #${order.id}?</h4><div class="cancel-actions"><button class="btn-abort-cancel" onclick="closeCancelPopup(${order.id})">Não</button><button class="btn-confirm-cancel" onclick="performCancelOrder(${order.id})">Sim, Cancelar</button></div></div>`;
    return div;
}

function openCancelPopup(id) { const popup = document.getElementById(`cancel-popup-${id}`); if(popup) popup.style.display = 'flex'; }
function closeCancelPopup(id) { const popup = document.getElementById(`cancel-popup-${id}`); if(popup) popup.style.display = 'none'; }
function performCancelOrder(id) {
    const order = storeData.orders.find(o => o.id === id);
    if(order) { order.status = 'cancelled'; DB.saveStoreData(currentSlug, storeData); loadAdminOrders(); }
}
function changeStatus(id, st) { 
    const order = storeData.orders.find(o => o.id === id); 
    if(order) { 
        order.status = st; DB.saveStoreData(currentSlug, storeData); loadAdminOrders(); 
        if(st === 'preparing') sendAutomatedWhatsApp(id, 'preparing');
        else if(st === 'delivery') sendAutomatedWhatsApp(id, 'delivery');
    } 
}
function openDriverReport(driverName) {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = "";
    const orders = storeData.orders.filter(o => o.driverName === driverName && o.status === 'done');
    let totalFees = 0;
    if (orders.length === 0) { tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:15px; color:#777;'>Nenhuma entrega finalizada para este motoboy.</td></tr>"; }
    orders.forEach(o => {
        let deliveryFee = o.deliveryFee;
        if (deliveryFee === undefined || deliveryFee === null) { const itemsTotal = o.items.reduce((acc, i) => acc + i.total, 0); deliveryFee = o.total - itemsTotal; }
        deliveryFee = Math.round(deliveryFee * 100) / 100;
        if(deliveryFee < 0) deliveryFee = 0;
        totalFees += deliveryFee;
        const bairro = (o.metaData && o.metaData.neigh) ? o.metaData.neigh : "Não inf.";
        tbody.innerHTML += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">#${o.id}</td><td style="padding:8px; font-size:0.8rem; color:#555;">${bairro}</td><td style="padding:8px; text-align:right;">R$ ${o.total.toFixed(2)}</td><td style="padding:8px; text-align:right; font-weight:bold; color:#007bff;">R$ ${deliveryFee.toFixed(2)}</td></tr>`;
    });
    document.getElementById('reportDriverName').innerText = `Extrato: ${driverName}`;
    document.getElementById('reportCount').innerText = orders.length;
    document.getElementById('reportTotalFees').innerText = `R$ ${totalFees.toFixed(2)}`;
    document.getElementById('driverReportModal').classList.add('active');
}




// Função para disparar a automação no n8n
async function notifyOrderUpdate(orderId, status) {
    const order = storeData.orders.find(o => o.id === orderId);
    if (!order) return;

    // SUA URL REAL AQUI:
    const n8nWebhookUrl = "https://n8n.recursosaladeaula.com.br/webhook/9ec8c3f7-c914-47d1-bec7-29711131fa07";

    const payload = {
        loja: currentSlug,
        nome_loja: storeData.settings.name,
        pedido_id: order.id,
        status: status,
        cliente_nome: order.customerName,
        cliente_fone: order.customerPhone.replace(/\D/g, ''),
        total: order.total.toFixed(2),
        itens: order.items.map(i => `${i.qty}x ${i.name}`).join(", "),
        link_status: `${window.location.origin}/status.html?id=${order.id}&loja=${currentSlug}`
    };

   try {
        // Remova apenas a palavra 'await' abaixo
        fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error("Erro n8n:", error);
    }
}








function setDriverState(driverName, isGoing) {
    driversStatus[driverName] = isGoing;
    
    if (isGoing) {
        // Pega todos os pedidos que estão com esse motoboy
        const ordersInRoute = storeData.orders.filter(o => o.driverName === driverName && o.status === 'delivery');
        // Avisa o n8n para cada pedido que saiu
        ordersInRoute.forEach(o => notifyOrderUpdate(o.id, 'SAIU_PARA_ENTREGA'));
    }
    
    DB.saveStoreData(currentSlug, storeData);
    loadAdminOrders();
}



function changeStatus(id, st) {
    const order = storeData.orders.find(o => o.id === id);
    if (order) {
        order.status = st;
        DB.saveStoreData(currentSlug, storeData);
        loadAdminOrders();
        
        // Dispara a IA para avisar que o pedido foi aceito ou está pronto
        notifyOrderUpdate(id, st);
    }

}
