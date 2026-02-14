// --- checkout.js ---
// Finalização de Pedido e Cálculo de Taxas

function initCheckout() {
    setTimeout(() => {
        if(typeof fbq === 'function') {
            const tempCart = JSON.parse(localStorage.getItem('bh_cart')) || [];
            const tempTotal = tempCart.reduce((acc, i) => acc + i.total, 0);
            fbq('track', 'InitiateCheckout', { num_items: tempCart.length, value: tempTotal, currency: 'BRL' });
        }
    }, 1000); 

    window.removeFromCart = function(idx) { cart.splice(idx, 1); localStorage.setItem('bh_cart', JSON.stringify(cart)); location.reload(); }
    
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            paymentOptions.forEach(opt => { opt.classList.remove('selected'); opt.style.borderColor = '#ddd'; opt.style.color = '#333'; opt.style.backgroundColor = 'transparent'; });
            this.classList.add('selected'); this.style.borderColor = '#0f6e63'; this.style.color = '#0f6e63'; this.style.backgroundColor = '#e0f2f1';
            document.getElementById('selectedPayment').value = this.getAttribute('data-value');
        });
    });
    
    loadCheckoutItems();
}

function loadCheckoutItems() {
    const cartItems = JSON.parse(localStorage.getItem('bh_cart')) || [];
    const container = document.getElementById('checkoutItems');
    container.innerHTML = '';
    let subtotal = 0;

    if (cartItems.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777;">Seu carrinho está vazio.</p>';
    } else {
        cartItems.forEach((item, idx) => {
            subtotal += item.total;
            container.innerHTML += `<div class="checkout-item"><div><div style="font-weight:600;">${item.qty}x ${item.name}</div><div style="font-size:0.85rem; color:#777;">${item.obs || ''}</div></div><div style="text-align:right"><div style="font-weight:600;">R$ ${item.total.toFixed(2)}</div><a href="#" onclick="removeFromCart(${idx})" style="color:red; font-size:0.8rem; text-decoration:underline;">Remover</a></div>`;
        });
    }

    if(document.getElementById('subtotalVal')) {
        document.getElementById('subtotalVal').innerText = `R$ ${subtotal.toFixed(2)}`;
    }

    const bairroInput = document.getElementById("customerNeighborhood");
    const dataList = document.getElementById("lista-bairros");
    
    if(bairroInput) bairroInput.value = ""; 
    if(dataList) dataList.innerHTML = "";

    if(bairroInput && storeData.settings.feeType === 'neighborhood') {
        bairroInput.style.display = 'block';
        if(bairroInput.previousElementSibling) bairroInput.previousElementSibling.style.display = 'block';
        const bairros = storeData.settings.neighborhoods || [];
        if(dataList) {
            bairros.forEach(n => {
                const op = document.createElement('option');
                op.value = n.name; 
                op.label = `Taxa: R$ ${parseFloat(n.price).toFixed(2)}`; 
                dataList.appendChild(op);
            });
        }
    } 
    else if (bairroInput) {
        bairroInput.style.display = 'none';
        if(bairroInput.previousElementSibling) bairroInput.previousElementSibling.style.display = 'none';
    }
    if(typeof calculateShipping === "function") calculateShipping();
}

window.calculateShipping = function() {
    const cartItems = JSON.parse(localStorage.getItem('bh_cart')) || [];
    const subtotal = cartItems.reduce((acc, i) => acc + i.total, 0);
    let fee = 0;

    if (storeData && storeData.settings.feeType === 'fixed') {
        fee = storeData.settings.feeValue;
    } 
    else if (storeData && storeData.settings.feeType === 'neighborhood') {
        const bairroInput = document.getElementById("customerNeighborhood");
        const val = bairroInput ? bairroInput.value.trim() : "";
        const bairros = storeData.settings.neighborhoods || [];
        const bairroEncontrado = bairros.find(b => b.name.toLowerCase() === val.toLowerCase());

        if(bairroEncontrado) {
            fee = parseFloat(bairroEncontrado.price);
            if(bairroInput) bairroInput.style.borderColor = "#28a745"; 
        } else {
            fee = 0; 
            if(bairroInput) {
                if(val !== "") bairroInput.style.borderColor = "#dc3545"; 
                else bairroInput.style.borderColor = "#ddd";
            }
        }
    }

    const freeMin = storeData.settings.freeShippingMin || 0;
    let isFreeByAmount = false;
    
    let upsellBanner = document.getElementById('shippingUpsellBanner');
    if (!upsellBanner) {
        upsellBanner = document.createElement('div');
        upsellBanner.id = 'shippingUpsellBanner';
        upsellBanner.style.cssText = "background:#fff3cd; color:#856404; padding:8px 12px; border-radius:6px; margin-bottom:15px; border:1px solid #ffeeba; font-size:0.85rem; text-align:center;";
        const summaryFirstRow = document.querySelector('.summary-row'); 
        if(summaryFirstRow && summaryFirstRow.parentNode) {
            summaryFirstRow.parentNode.insertBefore(upsellBanner, summaryFirstRow);
        }
    }

    if (freeMin > 0) {
        if (subtotal >= freeMin) {
            fee = 0;
            isFreeByAmount = true;
            upsellBanner.style.display = "none"; 
        } else {
            const missing = freeMin - subtotal;
            upsellBanner.style.background = "#fff3cd";
            upsellBanner.style.color = "#856404";
            upsellBanner.style.borderColor = "#ffeeba";
            upsellBanner.innerHTML = `<i class="material-icons" style="vertical-align:middle; font-size:1.1rem; margin-right:4px;">moped</i> Falta <b>R$ ${missing.toFixed(2)}</b> para <b>Entrega Grátis</b>! <a href="index.html" style="text-decoration:underline; font-weight:bold; color:#856404; margin-left:5px;">Adicionar outro item</a>`;
            upsellBanner.style.display = "block";
        }
    } else { if(upsellBanner) upsellBanner.style.display = "none"; }

    const allRows = document.querySelectorAll('.checkout-summary div, .summary-row');
    allRows.forEach(row => {
        if(row.innerText.includes('Entrega')) {
            const valSpan = row.querySelector('span:last-child') || row.lastElementChild;
            if(valSpan) {
                if (isFreeByAmount) { valSpan.innerHTML = `<span style="color:#28a745; font-weight:bold;">Entrega Grátis aplicada</span>`; }
                else if (fee === 0 && storeData.settings.feeType === 'neighborhood') {
                    const bairroInput = document.getElementById("customerNeighborhood");
                    valSpan.innerText = (bairroInput && bairroInput.value !== "") ? "A Consultar" : "Selecione...";
                } else { valSpan.innerText = fee === 0 ? 'Grátis' : `R$ ${fee.toFixed(2)}`; }
            }
        }
    });

    const checkoutTotalEl = document.getElementById('checkoutTotal');
    if(checkoutTotalEl) { checkoutTotalEl.innerText = `R$ ${(subtotal + fee).toFixed(2)}`; }
};

