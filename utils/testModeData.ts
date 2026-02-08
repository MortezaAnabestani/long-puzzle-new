/**
 * TEST MODE DATA
 * عکس‌ها و متن‌های آماده برای تست سریع
 */

export interface TestChapter {
  imageUrl: string;
  title: string;
  narrativeText: string;
  duration: number; // seconds
}

export interface TestProject {
  id: string;
  title: string;
  genre: string;
  chapters: TestChapter[];
  totalDuration: number;
}

// ─── SAMPLE IMAGES (Placeholder URLs) ────────────────────────────────
// در production باید این URLها رو با عکس‌های واقعی جایگزین کنید

const SAMPLE_IMAGES = [
  "https://picsum.photos/seed/doc1/1920/1080",
  "https://picsum.photos/seed/doc2/1920/1080",
  "https://picsum.photos/seed/doc3/1920/1080",
  "https://picsum.photos/seed/doc4/1920/1080",
  "https://picsum.photos/seed/doc5/1920/1080",
  "https://picsum.photos/seed/doc6/1920/1080",
  "https://picsum.photos/seed/doc7/1920/1080",
  "https://picsum.photos/seed/doc8/1920/1080",
  "https://picsum.photos/seed/doc9/1920/1080",
];

// ─── TEST PROJECTS ────────────────────────────────────────────────────

