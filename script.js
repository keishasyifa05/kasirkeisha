// Inisialisasi Data Default ke LocalStorage jika belum ada (Harga tanpa titik & ID unik)
if (!localStorage.getItem('products')) {
    const defaultProducts = [
        { id: 1, name: 'Fudgy Brownies *10x10', price: 20000, stock: 20 },
        { id: 2, name: 'Fudgy Brownies *20x10', price: 35000, stock: 15 },
        { id: 3, name: 'Fudgy Brownies *20x20', price: 55000, stock: 20 },
        { id: 4, name: 'Brownies Kukus *20x10', price: 35000, stock: 20 },
        { id: 5, name: 'Brownies Kukus *20x20', price: 65000, stock: 10 },
        { id: 6, name: 'Brownies Pie *isi 12', price: 55000, stock: 25 }
    ];
    localStorage.setItem('products', JSON.stringify(defaultProducts));
}

if (!localStorage.getItem('transactions')) {
    localStorage.setItem('transactions', JSON.stringify([]));
}

let cart = [];

// Fungsi Pindah Tab
function switchTab(tabName) {
    ['kasir', 'produk', 'riwayat'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.add('hidden');
        document.getElementById(`btn-${t}`).className = 'bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold transition';
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.getElementById(`btn-${tabName}`).className = 'bg-blue-600 text-white px-4 py-2 rounded font-semibold transition';

    if (tabName === 'kasir') renderProductList();
    if (tabName === 'produk') renderProductTable();
    if (tabName === 'riwayat') renderHistoryTable();
}

// Format Angka ke Rupiah
function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// --- FITUR KASIR & KERANJANG ---
function renderProductList() {
    const products = JSON.parse(localStorage.getItem('products'));
    const keyword = document.getElementById('search-product').value.toLowerCase();
    const container = document.getElementById('product-list');
    container.innerHTML = '';

    const filtered = products.filter(p => p.name.toLowerCase().includes(keyword));

    if (filtered.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-4">Produk tidak ditemukan</p>`;
        return;
    }

    filtered.forEach(p => {
        container.innerHTML += `
            <div onclick="addToCart(${p.id})" class="border p-3 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow transition bg-white flex flex-col justify-between">
                <div>
                    <h3 class="font-semibold text-sm text-gray-800">${p.name}</h3>
                    <p class="text-blue-600 font-bold text-sm mt-1">${formatRupiah(p.price)}</p>
                </div>
                <span class="text-xs text-gray-500 mt-2">Stok: ${p.stock}</span>
            </div>
        `;
    });
}

function addToCart(id) {
    let products = JSON.parse(localStorage.getItem('products'));
    let product = products.find(p => p.id === id);

    if (product.stock <= 0) {
        alert('Stok produk habis!');
        return;
    }

    let cartItem = cart.find(item => item.id === id);
    if (cartItem) {
        if (cartItem.qty < product.stock) {
            cartItem.qty++;
        } else {
            alert('Jumlah melebihi stok tersedia!');
            return;
        }
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-sm text-center py-4">Keranjang masih kosong</p>`;
        document.getElementById('cart-total').innerText = formatRupiah(0);
        document.getElementById('cart-change').innerText = formatRupiah(0);
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        let subtotal = item.price * item.qty;
        total += subtotal;
        container.innerHTML += `
            <div class="py-2 flex justify-between items-center text-sm">
                <div>
                    <p class="font-semibold">${item.name}</p>
                    <p class="text-xs text-gray-500">${formatRupiah(item.price)} x ${item.qty}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="font-bold">${formatRupiah(subtotal)}</span>
                    <button onclick="changeQty(${index}, -1)" class="bg-gray-200 px-2 py-0.5 rounded text-xs">-</button>
                    <button onclick="changeQty(${index}, 1)" class="bg-gray-200 px-2 py-0.5 rounded text-xs">+</button>
                </div>
            </div>
        `;
    });

    document.getElementById('cart-total').innerText = formatRupiah(total);
    calculateChange();
}

