
export function getJalaliDate(): string {
  const now = new Date();
  const g_y = now.getFullYear();
  const g_m = now.getMonth() + 1;
  const g_d = now.getDate();

  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let gy = g_y - 1600;
  let gm = g_m - 1;
  let gd = g_d - 1;

  let g_day_no = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);

  for (let i = 0; i < gm; ++i) g_day_no += g_days_in_month[i];
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) ++g_day_no;
  g_day_no += gd;

  let j_day_no = g_day_no - 79;
  let j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;

  let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;

  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }

  let jm = 0;
  for (let i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i) {
    j_day_no -= j_days_in_month[i];
    jm = i + 1;
  }
  let jd = j_day_no + 1;

  return `${jy}-${String(jm + 1).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
}