export const TEST_PROJECTS: TestProject[] = [
  {
    id: "test-ancient-egypt",
    title: "اسرار مصر باستان",
    genre: "HISTORICAL_RECONSTRUCTION",
    totalDuration: 600, // 10 minutes
    chapters: [
      {
        imageUrl: SAMPLE_IMAGES[0],
        title: "کشف هرم بزرگ",
        narrativeText: "هرم بزرگ جیزه، یکی از عجایب هفتگانه دنیای باستان، حدود ۴۵۰۰ سال پیش ساخته شد.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[1],
        title: "فرعون خوفو",
        narrativeText: "خوفو، فرعون قدرتمند مصر، این بنای شگفت‌انگیز را به عنوان مقبره خود ساخت.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[2],
        title: "راز ساخت",
        narrativeText: "چگونه مصریان باستان توانستند بلوک‌های سنگی ۲.۵ تنی را به ارتفاع ۱۴۶ متر بالا ببرند؟",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[3],
        title: "کارگران ماهر",
        narrativeText: "بر خلاف تصور رایج، هرم توسط کارگران ماهر ساخته شد، نه بردگان.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[4],
        title: "فناوری پیشرفته",
        narrativeText: "مصریان از سطح شیب‌دار، اهرم‌ها و قرقره‌ها برای جابجایی سنگ‌ها استفاده می‌کردند.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[5],
        title: "دقت معماری",
        narrativeText: "هرم با دقتی حیرت‌انگیز در راستای نقاط اصلی جغرافیایی قرار گرفته است.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[6],
        title: "اتاق‌های مخفی",
        narrativeText: "درون هرم، اتاق‌های پنهان و راهروهای پیچیده‌ای وجود دارد که هنوز اسرار آن کشف نشده.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[7],
        title: "گنج فرعون",
        narrativeText: "علی‌رغم حفاظت شدید، دزدان قبور در طول تاریخ به بسیاری از گنج‌ها دست یافتند.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[8],
        title: "میراث جاودان",
        narrativeText: "امروز، هرم بزرگ جیزه همچنان به عنوان نمادی از قدرت و هوش بشر باقی مانده است.",
        duration: 60,
      },
    ],
  },
  {
    id: "test-ocean-depths",
    title: "اعماق اقیانوس",
    genre: "UNSOLVED_MYSTERIES",
    totalDuration: 540, // 9 minutes
    chapters: [
      {
        imageUrl: SAMPLE_IMAGES[0],
        title: "دنیای ناشناخته",
        narrativeText: "اعماق اقیانوس‌ها، آخرین مرز ناشناخته کره زمین، پر از موجودات عجیب و اسرار نهفته است.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[1],
        title: "فشار وحشتناک",
        narrativeText: "در عمق ۱۱ کیلومتری، فشار آب هزار برابر فشار سطح دریا است.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[2],
        title: "تاریکی مطلق",
        narrativeText: "در عمق بیش از ۱۰۰۰ متر، هیچ نور خورشیدی به آب نمی‌رسد.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[3],
        title: "موجودات نورافشان",
        narrativeText: "بسیاری از موجودات اعماق قادرند نور زیستی تولید کنند.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[4],
        title: "کالامار غول‌پیکر",
        narrativeText: "کالامارهای غول‌پیکر با طول بیش از ۱۳ متر در اعماق زندگی می‌کنند.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[5],
        title: "دریاچه‌های زیردریایی",
        narrativeText: "در کف اقیانوس، دریاچه‌هایی از آب شور فوق‌العاده غلیظ وجود دارد.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[6],
        title: "کوه‌های زیر آب",
        narrativeText: "بلندترین کوه‌های جهان در زیر اقیانوس‌ها پنهان شده‌اند.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[7],
        title: "آتشفشان‌های فعال",
        narrativeText: "بیش از ۷۵ درصد فعالیت‌های آتشفشانی زمین در زیر آب رخ می‌دهد.",
        duration: 60,
      },
      {
        imageUrl: SAMPLE_IMAGES[8],
        title: "آینده اکتشاف",
        narrativeText: "تنها ۵ درصد از اعماق اقیانوس‌ها تاکنون کاوش شده است.",
        duration: 60,
      },
    ],
  },
  {
    id: "test-quick",
    title: "تست سریع",
    genre: "LOST_CIVILIZATIONS",
    totalDuration: 180, // 3 minutes - for quick testing
    chapters: [
      {
        imageUrl: SAMPLE_IMAGES[0],
        title: "فصل اول",
        narrativeText: "این یک متن تست است برای فصل اول.",
        duration: 20,
      },
      {
        imageUrl: SAMPLE_IMAGES[1],
        title: "فصل دوم",
        narrativeText: "این یک متن تست است برای فصل دوم.",
        duration: 20,
      },
      {
        imageUrl: SAMPLE_IMAGES[2],
        title: "فصل سوم",
        narrativeText: "این یک متن تست است برای فصل سوم.",
        duration: 20,
      },
      {
        imageUrl: SAMPLE_IMAGES[3],
        title: "فصل چهارم",
        narrativeText: "این یک متن تست است برای فصل چهارم.",
        duration: 20,
      },
      {
        imageUrl: SAMPLE_IMAGES[4],
        title: "فصل پنجم",
        narrativeText: "این یک متن تست است برای فصل پنجم.",
        duration: 20,
      },
      {
        imageUrl: SAMPLE_IMAGES[5],
        title: "فصل ششم",
        narrativeText: "این یک متن تست است برای فصل ششم.",
        duration: 20,
      },
      {
        imageUrl: SAMPLE_IMAGES[6],
        title: "فصل هفتم",
        narrativeText: "این یک متن تست است برای فصل هفتم.",
        duration: 20,
      },
      {
        imageUrl: SAMPLE_IMAGES[7],
        title: "فصل هشتم",
        narrativeText: "این یک متن تست است برای فصل هشتم.",
        duration: 20,
      },
      {
        imageUrl: SAMPLE_IMAGES[8],
        title: "فصل نهم",
        narrativeText: "این یک متن تست است برای فصل نهم.",
        duration: 20,
      },
    ],
  },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────

export const getRandomTestProject = (): TestProject => {
  return TEST_PROJECTS[Math.floor(Math.random() * TEST_PROJECTS.length)];
};

export const getTestProjectById = (id: string): TestProject | undefined => {
  return TEST_PROJECTS.find((p) => p.id === id);
};

export const getQuickTestProject = (): TestProject => {
  return TEST_PROJECTS.find((p) => p.id === "test-quick")!;
};
