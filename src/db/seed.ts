import "dotenv/config";
import { db } from "./index";
import { products } from "./schema";

type Seed = {
  slug: string;
  name: string;
  nameEn?: string;
  description: string;
  category: string;
  price: string;
  oldPrice?: string;
  icon: string;
  tint: string;
  badge?: string;
  deliveryTime?: string;
  stock?: number;
  rating?: string;
  sales?: number;
  features: string[];
  featured?: boolean;
};

const DATA: Seed[] = [
  // ---------- نيترو وديسكورد ----------
  {
    slug: "nitro-boost-1m",
    name: "نيترو بوست — شهر كامل",
    nameEn: "Discord Nitro Boost 1 Month",
    description:
      "اشتراك نيترو بوست كامل لمدة شهر مع بوستين مجانيين، بجودة إهداء مباشر على حسابك أو تفعيل داخلي آمن. استمتع بجميع مزايا النيترو الكاملة.",
    category: "nitro",
    price: "3.49",
    oldPrice: "9.99",
    icon: "Zap",
    tint: "violet",
    badge: "الأكثر مبيعاً",
    deliveryTime: "فوري — 5 دقائق",
    stock: 480,
    rating: "4.9",
    sales: 12400,
    features: [
      "نيترو بوست كامل بكل المزايا (جودة 4K، إيموجيات متحركة)",
      "بوستان مجانيان لأي سيرفر تختاره",
      "تفعيل عبر هدية رسمية 100% آمنة",
      "ضمان استبدال كامل طوال مدة الاشتراك",
    ],
    featured: true,
  },
  {
    slug: "server-boosts-14",
    name: "14 بوست سيرفر — مستوى 3",
    nameEn: "14x Server Boosts (Level 3)",
    description:
      "ارفع سيرفرك للمستوى الثالث فوراً مع 14 بوست شرعية لمدة شهر كامل. رابط مختصر مخصص، بانر، وجودة صوت 384kbps.",
    category: "nitro",
    price: "19.99",
    oldPrice: "34.99",
    icon: "Rocket",
    tint: "blue",
    deliveryTime: "15 — 30 دقيقة",
    stock: 90,
    rating: "4.9",
    sales: 3100,
    features: [
      "مستوى 3 كامل: رابط مختصر + بانر متحرك",
      "جودة صوت 384kbps ورموز دعوة مخصصة",
      "14 بوست تبقى شهراً كاملاً مع ضمان",
      "إمكانية التجديد الشهري التلقائي",
    ],
  },

  // ---------- بطاقات وفيزات ----------
  {
    slug: "visa-virtual-10",
    name: "بطاقة فيزا افتراضية $10",
    nameEn: "Virtual Visa Card $10",
    description:
      "بطاقة فيزا افتراضية برصيد 10 دولار، تعمل على أغلب المواقع العالمية والاشتراكات. تصلك البيانات كاملة خلال دقائق.",
    category: "cards",
    price: "12.49",
    icon: "CreditCard",
    tint: "slate",
    badge: "تفعيل فوري",
    deliveryTime: "فوري — دقائق",
    stock: 340,
    rating: "4.8",
    sales: 4100,
    features: [
      "رقم + CVV + تاريخ انتهاء صالح 12 شهر",
      "تدعم الاشتراكات والمتاجر العالمية",
      "كشف استخدام عند الطلب",
      "قابلة للشحن مجدداً عبرنا",
    ],
    featured: true,
  },
  {
    slug: "visa-virtual-50",
    name: "بطاقة فيزا افتراضية $50",
    nameEn: "Virtual Visa Card $50",
    description:
      "بطاقة فيزا افتراضية برصيد 50 دولار بنسبة قبول عالية على المتاجر والمنصات العالمية. أرقام أمريكية موثوقة.",
    category: "cards",
    price: "54.99",
    icon: "CreditCard",
    tint: "slate",
    deliveryTime: "فوري — دقائق",
    stock: 120,
    rating: "4.9",
    sales: 2300,
    features: ["رصيد $50 جاهز للاستخدام فوراً", "نسبة قبول عالية عالمياً", "دعم فني لأي عملية مرفوضة"],
  },
  {
    slug: "steam-card-20",
    name: "بطاقة Steam بقيمة $20",
    nameEn: "Steam Gift Card $20",
    description:
      "كود ستيم أمريكي بقيمة 20 دولار لتعبئة محفظتك وشراء الألعاب والإضافات. كود رسمي مخزّن وجاهز للإرسال الفوري.",
    category: "cards",
    price: "21.49",
    icon: "Gamepad2",
    tint: "rose",
    badge: "الأكثر مبيعاً",
    deliveryTime: "فوري",
    stock: 500,
    rating: "4.9",
    sales: 9800,
    features: ["كود أمريكي رسمي 100%", "تسليم كود فوري بعد الدفع", "يضاف مباشرة لمحفظة Steam", "متوفر بفئات أخرى عند الطلب"],
    featured: true,
  },
  {
    slug: "google-play-10",
    name: "بطاقة Google Play $10 أمريكي",
    nameEn: "Google Play $10 US",
    description:
      "بطاقة قوقل بلاي أمريكية بقيمة 10 دولار لشحن الألعاب والتطبيقات. كود رسمي يصلك خلال ثوانٍ من إتمام الطلب.",
    category: "cards",
    price: "10.99",
    icon: "Gift",
    tint: "amber",
    deliveryTime: "فوري",
    stock: 620,
    rating: "4.8",
    sales: 7200,
    features: ["كود رسمي أمريكي", "مناسب لشحن جميع الألعاب", "تسليم تلقائي فوري"],
  },
  {
    slug: "itunes-card-15",
    name: "بطاقة iTunes / Apple $15",
    nameEn: "iTunes Card $15 US",
    description:
      "بطاقة آيتونز أمريكية بقيمة 15 دولار لشحن رصيد Apple وشراء التطبيقات والألعاب والاشتراكات.",
    category: "cards",
    price: "15.99",
    icon: "Smartphone",
    tint: "amber",
    deliveryTime: "فوري",
    stock: 410,
    rating: "4.8",
    sales: 3900,
    features: ["كود أمريكي رسمي", "يعمل على App Store و iCloud", "تسليم فوري"],
  },

  // ---------- اشتراكات بريميوم ----------
  {
    slug: "netflix-4k-1m",
    name: "Netflix 4K بريميوم — شهر",
    nameEn: "Netflix Premium 4K — 1 Month",
    description:
      "حساب نتفليكس بريميوم 4K Ultra HD لمدة شهر كامل على بروفايل خاص بك وبين كود سري. جودة سينمائية وضمان كامل.",
    category: "subs",
    price: "3.99",
    oldPrice: "15.49",
    icon: "Clapperboard",
    tint: "rose",
    badge: "عرض محدود",
    deliveryTime: "فوري — 5 دقائق",
    stock: 750,
    rating: "4.9",
    sales: 15200,
    features: [
      "جودة 4K Ultra HD + HDR",
      "بروفايل خاص بك وبين كود",
      "يعمل على التلفاز والجوال وجميع الأجهزة",
      "ضمان استبدال كامل طوال المدة",
    ],
    featured: true,
  },
  {
    slug: "spotify-premium-12m",
    name: "Spotify Premium — سنة (حسابك)",
    nameEn: "Spotify Premium 12 Months — Your Account",
    description:
      "ترقية حساب سبوتيفاي الخاص بك إلى بريميوم لمدة سنة كاملة عبر دعوة عائلية رسمية. احتفظ بكل قوائمك وأغانيك.",
    category: "subs",
    price: "14.99",
    oldPrice: "119.88",
    icon: "Music",
    tint: "emerald",
    badge: "الأكثر مبيعاً",
    deliveryTime: "10 — 30 دقيقة",
    stock: 300,
    rating: "5.0",
    sales: 11800,
    features: [
      "على حسابك الشخصي — بدون فقدان بياناتك",
      "موسيقى بلا إعلانات وتحميل أوفلاين",
      "دعوة عائلية رسمية آمنة 100%",
      "ضمان استبدال طوال السنة",
    ],
    featured: true,
  },
  {
    slug: "youtube-premium-6m",
    name: "YouTube Premium + Music — 6 شهور",
    nameEn: "YouTube Premium 6 Months",
    description:
      "يوتيوب بريميوم على حسابك لمدة 6 شهور: بلا إعلانات، تشغيل بالخلفية، وتطبيق YouTube Music كامل.",
    category: "subs",
    price: "8.99",
    oldPrice: "77.94",
    icon: "Play",
    tint: "rose",
    deliveryTime: "15 — 45 دقيقة",
    stock: 260,
    rating: "4.8",
    sales: 6400,
    features: ["على إيميلك الشخصي مباشرة", "بلا إعلانات + تشغيل بالخلفية", "YouTube Music Premium مشمول"],
  },
  {
    slug: "chatgpt-plus-1m",
    name: "ChatGPT Plus — شهر",
    nameEn: "ChatGPT Plus — 1 Month",
    description:
      "اشتراك ChatGPT Plus رسمي لمدة شهر مع وصول كامل لأحدث النماذج وميزات التحليل المتقدمة والصور.",
    category: "subs",
    price: "14.99",
    oldPrice: "20.00",
    icon: "Bot",
    tint: "violet",
    badge: "جديد",
    deliveryTime: "15 — 60 دقيقة",
    stock: 180,
    rating: "4.9",
    sales: 2900,
    features: ["وصول لأقوى النماذج بأولوية", "توليد صور وتحليل ملفات", "تفعيل آمن على حسابك"],
    featured: true,
  },
  {
    slug: "shahid-vip-12m",
    name: "Shahid VIP — سنة كاملة",
    nameEn: "Shahid VIP 12 Months",
    description:
      "اشتراك شاهد VIP لمدة سنة: أحدث المسلسلات والأفلام العربية ومباريات الدوري بجودة عالية وبلا إعلانات.",
    category: "subs",
    price: "24.99",
    icon: "Tv",
    tint: "emerald",
    deliveryTime: "15 — 60 دقيقة",
    stock: 140,
    rating: "4.8",
    sales: 1800,
    features: ["سنة كاملة بضمان", "جميع الأجهزة", "محتوى حصري ورياضة"],
  },

  // ---------- حسابات قديمة ----------
  {
    slug: "discord-2016-aged",
    name: "حساب ديسكورد 2016 — نادر جداً",
    nameEn: "Aged Discord Account 2016",
    description:
      "حساب ديسكورد منشأ سنة 2016 بحالة ممتازة — تحفة رقمية نادرة لهواة الجمع. يأتي مع الإيميل الأصلي وكامل الصلاحيات.",
    category: "aged",
    price: "89.99",
    icon: "History",
    tint: "amber",
    badge: "نادر",
    deliveryTime: "1 — 6 ساعات",
    stock: 4,
    rating: "5.0",
    sales: 190,
    features: ["تاريخ إنشاء 2016 موثّق", "مع الإيميل الأصلي (OE)", "بدون أي مخالفات أو باندات سابقة", "نقل ملكية كامل وآمن"],
    featured: true,
  },
  {
    slug: "discord-2018-aged",
    name: "حساب ديسكورد 2018 — مميز",
    nameEn: "Aged Discord Account 2018",
    description:
      "حساب ديسكورد عتيق من 2018 بوزن ثقيل في السيرفرات. حالة نظيفة وجاهز للاستخدام فوراً مع إمكانية تغيير كل البيانات.",
    category: "aged",
    price: "34.99",
    icon: "History",
    tint: "amber",
    deliveryTime: "1 — 4 ساعات",
    stock: 17,
    rating: "4.9",
    sales: 830,
    features: ["إنشاء 2018", "حالة نظيفة 100%", "تغيير كامل للبيانات", "تسليم آمن عبر وسيط"],
  },

  // ---------- برمجة وتطوير ----------
  {
    slug: "custom-discord-bot",
    name: "بوت ديسكورد مخصص بالكامل",
    nameEn: "Fully Custom Discord Bot",
    description:
      "بوت ديسكورد مبرمج من الصفر حسب طلبك: أي نظام تتخيله ننفذه لك — أوامر سلاش، لوحات، ربط APIs، واستضافة مجانية شهر.",
    category: "dev",
    price: "49.99",
    icon: "Bot",
    tint: "blue",
    badge: "خدمة احترافية",
    deliveryTime: "2 — 5 أيام",
    stock: 30,
    rating: "5.0",
    sales: 640,
    features: [
      "برمجة من الصفر بأحدث إصدار discord.js",
      "أوامر سلاش وأزرار وقوائم تفاعلية",
      "لوحة تحكم ويب أساسية مجاناً",
      "استضافة مجانية أول شهر + دعم 30 يوم",
    ],
    featured: true,
  },
  {
    slug: "store-website",
    name: "تصميم موقع متجر احترافي",
    nameEn: "Pro Storefront Website",
    description:
      "موقع متجر كامل لمشروعك: صفحة منتجات، دفع إلكتروني، ولوحة إدارة — بتصميم عصري يضاهي كبرى المتاجر العالمية.",
    category: "dev",
    price: "149.00",
    icon: "Globe",
    tint: "blue",
    badge: "الأعلى قيمة",
    deliveryTime: "5 — 10 أيام",
    stock: 15,
    rating: "5.0",
    sales: 140,
    features: [
      "تصميم فريد 100% بدون قوالب جاهزة",
      "بوابات دفع + إشعارات ديسكورد",
      "لوحة إدارة كاملة للمنتجات والطلبات",
      "استضافة ودومين مجاني أول سنة",
    ],
  },

  // ---------- تصميم وإبداع ----------
  {
    slug: "logo-design-pro",
    name: "تصميم شعار احترافي",
    nameEn: "Professional Logo Design",
    description:
      "هوية تبدأ بشعار لا يُنسى: 3 مفاهيم أولية، تعديلات غير محدودة، وملفات مفتوحة المصدر بكل الصيغ.",
    category: "design",
    price: "19.99",
    icon: "PenTool",
    tint: "rose",
    deliveryTime: "2 — 4 أيام",
    stock: 999,
    rating: "4.9",
    sales: 1250,
    features: ["3 مفاهيم أولية مختلفة", "تعديلات غير محدودة", "ملفات AI + PSD + PNG + SVG", "حقوق استخدام تجارية كاملة"],
  },
  {
    slug: "full-brand-identity",
    name: "هوية بصرية متكاملة",
    nameEn: "Full Brand Identity",
    description:
      "حزمة هوية كاملة لمشروعك: شعار، ألوان، خطوط، بانرات سيرفر وسوشيال ميديا، وقوالب جاهزة — كل ما تحتاجه للانطلاق.",
    category: "design",
    price: "59.99",
    icon: "Palette",
    tint: "rose",
    badge: "حزمة شاملة",
    deliveryTime: "4 — 7 أيام",
    stock: 25,
    rating: "5.0",
    sales: 260,
    features: ["شعار + دليل هوية مصغّر", "بانرات وأفاتارات لكل المنصات", "قوالب إعلانات جاهزة للتعديل", "جلسة استشارة تصميمية مجانية"],
  },
];

async function main() {
  console.log(`Seeding ${DATA.length} products…`);
  await db.delete(products);
  await db.insert(products).values(DATA);
  console.log("Done ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
