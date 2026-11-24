export const colors = {
  navy: '#14263D',
  blue: '#2677E8',
  green: '#19A77C',
  amber: '#F2A43A',
  cloud: '#F4F6F9',
  white: '#FFFFFF',
  text: '#14263D',
  muted: '#6B7A90',
  border: '#E3E8EF',
  danger: '#DC2626',
};
export const radius = { sm: 8, md: 12, lg: 16 };

export const STATUS = {
  requested: { label: 'Pending', color: colors.amber },
  quoted: { label: 'Quotes received', color: colors.amber },
  booked: { label: 'Confirmed', color: colors.green },
  in_progress: { label: 'In progress', color: colors.blue },
  completed: { label: 'Completed', color: colors.green },
  cancelled: { label: 'Cancelled', color: colors.danger },
};

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const pretty = (s = '') => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
export const fmtDateTime = (d) => `${fmtDate(d)}, ${fmtTime(d)}`;
