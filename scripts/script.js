// scripts/script.js
(function() {
    // Инициализация Supabase
    const SUPABASE_URL = 'https://nykqhtiiwltmujgkjehs.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a3FodGlpd2x0bXVqZ2tqZWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MjA5MjAsImV4cCI6MjA2MDE5NjkyMH0.bWgZPqLsJ6LKYRWWp6kS5nbO4xzzJ7Fkqaf2iQ4P-Zg';

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const authWidget = document.getElementById('authWidget');
    const userProfileDiv = document.getElementById('userProfile');
    const newsList = document.getElementById('newsList');

    // Обработка callback после авторизации
    async function handleAuthCallback() {
        const hash = window.location.hash;
        
        if (!hash || !hash.includes('access_token')) {
            return;
        }
        
        console.log('Обнаружен callback с токеном');
        
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
            console.error('Ошибка авторизации:', error, errorDescription);
            alert('Не удалось войти: ' + (errorDescription || error));
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }
        
        if (accessToken) {
            console.log('Токен получен');
            const { data, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('Ошибка получения сессии:', sessionError);
            } else if (data.session) {
                console.log('Сессия установлена для:', data.session.user.email);
            }
            
            window.history.replaceState({}, document.title, window.location.pathname);
            await initAuth();
        }
    }

    async function initAuth() {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Ошибка получения сессии:', error);
        }
        
        if (session) {
            console.log('Пользователь авторизован:', session.user.email);
            await renderUserUI(session.user);
            await loadUserProfile(session.user.id);
        } else {
            console.log('Пользователь не авторизован');
            renderUnauthUI();
        }
        
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                await renderUserUI(session.user);
                await loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                renderUnauthUI();
                userProfileDiv.innerHTML = '<p>Войдите, чтобы увидеть свой профиль.</p>';
            }
        });
    }

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

    async function renderUserUI(user) {
        if (!authWidget) return;
        
        const { data: userData, error } = await supabase
            .from('users')
            .select('name, role, clearance_level')
            .eq('id', user.id)
            .single();
        
        const displayName = userData?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Гражданин';
        const role = userData?.role || 'citizen';
        const clearance = userData?.clearance_level || 1;
        
        let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        
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

    async function loadUserProfile(userId) {
        if (!userProfileDiv) return;
        
        const { data, error } = await supabase
            .from('users')
            .select('name, role, clearance_level, created_at')
            .eq('id', userId)
            .single();
            
        if (error) {
            userProfileDiv.innerHTML = '<p>Профиль загружается...</p>';
            return;
        }
        
        const joinDate = data.created_at ? new Date(data.created_at).toLocaleDateString('ru-RU') : 'Недавно';
        
        userProfileDiv.innerHTML = `
            <div class="profile-detail"><strong>Имя:</strong> ${escapeHtml(data.name)}</div>
            <div class="profile-detail"><strong>Роль:</strong> ${escapeHtml(data.role)}</div>
            <div class="profile-detail"><strong>Уровень допуска:</strong> ${data.clearance_level}</div>
            <div class="profile-detail"><strong>Дата регистрации:</strong> ${joinDate}</div>
            <div class="profile-detail"><strong>Статус:</strong> <span style="color: #22c55e;">Активен</span></div>
        `;
    }

    // Вход через Discord с правильным redirect URL
    async function signInWithDiscord() {
        try {
            let redirectTo = window.location.origin + window.location.pathname;
            
            // Убираем hash если есть
            if (redirectTo.includes('#')) {
                redirectTo = redirectTo.split('#')[0];
            }
            
            console.log('Redirect URL:', redirectTo);
            
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: redirectTo,
                    scopes: 'identify email'
                }
            });
            
            if (error) throw error;
            
        } catch (error) {
            console.error('Ошибка входа:', error.message);
            alert('Не удалось войти через Discord: ' + error.message);
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function loadNews() {
        if (!newsList) return;
        
        newsList.innerHTML = '<li>Загрузка новостей...</li>';
        
        try {
            const { data, error } = await supabase
                .from('news')
                .select('title')
                .limit(5);
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                newsList.innerHTML = data.map(item => `<li>📢 ${escapeHtml(item.title)}</li>`).join('');
                return;
            }
        } catch (error) {
            console.log('Используем демо-новости');
        }
        
        const mockNews = [
            '🏛️ Открыт приём заявок на благоустройство дворов',
            '📢 Новый график работы общественного транспорта',
            '⚡ Голосование за бюджет города 2026'
        ];
        newsList.innerHTML = mockNews.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    }

    async function init() {
        console.log('Инициализация...');
        await handleAuthCallback();
        await loadNews();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();