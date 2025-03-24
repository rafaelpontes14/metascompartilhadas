import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

console.log('Verificando variáveis de ambiente...');
console.log('Ambiente:', process.env.NODE_ENV || 'development');

const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter(varName => !env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente faltando:', missingVars.join(', '));
  process.exit(1);
} else {
  console.log('✅ Todas as variáveis de ambiente necessárias estão definidas');
  console.log('Variáveis disponíveis:', Object.keys(env).filter(key => key.startsWith('VITE_')));
} 