import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { OrderLiveTracker, TrackedOrder } from './order-live-tracker'

export const dynamic = 'force-dynamic'

interface PedidoPageProps {
  params: Promise<{
    storeSlug: string
    id: string
  }>
}

export default async function PedidoPage({ params }: PedidoPageProps) {
  const { storeSlug, id } = await params

  // UUID validation
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (!isUuid) {
    notFound()
  }

  let supabase = createServerSupabaseClient()
  let { data: orderData, error } = await (supabase as any).rpc('get_public_order_tracking', {
    p_order_id: id
  })

  if ((error || !orderData) && process.env.NODE_ENV === 'development') {
    const admin = createAdminSupabaseClient()
    const { data: adminData } = await (admin as any).rpc('get_public_order_tracking', {
      p_order_id: id
    })
    orderData = adminData
  }

  if (!orderData) {
    notFound()
  }

  return <OrderLiveTracker initialOrder={orderData as unknown as TrackedOrder} />
}
