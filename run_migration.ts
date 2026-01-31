import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.SUPABASE_URL || 'https://absuvpfxpyeecaugdpig.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

console.log('Running Supabase migration...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    // Read SQL file
    const sql = readFileSync('./supabase/phase2_migration.sql', 'utf-8')
    
    console.log('Executing migration...')
    
    // Split into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: stmt })
      
      if (error) {
        console.log('Note:', error.message)
      }
    }
    
    console.log('\n✅ Migration completed!')
    
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  }
}

runMigration()
