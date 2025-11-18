// Configuração da API
const API_CONFIG = {
  baseURL: 'https://userannyrosa.onrender.com', // SUBSTITUA pela URL da sua API
  auth: {
    username: 'RannyRosa', // SUBSTITUA pelo seu usuário
    password: 'xtU7xAISA656HqqIxhofyyFr4DjVzWB7' // SUBSTITUA pela sua senha
  },
  whatsapp: '5527992999497' // SUBSTITUA pelo seu número do WhatsApp
};

// Helper para criar headers com Basic Auth
function getAuthHeaders() {
  const credentials = btoa(`${API_CONFIG.auth.username}:${API_CONFIG.auth.password}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}
