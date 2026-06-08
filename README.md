# ⚡ FlashStore — PWA de Ofertas Relâmpago

Uma **Progressive Web App** mobile-first para e-commerce de ofertas relâmpago, construída com HTML5, CSS3 e JavaScript vanilla — sem frameworks.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Stack Tecnológico](#stack-tecnológico)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Como Rodar](#como-rodar)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Arquitetura e Padrões](#arquitetura-e-padrões)
- [Segurança (CSP)](#segurança-csp)
- [Service Worker](#service-worker)
- [Guia de Desenvolvimento](#guia-de-desenvolvimento)
- [Licença](#licença)

---

## Visão Geral

O FlashStore é uma PWA completa que simula uma loja de ofertas relâmpago com:

- Interface mobile-first responsiva (viewport 390×844 otimizado para iPhone)
- Tema claro/escuro com persistência no localStorage
- Sistema de notificações in-app e push (via Service Worker)
- Carrinho de compras com persistência no localStorage
- Busca e filtros por categoria
- PWA instalável com manifest.json
- Funcionalidade offline via Service Worker com caching inteligente
- Animações de scroll reveal com IntersectionObserver
- Contagem regressiva persistente

---

## Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Markup** | HTML5 semântico com acessibilidade (ARIA) |
| **Estilos** | CSS3 vanilla (variáveis CSS, flexbox, grid, dark mode) |
| **Lógica** | JavaScript vanilla (**ES Modules**, ES6+, async/await) |
| **PWA** | Service Worker + manifest.json |
| **Testes** | Playwright (functional + Lighthouse) |
| **CI/CD** | GitHub Actions (Ubuntu, Node 20) |
| **Servidor** | `serve` (dev), qualquer servidor estático (produção) |

---

## Estrutura do Projeto

```
freebuff/
├── js/                        # Lógica modular da aplicação
│   ├── modules/               # Módulos ES6
│   │   ├── cart.js            # Estado e lógica do carrinho
│   │   ├── constants.js       # Constantes e chaves de armazenamento
│   │   ├── countdown.js       # Lógica do timer regressivo
│   │   ├── images.js          # Observador de carregamento de imagens
│   │   ├── notifications.js   # Estado e lógica de notificações
│   │   ├── pwa-notifications.js # Push notifications e permissões
│   │   ├── pwa.js             # Registro de Service Worker e instalação
│   │   ├── renderers.js       # Manipulação do DOM e renderização
│   │   ├── reveal.js          # Animações de scroll (IntersectionObserver)
│   │   ├── theme.js           # Lógica de tema claro/escuro
│   │   └── utils.js           # Utilitários (formatters, escape, debounce)
│   └── main.js                # Ponto de entrada (Orchestrator)
├── index.html                 # Página principal (HTML semântico)
├── app.css                    # Estilos globais (CSS vanilla)
├── theme-init.js              # Script anti-FOUC para dark mode (carrega no <head>)
├── service-worker.js          # Service Worker v3 (caching, push, sync)
├── manifest.json              # Manifest PWA (instalável)
├── offline.html               # Página offline fallback
├── .env.example               # Exemplo de variáveis de ambiente
├── .gitignore                 # Configuração de arquivos ignorados pelo Git
├── icon-192.svg               # Ícone PWA 192×192
├── icon-512.svg               # Ícone PWA 512×512
├── package.json               # Dependências e scripts
├── playwright.config.js       # Configuração Playwright
└── tests/                     # Suíte de testes automatizados
```

---

## Funcionalidades

### 🏠 Tab Início
- **Hero Banner** — Destaque da oferta relâmpago com preço e desconto
- **Countdown Timer** — Contagem regressiva persistente (sobrevive reloads via localStorage)
- **Quick Actions** — Acesso rápido a Ofertas, Categorias, Frete Grátis, Favoritos
- **Mais Vendidos** — Lista horizontal de produtos em destaque
- **Seção de Confiança** — Ícones de Entrega Rápida, Compra Segura, Pague Fácil, Oferta Limitada

### 🛍️ Tab Produtos
- **Grid de Produtos** — Layout 2 colunas com imagem, preço, desconto e botão adicionar
- **Busca** — Input com debounce (200ms) para filtrar por nome ou categoria
- **Filtros por Categoria** — Chips: Todos, Monitores, Notebooks, Periféricos
- **Estado vazio** — Mensagem amigável quando nenhum produto é encontrado

### 🛒 Tab Carrinho
- **Lista de Itens** — Imagem, nome, preço, controles de quantidade (+/-)
- **Persistência** — Carrinho salvo no localStorage
- **Resumo** — Subtotal, frete grátis, total
- **Checkout** — Botão "Finalizar Compra" (toast simulado)
- **Limpar Tudo** — Botão para esvaziar o carrinho

### 👤 Tab Perfil
- **Avatar e dados** — Perfil do usuário
- **Menu** — Meus Dados, Formas de Pagamento, Endereços, Notificações, Configurações
- **Preferências de Notificação** — Toggles para ofertas relâmpago, atualizações de pedido, promoções
- **Testar Notificação** — Botão para disparar notificação de teste

### 🔔 Notificações
- **Centro de Notificações** — Painel slide-in lateral com lista de notificações
- **Badge não-lidas** — Contador no sino do header
- **Ações** — Marcar todas como lidas, limpar tudo, excluir individual
- **Seed Demo** — 3 notificações iniciais (oferta, pedido, cupom)
- **Push Notifications** — Service Worker com handlers `push`, `notificationclick`, `notificationclose`

### 🌙 Tema
- **Dark Mode** — Toggle com persistência no `localStorage`
- **FOUC Prevention** — Script `theme-init.js` carregado sincronamente no `<head>`
- **`prefers-color-scheme`** — Respeita preferência do sistema na primeira visita

### 📱 PWA
- **Instalável** — Banner de instalação com `beforeinstallprompt`
- **Offline** — Página `offline.html` como fallback
- **Banners de Status** — Offline e reconectado com animações em tempo real

---

## Como Rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) ≥ 18
- npm

### Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd freebuff

# Instalar dependências
npm ci

# Instalar navegadores do Playwright (para testes)
npx playwright install chromium
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento na porta 3000
npm run serve
```

Acesse: [http://localhost:3000/index.html](http://localhost:3000/index.html)

---

## Testes

### Todos os testes

```bash
npm test
```

### Auditoria Lighthouse

```bash
npm run test:lighthouse
```

### Cobertura de Código

```bash
npm run test:coverage
```

---

## CI/CD

O pipeline GitHub Actions (`.github/workflows/ci.yml`) executa testes funcionais e auditoria Lighthouse a cada push ou PR para a branch `main`.

---

## Arquitetura e Padrões

### Separação de Responsabilidades (ES Modules)

A aplicação é dividida em módulos especializados que se comunicam via eventos customizados, garantindo um baixo acoplamento.

### Padrões de Código

- **ES Modules** — Modularização nativa sem necessidade de bundlers para desenvolvimento.
- **Observer (Custom Events)** — O estado da aplicação notifica a UI sobre mudanças de forma reativa.
- **Sanitização de Dados** — Prevenção de XSS em todas as renderizações dinâmicas.
- **Event Delegation** — Gerenciamento eficiente de eventos no `body` da página.
- **Persistence Layer** — Abstração sobre `localStorage` para manter o estado entre sessões.

---

## Segurança (CSP)

O projeto implementa uma **Content Security Policy (CSP)** rigorosa:

```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' https://images.unsplash.com data:;
connect-src 'self';
font-src 'self';
```

- **Zero Inline Scripts**: Todo o código JS é carregado via módulos externos.
- **Zero Inline Styles**: Manipulações de estilo via JS são feitas através de classes CSS, mantendo a política de estilos restrita.

---

## Service Worker (v3)

### Estratégias de Cache

| Recurso | Estratégia | Descrição |
|---------|------------|-----------|
| **Navegação (HTML)** | **Network-first** | Tenta buscar a versão mais nova na rede, fallback para o cache offline. |
| **Imagens** | **Cache-first** | Carregamento instantâneo a partir do cache, rede apenas se não existir. |
| **Assets (JS/CSS)** | **Cache-first** | Cache agressivo para assets estáticos para performance máxima. |

---

## Guia de Desenvolvimento

### Variáveis de Ambiente
Renomeie o arquivo `.env.example` para `.env` e preencha as chaves necessárias para notificações Push e Analytics.

### Adicionar um novo produto
Edite o array `PRODUCTS` em `js/modules/constants.js`.

---

## Licença

ISC
