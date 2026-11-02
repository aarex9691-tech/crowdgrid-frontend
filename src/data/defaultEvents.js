/**
 * Shown only while the server is unreachable (the free host sleeps when idle).
 * Kept identical to the seeded database (scripts/seed.js) so nothing "jumps"
 * when the real list arrives. Public event dates are a few days from today, like the seed.
 */
const at = (daysFromToday, hhmm) => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const d = new Date(new Date(`${today}T${hhmm}:00+05:30`).getTime() + daysFromToday * 86400000);
  return d.toISOString();
};

export const DEFAULT_EVENTS = [
  {
    _id: 'sample-simhastha',
    title: 'Simhastha Kumbh Mela 2026–28',
    slug: 'simhastha-kumbh-2027',
    kind: 'YATRA',
    isFlagship: true,
    tagline: 'Nashik, Maharashtra',
    city: 'Nashik',
    state: 'Maharashtra',
    venue: 'Ramkund & Kushavarta Kund',
    startDate: '2026-10-31T00:30:00.000Z',
    endDate: '2028-07-24T12:30:00.000Z',
    description: 'The Simhastha Kumbh on the banks of the Godavari at Nashik and Trimbakeshwar. Find verified shelter, langar, transport and help in one place.',
    expectedFootfall: 50000000,
    keyDates: [
      { date: '2026-10-31T00:30:00.000Z', label: 'Dhwajarohan (flag hoisting)' },
      { date: '2027-08-01T22:30:00.000Z', label: '1st Amrut Snan' },
      { date: '2027-08-30T22:30:00.000Z', label: '2nd Amrut Snan' },
      { date: '2027-09-10T22:30:00.000Z', label: '3rd Amrut Snan (Nashik)' },
    ],
  },
  {
    _id: 'sample-aarti',
    title: 'Ramkund Maha Aarti: Riverside Seating',
    slug: 'ramkund-maha-aarti',
    kind: 'PUBLIC',
    category: 'SPIRITUAL',
    city: 'Nashik',
    venue: 'Ramkund Ghat, Gate 2',
    startDate: at(3, '18:30'),
    endDate: at(3, '20:00'),
    ticketPrice: 199,
    capacity: 60,
    attendeesCount: 12,
    description: 'Reserved riverside seating for the evening Godavari Maha Aarti at Ramkund.',
  },
  {
    _id: 'sample-walk',
    title: 'Panchavati Heritage Walk',
    slug: 'panchavati-heritage-walk',
    kind: 'PUBLIC',
    category: 'HERITAGE_WALK',
    city: 'Nashik',
    venue: 'Kalaram Mandir main gate',
    startDate: at(5, '06:30'),
    endDate: at(5, '09:00'),
    ticketPrice: 150,
    capacity: 2,
    attendeesCount: 2,
    description: 'A guided morning walk through Kalaram Mandir, Sita Gufa and the old ghats of Panchavati.',
  },
  {
    _id: 'sample-bhajan',
    title: 'Bhajan Sandhya at Kalidas Kala Mandir',
    slug: 'bhajan-sandhya-kalidas',
    kind: 'PUBLIC',
    category: 'CULTURAL',
    city: 'Nashik',
    venue: 'Mahakavi Kalidas Kala Mandir',
    startDate: at(6, '19:00'),
    endDate: at(6, '21:30'),
    ticketPrice: 99,
    capacity: 400,
    attendeesCount: 137,
    description: 'An evening of bhajans and abhangs by local mandals.',
  },
  {
    _id: 'sample-wari',
    title: 'Pandharpur Ashadhi Wari 2027',
    slug: 'pandharpur-ashadhi-wari-2027',
    kind: 'YATRA',
    tagline: 'Pandharpur, Maharashtra',
    city: 'Pandharpur',
    state: 'Maharashtra',
    startDate: '2027-06-28T00:30:00.000Z',
    endDate: '2027-07-18T14:30:00.000Z',
    description: 'The centuries-old palkhi procession of the Warkaris to Lord Vitthal at Pandharpur.',
  },
  {
    _id: 'sample-rath',
    title: 'Jagannath Rath Yatra 2027',
    slug: 'jagannath-rath-yatra-2027',
    kind: 'YATRA',
    tagline: 'Puri, Odisha',
    city: 'Puri',
    state: 'Odisha',
    startDate: '2027-07-05T00:30:00.000Z',
    endDate: '2027-07-15T14:30:00.000Z',
    description: 'The chariot festival of Lord Jagannath, Balabhadra and Subhadra along Bada Danda.',
  },
];
