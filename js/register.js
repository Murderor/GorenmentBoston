import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

export async function initRegisterPage() {
  console.log('Инициализация страницы регистрации');
  
  async function loadDiscordInfo() {
    const user = await getCurrentUser();
    const container = document.getElementById('discord-info');
    
    if (container && user) {
      container.innerHTML = `
        <img src="${user.user_metadata?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" 
             class="discord-avatar" alt="Avatar">
        <div>
          <strong>Discord:</strong> ${user.user_metadata?.full_name || user.email}
        </div>
      `;
    }
  }
  
  async function registerUser() {
    const characterName = document.getElementById('character-name').value.trim();
    const staticId = document.getElementById('static-id').value.trim();
    const messageDiv = document.getElementById('message');
    const registerBtn = document.getElementById('register-button');
    
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
    registerBtn.disabled = true;
    registerBtn.textContent = '⏳ Проверка...';
    
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
        registerBtn.disabled = false;
        registerBtn.textContent = 'Завершить регистрацию';
        return;
      }
      
      // Обновляем профиль
      registerBtn.textContent = '⏳ Сохранение...';
      
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
        registerBtn.disabled = false;
        registerBtn.textContent = 'Завершить регистрацию';
        return;
      }
      
      // Успех!
      messageDiv.className = 'success-message';
      messageDiv.textContent = '✅ Регистрация успешна! Перенаправление...';
      messageDiv.style.display = 'block';
      registerBtn.textContent = '✅ Успешно!';
      
      setTimeout(() => {
        window.location.hash = '#dashboard';
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Ошибка:', error);
      messageDiv.textContent = '❌ Произошла ошибка';
      messageDiv.style.display = 'block';
      registerBtn.disabled = false;
      registerBtn.textContent = 'Завершить регистрацию';
    }
  }
  
  // Назначаем обработчики после загрузки DOM
  const registerBtn = document.getElementById('register-button');
  if (registerBtn) {
    registerBtn.addEventListener('click', registerUser);
  }
  
  const nameInput = document.getElementById('character-name');
  const idInput = document.getElementById('static-id');
  if (nameInput) {
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') registerUser();
    });
  }
  if (idInput) {
    idInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') registerUser();
    });
  }
  
  await loadDiscordInfo();
}

// Автоматическая инициализация при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRegisterPage);
} else {
  initRegisterPage();
}