window.finishOrder = function() {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const payment = document.getElementById('selectedPayment').value;
    const cep = document.getElementById('customerZip').value;
    const street = document.getElementById('customerStreet').value;
    const number = document.getElementById('customerNumber').value;
    const comp = document.getElementById('customerComp').value;
    const neigh = document.getElementById('customerNeighborhood').value;
    const city = document.getElementById('customerCity').value;
    const state = document.getElementById('customerState').value;

    const cartItems = JSON.parse(localStorage.getItem('bh_cart')) || [];
    if (cartItems.length === 0) return alert('Carrinho vazio!'); 
    if (!name || !phone || !cep || !street || !number || !neigh) return alert('Preencha endereço completo!');

    const subtotal = cartItems.reduce((acc, i) => acc + i.total, 0);
    let fee = 0;
    if(storeData.settings.feeType === 'fixed') { fee = storeData.settings.feeValue; } 
    else if (storeData.settings.feeType === 'neighborhood' && storeData.settings.neighborhoods) {
        const bairroEncontrado = storeData.settings.neighborhoods.find(n => n.name.toLowerCase() === neigh.trim().toLowerCase());
        if(bairroEncontrado) fee = parseFloat(bairroEncontrado.price);
    }
    
    const fullAddressReadable = `${street}, ${number} ${comp ? '- ' + comp : ''} - ${neigh}, ${city}/${state} (CEP: ${cep})`;
    const totalFinal = subtotal + fee;
    const orderId = Math.floor(Math.random() * 100000);
    
    const newOrder = {
        id: orderId,
        customerName: name,
        deliveryFee: fee,
        customerPhone: phone,
        customerEmail: "", 
        metaData: { zip: cep, city: city, state: state, country: 'BR', neigh: neigh },
        address: fullAddressReadable, 
        payment: payment,
        items: cartItems,
        total: totalFinal,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    if(!storeData.orders) storeData.orders = [];
    storeData.orders.push(newOrder); 
    DB.saveStoreData(currentSlug, storeData); 
    

    if (typeof notifyOrderUpdate === 'function') {
    notifyOrderUpdate(orderId, 'RECEIVED');
}

    localStorage.setItem('bh_last_active_order', orderId);
    let userHistory = JSON.parse(localStorage.getItem('bh_user_history')) || [];
    userHistory.push(orderId);
    localStorage.setItem('bh_user_history', JSON.stringify(userHistory));
    
    if(typeof fbq === 'function') {
        fbq('track', 'Purchase', { 
            value: totalFinal, currency: 'BRL', content_ids: [orderId],
            user_data: {
                fn: normalizeMetaText(name.split(' ')[0]),
                ph: phone.replace(/\D/g, ''),
                ct: normalizeMetaText(city).replace(/\s/g, ''),
                st: normalizeMetaText(state),
                zp: cep.replace(/\D/g, '')
            }
        });
    }

    const taxaTexto = (fee === 0 && storeData.settings.feeType === 'neighborhood') ? "A Consultar" : `R$ ${fee.toFixed(2)}`;
    let msg = `*NOVO PEDIDO #${orderId}*\n\n👤 *${name}*\n📱 *${phone}*\n📍 *${fullAddressReadable}*\n----------------\n`;
    cartItems.forEach(i => { msg += `${i.qty}x ${i.name}\n`; });
    msg += `----------------\n💰 *TOTAL:* R$ ${(totalFinal).toFixed(2)}\n🚚 *Taxa:* ${taxaTexto}\n💳 *Pag:* ${payment}`;
    
    const storePhone = "5527999999999"; 
    window.open(`https://wa.me/${storePhone}?text=${encodeURIComponent(msg)}`, '_blank');
    
    localStorage.removeItem('bh_cart'); 
    window.location.href = `status.html?id=${orderId}&loja=${currentSlug}`;
};