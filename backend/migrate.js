// migrate.js

import 'dotenv/config';
import postgres from 'postgres';

async function runMigration() {
  console.log("Iniciando a migração do banco de dados...");

  // Pega a string de conexão do arquivo .env
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERRO FATAL: A variável DATABASE_URL não foi encontrada!");
    return;
  }

  console.log("Conectando ao banco de dados...");
  const sql = postgres(connectionString);

  try {

    await sql`
      ALTER TABLE packages
        ADD COLUMN IF NOT EXISTS store_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS status VARCHAR(255),
        ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE,
        ADD COLUMN IF NOT EXISTS store_order_url TEXT,
        ADD COLUMN IF NOT EXISTS carrier_tracking_url TEXT;
    `;

    console.log("✅ Migração concluída com sucesso! As novas colunas foram adicionadas.");

    await sql.end();
    console.log("Conexão com o banco de dados encerrada.");

  } catch (error) {
    console.error("❌ Erro durante a migração:", error.message);
  }
}

runMigration();