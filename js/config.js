export const ENV = {
  supabaseUrl: 'https://wkmyefxaenklvchrjuxd.supabase.co',
  supabaseAnonKey: 'sb_publishable_laFi7Ym5-X4-UOs5J9UPYw_7QthzYDE',
  getSiteUrl: () => {
    // Для GitHub Pages в подпапке
    if (window.location.hostname.includes('github.io')) {
      return 'https://murderor.github.io/GorenmentBoston';
    }
    // Для локальной разработки
    return 'http://127.0.0.1:5500';
  }
};
