import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Note: Cleanup de conexões Prisma deve ser feito nos arquivos de teste individuais
// Este arquivo apenas configura o ambiente de teste
