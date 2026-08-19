/* =========================================================
   THE HEADER INSTRUMENT
   ---------------------------------------------------------
   Two clocks and a place, in the utility bar of every page.

   LONDON, IN WORDS AND IN TWELVE-HOUR TIME. The College's
   seat is London and the bar says so in full — "London,
   United Kingdom" — with the city's own time beside it. The
   first version of this printed 24-hour time because that is
   what a European reader expects; the College's readership is
   not European. Twelve-hour with AM/PM is what a reader in
   Riyadh, Lagos, Karachi or Jakarta reads without converting,
   and it is what a British institution writes on an invitation.

   AND WHERE THE READER IS. "Browsing from Nigeria", with the
   reader's own local time, so the two are legible against one
   another at a glance. That is the whole point of a world
   clock on an international college: not what time it is, but
   what time it is HERE relative to THERE.

   HOW THE COUNTRY IS KNOWN, AND WHY IT IS NOT LOOKED UP.
   From Intl.DateTimeFormat().resolvedOptions().timeZone — the
   IANA zone the reader's own device reports — resolved against
   the table below. No request is made to anybody. A geo-IP
   lookup would be a third-party call carrying the reader's
   address on every page of a site whose audience includes
   people in jurisdictions where that matters, to print one
   word of chrome. The zone is already on the device, it is
   already sent to no one, and it is accurate to the country in
   every case that matters here.

   The flag is derived from the ISO code by arithmetic —
   'NG' -> two regional-indicator code points -> 🇳🇬 — so no
   flag asset ships and no country is privileged with an image
   another lacks.
   ========================================================= */
(function () {
  var root = document.querySelector('[data-worldclock]');
  if (!root) return;

  var isAr = document.documentElement.lang === 'ar';
  var locale = isAr ? 'ar-u-ca-gregory-nu-latn' : 'en-GB';

  /* IANA zone -> ISO 3166-1 alpha-2. Ordered by where this
     College's readers actually are: the Gulf and the wider Arab
     world first, then Africa, South and South-East Asia, then
     the rest. A zone not listed falls back to the region name,
     which is still true and still useful. */
  var ZONE = {
    'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW',
    'Asia/Bahrain': 'BH', 'Asia/Muscat': 'OM', 'Asia/Aden': 'YE', 'Asia/Baghdad': 'IQ',
    'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Asia/Damascus': 'SY', 'Asia/Jerusalem': 'IL',
    'Asia/Hebron': 'PS', 'Asia/Gaza': 'PS', 'Africa/Cairo': 'EG', 'Africa/Khartoum': 'SD',
    'Africa/Tripoli': 'LY', 'Africa/Tunis': 'TN', 'Africa/Algiers': 'DZ',
    'Africa/Casablanca': 'MA', 'Africa/El_Aaiun': 'MA', 'Africa/Nouakchott': 'MR',
    'Africa/Lagos': 'NG', 'Africa/Accra': 'GH', 'Africa/Abidjan': 'CI', 'Africa/Dakar': 'SN',
    'Africa/Bamako': 'ML', 'Africa/Ouagadougou': 'BF', 'Africa/Niamey': 'NE',
    'Africa/Nairobi': 'KE', 'Africa/Kampala': 'UG', 'Africa/Dar_es_Salaam': 'TZ',
    'Africa/Addis_Ababa': 'ET', 'Africa/Mogadishu': 'SO', 'Africa/Djibouti': 'DJ',
    'Africa/Kigali': 'RW', 'Africa/Lusaka': 'ZM', 'Africa/Harare': 'ZW',
    'Africa/Johannesburg': 'ZA', 'Africa/Maputo': 'MZ', 'Africa/Luanda': 'AO',
    'Africa/Kinshasa': 'CD', 'Africa/Douala': 'CM', 'Africa/Libreville': 'GA',
    'Asia/Karachi': 'PK', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dhaka': 'BD',
    'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP', 'Asia/Kabul': 'AF',
    'Asia/Tehran': 'IR', 'Asia/Istanbul': 'TR', 'Europe/Istanbul': 'TR',
    'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID', 'Asia/Pontianak': 'ID',
    'Asia/Kuala_Lumpur': 'MY', 'Asia/Singapore': 'SG', 'Asia/Manila': 'PH',
    'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN',
    'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW',
    'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Tashkent': 'UZ', 'Asia/Almaty': 'KZ',
    'Asia/Baku': 'AZ', 'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM',
    'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES',
    'Europe/Lisbon': 'PT', 'Europe/Rome': 'IT', 'Europe/Berlin': 'DE', 'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT',
    'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK',
    'Europe/Helsinki': 'FI', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ',
    'Europe/Athens': 'GR', 'Europe/Bucharest': 'RO', 'Europe/Moscow': 'RU',
    'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA',
    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
    'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
    'America/Mexico_City': 'MX', 'America/Bogota': 'CO', 'America/Lima': 'PE',
    'America/Santiago': 'CL', 'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR',
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Perth': 'AU',
    'Australia/Brisbane': 'AU', 'Pacific/Auckland': 'NZ'
  };

  function flagFor(iso) {
    if (!iso || iso.length !== 2) return '';
    return String.fromCodePoint(
      0x1F1E6 + iso.charCodeAt(0) - 65,
      0x1F1E6 + iso.charCodeAt(1) - 65
    );
  }

  /* The country's name in the reader's own edition. Intl gives it
     to us in Arabic on the Arabic pages without a second table. */
  var regionNames = null;
  try {
    regionNames = new Intl.DisplayNames([isAr ? 'ar' : 'en-GB'], { type: 'region' });
  } catch (e) { regionNames = null; }

  function whereAmI() {
    var zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { zone = ''; }
    var iso = ZONE[zone];
    if (iso) {
      var name = null;
      try { name = regionNames && regionNames.of(iso); } catch (e) { name = null; }
      return { iso: iso, name: name || iso, flag: flagFor(iso) };
    }
    // Not in the table: the city half of the zone is still a true and
    // useful thing to print, and it is better than printing nothing.
    var city = zone.split('/').pop().replace(/_/g, ' ');
    return { iso: '', name: city || '', flag: '' };
  }

  var londonTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: 'numeric', minute: '2-digit', hour12: true
  });
  var localTime = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
  var dateFormat = new Intl.DateTimeFormat(locale, {
    calendar: 'gregory', weekday: 'long', day: 'numeric', month: 'long'
  });

  // "11:42 pm" out of Intl, "11:42 PM" on the page. A capitalised
  // meridiem is what an institution sets; the lowercase form reads as
  // a system default nobody chose.
  function polish(s) { return s.replace(/\s*(am|pm)$/i, function (m, g) { return ' ' + g.toUpperCase(); }); }

  var here = whereAmI();

  function paint(sel, value) {
    var els = root.querySelectorAll(sel);
    for (var i = 0; i < els.length; i += 1) els[i].textContent = value;
  }

  function tick() {
    var now = new Date();
    paint('[data-clock-london]', polish(londonTime.format(now)));
    paint('[data-clock-local]', polish(localTime.format(now)));
    paint('[data-clock-date]', dateFormat.format(now));
  }

  // The reader's own place is written once — it does not change on a
  // timer, and rewriting it every 30 seconds would make a screen
  // reader announce it every 30 seconds.
  if (here.name) {
    paint('[data-here-name]', here.name);
    paint('[data-here-flag]', here.flag);
    var block = root.querySelector('[data-here]');
    if (block) block.hidden = false;
  }

  tick();
  setInterval(tick, 20000);
})();
