const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Manila';

const monthFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
});

export function getMonthKey(date = new Date()) {
  const parts = monthFormatter.formatToParts(new Date(date));
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

export function getAppTimezone() {
  return APP_TIMEZONE;
}
