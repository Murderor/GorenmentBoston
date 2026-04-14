const routes = {
  '/': 'home',
  '/dashboard': 'dashboard',
  '/profile': 'profile',
  '/council': 'council',
  '/register': 'register'  // Добавляем страницу регистрации
};

export async function loadPage(path) {
  if (!path || path === 'callback' || path.includes('callback')) {
    path = '/';
  }
  
  const pageName = routes[path];
  const container = document.getElementById('page-content');
  if (!container) return;

  if (!pageName) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h1>404 - Страница не найдена</h1>
        <a href="#/" style="color: #3b82f6;">Вернуться на главную</a>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(`pages/${pageName}.html`);
    if (!response.ok) throw new Error('Page not found');
    const html = await response.text();
    container.innerHTML = html;
    setActiveNav(path);
    
    if (window.pageScripts && window.pageScripts[pageName]) {
      window.pageScripts[pageName]();
    }
  } catch (err) {
    console.error('Error loading page:', err);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h1>❌ Ошибка загрузки</h1>
        <p>Не удалось загрузить страницу</p>
        <a href="#/" style="color: #3b82f6;">Вернуться на главную</a>
      </div>
    `;
  }
}

function setActiveNav(path) {
  // Скрываем навигацию на странице регистрации
  const nav = document.querySelector('nav');
  if (nav) {
    nav.style.display = path === '/register' ? 'none' : 'flex';
  }
  
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkPath = link.getAttribute('data-path');
    link.classList.toggle('active', linkPath === path);
  });
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    let path = window.location.hash.slice(1) || '/';
    path = path.split('?')[0];
    loadPage(path);
  });
  
  let initialPath = window.location.hash.slice(1) || '/';
  initialPath = initialPath.split('?')[0];
  loadPage(initialPath);
}