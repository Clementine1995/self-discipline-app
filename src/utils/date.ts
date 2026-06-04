export const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

export const eachDateKeyBetween = (startDateKey: string, endDateKey: string) => {
  const dates: string[] = [];
  let cursor = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);

  while (cursor <= end) {
    dates.push(toDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return dates;
};

export const getRecentDateKeys = (days: number, endDate = new Date()) =>
  Array.from({ length: days }, (_, index) => toDateKey(addDays(endDate, index - days + 1)));
