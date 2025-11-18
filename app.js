// Estado global
let produtos = [];
let carrinho = [];
let usuarioLogado = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  inicializarEventos();
  verificarUsuarioLogado();
});

// Carregar produtos da API
async function carregarProdutos() {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/produtos`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Erro ao carregar produtos');
    
    produtos = await response.json();
    renderizarProdutos();
    document.getElementById('loadingProducts').style.display = 'none';
  } catch (error) {
    console.error('[v0] Erro ao carregar produtos:', error);
    document.getElementById('loadingProducts').style.display = 'none';
    document.getElementById('errorProducts').style.display = 'block';
    document.getElementById('errorProducts').textContent = 'Erro ao carregar produtos. Tente novamente.';
  }
}

// Renderizar produtos
function renderizarProdutos() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  
  produtos.forEach(produto => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imagemUrl = produto.imagem || '/placeholder.svg?height=150&width=150';
    const preco = parseFloat(produto.preco || 0);
    
    card.innerHTML = `
      <img src="${imagemUrl}" alt="${produto.nome}" class="product-image" 
           onerror="this.src='/placeholder.svg?height=150&width=150'">
      <div class="product-name">${produto.nome}</div>
      <div class="product-price">R$ ${preco.toFixed(2)}</div>
      <div class="product-quantity">
        <button class="qty-btn" onclick="alterarQuantidade(${produto.id}, -1)">-</button>
        <input type="number" class="qty-input" id="qty-${produto.id}" value="0" min="0" readonly>
        <button class="qty-btn" onclick="alterarQuantidade(${produto.id}, 1)">+</button>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

// Alterar quantidade do produto
function alterarQuantidade(produtoId, delta) {
  const input = document.getElementById(`qty-${produtoId}`);
  let quantidade = parseInt(input.value) + delta;
  
  if (quantidade < 0) quantidade = 0;
  
  input.value = quantidade;
  atualizarCarrinho(produtoId, quantidade);
}

// Atualizar carrinho
function atualizarCarrinho(produtoId, quantidade) {
  const itemExistente = carrinho.find(item => item.id === produtoId);
  
  if (quantidade === 0) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
  } else if (itemExistente) {
    itemExistente.quantidade = quantidade;
  } else {
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) {
      carrinho.push({
        id: produto.id,
        nome: produto.nome,
        preco: parseFloat(produto.preco || 0),
        quantidade: quantidade,
        imagem: produto.imagem
      });
    }
  }
  
  renderizarCarrinho();
  atualizarBadgeCarrinho();
}

