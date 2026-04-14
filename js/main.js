import { supabase } from './supabase.js';
import { signInWithDiscord, signOut, getCurrentUser } from './auth.js';
import { ENV } from './config.js';

// Глобальные функции
window.signIn = signInWithDiscord;
window.signOut = signOut;

// Загрузка страниц
async function loadPage(page) {
  const container = document.getElementById('page-content');
  if (!container) return;
  
  try {
    const response = await fetch(`pages/${page}.html`);
    if (!response.ok) {
      // Если страница не найдена, показываем заглушку
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h1>📄 ${page}</h1>
          <p>Страница в разработке</p>
          <a href="#home" style="color: #3b82f6;">На главную</a>
        </div>
      `;
      return;
    }
    const html = await response.text();
    container.innerHTML = html;
    
    // Инициализируем страницу после загрузки
    if (page === 'register') {
      setTimeout(() => {
        initRegisterPage();
      }, 100);
    }
    
    if (page === 'profile') {
      setTimeout(() => {
        initProfilePage();
      }, 100);
    }
    
  } catch (err) {
    console.error('Error loading page:', err);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h1>❌ Ошибка загрузки</h1>
        <p>Не удалось загрузить страницу</p>
        <a href="#home" style="color: #3b82f6;">На главную</a>
      </div>
    `;
  }
}

// Функция инициализации страницы профиля
async function initProfilePage() {
  const user = await getCurrentUser();
  const container = document.getElementById('profile-info');
  if (!container) return;
  
  if (user && user.profile) {
    container.innerHTML = `
      <div class="profile-card">
        <img src="${user.user_metadata?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" 
             class="profile-avatar" alt="Avatar">
        <div class="profile-details">
          <p><strong>⭐ Имя персонажа:</strong> ${user.profile.character_name || 'Не указано'}</p>
          <p><strong>🔑 Static ID:</strong> ${user.profile.static_id || 'Не указан'}</p>
          <p><strong>🎮 Discord:</strong> ${user.user_metadata?.full_name || user.email}</p>
          <p><strong>👑 Роль:</strong> ${user.profile.role || 'citizen'}</p>
          <p><strong>📅 Дата регистрации:</strong> ${new Date(user.profile.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = '<p>❌ Не удалось загрузить профиль</p>';
  }
}

// Функция инициализации страницы регистрации
async function initRegisterPage() {
  console.log('Инициализация страницы регистрации');
  
  // Ждем пока DOM обновится
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const characterNameInput = document.getElementById('character-name');
  const staticIdInput = document.getElementById('static-id');
  const registerBtn = document.getElementById('register-button');
  const messageDiv = document.getElementById('message');
  const discordInfoDiv = document.getElementById('discord-info');
  
  if (!registerBtn) {
    console.error('Кнопка регистрации не найдена');
    return;
  }
  
  // Загружаем информацию о Discord
  async function loadDiscordInfo() {
    const user = await getCurrentUser();
    if (discordInfoDiv && user) {
      discordInfoDiv.innerHTML = `
        <img src="${user.user_metadata?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" 
             class="discord-avatar" alt="Avatar" style="width: 48px; height: 48px; border-radius: 50%;">
        <div>
          <strong>Discord:</strong> ${user.user_metadata?.full_name || user.email}
        </div>
      `;
    }
  }
  
  // Функция регистрации
  async function registerUser() {
    const characterName = characterNameInput?.value.trim();
    const staticId = staticIdInput?.value.trim();
    
    if (!messageDiv) return;
    
    // Скрываем предыдущее сообщение
    messageDiv.style.display = 'none';
    messageDiv.className = 'error-message';
    
    // Валидация
    if (!characterName || characterName.length < 2) {
      messageDiv.textContent = '❌ Введите имя персонажа (мин. 2 символа)';
      messageDiv.style.display = 'block';
      return;
    }
    
    if (!staticId || staticId.length < 3) {
      messageDiv.textContent = '❌ Введите Static ID (мин. 3 символа)';
      messageDiv.style.display = 'block';
      return;
    }
    
    // Получаем пользователя
    const user = await getCurrentUser();
    if (!user) {
      messageDiv.textContent = '❌ Ошибка: пользователь не найден';
      messageDiv.style.display = 'block';
      return;
    }
    
    // Блокируем кнопку
    if (registerBtn) {
      registerBtn.disabled = true;
      registerBtn.textContent = '⏳ Проверка...';
    }
    
    try {
      // Проверяем уникальность static_id
      const { data: existing } = await supabase
        .from('profiles')
        .select('static_id')
        .eq('static_id', staticId)
        .maybeSingle();
      
      if (existing) {
        messageDiv.textContent = '❌ Этот Static ID уже занят!';
        messageDiv.style.display = 'block';
        if (registerBtn) {
          registerBtn.disabled = false;
          registerBtn.textContent = 'Завершить регистрацию';
        }
        return;
      }
      
      // Обновляем профиль
      if (registerBtn) registerBtn.textContent = '⏳ Сохранение...';
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          character_name: characterName,
          static_id: staticId,
          is_registered: true,
          updated_at: new Date()
        })
        .eq('id', user.id);
      
      if (updateError) {
        messageDiv.textContent = '❌ Ошибка: ' + updateError.message;
        messageDiv.style.display = 'block';
        if (registerBtn) {
          registerBtn.disabled = false;
          registerBtn.textContent = 'Завершить регистрацию';
        }
        return;
      }
      
      // Успех!
      messageDiv.className = 'success-message';
      messageDiv.textContent = '✅ Регистрация успешна! Перенаправление...';
      messageDiv.style.display = 'block';
      if (registerBtn) registerBtn.textContent = '✅ Успешно!';
      
      setTimeout(() => {
        window.location.hash = '#dashboard';
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Ошибка:', error);
      messageDiv.textContent = '❌ Произошла ошибка';
      messageDiv.style.display = 'block';
      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Завершить регистрацию';
      }
    }
  }
  
  // Назначаем обработчики
  registerBtn.onclick = registerUser;
  
  if (characterNameInput) {
    characterNameInput.onkeypress = (e) => {
      if (e.key === 'Enter') registerUser();
    };
  }
  
  if (staticIdInput) {
    staticIdInput.onkeypress = (e) => {
      if (e.key === 'Enter') registerUser();
    };
  }
  
  await loadDiscordInfo();
}

// Обновление UI
async function updateUI() {
  const user = await getCurrentUser();
  const authSection = document.getElementById('auth-section');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (authSection) {
    if (user && user.profile) {
      if (user.profile.is_registered) {
        authSection.innerHTML = `
          <div class="user-info">
            <span>⭐ ${user.profile.character_name || user.email}</span>
            <button onclick="window.signOut()" class="btn-logout">Выйти</button>
          </div>
        `;
        navLinks.forEach(link => link.style.display = 'inline-block');
      } else {
        authSection.innerHTML = `
          <div class="user-info">
            <span>⚠️ Требуется регистрация</span>
            <button onclick="window.location.hash='#register'" class="btn-discord">Регистрация</button>
            <button onclick="window.signOut()" class="btn-logout">Выйти</button>
          </div>
        `;
        navLinks.forEach(link => link.style.display = 'none');
      }
    } else {
      authSection.innerHTML = `
        <button onclick="window.signIn()" class="btn-discord">
          🎮 Войти через Discord
        </button>
      `;
      navLinks.forEach(link => link.style.display = 'none');
    }
  }
}

// Обработка маршрутов
async function handleRoute() {
  let hash = window.location.hash.slice(1); // убираем #
  
  // Убираем слэш в начале, если есть
  if (hash.startsWith('/')) {
    hash = hash.slice(1);
  }
  
  if (!hash || hash === '') {
    hash = 'home';
  }
  
  const user = await getCurrentUser();
  
  // Если пользователь не авторизован и не на главной
  if (!user && hash !== 'home') {
    window.location.hash = '#home';
    loadPage('home');
    updateUI();
    return;
  }
  
  // Если пользователь авторизован но не зарегистрирован
  if (user && user.profile && !user.profile.is_registered) {
    if (hash !== 'register') {
      window.location.hash = '#register';
      loadPage('register');
      updateUI();
      return;
    }
  }
  
  // Если зарегистрирован и пытается зайти на регистрацию
  if (user && user.profile && user.profile.is_registered && hash === 'register') {
    window.location.hash = '#dashboard';
    loadPage('dashboard');
    updateUI();
    return;
  }
  
  // Загружаем запрошенную страницу
  const validPages = ['home', 'dashboard', 'profile', 'council', 'register'];
  if (validPages.includes(hash)) {
    loadPage(hash);
  } else {
    loadPage('home');
  }
  
  updateUI();
}

// Создание/проверка профиля
async function ensureProfile(user) {
  if (!user) return null;
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error('Ошибка проверки профиля:', error);
    return null;
  }
  
  if (!profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        character_name: 'Неизвестный',
        discord_username: user.user_metadata?.full_name || user.email,
        discord_id: user.identities?.find(i => i.provider === 'discord')?.id,
        avatar_url: user.user_metadata?.avatar_url,
        is_registered: false
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Ошибка создания профиля:', insertError);
      return null;
    }
    
    return newProfile;
  }
  
  return profile;
}

// Инициализация
async function init() {
  console.log('🚀 Приложение запущено');
  
  // Обработка callback от Discord
  const hash = window.location.hash;
  if (hash && (hash.includes('access_token') || hash.includes('code'))) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await ensureProfile(session.user);
      window.location.hash = '';
      window.location.reload();
      return;
    }
  }
  
  // Проверяем текущую сессию
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await ensureProfile(session.user);
  }
  
  // Слушаем изменения авторизации
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event);
    if (event === 'SIGNED_IN' && session) {
      await ensureProfile(session.user);
      window.location.reload();
    } else if (event === 'SIGNED_OUT') {
      window.location.reload();
    }
  });
  
  // Запускаем роутинг
  window.addEventListener('hashchange', handleRoute);
  await handleRoute();
}

// Запуск приложения
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}