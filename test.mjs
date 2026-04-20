import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xhderhlscsreyylyucvb.supabase.co',
  'sb_publishable_ERYNxpVpCDlF17CT_VwCgg_ogPIzCg7',
)

async function test() {
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .eq('featured', true)
    .eq('in_stock', true)
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  // eslint-disable-next-line no-console
  console.info('Data:', data)
}

test()
