
# استراتژی تولید خودکار (Auto-Pilot Strategy v5.0)

این سند تعیین‌کننده رفتار موتور تولید محتوای هوشمند در حالت اتوپایلوت است.

## ۱. ساختار صف تولید (Production Queue)
فرآیند اتوپایلوت شامل ۵ مرحله متوالی با مشخصات فنی زیر است:

| ردیف | نوع محتوا | مدت زمان (ثانیه) | تراکم قطعات (Grid) | هدف استراتژیک |
| :--- | :--- | :--- | :--- | :--- |
| ۱ | Viral Topic | ۳۰ ثانیه | ۱۰۰ قطعه | Hook & Fast Reveal |
| ۲ | Viral Topic | ۴۵ ثانیه | ۳۰۰ قطعه | Retention Test |
| ۳ | Viral Topic | ۶۰ ثانیه | ۵۰۰ قطعه | Full Engagement |
| ۴ | Narrative | ۶۰ ثانیه | ۵۰۰ قطعه | Storytelling |
| ۵ | Narrative | ۶۰ ثانیه | ۹۰۰ قطعه | High Detail Finale |

## ۲. تنوع بصری و حرکتی (Variability Matrix)
در هر تکرار، موتور Neural Engine پارامترهای زیر را به صورت تصادفی از سایدبار انتخاب می‌کند:
- **Art Style:** انتخاب تصادفی از ۸ سبک (Hyper-Realistic, Anime, Watercolor, ...).
- **Kinetic Movement:** انتخاب تصادفی (Vortex, Flight, Wave, ...).
- **Tactile Material:** انتخاب تصادفی (Glass, Wood, Carbon, ...).
- **Geometry:** انتخاب تصادفی (Jigsaw, Hexagon, Triangle, ...).

## ۳. منطق انتخاب موسیقی (Sequential Audio)
- انتخاب موسیقی بر اساس شاخص صف (`Index % List.Length`) انجام می‌شود.
- تضمین می‌شود که موسیقی‌ها به ترتیب لیست استفاده شده و در صورت نیاز تکرار شوند.

## ۴. اجزای ثابت (Persistent Assets)
- **Identity_Asset:** لوگوی کانال و واترمارک در تمام ۵ ویدئو ثابت است.
- **Audio Profile Studio:** افکت‌های صوتی Snap و Move از تنظیمات جاری کاربر پیروی می‌کنند.
