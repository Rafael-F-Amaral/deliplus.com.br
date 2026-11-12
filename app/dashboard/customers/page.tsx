import { auth } from '@clerk/nextjs/server'
import { getActiveStoreId } from '@/lib/stores/get-active-store'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import CustomersClient, { CustomerRow } from './customers-client'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  await auth()
  let storeId = await getActiveStoreId().catch(() => null)

  let storeName = 'RafaelTeste'
  let customers: CustomerRow[] = []

  let supabase: ReturnType<typeof createServerSupabaseClient> | ReturnType<typeof createAdminSupabaseClient> = createServerSupabaseClient()

  if (!storeId && process.env.NODE_ENV === 'development') {
    try {
      const adminClient = createAdminSupabaseClient()
      const { data: firstStore } = await adminClient
        .from('stores')
        .select('id, name')
        .limit(1)
        .maybeSingle()
      if (firstStore) {
        storeId = firstStore.id
        storeName = firstStore.name
        supabase = adminClient
      }
    } catch (e) {
      console.warn('Dev store fallback failed:', e)
    }
  }

  if (storeId) {
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .maybeSingle()

      if (storeData?.name) {
        storeName = storeData.name
      }

      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email, total_spent_cents, orders_count, segment, last_order_at, created_at')
        .eq('store_id', storeId)
        .order('orders_count', { ascending: false })

      if (!error && data) {
        customers = data as CustomerRow[]
      } else if (process.env.NODE_ENV === 'development') {
        const adminClient = createAdminSupabaseClient()
        const { data: adminData } = await adminClient
          .from('customers')
          .select('id, name, phone, email, total_spent_cents, orders_count, segment, last_order_at, created_at')
          .eq('store_id', storeId)
          .order('orders_count', { ascending: false })

        if (adminData) {
          customers = adminData as CustomerRow[]
        }
      }
    } catch (err) {
      console.error('Falha ao carregar clientes:', err)
    }
  }

  return <CustomersClient initialCustomers={customers} storeName={storeName} />
}
