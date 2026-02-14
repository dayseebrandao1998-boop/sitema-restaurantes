// --- status.js ---
// Página de Status e Captura de E-mail

// --- status.js ---
function initStatusPage() {
    const params = new URLSearchParams(window.location.search); 
    const orderId = parseInt(params.get('id'));
    if(!orderId) return; 
    document.getElementById("orderIdDisplay").innerText = `#${orderId}`;
    loadStatusData(orderId); 
    setInterval(() => loadStatusData(orderId), 5000);
}

function loadStatusData(id) {
    loadStoreContext(); 
    const order = storeData.orders.find(o => o.id === id); 
    if(!order) return;

    // Recupera o slug da URL para garantir o redirecionamento correto
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('loja');

    // LÓGICA DE CANCELAMENTO COM TELEFONE CONFIGURÁVEL E REDIRECIONAMENTO PARA LOJA.HTML
    if(order.status === 'cancelled') {
        const ownerPhone = storeData.settings.ownerPhone || "Telefone não cadastrado";
        const container = document.querySelector('.status-container');
        container.innerHTML = `
            <div style="text-align:center; padding:40px 20px;">
                <i class="material-icons" style="font-size:4rem; color:#d32f2f;">cancel</i>
                <h2 style="color:#d32f2f; margin:20px 0;">Seu pedido foi cancelado</h2>
                <p style="color:#555; margin-bottom:20px;">Houve um problema com seu pedido. Por favor, entre em contato com a loja.</p>
                <div style="background:#fff; padding:15px; border-radius:8px; border:1px solid #ddd; display:inline-block;">
                    <p style="font-weight:bold; margin-bottom:5px;">Fale conosco:</p>
                    <a href="tel:${ownerPhone.replace(/\D/g,'')}" style="font-size:1.2rem; color:#333; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:5px;">
                        <i class="material-icons">phone</i> ${ownerPhone}
                    </a>
                </div>
                <br><br>
                <button onclick="window.location.href='loja.html?loja=${slug}'" class="back-home-btn" style="margin-top:20px;">
                    Voltar ao Cardápio
                </button>
            </div>`;
        return; 
    }

    // Fluxo normal do pedido
    updateTimeline(order.status);
    renderEmailCapture(order);
    
    let html = ""; 
    order.items.forEach(i => {
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.9rem;">
                    <span>${i.qty}x ${i.name}</span>
                    <span>R$ ${i.total.toFixed(2)}</span>
                 </div>`;
    });
    
    document.getElementById("statusOrderItems").innerHTML = html; 
    document.getElementById("statusTotalVal").innerText = `R$ ${order.total.toFixed(2)}`;

    // EXIBE O TEMPO DE ESPERA NO RESUMO (DENTRO DA BOX)
    const timeDesc = storeData.settings.feeDesc || "";
    if (timeDesc) {
        // Remove duplicados antes de adicionar
        const existingTime = document.getElementById('displayTimeStatus');
        if (existingTime) existingTime.remove();

        const divTime = document.createElement('div');
        divTime.id = 'displayTimeStatus';
        divTime.style.cssText = "margin-top:10px; padding-top:10px; border-top:1px dashed #eee; font-size:0.85rem; color:#777; text-align:center;";
        divTime.innerHTML = `<i class="material-icons" style="font-size:1rem; vertical-align:middle;">schedule</i> Tempo de espera: <b>${timeDesc}</b>`;
        document.querySelector('.order-summary-box').appendChild(divTime);
    }
}

function updateTimeline(status) {
    const stepsOrder = ['pending', 'preparing', 'ready', 'delivery', 'done'];
    const currentIndex = stepsOrder.indexOf(status);
    stepsOrder.forEach(s => {
        const el = document.getElementById(`step-${s}`);
        if(el) el.classList.remove('active');
    });
    if (currentIndex >= 0) {
        for (let i = 0; i <= currentIndex; i++) {
            const stepName = stepsOrder[i];
            const el = document.getElementById(`step-${stepName}`);
            if(el) el.classList.add('active');
        }
    }
}

function renderEmailCapture(order) {
    const container = document.getElementById("emailCaptureArea");
    if(!container) return; 
    if(order.customerEmail) { container.style.display = "none"; return; }
    container.style.display = "block";
    if(container.innerHTML.trim() === "") {
        container.innerHTML = `<div style="background: #fff9c4; padding: 15px; border-radius: 8px; border: 1px solid #fbc02d; text-align: center;">
                <p style="color: #f57f17; font-weight: bold; margin-bottom: 8px; font-size: 0.9rem;"><i class="material-icons" style="vertical-align:middle; font-size:1.1rem;">mark_email_unread</i> Receba cupons exclusivos na próxima compra!</p>
                <div style="display:flex; gap:8px;">
                    <input type="email" id="inputClientEmail" placeholder="Seu e-mail..." style="flex:1; padding:8px; border:1px solid #f9a825; border-radius:6px;">
                    <button onclick="saveClientEmail(${order.id})" style="background:#fbc02d; border:none; padding:8px 15px; border-radius:6px; font-weight:800; cursor:pointer;">OK</button>
                </div>
            </div>`;
    }
}

function saveClientEmail(orderId) {
    const email = document.getElementById("inputClientEmail").value.trim();
    if(!email.includes('@')) return alert("E-mail inválido");
    const order = storeData.orders.find(o => o.id === orderId);
    if(order) { order.customerEmail = email; DB.saveStoreData(currentSlug, storeData); }
    document.getElementById("emailCaptureArea").innerHTML = `<div style="background:#d4edda; color:#155724; padding:10px; border-radius:8px; text-align:center;">Cadastrado!</div>`;
    setTimeout(() => { document.getElementById("emailCaptureArea").style.display = 'none'; }, 3000);
}

function loadStatusData(id) {
    loadStoreContext(); 
    const order = storeData.orders.find(o => o.id === id); 
    if(!order) return;

    if(order.status === 'cancelled') {
        const container = document.querySelector('.status-container');
        container.innerHTML = `
            <div style="text-align:center; padding:40px 20px;">
                <i class="material-icons" style="font-size:4rem; color:#d32f2f;">cancel</i>
                <h2 style="color:#d32f2f; margin:20px 0;">Seu pedido foi cancelado</h2>
                <p style="color:#555; margin-bottom:20px;">Houve um problema com seu pedido. Por favor, entre em contato com a loja.</p>
                <div style="background:#fff; padding:15px; border-radius:8px; border:1px solid #ddd; display:inline-block;">
                    <p style="font-weight:bold; margin-bottom:5px;">Fale conosco:</p>
                    <a href="tel:5527992399932" style="font-size:1.2rem; color:#333; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:5px;">
                        <i class="material-icons">phone</i> (27) 99999-9999
                    </a>
                </div>
                <br><br>
                <button onclick="window.location.href='index.html'" class="back-home-btn" style="margin-top:20px;">Voltar ao Cardápio</button>
            </div>`;
        return; 
    }

    updateTimeline(order.status);
    renderEmailCapture(order);
    let html = ""; 
    order.items.forEach(i => html += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.9rem;"><span>${i.qty}x ${i.name}</span><span>R$ ${i.total.toFixed(2)}</span></div>`);
    document.getElementById("statusOrderItems").innerHTML = html; 
    document.getElementById("statusTotalVal").innerText = `R$ ${order.total.toFixed(2)}`;
}

function updateTimeline(status) {
    const stepsOrder = ['pending', 'preparing', 'ready', 'delivery', 'done'];
    const currentIndex = stepsOrder.indexOf(status);
    stepsOrder.forEach(s => {
        const el = document.getElementById(`step-${s}`);
        if(el) el.classList.remove('active');
    });
    if (currentIndex >= 0) {
        for (let i = 0; i <= currentIndex; i++) {
            const stepName = stepsOrder[i];
            const el = document.getElementById(`step-${stepName}`);
            if(el) el.classList.add('active');
        }
    }
}

function renderEmailCapture(order) {
    const container = document.getElementById("emailCaptureArea");
    if(!container) return; 
    if(order.customerEmail) { container.style.display = "none"; return; }

    container.style.display = "block";
    if(container.innerHTML.trim() === "") {
        container.innerHTML = `
            <div style="background: #fff9c4; padding: 15px; border-radius: 8px; border: 1px solid #fbc02d; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <p style="color: #f57f17; font-weight: bold; margin-bottom: 8px; font-size: 0.9rem;"><i class="material-icons" style="vertical-align:middle; font-size:1.1rem;">mark_email_unread</i> Receba cupons exclusivos na próxima compra!</p>
                <div style="display:flex; gap:8px;">
                    <input type="email" id="inputClientEmail" placeholder="Digite seu e-mail aqui..." style="flex:1; padding:8px 12px; border:1px solid #f9a825; border-radius:6px; outline:none;">
                    <button onclick="saveClientEmail(${order.id})" style="background:#fbc02d; color:#4e342e; border:none; padding:8px 20px; border-radius:6px; font-weight:800; cursor:pointer; box-shadow: 0 2px 0 #f57f17;">OK</button>
                </div>
            </div>`;
    }
}

function saveClientEmail(orderId) {
    const emailInput = document.getElementById("inputClientEmail");
    const email = emailInput.value.trim();
    if(!email || !email.includes('@') || !email.includes('.')) { return alert("Por favor, digite um e-mail válido."); }

    const order = storeData.orders.find(o => o.id === orderId);
    if(order) {
        order.customerEmail = email; 
        DB.saveStoreData(currentSlug, storeData);
    }
    const container = document.getElementById("emailCaptureArea");
    container.innerHTML = `<div style="background: #d4edda; color: #155724; padding: 10px; border-radius: 8px; border: 1px solid #c3e6cb; text-align: center;"><i class="material-icons" style="vertical-align:middle">check_circle</i> E-mail cadastrado com sucesso!</div>`;
    setTimeout(() => { container.style.display = 'none'; }, 3000);
}