// Renderizar carrinho
function renderizarCarrinho() {
  const container = document.getElementById('cartItems');
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  if (carrinho.length === 0) {
    container.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
    checkoutBtn.disabled = true;
    document.getElementById('cartTotal').textContent = 'R$ 0,00';
    return;
  }
  
  let html = '';
  let total = 0;
  
  carrinho.forEach(item => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;
    
    html += `
      <div class="cart-item">
        <img src="${item.imagem || '/placeholder.svg?height=60&width=60'}" 
             alt="${item.nome}" class="cart-item-image"
             onerror="this.src='/placeholder.svg?height=60&width=60'">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.nome}</div>
          <div class="cart-item-price">R$ ${item.preco.toFixed(2)}</div>
          <div class="cart-item-quantity">${item.quantidade}x - R$ ${subtotal.toFixed(2)}</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  document.getElementById('cartTotal').textContent = `R$ ${total.toFixed(2)}`;
  checkoutBtn.disabled = false;
}

// Atualizar badge do carrinho
function atualizarBadgeCarrinho() {
  const total = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
  document.getElementById('cartCount').textContent = total;
}

// Inicializar eventos
function inicializarEventos() {
  document.getElementById('cartToggle').addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.toggle('open');
  });
  
  document.getElementById('closeCart').addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.remove('open');
  });
  
  document.getElementById('checkoutBtn').addEventListener('click', abrirCheckout);
  document.getElementById('loginBtn').addEventListener('click', () => openModal('loginModal'));
  
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
}

// Verificar usuário logado
function verificarUsuarioLogado() {
  const usuario = localStorage.getItem('usuario');
  if (usuario) {
    usuarioLogado = JSON.parse(usuario);
    document.getElementById('loginBtn').textContent = 'Sair';
    document.getElementById('loginBtn').onclick = logout;
  }
}

// Login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ documento: email, senha: password })
    });
    
    if (!response.ok) throw new Error('Login falhou');
    
    const data = await response.json();
    usuarioLogado = data.usuario;
    localStorage.setItem('usuario', JSON.stringify(usuarioLogado));
    
    closeModal('loginModal');
    verificarUsuarioLogado();
    alert('Login realizado com sucesso!');
  } catch (error) {
    console.error('[v0] Erro no login:', error);
    alert('Erro ao fazer login. Verifique suas credenciais.');
  }
}

// Logout
function logout() {
  usuarioLogado = null;
  localStorage.removeItem('usuario');
  document.getElementById('loginBtn').textContent = 'Login';
  document.getElementById('loginBtn').onclick = () => openModal('loginModal');
  alert('Logout realizado!');
}

// Abrir checkout
function abrirCheckout() {
  if (carrinho.length === 0) return;
  
  if (usuarioLogado) {
    // Preencher dados do usuário logado
    document.getElementById('customerName').value = usuarioLogado.nome || '';
    document.getElementById('customerEmail').value = usuarioLogado.email || '';
    document.getElementById('customerCPF').value = usuarioLogado.documento || '';
  }
  
  openModal('checkoutModal');
}

// Processar checkout
async function handleCheckout(e) {
  e.preventDefault();
  
  const nome = document.getElementById('customerName').value;
  const email = document.getElementById('customerEmail').value;
  const telefone = document.getElementById('customerPhone').value;
  const cpf = document.getElementById('customerCPF').value;
  const endereco = document.getElementById('customerAddress').value;
  
  try {
    // Criar pedido
    const pedidoData = {
      cliente: {
        nome,
        email,
        telefone,
        cpf_cnpj: cpf,
        endereco
      },
      itens: carrinho.map(item => ({
        produto_id: item.id,
        quantidade: item.quantidade,
        preco: item.preco
      }))
    };
    
    const response = await fetch(`${API_CONFIG.baseURL}/pedidos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(pedidoData)
    });
    
    if (!response.ok) throw new Error('Erro ao criar pedido');
    
    const resultado = await response.json();
    
    // Gerar mensagem WhatsApp
    const mensagem = gerarMensagemWhatsApp(nome, carrinho);
    const whatsappUrl = `https://wa.me/${API_CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;
    
    // Limpar carrinho
    carrinho = [];
    produtos.forEach(p => {
      const input = document.getElementById(`qty-${p.id}`);
      if (input) input.value = 0;
    });
    renderizarCarrinho();
    atualizarBadgeCarrinho();
    
    closeModal('checkoutModal');
    document.getElementById('cartSidebar').classList.remove('open');
    
    // Abrir WhatsApp
    alert('Pedido registrado! Você será redirecionado para o WhatsApp.');
    window.open(whatsappUrl, '_blank');
    
  } catch (error) {
    console.error('[v0] Erro no checkout:', error);
    alert('Erro ao finalizar pedido. Tente novamente.');
  }
}

// Gerar mensagem WhatsApp
function gerarMensagemWhatsApp(nomeCliente, itens) {
  let mensagem = `*Novo Pedido - ${nomeCliente}*\n\n`;
  let total = 0;
  
  itens.forEach(item => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;
    mensagem += `• ${item.nome} - ${item.quantidade}x - R$ ${subtotal.toFixed(2)}\n`;
  });
  
  mensagem += `\n*Total: R$ ${total.toFixed(2)}*`;
  return mensagem;
}

// Modal helpers
function openModal(modalId) {
  document.getElementById(modalId).classList.add('open');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
}
