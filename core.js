// --- core.js ---
// Banco de dados, Variáveis Globais e Inicialização
// --- core.js ---
const WHITELIST = ['felipe', 'edicley', 'guilherme', 'teste']; // Slugs autorizados


const DB_KEY = 'saas_delivery_db';
const STOCK_IMAGES = [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60", 
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=60", 
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60", 
    "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60", 
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=60", 
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=500&q=60"  
];

const DB = {
    getAll: () => JSON.parse(localStorage.getItem(DB_KEY)) || {},
    saveAll: (data) => localStorage.setItem(DB_KEY, JSON.stringify(data)),
    init: () => { },
    getStore: (slug) => { return DB.getAll()[slug] || null; },
    saveStoreData: (slug, data) => {
        const db = DB.getAll();
        db[slug] = data;
        try { DB.saveAll(db); } catch (e) { alert("Erro: Imagem muito grande. Tente uma menor."); }
    }
};

let currentSlug = null;
let isAdmin = false;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('bh_cart')) || [];
let currentProduct = null;
let currentQty = 1;
let tempComplements = []; 
let tempNeighborhoods = [];
let editingProductContext = null;
let driversStatus = JSON.parse(localStorage.getItem('bh_drivers_status')) || {};

// --- INICIALIZAÇÃO (ROUTER) ---
document.addEventListener("DOMContentLoaded", () => {
    DB.init();
    const pageId = document.body.id;

    if (pageId === "adminPage") {
        const loggedSlug = localStorage.getItem('saas_admin_slug');
        if (!loggedSlug) return window.location.href = "login.html";
        currentSlug = loggedSlug;
        isAdmin = true;
        loadStoreContext();
        initAdmin();
    } 
    else if (window.location.pathname.includes('login.html')) { /* Login Page */ }
    else {
        // ÁREA DO CLIENTE
        const params = new URLSearchParams(window.location.search);
        let slugParam = params.get('loja');

        if (!slugParam) {
            const adminSlug = localStorage.getItem('saas_admin_slug');
            if (adminSlug) {
                slugParam = adminSlug;
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?loja=' + adminSlug;
                window.history.replaceState({path:newUrl},'',newUrl);
            } else { 
                slugParam = 'demo'; 
            }
        }
        
        currentSlug = slugParam;
        loadStoreContext();
        
        if (!storeData && currentSlug !== 'demo') {
            storeData = getSeedStoreData("Loja Exemplo");
            alert("Loja não encontrada. Mostrando exemplo.");
        } else if (currentSlug === 'demo' && !storeData) {
            storeData = getSeedStoreData("Loja Demo");
        }

        applyStoreSettings();

        if (document.getElementById("menuContainer")) initHome();
        else if (document.getElementById("checkoutPage")) initCheckout();
        else if (pageId === "statusPage") initStatusPage();
    }
    updateGlobalCartCount();
});

function loadStoreContext() { storeData = DB.getStore(currentSlug); }



function handleLogin() {
    const slug = document.getElementById('loginSlug').value;
    const pass = document.getElementById('loginPass').value;

    // Trava de Segurança: Verifica se o slug está na Whitelist
    if (!WHITELIST.includes(slug)) {
        return alert("Erro: Esta loja não está autorizada no sistema. Fale com o administrador.");
    }

    const store = DB.getStore(slug);
    if (store && store.password === pass) {
        localStorage.setItem('saas_admin_slug', slug);
        window.location.href = "admin.html";
    } else { alert("Dados incorretos."); }
}






function getSeedStoreData(slugName) {
    return {
        password: '123',
        settings: { 
            name: slugName.toUpperCase(), 
            logo: "https://via.placeholder.com/100?text=Logo",
            banner: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
            address: "", feeType: 'fixed', feeValue: 0, feeDesc: "" 
        },
        menu: [
            {
                id: 'cat_especiais', name: 'Platos Especiales', items: [
                    { id: 101, name: 'Hamburguesa Royal a la Cubana', desc: 'Hamburguesa con cebola, tomate, queijo especial e molho secreto.', price: 18.00, img: STOCK_IMAGES[0], complements: [] },
                    { id: 102, name: 'Pizza Margarita Especial', desc: 'Massa artesanal, molho de tomate fresco, manjericão e queijo.', price: 12.00, img: STOCK_IMAGES[1], complements: [] }
                ]
            },
            {
                id: 'cat_bebidas', name: 'Bebidas', items: [
                    { id: 201, name: 'Coca-Cola', desc: 'Lata 350ml gelada.', price: 6.00, img: STOCK_IMAGES[2], complements: [] },
                    { id: 202, name: 'Suco Natural', desc: 'Laranja, 500ml.', price: 8.00, img: STOCK_IMAGES[3], complements: [] }
                ]
            },
            {
                id: 'cat_postres', name: 'Postres', items: [
                    { id: 301, name: 'Suspiro a la Limeña', desc: 'Doce típico peruano com base de leite condensado.', price: 10.00, img: STOCK_IMAGES[4], complements: [] }
                ]
            }
        ],
        orders: []
    };
}

function handleLogin() {
    const slug = document.getElementById('loginSlug').value;
    const pass = document.getElementById('loginPass').value;
    const store = DB.getStore(slug);
    if (store && store.password === pass) {
        localStorage.setItem('saas_admin_slug', slug);
        window.location.href = "admin.html";
    } else { alert("Dados incorretos."); }
}

function handleRegisterMock() {
    const slug = prompt("Crie o link da sua loja (ex: delivery10):");
    if(!slug) return;
    if(DB.getStore(slug)) return alert("Link já existe!");
    const newStore = getSeedStoreData(slug);
    DB.saveStoreData(slug, newStore);
    alert(`Loja criada!\nLink: ${slug}\nSenha: 123`);
}

function doLogout() {
    localStorage.removeItem('saas_admin_slug');
    window.location.href = "login.html";
}






async function createWhatsAppInstance(slug) {
    const url = "https://zap.recursosaladeaula.com.br/instance/create";
    const apiKey = "P@ssw0rd!0809"; // Sua chave mestre

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                "instanceName": slug,
                "token": "token-" + slug, // Um token único para esta loja
                "qrcode": true
            })
        });
        const data = await response.json();
        console.log("Instância criada com sucesso:", data);
        return data;
    } catch (error) {
        console.error("Erro ao criar instância no Evolution:", error);
    }
}




async function handleRegisterMock() {
    const slug = prompt("Crie o link da sua loja (ex: delivery10):");
    if(!slug) return;

    // Verifica Whitelist antes de criar
    if (!WHITELIST.includes(slug)) {
        return alert("Este link não está na lista de autorizados.");
    }

    if(DB.getStore(slug)) return alert("Link já existe!");

    // 1. Cria a instância de WhatsApp no servidor
    alert("Estamos preparando seu WhatsApp, aguarde...");
    await createWhatsAppInstance(slug);

    // 2. Cria a loja no banco
    const newStore = getSeedStoreData(slug);
    DB.saveStoreData(slug, newStore);

    alert(`Loja criada e WhatsApp preparado!\nLink: ${slug}\nSenha: 123`);
}