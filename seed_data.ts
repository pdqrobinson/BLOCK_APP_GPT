import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://absuvpfxpyeecaugdpig.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

console.log('Seeding demo posts...')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedPosts() {
  try {
    // Phoenix, AZ area coordinates
    const posts = [
      // Status posts
      {
        user_id: 'demo-user-1',
        post_type: 'status',
        geometry: { type: 'Point', coordinates: [-112.0740, 33.4484] },
        content: 'Just finished a great morning walk! The weather is perfect today. ☀️',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 'demo-user-1',
        post_type: 'status',
        geometry: { type: 'Point', coordinates: [-112.0640, 33.4584] },
        content: 'Working from a coffee shop today. Anyone want to meet up?',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      // Ask posts
      {
        user_id: 'demo-user-2',
        post_type: 'ask',
        geometry: { type: 'Point', coordinates: [-112.0840, 33.4384] },
        content: 'Does anyone know a good place to get tacos nearby? Looking for recommendations! 🌮',
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 'demo-user-2',
        post_type: 'ask',
        geometry: { type: 'Point', coordinates: [-112.0940, 33.4484] },
        content: 'Has anyone seen a lost cat? Orange tabby, very friendly. 🐱',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      // Activity posts
      {
        user_id: 'demo-user-3',
        post_type: 'activity',
        geometry: { type: 'Point', coordinates: [-112.0740, 33.4384] },
        content: 'Pickleball meetup at the park tomorrow at 9am! All skill levels welcome. 🏓',
        expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 'demo-user-3',
        post_type: 'activity',
        geometry: { type: 'Point', coordinates: [-112.0640, 33.4684] },
        content: 'Group yoga session this evening at 6pm. Bring your own mat! 🧘',
        expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      // Food items
      {
        user_id: 'demo-user-4',
        post_type: 'item',
        item_kind: 'food',
        geometry: { type: 'Point', coordinates: [-112.0840, 33.4584] },
        content: 'Free homemade cookies! Made too many for the party. Fresh and delicious. 🍪',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 'demo-user-4',
        post_type: 'item',
        item_kind: 'food',
        geometry: { type: 'Point', coordinates: [-112.0740, 33.4484] },
        content: 'Extra garden vegetables - tomatoes, peppers, and zucchini available for pickup! 🥬',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      // Physical items
      {
        user_id: 'demo-user-5',
        post_type: 'item',
        item_kind: 'physical',
        geometry: { type: 'Point', coordinates: [-112.0940, 33.4384] },
        content: 'Free patio furniture! 2 chairs and a small table. First come first served. 🪑',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 'demo-user-5',
        post_type: 'item',
        item_kind: 'physical',
        geometry: { type: 'Point', coordinates: [-112.0640, 33.4284] },
        content: 'Kids bicycle (ages 5-7). Used but in good condition. Free to a good home. 🚲',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      // More status posts
      {
        user_id: 'demo-user-1',
        post_type: 'status',
        geometry: { type: 'Point', coordinates: [-112.0540, 33.4484] },
        content: 'Beautiful sunset today! Anyone else catching it?',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 'demo-user-2',
        post_type: 'status',
        geometry: { type: 'Point', coordinates: [-112.0840, 33.4684] },
        content: 'Local library event tonight - book club meeting at 7pm! 📚',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 'demo-user-3',
        post_type: 'status',
        geometry: { type: 'Point', coordinates: [-112.1040, 33.4284] },
        content: 'Community garden is looking great this season. Come check it out! 🌻',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: 'demo-user-4',
        post_type: 'status',
        geometry: { type: 'Point', coordinates: [-112.0740, 33.4784] },
        content: 'Farmers market this Saturday! Fresh produce and local goods. 🥕',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    console.log(`Inserting ${posts.length} demo posts...`)

    for (const post of posts) {
      const idempotencyKey = crypto.randomUUID()

      // Insert using service role to bypass RLS
      const { error } = await supabase
        .from('posts')
        .insert({
          ...post,
          idempotency_key: idempotencyKey,
          report_count: 0,
          hidden: false
        })

      if (error) {
        console.error(`Error inserting post: ${error.message}`)
      } else {
        console.log(`✓ Inserted: ${post.content.substring(0, 40)}...`)
      }
    }

    console.log('\n✅ Seed data completed!')

  } catch (err: any) {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  }
}

seedPosts()
