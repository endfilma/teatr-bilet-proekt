export const CATALOG_URL =
  'https://functions.poehali.dev/fee37349-6550-4335-8518-fbca21c25060';
export const BOOKING_URL =
  'https://functions.poehali.dev/4d6cc48b-7569-4e4b-9c94-b9b2be177594';
export const ADMIN_AUTH_URL =
  'https://functions.poehali.dev/d7e0c715-c970-4af1-b9b7-e41088428d54';

export type ApiSession = {
  id: string;
  showId: number;
  slug: string;
  title: string;
  scene: string;
  genre: string;
  meta: string;
  annotation: string;
  director: string;
  date: string;
  time: string;
  dateLabel: string;
  startsAt: string;
  hallCaption: string;
  priceFrom: number;
  free: number;
};

export type ApiShow = {
  id: number;
  slug: string;
  title: string;
  scene: string;
  genre: string;
  meta: string;
  annotation: string;
  director: string;
  priceFrom: number;
  isActive: boolean;
  sortOrder: number;
};

export type ApiSection = {
  key: string;
  label: string;
  anchor: string;
  isVisible: boolean;
  sortOrder: number;
};

export type Catalog = {
  sections: ApiSection[];
  shows: ApiShow[];
  sessions: ApiSession[];
  occupied: Record<string, string[]>;
};

export const fetchCatalog = async (): Promise<Catalog> => {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error('catalog');
  return res.json();
};

export const adminPost = async (token: string, payload: Record<string, unknown>) => {
  const res = await fetch(CATALOG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
};

export const adminLogin = async (password: string): Promise<string> => {
  const res = await fetch(ADMIN_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Не удалось войти');
  return data.token;
};

export type BookingResult = {
  code: string;
  qrUrl: string;
  paymentUrl: string | null;
  emailSent: boolean;
  status: string;
};

export const createBooking = async (payload: {
  sessionId: string;
  name: string;
  email: string;
  phone: string;
  seats: { id: string; row: number; num: number; price: number }[];
  total: number;
  returnUrl: string;
}): Promise<BookingResult> => {
  const res = await fetch(BOOKING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Не удалось оформить заказ');
  return data;
};

export const confirmPayment = async (code: string) => {
  await fetch(BOOKING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'paid', code }),
  });
};