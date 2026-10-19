export interface DaySchedule {
  open: string;
  close: string;
  enabled: boolean;
}

export type BusinessHours = {
  seg: DaySchedule;
  ter: DaySchedule;
  qua: DaySchedule;
  qui: DaySchedule;
  sex: DaySchedule;
  sab: DaySchedule;
  dom: DaySchedule;
};

export interface PrinterSettings {
  auto_print: boolean;
  paper_width: "58mm" | "80mm";
  copies: number;
  sound_alerts: boolean;
}

export interface StoreSettingsData {
  store: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  delivery: {
    min_order_cents: number;
    default_prep_min: number;
    default_prep_max: number;
    delivery_fee_cents: number;
    free_delivery_above_cents: number | null;
    accepts_delivery: boolean;
    accepts_pickup: boolean;
    is_open_override: boolean | null;
    phone: string;
    instagram: string;
    address: string;
    bio: string;
    category: string;
    logo_url: string | null;
    banner_url: string | null;
    pix_key: string;
    pix_key_type: string;
    accept_cash: boolean;
    need_change_option: boolean;
    accept_card: boolean;
    accept_pix: boolean;
    accept_meal_voucher: boolean;
    business_hours: BusinessHours;
    printer_settings: PrinterSettings;
  };
  billing?: {
    planCode: string;
    planName: string;
    isTrial: boolean;
    trialDaysRemaining?: number;
    isPaid: boolean;
    maxStores: number;
    activeStoresCount: number;
  } | null;
}
