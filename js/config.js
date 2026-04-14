// Конфигурация для разных окружений
export const ENV = {
  // Замените на ваши данные из Supabase
  supabaseUrl: 'https://wkmyefxaenklvchrjuxd.supabase.co',
  supabaseAnonKey: 'sb_publishable_laFi7Ym5-X4-UOs5J9UPYw_7QthzYDE',
  
  getSiteUrl: () => {
    // Live Server использует localhost с разными портами
    if (location.hostname === 'localhost' || 
        location.hostname === '127.0.0.1' ||
        location.hostname === '0.0.0.0') {
      return `http://${location.hostname}:${location.port}`;
    }
    
    // GitHub Pages
    if (location.hostname.endsWith('github.io')) {
      const basePath = location.pathname.replace(/\/$/, '');
      return `https://${location.hostname}${basePath}`;
    }
    
    return window.location.origin;
  },
  
  isFileProtocol: () => location.protocol === 'file:'
};