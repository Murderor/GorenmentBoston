// scripts/script.js
(function() {
    // Инициализация Supabase
    const SUPABASE_URL = 'https://nykqhtiiwltmujgkjehs.supabase.co';     // замените на свой URL
    const SUPABASE_ANON_KEY = 'sb_publishable_kaRLHUqyz2zW_xl_TwCBlw_ixmiqCf7';                // замените на свой anon key

    // Создаем клиент Supabase
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // DOM элементы
    const authWidget = document.getElementById('authWidget');
    const userProfileDiv = document.getElementById('userProfile');
    const newsList = document.getElementById('newsList');

    // Функция проверки и отображения сессии
    async function initAuth() {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // Пользователь вошёл
            await renderUserUI(session.user);
            await loadUserProfile(session.user.id);
        } else {
            renderUnauthUI();
        }
        
        // Слушаем изменения аутентификации
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await renderUserUI(session.user);
                await loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                renderUnauthUI();
                userProfileDiv.innerHTML = '<p>Войдите, чтобы увидеть свой профиль.</p>';
            }
        });
    }

    // Рендер для неавторизованного пользователя
    function renderUnauthUI() {
        if (!authWidget) return;
        authWidget.innerHTML = `
            <button id="discordLoginBtn" class="btn-discord">
                <span>🎮</span> Войти через Discord
            </button>
        `;
        const loginBtn = document.getElementById('discordLoginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => signInWithDiscord());
        }
    }

    // Рендер UI авторизованного пользователя
    async function renderUserUI(user) {
        if (!authWidget) return;
        
        // Получаем роль и уровень допуска из таблицы users
        const { data: userData, error } = await supabase
            .from('users')
            .select('name, role, clearance_level')
            .eq('id', user.id)
            .single();
        
        const displayName = userData?.name || user.user_metadata?.full_name || user.email || 'Гражданин';
        const role = userData?.role || 'citizen';
        const clearance = userData?.clearance_level || 1;
        
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
        
        authWidget.innerHTML = `
            <div class="user-info">
                ${avatarUrl ? `<img src="${avatarUrl}" class="user-avatar" alt="avatar">` : '<span>👤</span>'}
                <span class="user-name">${escapeHtml(displayName)}</span>
                <span class="user-role">${escapeHtml(role)} (ур. ${clearance})</span>
                <button id="logoutBtn" class="btn-logout">Выйти</button>
            </div>
        `;
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => supabase.auth.signOut());
        }
    }

    // Загрузка профиля из БД
    async function loadUserProfile(userId) {
        if (!userProfileDiv) return;
        
        const { data, error } = await supabase
            .from('users')
            .select('name, role, clearance_level')
            .eq('id', userId)
            .single();
            
        if (error) {
            console.error('Ошибка загрузки профиля:', error);
            userProfileDiv.innerHTML = '<p>Не удалось загрузить профиль.</p>';
            return;
        }
        
        userProfileDiv.innerHTML = `
            <div class="profile-detail"><strong>Имя:</strong> ${escapeHtml(data.name)}</div>
            <div class="profile-detail"><strong>Роль:</strong> ${escapeHtml(data.role)}</div>
            <div class="profile-detail"><strong>Уровень допуска:</strong> ${data.clearance_level}</div>
            <div class="profile-detail"><strong>Статус:</strong> <span style="color: green;">Активен</span></div>
        `;
    }

    // Вход через Discord
    async function signInWithDiscord() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: window.location.origin,
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Ошибка входа:', error.message);
            alert('Не удалось войти через Discord. Проверьте настройки Supabase.');
        }
    }

    // Защита от XSS
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Загрузка новостей
    async function loadNews() {
        if (!newsList) return;
        
        // Пробуем загрузить из Supabase (если таблица есть)
        try {
            const { data, error } = await supabase
                .from('news')
                .select('title, created_at')
                .order('created_at', { ascending: false })
                .limit(5);
                
            if (!error && data && data.length > 0) {
                newsList.innerHTML = data.map(item => 
                    `<li>📢 ${escapeHtml(item.title)}</li>`
                ).join('');
                return;
            }
        } catch (e) {
            console.log('Таблица news пока не создана, используем демо-данные');
        }
        
        // Демо-данные
        const mockNews = [
            '🏛️ Открыт приём заявок на благоустройство дворов',
            '📢 Новый график работы общественного транспорта',
            '⚡ Голосование за бюджет города 2026',
            '🎉 Поздравление ветеранов с наступающим праздником'
        ];
        newsList.innerHTML = mockNews.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    }

    // Запуск приложения после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initAuth();
            loadNews();
        });
    } else {
        initAuth();
        loadNews();
    }
})();