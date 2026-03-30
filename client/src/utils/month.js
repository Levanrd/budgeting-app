export const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Manila';

function getParts(date, timeZone = APP_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  });
  const parts = formatter.formatToParts(new Date(date));
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  };
}

export function getMonthKey(date = new Date(), timeZone = APP_TIMEZONE) {
  const { year, month } = getParts(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getRecentMonthOptions(count = 12, format = 'long', timeZone = APP_TIMEZONE) {
  const { year, month } = getParts(new Date(), timeZone);
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: format,
    year: 'numeric',
    timeZone,
  });

  return Array.from({ length: count }, (_, index) => {
    const baseDate = new Date(Date.UTC(year, month - 1 - index, 15));
    return {
      value: getMonthKey(baseDate, timeZone),
      label: formatter.format(baseDate),
    };
  });
}
