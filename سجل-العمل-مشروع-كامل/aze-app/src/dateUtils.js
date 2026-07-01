const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatLong(date) {
  return `${WEEKDAYS_AR[date.getDay()]}، ${date.getDate()} ${MONTHS_AR[date.getMonth()]} ${date.getFullYear()}`
}

function formatShort(date) {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getFullYear()}`
}

function isToday(date) {
  return toKey(date) === toKey(new Date())
}

function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n)
}

export { toKey, fromKey, addDays, formatLong, formatShort, isToday, formatNumber, WEEKDAYS_AR, MONTHS_AR }
