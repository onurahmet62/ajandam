// Turkiye Cumhuriyeti Resmi Tatiller & Ozel Gunler

export interface StaticHoliday {
  name: string;
  start: Date;
  end: Date;
  type: 'dini' | 'resmi' | 'ozel';
}

// Dini bayram tarihleri [month (0-indexed), day]
const DINI_BAYRAMLAR: {
  year: number;
  ramazanStart: [number, number]; // 3 gun
  kurbanStart: [number, number];  // 4 gun
}[] = [
  { year: 2025, ramazanStart: [2, 30], kurbanStart: [5, 6] },
  { year: 2026, ramazanStart: [2, 20], kurbanStart: [4, 27] },
  { year: 2027, ramazanStart: [2, 10], kurbanStart: [4, 17] },
  { year: 2028, ramazanStart: [1, 27], kurbanStart: [4, 5] },
  { year: 2029, ramazanStart: [1, 14], kurbanStart: [3, 24] },
  { year: 2030, ramazanStart: [1, 4], kurbanStart: [3, 13] },
];

// Resmi tatiller [month (0-indexed), day, name]
const RESMI_TATILLER: [number, number, string][] = [
  [0, 1, 'Yilbasi'],
  [3, 23, 'Ulusal Egemenlik ve Cocuk Bayrami'],
  [4, 1, 'Emek ve Dayanisma Gunu'],
  [4, 19, "Ataturk'u Anma, Genclik ve Spor Bayrami"],
  [6, 15, 'Demokrasi ve Milli Birlik Gunu'],
  [7, 30, 'Zafer Bayrami'],
  [9, 29, 'Cumhuriyet Bayrami'],
];

// Herkesin kutladigi ozel gunler [month (0-indexed), day, name]
// Sabit tarihli olanlar
const OZEL_GUNLER_SABIT: [number, number, string][] = [
  [1, 14, 'Sevgililer Gunu'],
  [2, 8, 'Dunya Kadinlar Gunu'],
  [2, 18, 'Canakkale Zaferi'],
  [3, 23, 'Cocuk Bayrami'],
  [9, 29, 'Cumhuriyet Bayrami'],
  [10, 10, "Ataturk'u Anma Gunu"],
  [10, 24, 'Ogretmenler Gunu'],
  [11, 31, 'Yilbasi Gecesi'],
];

// Anneler Gunu: Mayis'in 2. Pazari
function getAnnelerGunu(year: number): Date {
  const may1 = new Date(year, 4, 1);
  const dayOfWeek = may1.getDay(); // 0=Sun
  const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return new Date(year, 4, firstSunday + 7); // 2nd Sunday
}

// Babalar Gunu: Haziran'in 3. Pazari
function getBabalarGunu(year: number): Date {
  const jun1 = new Date(year, 5, 1);
  const dayOfWeek = jun1.getDay();
  const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return new Date(year, 5, firstSunday + 14); // 3rd Sunday
}

export function getStaticHolidays(rangeStart: Date, rangeEnd: Date): StaticHoliday[] {
  const holidays: StaticHoliday[] = [];
  const startYear = rangeStart.getFullYear();
  const endYear = rangeEnd.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    // Dini bayramlar
    const dini = DINI_BAYRAMLAR.find((d) => d.year === year);
    if (dini) {
      const rStart = new Date(year, dini.ramazanStart[0], dini.ramazanStart[1]);
      const rEnd = new Date(year, dini.ramazanStart[0], dini.ramazanStart[1] + 2);
      if (rStart <= rangeEnd && rEnd >= rangeStart) {
        holidays.push({ name: 'Ramazan Bayrami', start: rStart, end: rEnd, type: 'dini' });
      }

      const kStart = new Date(year, dini.kurbanStart[0], dini.kurbanStart[1]);
      const kEnd = new Date(year, dini.kurbanStart[0], dini.kurbanStart[1] + 3);
      if (kStart <= rangeEnd && kEnd >= rangeStart) {
        holidays.push({ name: 'Kurban Bayrami', start: kStart, end: kEnd, type: 'dini' });
      }
    }

    // Resmi tatiller
    for (const [m, d, name] of RESMI_TATILLER) {
      const date = new Date(year, m, d);
      if (date >= rangeStart && date <= rangeEnd) {
        holidays.push({ name, start: date, end: date, type: 'resmi' });
      }
    }

    // Ozel gunler (sabit tarihli)
    for (const [m, d, name] of OZEL_GUNLER_SABIT) {
      const date = new Date(year, m, d);
      if (date >= rangeStart && date <= rangeEnd) {
        // Resmi tatillerle cakisanlari ekleme
        const isDuplicate = holidays.some(
          (h) => h.start.getTime() === date.getTime() && h.name !== name
        );
        if (!isDuplicate || !RESMI_TATILLER.some(([rm, rd]) => rm === m && rd === d)) {
          holidays.push({ name, start: date, end: date, type: 'ozel' });
        }
      }
    }

    // Anneler Gunu
    const anneler = getAnnelerGunu(year);
    if (anneler >= rangeStart && anneler <= rangeEnd) {
      holidays.push({ name: 'Anneler Gunu', start: anneler, end: anneler, type: 'ozel' });
    }

    // Babalar Gunu
    const babalar = getBabalarGunu(year);
    if (babalar >= rangeStart && babalar <= rangeEnd) {
      holidays.push({ name: 'Babalar Gunu', start: babalar, end: babalar, type: 'ozel' });
    }
  }

  return holidays;
}

// Renk paleti
export const HOLIDAY_COLORS: Record<StaticHoliday['type'], string> = {
  dini: '#059669',   // yesil
  resmi: '#DC2626',  // kirmizi
  ozel: '#D97706',   // turuncu
};
