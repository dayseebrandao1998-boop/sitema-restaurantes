// --- utils.js ---
// Funções utilitárias e helpers

const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- MÁSCARA DE TELEFONE ---
function handlePhoneMask(event) {
    let input = event.target;
    input.value = phoneMask(input.value);
}

function phoneMask(value) {
    if (!value) return "";
    value = value.replace(/\D/g,''); // Remove tudo o que não é dígito
    value = value.replace(/(\d{2})(\d)/,"($1) $2");
    value = value.replace(/(\d)(\d{4})$/,"$1-$2");
    return value;
}

// --- FUNÇÕES DE CEP E ENDEREÇO (INTEGRAÇÃO VIACEP) ---
function buscaCep(valor) {
    var cep = valor.replace(/\D/g, '');
    if (cep != "") {
        var validacep = /^[0-9]{8}$/;
        if(validacep.test(cep)) {
            document.getElementById('customerStreet').value="...";
            document.getElementById('customerNeighborhood').value="...";
            document.getElementById('customerCity').value="...";
            document.getElementById('customerState').value="...";
            var script = document.createElement('script');
            script.src = 'https://viacep.com.br/ws/'+ cep + '/json/?callback=meu_callback';
            document.body.appendChild(script);
        } else {
            alert("Formato de CEP inválido.");
        }
    }
}

function meu_callback(conteudo) {
    if (!("erro" in conteudo)) {
        document.getElementById('customerStreet').value=(conteudo.logradouro);
        document.getElementById('customerNeighborhood').value=(conteudo.bairro);
        document.getElementById('customerCity').value=(conteudo.localidade);
        document.getElementById('customerState').value=(conteudo.uf);
        document.getElementById('customerNumber').focus();
        if(typeof calculateShipping === 'function') calculateShipping();
    } else {
        alert("CEP não encontrado.");
        document.getElementById('customerStreet').value="";
        document.getElementById('customerNeighborhood').value="";
    }
}

// --- EXPORTAR PARA CSV ---
function normalizeMetaText(text) {
    if (!text) return "";
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function exportToCSV() {
    if(!storeData.orders || storeData.orders.length === 0) return alert("Sem dados para exportar.");
    const now = new Date();
    const past30 = new Date();
    past30.setDate(now.getDate() - 30);
    const orders = storeData.orders.filter(o => {
        const d = new Date(o.timestamp);
        return d >= past30 && (o.status === 'done' || o.status === 'delivery');
    });
    if(orders.length === 0) return alert("Nenhum pedido concluído nos últimos 30 dias.");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "email,phone,fn,ln,zip,country,st,ct,event_name,event_time,value,currency\n"; 

    orders.forEach(o => {
        let rawPhone = (o.customerPhone || "").replace(/\D/g, '');
        let phone = (rawPhone.length >= 10 && rawPhone.length <= 11) ? "55" + rawPhone : rawPhone;
        let cleanName = normalizeMetaText(o.customerName || "");
        let nameParts = cleanName.split(' ');
        let fn = nameParts[0] || ""; 
        let ln = nameParts.length > 1 ? nameParts.slice(1).join(' ') : "";
        let meta = o.metaData || {};
        let ct = normalizeMetaText(meta.city || "").replace(/\s/g, ''); 
        let st = normalizeMetaText(meta.state || "").substring(0, 2);   
        let zip = (meta.zip || "").replace(/\D/g, '');                  
        let country = "br";                                             
        let event_name = "purchase";
        let rawDate = o.timestamp ? new Date(o.timestamp) : new Date();
        let fullIso = rawDate.toISOString();
        let event_time = fullIso.split('.')[0] + 'Z'; 
        let valRaw = o.total;
        let value = Number.isInteger(valRaw) ? valRaw : valRaw.toFixed(2);
        let currency = "BRL";
        let email = o.customerEmail || ""; 
        csvContent += `${email},${phone},${fn},${ln},${zip},${country},${st},${ct},${event_name},${event_time},${value},${currency}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "meta_ads_offline_events.csv");
    document.body.appendChild(link);
    link.click();
}

// Estilo extra para os botões de filtro
const styleFilter = document.createElement('style');
styleFilter.innerHTML = `
    .filter-btn { padding: 6px 15px; border-radius: 20px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; border: 1px solid #ddd; background: transparent; }
    .filter-btn:hover { background: #eee; }
    .filter-btn.active { background: #555; color: white; border-color: #555; }
`;
document.head.appendChild(styleFilter);