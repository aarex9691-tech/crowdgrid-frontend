import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Hindi and Marathi for the pilgrim screens (navigation, yatra tabs, lodging,
 * food, transport, SOS and the personal QR). Staff dashboards stay in English.
 *
 *   const t = useT();
 *   t('lodging.bookBeds')                       -> "Book beds" / "बिस्तर बुक करें" / "बेड बुक करा"
 *   t('lodging.bedsFree', { n: 12 })            -> "{n} beds free" with n filled in
 *
 * A key missing in Hindi or Marathi falls back to English, so nothing is ever blank.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
];

const en = {
  'nav.home': 'Home',
  'nav.events': 'Events',
  'nav.passbook': 'My Passbook',
  'nav.help': 'Help',
  'nav.about': 'About us',
  'nav.bookNow': 'Book now',
  'nav.login': 'Log in',
  'nav.language': 'Language',

  'hub.allYatras': 'All yatras',
  'hub.services': 'Yatra services',
  'tab.lodging': 'Lodging & camps',
  'tab.food': 'Food',
  'tab.transit': 'Transport',
  'tab.route': 'Walk to ghat',
  'tab.seva': 'Seva',
  'tab.sos': 'Emergency SOS',
  'hint.lodging': 'Book a bed in a verified dharamshala or tent camp. Free camps are marked, and your stay QR is ready right away.',
  'hint.food': 'Get a free meal token for you and up to 4 family members. Show the QR at the kitchen counter.',
  'hint.transit': 'Shuttles and buses between parking, stations and the ghats. One bus pass can cover up to 5 people.',
  'hint.route': 'Pick where you are and a ghat. We show the least crowded walking route, updated live by the control room.',
  'hint.seva': 'Volunteer for crowd guidance, first aid or annadanam. Approved volunteers get a volunteer ID QR.',
  'hint.sos': 'Ask for help in one tap, or report a missing or found person. In danger, call 112 first.',

  'lodging.checkIn': 'Check-in',
  'lodging.checkOut': 'Check-out',
  'lodging.upToNights': '(up to {n} nights)',
  'lodging.perNightNote': 'Beds are counted night by night: the number on each camp is free on every night of your stay.',
  'lodging.sector': 'Sector / zone',
  'lodging.allSectors': 'All sectors',
  'lodging.type': 'Type of stay',
  'lodging.allTypes': 'All types',
  'lodging.soldOut': 'Sold out for these dates',
  'lodging.onlyLeft': 'Only {n} beds left',
  'lodging.bedsFree': '{n} beds free',
  'lodging.bookBeds': 'Book beds',
  'lodging.chooseBeds': 'Choose beds',
  'lodging.verified': 'Verified',
  'lodging.free': 'Free',
  'lodging.perNight': '₹{n} per night',
  'lodging.kmToGhat': '{n} km to ghat',
  'lodging.numberOfBeds': 'Number of beds',
  'lodging.maxPerPerson': 'Maximum {n} per person',
  'lodging.guestNames': 'Guest names',
  'lodging.guestN': 'Guest {n} full name',
  'lodging.stay': 'Stay',
  'lodging.nights': '{n} night(s)',
  'lodging.changeDates': 'Change the dates at the top of this tab.',
  'lodging.bookFree': 'Book {n} bed(s) · Free',
  'lodging.booking': 'Booking…',
  'lodging.addToCart': 'Add to cart · {amount}',
  'lodging.finding': 'Finding camps',
  'lodging.none': 'No camps match these filters. Try another sector or type.',
  'common.cancel': 'Cancel',
  'common.openPassbook': 'Open my passbook',

  'food.today': 'Today',
  'food.tomorrow': 'Tomorrow',
  'food.sector': 'Sector',
  'food.howMany': 'Token for how many people?',
  'food.rule': 'Each account can take 1 token per meal (breakfast, lunch and dinner) each day. One token feeds up to 5 family members: show it at the kitchen counter during the meal time.',
  'food.claim': 'Claim meal token',
  'food.claimFor': 'Claim token for {n}',
  'food.allTaken': 'All tokens taken',
  'food.claiming': 'Claiming…',
  'food.ready': 'Meal token ready. It works only during its meal window.',
  'food.back': 'Back to kitchens',

  'transit.schedule': 'Shuttle schedule',
  'transit.freeSeva': 'Free seva',
  'transit.boardAt': 'Board at {gate}',
  'transit.full': 'Full for {day}',
  'transit.onlySeats': 'Only {n} seats left for {day}',
  'transit.seatsLeft': '{n} seats left for {day}',
  'transit.travelling': 'Travelling',
  'transit.getPass': 'Get boarding pass · Free',
  'transit.preparing': 'Preparing…',

  'sos.title': 'Need help right now?',
  'sos.lead': 'Press the button. We send your live location to the police and volunteer control room.',

  'qr.oneQr': 'One QR for all your passes',
  'qr.show': 'Show this single code at any camp gate, food counter or bus gate. The volunteer\'s scanner finds the right pass and marks it used.',
  'qr.live': 'Live QR · changes in {n}s',
  'qr.liveNote': 'It changes every 30 seconds, even without internet, so a screenshot is no use to anyone else. Show it from the app.',
  'qr.staticNote': 'This phone shows a fixed QR. Keep it private: anyone with a copy could use your passes.',
  'qr.reset': 'Lost your phone or shared a screenshot? Reset this QR',
};