function changeQty(index, delta) {
    let products = JSON.parse(localStorage.getItem('products'));
    let product = products.find(p => p.id === cart[index].id);

    cart[index].qty += delta;
    if (cart[index].qty > product.stock) {
        alert('Stok tidak mencukupi!');
        cart[index].qty = product.stock;
    }
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    renderCart();
}

function calculateChange() {
    let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let payment = parseFloat(document.getElementById('payment-amount').value) || 0;
    let change = payment - total;

    let changeEl = document.getElementById('cart-change');
    if (change >= 0) {
        changeEl.innerText = formatRupiah(change);
        changeEl.className = "text-green-600 font-bold";
    } else {
        changeEl.innerText = "Uang kurang " + formatRupiah(Math.abs(change));
        changeEl.className = "text-red-600 font-bold";
    }
}

function processCheckout() {
    if (cart.length === 0) {
        alert('Keranjang masih kosong!');
        return;
    }

    let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let payment = parseFloat(document.getElementById('payment-amount').value) || 0;

    if (payment < total) {
        alert('Jumlah pembayaran kurang dari total belanja!');
        return;
    }

    let change = payment - total;

    // Kurangi stok produk di localStorage
    let products = JSON.parse(localStorage.getItem('products'));
    cart.forEach(cartItem => {
        let p = products.find(prod => prod.id === cartItem.id);
        if (p) p.stock -= cartItem.qty;
    });
    localStorage.setItem('products', JSON.stringify(products));

    // Simpan Transaksi ke Riwayat
    let transactions = JSON.parse(localStorage.getItem('transactions'));
    let transactionId = 'TRX-' + Date.now();
    let transactionDate = new Date().toLocaleString('id-ID');

    let newTx = {
        id: transactionId,
        date: transactionDate,
        items: [...cart],
        total: total,
        payment: payment,
        change: change
    };

    transactions.push(newTx);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Tampilkan Struk
    showReceipt(newTx);

    // Reset Kasir
    cart = [];
    document.getElementById('payment-amount').value = '';
    renderCart();
    renderProductList();
}


// --- FITUR CRUD PRODUK ---
function saveProduct(e) {
    e.preventDefault();
    let id = document.getElementById('product-id').value;
    let name = document.getElementById('p-name').value;
    let price = parseInt(document.getElementById('p-price').value);
    let stock = parseInt(document.getElementById('p-stock').value);

    let products = JSON.parse(localStorage.getItem('products'));

    if (id) {
        // UPDATE
        let p = products.find(prod => prod.id == id);
        p.name = name;
        p.price = price;
        p.stock = stock;
    } else {
        // CREATE
        let newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price, stock });
    }

    localStorage.setItem('products', JSON.stringify(products));
    resetProductForm();
    renderProductTable();
}

function renderProductTable() {
    let products = JSON.parse(localStorage.getItem('products'));
    let tbody = document.getElementById('product-table-body');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">Belum ada data produk</td></tr>`;
        return;
    }

    products.forEach(p => {
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50">
                <td class="border p-2">${p.name}</td>
                <td class="border p-2">${formatRupiah(p.price)}</td>
                <td class="border p-2">${p.stock}</td>
                <td class="border p-2 text-center space-x-2">
                    <button onclick="editProduct(${p.id})" class="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600">Edit</button>
                    <button onclick="deleteProduct(${p.id})" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">Hapus</button>
                </td>
            </tr>
        `;
    });
}

function editProduct(id) {
    let products = JSON.parse(localStorage.getItem('products'));
    let p = products.find(prod => prod.id === id);
    
    document.getElementById('product-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-stock').value = p.stock;

    document.getElementById('form-title').innerText = "Edit Produk (UPDATE)";
    document.getElementById('btn-save-product').innerText = "Perbarui Produk";
    document.getElementById('btn-save-product').className = "bg-yellow-500 text-white p-2 rounded font-bold hover:bg-yellow-600 transition";
}

function deleteProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        let products = JSON.parse(localStorage.getItem('products'));
        products = products.filter(p => p.id !== id);