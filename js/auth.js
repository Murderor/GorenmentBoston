import { supabase } from './supabase.js';
import { ENV } from './config.js';

export async function signInWithDiscord() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: https://murderor.github.io/GorenmentBoston/,
      }
    });
    
    if (error) throw error;
    console.log('Перенаправление на Discord...');
    return data;
  } catch (error) {
    console.error('Ошибка входа:', error.message);
    alert('Ошибка входа через Discord: ' + error.message);
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('Выход выполнен');
    window.location.href = '/';
  } catch (error) {
    console.error('Ошибка выхода:', error);
  }
}

export async function getCurrentUser() {
  try {
    // Получаем сессию
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Ошибка получения сессии:', sessionError);
      return null;
    }
    
    if (!session) {
      return null;
    }
    
    // Получаем профиль
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('Ошибка получения профиля:', profileError);
    }
    
    return { ...session.user, profile };
  } catch (error) {
    console.error('Ошибка в getCurrentUser:', error);
    return null;
  }
}