const hi = {
  'nav.home': 'होम',
  'nav.events': 'कार्यक्रम',
  'nav.passbook': 'मेरी पासबुक',
  'nav.help': 'सहायता',
  'nav.about': 'हमारे बारे में',
  'nav.bookNow': 'अभी बुक करें',
  'nav.login': 'लॉग इन',
  'nav.language': 'भाषा',

  'hub.allYatras': 'सभी यात्राएँ',
  'hub.services': 'यात्रा सेवाएँ',
  'tab.lodging': 'ठहरने की जगह और शिविर',
  'tab.food': 'भोजन',
  'tab.transit': 'परिवहन',
  'tab.route': 'घाट तक पैदल',
  'tab.seva': 'सेवा',
  'tab.sos': 'आपातकालीन SOS',
  'hint.lodging': 'सत्यापित धर्मशाला या टेंट शिविर में बिस्तर बुक करें। निःशुल्क शिविर अलग दिखाए गए हैं, और आपका QR तुरंत तैयार हो जाता है।',
  'hint.food': 'अपने और परिवार के 4 सदस्यों तक के लिए निःशुल्क भोजन टोकन लें। रसोई काउंटर पर QR दिखाएँ।',
  'hint.transit': 'पार्किंग, स्टेशन और घाटों के बीच शटल और बसें। एक बस पास 5 लोगों तक के लिए।',
  'hint.route': 'आप कहाँ हैं और कौन सा घाट, चुनें। हम सबसे कम भीड़ वाला पैदल रास्ता दिखाते हैं, जो नियंत्रण कक्ष से लाइव अपडेट होता है।',
  'hint.seva': 'भीड़ मार्गदर्शन, प्राथमिक चिकित्सा या अन्नदान में सेवा दें। स्वीकृत स्वयंसेवकों को ID QR मिलता है।',
  'hint.sos': 'एक बटन दबाकर मदद माँगें, या लापता/मिले व्यक्ति की सूचना दें। खतरे में हों तो पहले 112 पर कॉल करें।',

  'lodging.checkIn': 'चेक-इन',
  'lodging.checkOut': 'चेक-आउट',
  'lodging.upToNights': '(अधिकतम {n} रातें)',
  'lodging.perNightNote': 'बिस्तर हर रात के हिसाब से गिने जाते हैं: हर शिविर पर दिखी संख्या आपके ठहराव की हर रात खाली है।',
  'lodging.sector': 'सेक्टर / क्षेत्र',
  'lodging.allSectors': 'सभी सेक्टर',
  'lodging.type': 'ठहरने का प्रकार',
  'lodging.allTypes': 'सभी प्रकार',
  'lodging.soldOut': 'इन तारीखों के लिए भर गया',
  'lodging.onlyLeft': 'केवल {n} बिस्तर बचे',
  'lodging.bedsFree': '{n} बिस्तर खाली',
  'lodging.bookBeds': 'बिस्तर बुक करें',
  'lodging.chooseBeds': 'बिस्तर चुनें',
  'lodging.verified': 'सत्यापित',
  'lodging.free': 'निःशुल्क',
  'lodging.perNight': '₹{n} प्रति रात',
  'lodging.kmToGhat': 'घाट से {n} किमी',
  'lodging.numberOfBeds': 'बिस्तरों की संख्या',
  'lodging.maxPerPerson': 'प्रति व्यक्ति अधिकतम {n}',
  'lodging.guestNames': 'अतिथियों के नाम',
  'lodging.guestN': 'अतिथि {n} का पूरा नाम',
  'lodging.stay': 'ठहराव',
  'lodging.nights': '{n} रात',
  'lodging.changeDates': 'तारीखें इस टैब में ऊपर बदलें।',
  'lodging.bookFree': '{n} बिस्तर बुक करें · निःशुल्क',
  'lodging.booking': 'बुक हो रहा है…',
  'lodging.addToCart': 'कार्ट में डालें · {amount}',
  'lodging.finding': 'शिविर खोज रहे हैं',
  'lodging.none': 'इन फ़िल्टर से कोई शिविर नहीं मिला। दूसरा सेक्टर या प्रकार चुनें।',
  'common.cancel': 'रद्द करें',
  'common.openPassbook': 'मेरी पासबुक खोलें',

  'food.today': 'आज',
  'food.tomorrow': 'कल',
  'food.sector': 'सेक्टर',
  'food.howMany': 'कितने लोगों के लिए टोकन?',
  'food.rule': 'हर खाते को हर दिन प्रत्येक भोजन (नाश्ता, दोपहर और रात) का 1 टोकन मिलता है। एक टोकन से परिवार के 5 लोगों तक भोजन: भोजन के समय रसोई काउंटर पर दिखाएँ।',
  'food.claim': 'भोजन टोकन लें',
  'food.claimFor': '{n} लोगों का टोकन लें',
  'food.allTaken': 'सभी टोकन खत्म',
  'food.claiming': 'टोकन ले रहे हैं…',
  'food.ready': 'भोजन टोकन तैयार है। यह केवल भोजन के समय में ही चलेगा।',
  'food.back': 'रसोई सूची पर वापस',

  'transit.schedule': 'शटल समय-सारणी',
  'transit.freeSeva': 'निःशुल्क सेवा',
  'transit.boardAt': '{gate} से चढ़ें',
  'transit.full': '{day} के लिए भरी हुई',
  'transit.onlySeats': '{day} के लिए केवल {n} सीटें बचीं',
  'transit.seatsLeft': '{day} के लिए {n} सीटें खाली',
  'transit.travelling': 'यात्री',
  'transit.getPass': 'बोर्डिंग पास लें · निःशुल्क',
  'transit.preparing': 'तैयार हो रहा है…',

  'sos.title': 'अभी मदद चाहिए?',
  'sos.lead': 'बटन दबाएँ। हम आपकी लाइव लोकेशन पुलिस और स्वयंसेवक नियंत्रण कक्ष को भेजते हैं।',

  'qr.oneQr': 'आपके सभी पास के लिए एक QR',
  'qr.show': 'यह एक कोड किसी भी शिविर गेट, भोजन काउंटर या बस गेट पर दिखाएँ। स्वयंसेवक का स्कैनर सही पास ढूँढकर उसे उपयोग किया हुआ दर्ज करता है।',
  'qr.live': 'लाइव QR · {n} सेकंड में बदलेगा',
  'qr.liveNote': 'यह हर 30 सेकंड में बदलता है, इंटरनेट के बिना भी, इसलिए इसका स्क्रीनशॉट किसी और के काम का नहीं। ऐप से ही दिखाएँ।',
  'qr.staticNote': 'यह फ़ोन स्थायी QR दिखाता है। इसे निजी रखें: जिसके पास इसकी कॉपी होगी वह आपके पास इस्तेमाल कर सकता है।',
  'qr.reset': 'फ़ोन खो गया या स्क्रीनशॉट भेज दिया? यह QR बदलें',
};

