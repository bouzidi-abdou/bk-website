import type { Pool } from "pg";

const SEED_PRODUCTS = [
  {
    slug: "nitro-boost-1m",
    name: "نيترو بوست — شهر كامل",
    name_en: "Discord Nitro Boost 1 Month",
    description: "اشتراك نيترو بوست كامل لمدة شهر مع بوستين مجانيين، بجودة إهداء مباشر على حسابك أو تفعيل داخلي آمن. استمتع بجميع مزايا النيترو الكاملة.",
    category: "nitro",
    price: 3.49,
    old_price: 9.99,
    icon: "Zap",
    tint: "violet",
    badge: "الأكثر مبيعاً",
    delivery_time: "فوري — 5 دقائق",
    stock: 480,
    rating: "4.9",
    sales: 12400,
    features: JSON.stringify([
      "نيترو بوست كامل بكل المزايا (جودة 4K، إيموجيات متحركة)",
      "بوستان مجانيان لأي سيرفر تختاره",
      "تفعيل عبر هدية رسمية 100% آمنة",
      "ضمان استبدال كامل طوال مدة الاشتراك",
    ]),
    featured: true,
  },
  {
    slug: "server-boosts-14",
    name: "14 بوست سيرفر — مستوى 3",
    name_en: "14x Server Boosts (Level 3)",
    description: "ارفع سيرفرك للمستوى الثالث فوراً مع 14 بوست شرعية لمدة شهر كامل. رابط مختصر مخصص، بانر، وجودة صوت 384kbps.",
    category: "nitro",
    price: 19.99,
    old_price: 34.99,
    icon: "Rocket",
    tint: "blue",
    badge: null,
    delivery_time: "15 — 30 دقيقة",
    stock: 90,
    rating: "4.9",
    sales: 3100,
    features: JSON.stringify([
      "مستوى 3 كامل: رابط مختصر + بانر متحرك",
      "جودة صوت 384kbps ورموز دعوة مخصصة",
      "14 بوست تبقى شهراً كاملاً مع ضمان",
      "إمكانية التجديد الشهري التلقائي",
    ]),
    featured: false,
  },
  {
    slug: "visa-virtual-10",
    name: "بطاقة فيزا افتراضية $10",
    name_en: "Virtual Visa Card $10",
    description: "بطاقة فيزا افتراضية برصيد 10 دولار، تعمل على أغلب المواقع العالمية والاشتراكات. تصلك البيانات كاملة خلال دقائق.",
    category: "cards",
    price: 12.49,
    old_price: null,
    icon: "CreditCard",
    tint: "slate",
    badge: "تفعيل فوري",
    delivery_time: "فوري — دقائق",
    stock: 340,
    rating: "4.8",
    sales: 4100,
    features: JSON.stringify([
      "رقم + CVV + تاريخ انتهاء صالح 12 شهر",
      "تدعم الاشتراكات والمتاجر العالمية",
      "كشف استخدام عند الطلب",
      "قابلة للشحن مجدداً عبرنا",
    ]),
    featured: true,
  },
  {
    slug: "visa-virtual-50",
    name: "بطاقة فيزا افتراضية $50",
    name_en: "Virtual Visa Card $50",
    description: "بطاقة فيزا افتراضية برصيد 50 دولار بنسبة قبول عالية على المتاجر والمنصات العالمية. أرقام أمريكية موثوقة.",
    category: "cards",
    price: 54.99,
    old_price: null,
    icon: "CreditCard",
    tint: "slate",
    badge: null,
    delivery_time: "فوري — دقائق",
    stock: 120,
    rating: "4.9",
    sales: 2300,
    features: JSON.stringify(["رصيد $50 جاهز للاستخدام فوراً", "نسبة قبول عالية عالمياً", "دعم فني لأي عملية مرفوضة"]),
    featured: false,
  },
  {
    slug: "steam-card-20",
    name: "بطاقة Steam بقيمة $20",
    name_en: "Steam Gift Card $20",
    description: "كود ستيم أمريكي بقيمة 20 دولار لتعبئة محفظتك وشراء الألعاب والإضافات. كود رسمي مخزّن وجاهز للإرسال الفوري.",
    category: "cards",
    price: 21.49,
    old_price: null,
    icon: "Gamepad2",
    tint: "rose",
    badge: "الأكثر مبيعاً",
    delivery_time: "فوري",
    stock: 500,
    rating: "4.9",
    sales: 9800,
    features: JSON.stringify(["كود أمريكي رسمي 100%", "تسليم كود فوري بعد الدفع", "يضاف مباشرة لمحفظة Steam", "متوفر بفئات أخرى عند الطلب"]),
    featured: true,
  },
  {
    slug: "google-play-10",
    name: "بطاقة Google Play $10 أمريكي",
    name_en: "Google Play $10 US",
    description: "بطاقة قوقل بلاي أمريكية بقيمة 10 دولار لشحن الألعاب والتطبيقات. كود رسمي يصلك خلال ثوانٍ من إتمام الطلب.",
    category: "cards",
    price: 10.99,
    old_price: null,
    icon: "Gift",
    tint: "amber",
    badge: null,
    delivery_time: "فوري",
    stock: 620,
    rating: "4.8",
    sales: 7200,
    features: JSON.stringify(["كود رسمي أمريكي", "مناسب لشحن جميع الألعاب", "تسليم تلقائي فوري"]),
    featured: false,
  },
  {
    slug: "itunes-card-15",
    name: "بطاقة iTunes / Apple $15",
    name_en: "iTunes Card $15 US",
    description: "بطاقة آيتونز أمريكية بقيمة 15 دولار لشحن رصيد Apple وشراء التطبيقات والألعاب والاشتراكات.",
    category: "cards",
    price: 15.99,
    old_price: null,
    icon: "Smartphone",
    tint: "amber",
    badge: null,
    delivery_time: "فوري",
    stock: 410,
    rating: "4.8",
    sales: 3900,
    features: JSON.stringify(["كود أمريكي رسمي", "يعمل على App Store و iCloud", "تسليم فوري"]),
    featured: false,
  },
  {
    slug: "netflix-4k-1m",
    name: "Netflix 4K بريميوم — شهر",
    name_en: "Netflix Premium 4K — 1 Month",
    description: "حساب نتفليكس بريميوم 4K Ultra HD لمدة شهر كامل على بروفايل خاص بك وبين كود سري. جودة سينمائية وضمان كامل.",
    category: "subs",
    price: 3.99,
    old_price: 15.49,
    icon: "Clapperboard",
    tint: "rose",
    badge: "عرض محدود",
    delivery_time: "فوري — 5 دقائق",
    stock: 750,
    rating: "4.9",
    sales: 15200,
    features: JSON.stringify([
      "جودة 4K Ultra HD + HDR",
      "بروفايل خاص بك وبين كود",
      "يعمل على التلفاز والجوال وجميع الأجهزة",
      "ضمان استبدال كامل طوال المدة",
    ]),
    featured: true,
  },
  {
    slug: "spotify-premium-12m",
    name: "Spotify Premium — سنة (حسابك)",
    name_en: "Spotify Premium 12 Months — Your Account",
    description: "ترقية حساب سبوتيفاي الخاص بك إلى بريميوم لمدة سنة كاملة عبر دعوة عائلية رسمية. احتفظ بكل قوائمك وأغانيك.",
    category: "subs",
    price: 14.99,
    old_price: 119.88,
    icon: "Music",
    tint: "emerald",
    badge: "الأكثر مبيعاً",
    delivery_time: "10 — 30 دقيقة",
    stock: 300,
    rating: "5.0",
    sales: 11800,
    features: JSON.stringify([
      "على حسابك الشخصي — بدون فقدان بياناتك",
      "موسيقى بلا إعلانات وتحميل أوفلاين",
      "دعوة عائلية رسمية آمنة 100%",
      "ضمان استبدال طوال السنة",
    ]),
    featured: true,
  },
  {
    slug: "youtube-premium-6m",
    name: "YouTube Premium + Music — 6 شهور",
    name_en: "YouTube Premium 6 Months",
    description: "يوتيوب بريميوم على حسابك لمدة 6 شهور: بلا إعلانات، تشغيل بالخلفية، وتطبيق YouTube Music كامل.",
    category: "subs",
    price: 8.99,
    old_price: 77.94,
    icon: "Play",
    tint: "rose",
    badge: null,
    delivery_time: "15 — 45 دقيقة",
    stock: 260,
    rating: "4.8",
    sales: 6400,
    features: JSON.stringify(["على إيميلك الشخصي مباشرة", "بلا إعلانات + تشغيل بالخلفية", "YouTube Music Premium مشمول"]),
    featured: false,
  },
  {
    slug: "chatgpt-plus-1m",
    name: "ChatGPT Plus — شهر",
    name_en: "ChatGPT Plus — 1 Month",
    description: "اشتراك ChatGPT Plus رسمي لمدة شهر مع وصول كامل لأحدث النماذج وميزات التحليل المتقدمة والصور.",
    category: "subs",
    price: 14.99,
    old_price: 20.00,
    icon: "Bot",
    tint: "violet",
    badge: "جديد",
    delivery_time: "15 — 60 دقيقة",
    stock: 180,
    rating: "4.9",
    sales: 2900,
    features: JSON.stringify(["وصول لأقوى النماذج بأولوية", "توليد صور وتحليل ملفات", "تفعيل آمن على حسابك"]),
    featured: true,
  },
  {
    slug: "shahid-vip-12m",
    name: "Shahid VIP — سنة كاملة",
    name_en: "Shahid VIP 12 Months",
    description: "اشتراك شاهد VIP لمدة سنة: أحدث المسلسلات والأفلام العربية ومباريات الدوري بجودة عالية وبلا إعلانات.",
    category: "subs",
    price: 24.99,
    old_price: null,
    icon: "Tv",
    tint: "emerald",
    badge: null,
    delivery_time: "15 — 60 دقيقة",
    stock: 140,
    rating: "4.8",
    sales: 1800,
    features: JSON.stringify(["سنة كاملة بضمان", "جميع الأجهزة", "محتوى حصري ورياضة"]),
    featured: false,
  },
  {
    slug: "discord-2016-aged",
    name: "حساب ديسكورد 2016 — نادر جداً",
    name_en: "Aged Discord Account 2016",
    description: "حساب ديسكورد منشأ سنة 2016 بحالة ممتازة — تحفة رقمية نادرة لهواة الجمع. يأتي مع الإيميل الأصلي وكامل الصلاحيات.",
    category: "aged",
    price: 89.99,
    old_price: null,
    icon: "History",
    tint: "amber",
    badge: "نادر",
    delivery_time: "1 — 6 ساعات",
    stock: 4,
    rating: "5.0",
    sales: 190,
    features: JSON.stringify(["تاريخ إنشاء 2016 موثّق", "مع الإيميل الأصلي (OE)", "بدون أي مخالفات أو باندات سابقة", "نقل ملكية كامل وآمن"]),
    featured: true,
  },
  {
    slug: "discord-2018-aged",
    name: "حساب ديسكورد 2018 — مميز",
    name_en: "Aged Discord Account 2018",
    description: "حساب ديسكورد عتيق من 2018 بوزن ثقيل في السيرفرات. حالة نظيفة وجاهز للاستخدام فوراً مع إمكانية تغيير كل البيانات.",
    category: "aged",
    price: 34.99,
    old_price: null,
    icon: "History",
    tint: "amber",
    badge: null,
    delivery_time: "1 — 4 ساعات",
    stock: 17,
    rating: "4.9",
    sales: 830,
    features: JSON.stringify(["إنشاء 2018", "حالة نظيفة 100%", "تغيير كامل للبيانات", "تسليم آمن عبر وسيط"]),
    featured: false,
  },
  {
    slug: "custom-discord-bot",
    name: "بوت ديسكورد مخصص بالكامل",
    name_en: "Fully Custom Discord Bot",
    description: "بوت ديسكورد مبرمج من الصفر حسب طلبك: أي نظام تتخيله ننفذه لك — أوامر سلاش، لوحات، ربط APIs، واستضافة مجانية شهر.",
    category: "dev",
    price: 49.99,
    old_price: null,
    icon: "Bot",
    tint: "blue",
    badge: "خدمة احترافية",
    delivery_time: "2 — 5 أيام",
    stock: 30,
    rating: "5.0",
    sales: 640,
    features: JSON.stringify([
      "برمجة من الصفر بأحدث إصدار discord.js",
      "أوامر سلاش وأزرار وقوائم تفاعلية",
      "لوحة تحكم ويب أساسية مجاناً",
      "استضافة مجانية أول شهر + دعم 30 يوم",
    ]),
    featured: true,
  },
  {
    slug: "store-website",
    name: "تصميم موقع متجر احترافي",
    name_en: "Pro Storefront Website",
    description: "موقع متجر كامل لمشروعك: صفحة منتجات، دفع إلكتروني، ولوحة إدارة — بتصميم عصري يضاهي كبرى المتاجر العالمية.",
    category: "dev",
    price: 149.00,
    old_price: null,
    icon: "Globe",
    tint: "blue",
    badge: "الأعلى قيمة",
    delivery_time: "5 — 10 أيام",
    stock: 15,
    rating: "5.0",
    sales: 140,
    features: JSON.stringify([
      "تصميم فريد 100% بدون قوالب جاهزة",
      "بوابات دفع + إشعارات ديسكورد",
      "لوحة إدارة كاملة للمنتجات والطلبات",
      "استضافة ودومين مجاني أول سنة",
    ]),
    featured: false,
  },
  {
    slug: "logo-design-pro",
    name: "تصميم شعار احترافي",
    name_en: "Professional Logo Design",
    description: "هوية تبدأ بشعار لا يُنسى: 3 مفاهيم أولية، تعديلات غير محدودة، وملفات مفتوحة المصدر بكل الصيغ.",
    category: "design",
    price: 19.99,
    old_price: null,
    icon: "PenTool",
    tint: "rose",
    badge: null,
    delivery_time: "2 — 4 أيام",
    stock: 999,
    rating: "4.9",
    sales: 1250,
    features: JSON.stringify(["3 مفاهيم أولية مختلفة", "تعديلات غير محدودة", "ملفات AI + PSD + PNG + SVG", "حقوق استخدام تجارية كاملة"]),
    featured: false,
  },
  {
    slug: "full-brand-identity",
    name: "هوية بصرية متكاملة",
    name_en: "Full Brand Identity",
    description: "حزمة هوية كاملة لمشروعك: شعار، ألوان، خطوط، بانرات سيرفر وسوشيال ميديا، وقوالب جاهزة — كل ما تحتاجه للانطلاق.",
    category: "design",
    price: 59.99,
    old_price: null,
    icon: "Palette",
    tint: "rose",
    badge: "حزمة شاملة",
    delivery_time: "4 — 7 أيام",
    stock: 25,
    rating: "5.0",
    sales: 260,
    features: JSON.stringify(["شعار + دليل هوية مصغّر", "بانرات وأفاتارات لكل المنصات", "قوالب إعلانات جاهزة للتعديل", "جلسة استشارة تصميمية مجانية"]),
    featured: true,
  },
];

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  global_name TEXT,
  avatar TEXT,
  email TEXT,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC(14, 0) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT 'violet';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS publisher_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS coupon_percent INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_effect TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_frame TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_since TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS application_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Briefcase',
  tint TEXT NOT NULL DEFAULT 'violet',
  terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  grants_role TEXT NOT NULL DEFAULT 'seller',
  open BOOLEAN NOT NULL DEFAULT true,
  closed_note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS application_types_key_idx ON application_types(key);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type_id UUID NOT NULL REFERENCES application_types(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nickname TEXT,
  location TEXT,
  age TEXT,
  hobbies TEXT,
  product_types TEXT,
  experience TEXT,
  contact TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS applications_user_idx ON applications(user_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);

INSERT INTO application_types (key, title, subtitle, description, icon, tint, terms, grants_role, sort_order) VALUES
  ('seller', 'التقديم كبائع معتمد',
   'انشر منتجاتك داخل BK MARKET واحصل على أرباحك',
   'برنامج البائعين المعتمدين يتيح لك عرض منتجاتك الرقمية داخل المتجر مع لوحة تحكم خاصة، وشارة بائع موثّق على ملفك الشخصي، ودعم مباشر من فريق الإدارة.',
   'Store', 'emerald',
   '["يقتطع المتجر عمولة 5% من قيمة كل عملية بيع ناجحة","يلتزم البائع بتسليم المنتج خلال المدة المعلنة في صفحة المنتج","يُمنع نشر أي منتج مخالف أو مسروق أو منتهي الصلاحية","يحق للإدارة إيقاف حساب البائع فوراً عند تكرار الشكاوى","تُصرف الأرباح إلى محفظة BK COIN الخاصة بالبائع بعد اكتمال الطلب","البائع مسؤول عن دقة وصف وسعر منتجاته"]'::jsonb,
   'seller', 10)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Shield',
  color TEXT NOT NULL DEFAULT 'violet',
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS roles_key_idx ON roles(key);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_roles_user_idx ON user_roles(user_id);

ALTER TABLE news ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS user_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  effect_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'effect',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_effects_user_idx ON user_effects(user_id);
CREATE INDEX IF NOT EXISTS users_discord_id_idx ON users(discord_id);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  old_price NUMERIC(10, 2),
  icon TEXT NOT NULL DEFAULT 'Package',
  tint TEXT NOT NULL DEFAULT 'violet',
  image_url TEXT,
  badge TEXT,
  delivery_time TEXT NOT NULL DEFAULT 'فوري',
  stock INTEGER NOT NULL DEFAULT 250,
  rating NUMERIC(2, 1) NOT NULL DEFAULT '5.0',
  sales INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_featured_idx ON products(featured);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  coupon TEXT,
  payment_method TEXT NOT NULL DEFAULT 'paypal',
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);

CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS visits_created_idx ON visits(created_at);

CREATE TABLE IF NOT EXISTS coin_tx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  kind TEXT NOT NULL DEFAULT 'topup',
  note TEXT,
  by_admin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS coin_tx_user_idx ON coin_tx(user_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  from_admin BOOLEAN NOT NULL DEFAULT false,
  author_name TEXT,
  read_by_admin BOOLEAN NOT NULL DEFAULT false,
  read_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id, created_at);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unread_for_admin INTEGER NOT NULL DEFAULT 0,
  unread_for_user INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tickets_user_idx ON tickets(user_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets(status);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  from_admin BOOLEAN NOT NULL DEFAULT false,
  author_name TEXT,
  system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_idx ON ticket_messages(ticket_id, created_at);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Package',
  tint TEXT NOT NULL DEFAULT 'violet',
  sort_order INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS categories_key_idx ON categories(key);

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  kind TEXT NOT NULL DEFAULT 'news',
  pinned BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS news_created_idx ON news(created_at);

CREATE TABLE IF NOT EXISTS news_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS news_likes_uniq_idx ON news_likes(news_id, user_id);

INSERT INTO categories (key, name_ar, name_en, icon, tint, sort_order) VALUES
  ('nitro',  'نيترو وديسكورد',    'Discord & Nitro',        'Zap',        'violet',  10),
  ('cards',  'بطاقات وفيزات',     'Cards & Gift Cards',     'CreditCard', 'slate',   20),
  ('subs',   'اشتراكات بريميوم',  'Premium Subscriptions',  'Crown',      'rose',    30),
  ('aged',   'حسابات قديمة',      'Aged Accounts',          'History',    'amber',   40),
  ('dev',    'برمجة وتطوير',      'Development',            'Code2',      'blue',    50),
  ('design', 'تصميم وإبداع',      'Design & Creative',      'Palette',    'emerald', 60)
ON CONFLICT (key) DO NOTHING;
`;

let initializingPromise: Promise<void> | null = null;
let initialized = false;

export async function ensureSchemaInitialized(pool: Pool): Promise<void> {
  if (initialized) return;
  if (initializingPromise) return initializingPromise;

  initializingPromise = (async () => {
    try {
      // 1. Create tables and indexes if they don't exist
      await pool.query(DDL);

      // 2. Check if products table is empty, auto-seed if needed
      const countRes = await pool.query("SELECT count(*)::int AS c FROM products");
      const count = countRes.rows[0]?.c ?? 0;

      if (count === 0) {
        console.log("[db-init] Auto-seeding 18 default products...");
        for (const p of SEED_PRODUCTS) {
          await pool.query(
            `INSERT INTO products (slug, name, name_en, description, category, price, old_price, icon, tint, badge, delivery_time, stock, rating, sales, features, featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16)
             ON CONFLICT (slug) DO NOTHING`,
            [
              p.slug,
              p.name,
              p.name_en,
              p.description,
              p.category,
              p.price,
              p.old_price,
              p.icon,
              p.tint,
              p.badge,
              p.delivery_time,
              p.stock,
              p.rating,
              p.sales,
              p.features,
              p.featured,
            ]
          );
        }
        console.log("[db-init] Auto-seeding completed successfully.");
      }

      initialized = true;
    } catch (err) {
      console.error("[db-init] Auto-schema initialization failed:", err);
      // Reset so next query can retry
      initialized = false;
    } finally {
      initializingPromise = null;
    }
  })();

  return initializingPromise;
}