const mr = {
  'nav.home': 'मुख्यपृष्ठ',
  'nav.events': 'कार्यक्रम',
  'nav.passbook': 'माझी पासबुक',
  'nav.help': 'मदत',
  'nav.about': 'आमच्याबद्दल',
  'nav.bookNow': 'आता बुक करा',
  'nav.login': 'लॉग इन',
  'nav.language': 'भाषा',

  'hub.allYatras': 'सर्व यात्रा',
  'hub.services': 'यात्रा सेवा',
  'tab.lodging': 'निवास आणि शिबिरे',
  'tab.food': 'भोजन',
  'tab.transit': 'वाहतूक',
  'tab.route': 'घाटापर्यंत पायी',
  'tab.seva': 'सेवा',
  'tab.sos': 'आपत्कालीन SOS',
  'hint.lodging': 'प्रमाणित धर्मशाळा किंवा तंबू शिबिरात बेड बुक करा. मोफत शिबिरे वेगळी दाखवली आहेत, आणि तुमचा QR लगेच तयार होतो.',
  'hint.food': 'तुमच्यासाठी आणि कुटुंबातील 4 जणांपर्यंत मोफत भोजन टोकन घ्या. स्वयंपाकघराच्या काउंटरवर QR दाखवा.',
  'hint.transit': 'पार्किंग, स्थानके आणि घाटांदरम्यान शटल व बस. एक बस पास 5 जणांपर्यंत.',
  'hint.route': 'तुम्ही कुठे आहात आणि कोणता घाट ते निवडा. आम्ही सर्वात कमी गर्दीचा पायी मार्ग दाखवतो, जो नियंत्रण कक्षाकडून थेट अपडेट होतो.',
  'hint.seva': 'गर्दी मार्गदर्शन, प्रथमोपचार किंवा अन्नदानात सेवा करा. मंजूर स्वयंसेवकांना ओळखपत्र QR मिळतो.',
  'hint.sos': 'एका बटणाने मदत मागा, किंवा हरवलेल्या/सापडलेल्या व्यक्तीची माहिती द्या. धोका असल्यास आधी 112 वर फोन करा.',

  'lodging.checkIn': 'चेक-इन',
  'lodging.checkOut': 'चेक-आउट',
  'lodging.upToNights': '(जास्तीत जास्त {n} रात्री)',
  'lodging.perNightNote': 'बेड प्रत्येक रात्रीप्रमाणे मोजले जातात: प्रत्येक शिबिरावरची संख्या तुमच्या मुक्कामाच्या प्रत्येक रात्री रिकामी आहे.',
  'lodging.sector': 'सेक्टर / विभाग',
  'lodging.allSectors': 'सर्व सेक्टर',
  'lodging.type': 'निवासाचा प्रकार',
  'lodging.allTypes': 'सर्व प्रकार',
  'lodging.soldOut': 'या तारखांसाठी भरले',
  'lodging.onlyLeft': 'फक्त {n} बेड उरले',
  'lodging.bedsFree': '{n} बेड रिकामे',
  'lodging.bookBeds': 'बेड बुक करा',
  'lodging.chooseBeds': 'बेड निवडा',
  'lodging.verified': 'प्रमाणित',
  'lodging.free': 'मोफत',
  'lodging.perNight': 'प्रति रात्र ₹{n}',
  'lodging.kmToGhat': 'घाटापासून {n} किमी',
  'lodging.numberOfBeds': 'बेडची संख्या',
  'lodging.maxPerPerson': 'प्रति व्यक्ती जास्तीत जास्त {n}',
  'lodging.guestNames': 'पाहुण्यांची नावे',
  'lodging.guestN': 'पाहुणा {n} चे पूर्ण नाव',
  'lodging.stay': 'मुक्काम',
  'lodging.nights': '{n} रात्र',
  'lodging.changeDates': 'तारखा या टॅबमध्ये वर बदला.',
  'lodging.bookFree': '{n} बेड बुक करा · मोफत',
  'lodging.booking': 'बुक होत आहे…',
  'lodging.addToCart': 'कार्टमध्ये टाका · {amount}',
  'lodging.finding': 'शिबिरे शोधत आहोत',
  'lodging.none': 'या फिल्टरनुसार कोणतेही शिबिर नाही. दुसरा सेक्टर किंवा प्रकार निवडा.',
  'common.cancel': 'रद्द करा',
  'common.openPassbook': 'माझी पासबुक उघडा',

  'food.today': 'आज',
  'food.tomorrow': 'उद्या',
  'food.sector': 'सेक्टर',
  'food.howMany': 'किती जणांसाठी टोकन?',
  'food.rule': 'प्रत्येक खात्याला दररोज प्रत्येक जेवणाचे (नाश्ता, दुपार आणि रात्र) 1 टोकन मिळते. एका टोकनवर कुटुंबातील 5 जणांपर्यंत जेवण: जेवणाच्या वेळी स्वयंपाकघराच्या काउंटरवर दाखवा.',
  'food.claim': 'भोजन टोकन घ्या',
  'food.claimFor': '{n} जणांचे टोकन घ्या',
  'food.allTaken': 'सर्व टोकन संपले',
  'food.claiming': 'टोकन घेत आहोत…',
  'food.ready': 'भोजन टोकन तयार आहे. ते फक्त जेवणाच्या वेळेतच चालेल.',
  'food.back': 'स्वयंपाकघरांच्या यादीकडे परत',

  'transit.schedule': 'शटल वेळापत्रक',
  'transit.freeSeva': 'मोफत सेवा',
  'transit.boardAt': '{gate} येथून बसा',
  'transit.full': '{day} साठी भरलेली',
  'transit.onlySeats': '{day} साठी फक्त {n} जागा उरल्या',
  'transit.seatsLeft': '{day} साठी {n} जागा रिकाम्या',
  'transit.travelling': 'प्रवासी',
  'transit.getPass': 'बोर्डिंग पास घ्या · मोफत',
  'transit.preparing': 'तयार होत आहे…',

  'sos.title': 'आत्ता मदत हवी आहे?',
  'sos.lead': 'बटण दाबा. आम्ही तुमचे थेट स्थान पोलीस आणि स्वयंसेवक नियंत्रण कक्षाला पाठवतो.',

  'qr.oneQr': 'तुमच्या सर्व पाससाठी एक QR',
  'qr.show': 'हा एकच कोड कोणत्याही शिबिर गेट, भोजन काउंटर किंवा बस गेटवर दाखवा. स्वयंसेवकाचा स्कॅनर योग्य पास शोधून तो वापरल्याची नोंद करतो.',
  'qr.live': 'थेट QR · {n} सेकंदात बदलेल',
  'qr.liveNote': 'तो दर 30 सेकंदांनी बदलतो, इंटरनेटशिवायही, त्यामुळे त्याचा स्क्रीनशॉट दुसऱ्या कोणाच्या उपयोगाचा नाही. ॲपमधूनच दाखवा.',
  'qr.staticNote': 'हा फोन कायमचा QR दाखवतो. तो खासगी ठेवा: ज्याच्याकडे त्याची प्रत असेल तो तुमचे पास वापरू शकतो.',
  'qr.reset': 'फोन हरवला किंवा स्क्रीनशॉट पाठवला? हा QR बदला',
};

const DICTS = { en, hi, mr };
const KEY = 'cg_lang';

const readLang = () => {
  try {
    const v = localStorage.getItem(KEY);
    return DICTS[v] ? v : 'en';
  } catch {
    return 'en';
  }
};

const fill = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : text);

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k, v) => fill(en[k] ?? k, v) });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en-IN' : `${lang}-IN`;
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!DICTS[code]) return;
    setLangState(code);
    try {
      localStorage.setItem(KEY, code);
    } catch {
      /* storage blocked: the choice lasts until the page is closed */
    }
  }, []);

  const t = useCallback((key, vars) => fill(DICTS[lang][key] ?? en[key] ?? key, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLang = () => useContext(LangContext);
// eslint-disable-next-line react-refresh/only-export-components
export const useT = () => useContext(LangContext).t;

/** Compact language picker for the header. */
export function LanguageSwitch({ className = '' }) {
  const { lang, setLang, t } = useLang();
  return (
    <label className={`inline-flex items-center ${className}`}>
      <span className="sr-only">{t('nav.language')}</span>
      <select className="min-h-10 rounded-xl border border-line bg-white px-2 text-sm font-semibold text-ink" value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('nav.language')}>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}
