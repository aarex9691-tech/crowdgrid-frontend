import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { HOME_STRINGS } from './homeStrings';

/**
 * Hindi and Marathi for the pilgrim screens (navigation, yatra tabs, lodging,
 * food, transport, SOS, events, passbook, and the personal QR).
 *
 *   const t = useT();
 *   t('lodging.bookBeds')                       -> "Book beds" / "बिस्तर बुक करें"
 *   t('lodging.bedsFree', { n: 12 })            -> "{n} beds free" with n filled in
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
  'nav.logout': 'Log out',
  'nav.language': 'Language',
  'nav.searchPlaceholder': 'Search events and places',
  'nav.search': 'Search',

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
  'lodging.howToChoose': 'How to choose beds',
  'lodging.pickBeds': 'Choose my tent and beds',
  'lodging.anyBeds': 'Any free beds',
  'lodging.loadingMap': 'Loading tents',
  'lodging.bed': 'Bed',
  'lodging.tapBeds': 'Tap free beds to choose them (up to {n}). A tent sleeps {size}.',
  'lodging.legendFree': 'Free',
  'lodging.legendTaken': 'Taken',
  'lodging.legendYours': 'Your choice',
  'lodging.wholeTent': 'Choose the whole tent',
  'lodging.freeIn': '{n} free',
  'lodging.showMore': 'Show more tents',
  'lodging.pickFirst': 'Choose at least one bed',
  'lodging.namesNeeded': 'Enter the full name of each person staying',
  'lodging.selected': '{n} selected',
  'lodging.fullName': 'Full name',
  'lodging.step.dates': 'Dates',
  'lodging.step.beds': 'Beds',
  'lodging.step.names': 'Names',
  'lodging.step.confirm': 'Confirm',
  'lodging.summary': 'Your booking',
  'lodging.total': 'Total',
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
  'sos.whatHelp': 'What do you need help with?',
  'sos.type.MEDICAL': 'Medical',
  'sos.type.CROWD': 'Crowd crush',
  'sos.type.LOST': 'Lost / separated',
  'sos.type.FIRE': 'Fire or danger',
  'sos.type.GENERAL': 'Other help',
  'sos.notePlaceholder': 'Optional: a few words (e.g. "father fainted near the steps")',
  'sos.finding': 'Finding you…',
  'sos.sending': 'Sending…',
  'sos.sendAgain': 'Send again',
  'sos.sent': 'Alert sent to the control room.',
  'sos.updated': 'Your open alert was updated.',
  'sos.located': 'Location shared (accurate to about {m} m).',
  'sos.noGps': 'We could not get your GPS location. If you can, call 112 and tell them where you are.',
  'sos.call112': 'Call 112 directly.',
  'sos.my': 'My SOS',
  'sos.status.OPEN': 'Waiting for the control room',
  'sos.status.ACKNOWLEDGED': 'Help is being arranged',
  'sos.status.RESOLVED': 'Closed',
  'sos.step.sent': 'Alert sent',
  'sos.step.seen': 'Seen by the control room',
  'sos.step.helper': '{name} is on the way',
  'sos.step.helperWait': 'A volunteer will be assigned',
  'sos.step.resolved': 'Resolved',
  'sos.step.safe': 'You marked yourself safe',
  'sos.updateLocation': 'Update my location',
  'sos.safe': "I'm safe now",

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
  'nav.logout': 'लॉग आउट',
  'nav.language': 'भाषा',
  'nav.searchPlaceholder': 'कार्यक्रम और स्थान खोजें',
  'nav.search': 'खोजें',

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
  'lodging.howToChoose': 'बिस्तर कैसे चुनें',
  'lodging.pickBeds': 'टेंट और बिस्तर खुद चुनें',
  'lodging.anyBeds': 'कोई भी खाली बिस्तर',
  'lodging.loadingMap': 'टेंट लोड हो रहे हैं',
  'lodging.bed': 'बिस्तर',
  'lodging.tapBeds': 'खाली बिस्तर पर टैप करके चुनें (अधिकतम {n})। एक टेंट में {size} लोग रहते हैं।',
  'lodging.legendFree': 'खाली',
  'lodging.legendTaken': 'भरा हुआ',
  'lodging.legendYours': 'आपका चुनाव',
  'lodging.wholeTent': 'पूरा टेंट चुनें',
  'lodging.freeIn': '{n} खाली',
  'lodging.showMore': 'और टेंट दिखाएँ',
  'lodging.pickFirst': 'कम से कम एक बिस्तर चुनें',
  'lodging.namesNeeded': 'ठहरने वाले हर व्यक्ति का पूरा नाम लिखें',
  'lodging.selected': '{n} चुने गए',
  'lodging.fullName': 'पूरा नाम',
  'lodging.step.dates': 'तारीखें',
  'lodging.step.beds': 'बिस्तर',
  'lodging.step.names': 'नाम',
  'lodging.step.confirm': 'पुष्टि',
  'lodging.summary': 'आपकी बुकिंग',
  'lodging.total': 'कुल',
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
  'sos.whatHelp': 'आपको किस तरह की मदद चाहिए?',
  'sos.type.MEDICAL': 'चिकित्सा',
  'sos.type.CROWD': 'भीड़ में दबाव',
  'sos.type.LOST': 'खो गए / बिछड़ गए',
  'sos.type.FIRE': 'आग या खतरा',
  'sos.type.GENERAL': 'अन्य मदद',
  'sos.notePlaceholder': 'वैकल्पिक: कुछ शब्द (जैसे "सीढ़ियों के पास पिताजी बेहोश हो गए")',
  'sos.finding': 'आपकी लोकेशन खोज रहे हैं…',
  'sos.sending': 'भेज रहे हैं…',
  'sos.sendAgain': 'फिर से भेजें',
  'sos.sent': 'अलर्ट नियंत्रण कक्ष को भेज दिया गया।',
  'sos.updated': 'आपका खुला अलर्ट अपडेट हो गया।',
  'sos.located': 'लोकेशन भेजी गई (लगभग {m} मीटर तक सटीक)।',
  'sos.noGps': 'आपकी GPS लोकेशन नहीं मिली। हो सके तो 112 पर कॉल करके अपनी जगह बताएँ।',
  'sos.call112': 'सीधे 112 पर कॉल करें।',
  'sos.my': 'मेरा SOS',
  'sos.status.OPEN': 'नियंत्रण कक्ष के जवाब की प्रतीक्षा',
  'sos.status.ACKNOWLEDGED': 'मदद की व्यवस्था हो रही है',
  'sos.status.RESOLVED': 'बंद',
  'sos.step.sent': 'अलर्ट भेजा गया',
  'sos.step.seen': 'नियंत्रण कक्ष ने देखा',
  'sos.step.helper': '{name} आपकी ओर आ रहे हैं',
  'sos.step.helperWait': 'एक स्वयंसेवक नियुक्त किया जाएगा',
  'sos.step.resolved': 'समाधान हो गया',
  'sos.step.safe': 'आपने बताया कि आप सुरक्षित हैं',
  'sos.updateLocation': 'मेरी लोकेशन अपडेट करें',
  'sos.safe': 'मैं अब सुरक्षित हूँ',

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
  'nav.logout': 'लॉग आउट',
  'nav.language': 'भाषा',
  'nav.searchPlaceholder': 'कार्यक्रम आणि ठिकाणे शोधा',
  'nav.search': 'शोधा',

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
  'lodging.howToChoose': 'बेड कसे निवडायचे',
  'lodging.pickBeds': 'तंबू आणि बेड स्वतः निवडा',
  'lodging.anyBeds': 'कोणतेही रिकामे बेड',
  'lodging.loadingMap': 'तंबू लोड होत आहेत',
  'lodging.bed': 'बेड',
  'lodging.tapBeds': 'रिकाम्या बेडवर टॅप करून निवडा (जास्तीत जास्त {n}). एका तंबूत {size} जण राहतात.',
  'lodging.legendFree': 'रिकामा',
  'lodging.legendTaken': 'भरलेला',
  'lodging.legendYours': 'तुमची निवड',
  'lodging.wholeTent': 'संपूर्ण तंबू निवडा',
  'lodging.freeIn': '{n} रिकामे',
  'lodging.showMore': 'आणखी तंबू दाखवा',
  'lodging.pickFirst': 'किमान एक बेड निवडा',
  'lodging.namesNeeded': 'राहणाऱ्या प्रत्येक व्यक्तीचे पूर्ण नाव लिहा',
  'lodging.selected': '{n} निवडले',
  'lodging.fullName': 'पूर्ण नाव',
  'lodging.step.dates': 'तारखा',
  'lodging.step.beds': 'बेड',
  'lodging.step.names': 'नावे',
  'lodging.step.confirm': 'पुष्टी',
  'lodging.summary': 'तुमचे बुकिंग',
  'lodging.total': 'एकूण',
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
  'sos.whatHelp': 'तुम्हाला कोणती मदत हवी आहे?',
  'sos.type.MEDICAL': 'वैद्यकीय',
  'sos.type.CROWD': 'गर्दीत दबाव',
  'sos.type.LOST': 'हरवले / चुकामूक',
  'sos.type.FIRE': 'आग किंवा धोका',
  'sos.type.GENERAL': 'इतर मदत',
  'sos.notePlaceholder': 'ऐच्छिक: काही शब्द (उदा. "पायऱ्यांजवळ वडील बेशुद्ध पडले")',
  'sos.finding': 'तुमचे स्थान शोधत आहोत…',
  'sos.sending': 'पाठवत आहोत…',
  'sos.sendAgain': 'पुन्हा पाठवा',
  'sos.sent': 'अलर्ट नियंत्रण कक्षाला पाठवला.',
  'sos.updated': 'तुमचा चालू अलर्ट अपडेट झाला.',
  'sos.located': 'स्थान पाठवले (सुमारे {m} मीटरपर्यंत अचूक).',
  'sos.noGps': 'तुमचे GPS स्थान मिळाले नाही. शक्य असल्यास 112 वर फोन करून तुमची जागा सांगा.',
  'sos.call112': 'थेट 112 वर फोन करा.',
  'sos.my': 'माझा SOS',
  'sos.status.OPEN': 'नियंत्रण कक्षाच्या प्रतिसादाची वाट',
  'sos.status.ACKNOWLEDGED': 'मदतीची व्यवस्था होत आहे',
  'sos.status.RESOLVED': 'बंद',
  'sos.step.sent': 'अलर्ट पाठवला',
  'sos.step.seen': 'नियंत्रण कक्षाने पाहिला',
  'sos.step.helper': '{name} तुमच्याकडे येत आहेत',
  'sos.step.helperWait': 'एक स्वयंसेवक नेमला जाईल',
  'sos.step.resolved': 'निराकरण झाले',
  'sos.step.safe': 'तुम्ही सुरक्षित असल्याचे कळवले',
  'sos.updateLocation': 'माझे स्थान अपडेट करा',
  'sos.safe': 'मी आता सुरक्षित आहे',

  'qr.oneQr': 'तुमच्या सर्व पाससाठी एक QR',
  'qr.show': 'हा एकच कोड कोणत्याही शिबिर गेट, भोजन काउंटर किंवा बस गेटवर दाखवा. स्वयंसेवकाचा स्कॅनर योग्य पास शोधून तो वापरल्याची नोंद करतो.',
  'qr.live': 'थेट QR · {n} सेकंदात बदलेल',
  'qr.liveNote': 'तो दर 30 सेकंदांनी बदलतो, इंटरनेटशिवायही, त्यामुळे त्याचा स्क्रीनशॉट दुसऱ्या कोणाच्या उपयोगाचा नाही. ॲपमधूनच दाखवा.',
  'qr.staticNote': 'हा फोन कायमचा QR दाखवतो. तो खासगी ठेवा: ज्याच्याकडे त्याची प्रत असेल तो तुमचे पास वापरू शकतो.',
  'qr.reset': 'फोन हरवला किंवा स्क्रीनशॉट पाठवला? हा QR बदला',
};

const DICTS = {
  en: { ...en, ...HOME_STRINGS.en },
  hi: { ...hi, ...HOME_STRINGS.hi },
  mr: { ...mr, ...HOME_STRINGS.mr },
};
const EN = DICTS.en;
const KEY = 'cg_lang';

// Instant UI Dictionary for zero-latency translation across all screens
export const COMMON_DICTIONARY_HI = {
  // Navigation & Core Ribbon
  'Home': 'होम',
  'Events': 'कार्यक्रम',
  'All events': 'सभी कार्यक्रम',
  'My Passbook': 'मेरी पासबुक',
  'Help': 'सहायता',
  'Help centre': 'सहायता केंद्र',
  'Help centre & FAQs': 'सहायता केंद्र और अक्सर पूछे जाने वाले प्रश्न',
  'About us': 'हमारे बारे में',
  'About CrowdGrid': 'क्राउडग्रिड के बारे में',
  'Book now': 'अभी बुक करें',
  'Log in': 'लॉग इन',
  'Log out': 'लॉग आउट',
  'Log out?': 'लॉग आउट करें?',
  'Stay logged in': 'लॉग इन रहें',
  'Create account': 'खाता बनाएँ',
  'Create your account': 'अपना खाता बनाएँ',
  'Register': 'पंजीकरण',
  'Search': 'खोजें',
  'Search events and places': 'कार्यक्रम और स्थान खोजें',
  'Search by city, name or ghat': 'शहर, नाम या घाट से खोजें',
  'Explore': 'एक्सप्लोर करें',
  'Contact customer care': 'ग्राहक सहायता से संपर्क करें',
  'Take the tour': 'गाइडेड टूर देखें',
  'Emergency SOS': 'आपातकालीन SOS',
  'SOS & lost and found': 'SOS और खोया-पाया',
  'Scanner': 'स्कैनर',
  'Control room': 'नियंत्रण कक्ष',
  'Analytics': 'विश्लेषण',
  'Hosted events': 'आयोजित कार्यक्रम',
  'Campus & Corporate': 'कैंपस और कॉर्पोरेट',
  'Campus & Corporate events': 'कैंपस और कॉर्पोरेट कार्यक्रम',
  'My camps': 'मेरे शिविर',
  'My ID badge': 'मेरा पहचान पत्र',
  'Open scanner': 'स्कैनर खोलें',
  'New event': 'नया कार्यक्रम',
  'Host an event': 'कार्यक्रम आयोजित करें',

  // Passbook screen
  'Attendee': 'सहभागी',
  'My passbook': 'मेरी पासबुक',
  'Every pass in one place. Opens without network.': 'सभी पास एक ही जगह पर। बिना इंटरनेट के भी खुलता है।',
  'No active passes yet': 'अभी कोई सक्रिय पास नहीं है',
  'Book a ticket, a bed, a meal token or a shuttle seat, and the pass appears here.': 'टिकट, बिस्तर, भोजन टोकन या बस सीट बुक करें, और आपका पास यहाँ दिखेगा।',
  'Find an event': 'कार्यक्रम खोजें',
  'All': 'सभी',
  'Your passes': 'आपके पास',
  'Hide individual QR codes': 'अलग-अलग QR कोड छुपाएँ',
  'Show individual QR codes (backup)': 'अलग-अलग QR कोड दिखाएँ (बैकअप)',
  'Show': 'दिखाएँ',
  'Hide': 'छुपाएँ',
  'Show used, expired and cancelled passes': 'उपयोग किए गए, समाप्त और रद्द किए गए पास दिखाएँ',
  'Hide used, expired and cancelled passes': 'उपयोग किए गए, समाप्त और रद्द किए गए पास छुपाएँ',
  'Lodging pass': 'ठहरने का पास',
  'Meal token': 'भोजन टोकन',
  'Boarding pass': 'बोर्डिंग पास',
  'Entry pass': 'प्रवेश पास',
  'Corporate badge': 'कॉर्पोरेट बैज',
  'Volunteer ID': 'स्वयंसेवक पहचान पत्र',
  'Ready to scan': 'स्कैन के लिए तैयार',
  'Not open yet': 'अभी खुला नहीं है',
  'Used': 'उपयोग किया गया',
  'Expired': 'समाप्त',
  'Cancelled': 'रद्द किया गया',
  'Your bed': 'आपका बिस्तर',
  'Beds': 'बिस्तर',
  'People': 'लोग',
  'Paid': 'भुगतान किया गया',
  'Refund': 'धनवापसी',
  'Stay': 'ठहराव',
  'Board at': 'चढ़ने का स्थान',
  'Fare': 'किराया',
  'Free seva': 'निःशुल्क सेवा',
  'Menu': 'मेन्यू',
  'Guests': 'अतिथि',
  'Names': 'नाम',
  'Trust': 'ट्रस्ट',
  'Seva': 'सेवा',
  'Cancel pass': 'पास रद्द करें',
  'Keep pass': 'पास रखें',
  'Yes, cancel this pass': 'हाँ, यह पास रद्द करें',
  'Cancel': 'रद्द करें',
  'Close': 'बंद करें',
  'Download pass': 'पास डाउनलोड करें',
  'Copy code': 'कोड कॉपी करें',
  'Copied': 'कॉपी हो गया',
  'Free pass, nothing to refund': 'निःशुल्क पास, कोई धनवापसी नहीं',
  'Upcoming & active': 'आगामी और सक्रिय',
  'Past & used': 'पुराने और उपयोग किए गए',
  'Filter passes': 'पास फ़िल्टर करें',
  'Opening your passbook': 'आपकी पासबुक खुल रही है…',

  // Events & Yatras screen
  'Yatras & melas': 'यात्राएँ एवं मेले',
  'Large pilgrimages with lodging, food, transport and seva.': 'ठहरने, भोजन, परिवहन और सेवा के साथ बड़े तीर्थ आयोजन।',
  'Public events': 'सार्वजनिक कार्यक्रम',
  'Open to everyone. Register, pay at checkout and get your entry pass.': 'सभी के लिए खुला। रजिस्टर करें, चेकआउट पर भुगतान करें और प्रवेश पास प्राप्त करें।',
  'Invite-only events for students and professionals. Enter the 6-digit code from your host.': 'विद्यार्थियों और पेशेवरों के लिए आमंत्रण-मात्र कार्यक्रम। अपने आयोजक से प्राप्त 6 अंकों का कोड दर्ज करें।',
  'Enter 6-digit code': '6 अंकों का कोड दर्ज करें',
  'Enter code': 'कोड दर्ज करें',
  'View event': 'कार्यक्रम देखें',
  'Book passes': 'पास बुक करें',
  'Register now': 'अभी रजिस्टर करें',
  'All categories': 'सभी श्रेणियाँ',
  'All dates': 'सभी तारीखें',
  'Clear filters': 'फ़िल्टर साफ़ करें',
  'No events found': 'कोई कार्यक्रम नहीं मिला',
  'Try clearing the search or category filter.': 'खोज या श्रेणी फ़िल्टर हटाकर पुनः प्रयास करें।',
  'Flagship': 'प्रमुख आयोजन',
  'Royal Bathing Dates (Shahi Snan)': 'शाही स्नान की महत्वपूर्ण तिथियाँ',
  'Upcoming public events': 'आगामी सार्वजनिक कार्यक्रम',
  'Book lodging, food & transport': 'ठहरने, भोजन और परिवहन की बुकिंग',

  // Authentication & Forms
  'Use the mobile number you registered with.': 'जिस मोबाइल नंबर से पंजीकरण किया था, उसका उपयोग करें।',
  'Mobile number': 'मोबाइल नंबर',
  'Password': 'पासवर्ड',
  'Show password': 'पासवर्ड दिखाएँ',
  'Hide password': 'पासवर्ड छुपाएँ',
  'Forgot password?': 'पासवर्ड भूल गए?',
  'Signing in…': 'साइन इन हो रहा है…',
  "Don't have an account?": 'क्या आपका खाता नहीं है?',
  'Create one': 'नया खाता बनाएँ',
  'Already have an account?': 'क्या पहले से खाता है?',
  'Already registered?': 'क्या पहले से पंजीकृत हैं?',
  'Full name': 'पूरा नाम',
  'As on your ID card': 'पहचान पत्र के अनुसार',
  'Send code to verify this number': 'इस नंबर को सत्यापित करने के लिए कोड भेजें',
  'Send a new code': 'नया कोड भेजें',
  'Sending code…': 'कोड भेजा जा रहा है…',
  '6-digit code': '6-अंकों का कोड',
  'At least 8 characters, with a letter and a number.': 'कम से कम 8 अक्षर, एक अक्षर और एक संख्या के साथ।',
  'Creating account…': 'खाता बनाया जा रहा है…',
  'One account for passes, stays, meals and rides at every event.': 'हर कार्यक्रम में पास, ठहराव, भोजन और यात्रा के लिए एक ही खाता।',
  'Running a camp or kitchen? Create an account first, then register your organisation from your profile.': 'क्या आप कोई शिविर या रसोई चला रहे हैं? पहले एक खाता बनाएँ, फिर अपनी प्रोफ़ाइल से अपनी संस्था पंजीकृत करें।',

  // Checkout & Account
  'Checkout': 'चेकआउट',
  'Order summary': 'ऑर्डर सारांश',
  'Total': 'कुल',
  'Subtotal': 'उप-कुल',
  'Proceed to pay': 'भुगतान के लिए आगे बढ़ें',
  'Pay': 'भुगतान करें',
  'Pay now': 'अभी भुगतान करें',
  'Items': 'सामग्री',
  'Empty cart': 'खाली कार्ट',
  'Your cart is empty': 'आपकी कार्ट खाली है',
  'My account': 'मेरा खाता',
  'Profile': 'प्रोफ़ाइल',
  'Personal information': 'व्यक्तिगत जानकारी',
  'Role': 'भूमिका',
  'Save changes': 'बदलाव सहेजें',

  // Common UI words & helpers
  'Verified': 'सत्यापित',
  'Free': 'निःशुल्क',
  'Sold out': 'भर गया',
  'Only a few left': 'केवल कुछ बचे हैं',
  'Loading…': 'लोड हो रहा है…',
  'Back': 'वापस',
  'Next': 'आगे',
  'Confirm': 'पुष्टि करें',
  'Continue': 'जारी रखें',
  'Error': 'त्रुटि',
  'Success': 'सफल',
  'Warning': 'चेतावनी',
  'Emergency': 'आपातकालीन',
  'Medical': 'चिकित्सा',
  'Child helpline': 'बाल हेल्पलाइन',
  'View details': 'विवरण देखें',
};

// Read saved language (defaulting to English)
const readLang = () => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && (saved === 'hi' || saved === 'en' || saved === 'mr')) return saved;
  } catch {
    /* ignore */
  }
  return 'en';
};

const translationCache = new Map();

// Initialize cache with known dictionary items
for (const [k, v] of Object.entries(COMMON_DICTIONARY_HI)) {
  translationCache.set(k.trim(), v);
}

/**
 * High-speed batch translation endpoint.
 * Batches multiple phrases into 1 single HTTP request with numbered lines.
 */
export async function translateWithGoogleBatch(texts, targetLang = 'hi') {
  if (!texts || texts.length === 0 || targetLang === 'en') return {};
  const unCached = [];
  const results = {};

  for (const t of texts) {
    const clean = t.trim();
    if (translationCache.has(clean)) {
      results[clean] = translationCache.get(clean);
    } else if (COMMON_DICTIONARY_HI[clean]) {
      results[clean] = COMMON_DICTIONARY_HI[clean];
      translationCache.set(clean, COMMON_DICTIONARY_HI[clean]);
    } else {
      unCached.push(clean);
    }
  }

  if (unCached.length === 0) return results;

  // Split into chunks of 20 to avoid exceeding URL limits
  const chunks = [];
  for (let i = 0; i < unCached.length; i += 20) {
    chunks.push(unCached.slice(i, i + 20));
  }

  for (const chunk of chunks) {
    try {
      const indexed = chunk.map((text, idx) => `${idx}. ${text.replace(/\s+/g, ' ')}`).join('\n');
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(indexed)}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      const raw = data?.[0]?.map((item) => item[0]).join('') || '';
      const lines = raw.split('\n');

      for (const line of lines) {
        const m = line.match(/^(\d+)\.\s*(.*)$/);
        if (m) {
          const idx = parseInt(m[1], 10);
          const orig = chunk[idx];
          const trans = m[2].trim();
          if (orig && trans) {
            translationCache.set(orig, trans);
            results[orig] = trans;
          }
        }
      }
    } catch {
      /* network or offline: fallback silently */
    }
  }

  return results;
}

export async function translateWithGoogle(text, targetLang = 'hi') {
  if (!text || !text.trim() || targetLang === 'en') return text;
  const clean = text.trim();
  if (translationCache.has(clean)) return translationCache.get(clean);
  if (COMMON_DICTIONARY_HI[clean]) return COMMON_DICTIONARY_HI[clean];

  const res = await translateWithGoogleBatch([clean], targetLang);
  return res[clean] || text;
}

/** Track modified text nodes to restore them cleanly when switching back to English */
const activeTrackedNodes = new Set();
let domObserver = null;
let currentLanguage = readLang();
let scanTimer = null;

/**
 * Text that must never be sent to the translation service: anything that looks like personal data.
 * (Names, SOS messages and missing-person details are also kept out by the data-no-translate zones.)
 */
const looksPersonal = (str) => /@|\d{6,}|\+\d/.test(str);

function shouldTranslateText(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.length < 2) return false;
  // If text is already Devanagari (Hindi/Marathi), skip! Never loop.
  if (/[\u0900-\u097F]/.test(trimmed)) return false;
  // Skip pure numbers, punctuation, dates, phone codes, currencies
  if (/^[\d\s.,:;!?()/[\]{}+*&^%$#@~|<=>\\"'_—–-]+$/.test(trimmed)) return false;
  // Must contain English letters
  if (!/[a-zA-Z]{2,}/.test(trimmed)) return false;
  return true;
}

/**
 * Scans the entire DOM and translates untranslated text nodes and input placeholders
 */
function scanAndTranslateDOM() {
  if (typeof document === 'undefined' || currentLanguage !== 'hi') return;

  try {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'code', 'pre', 'noscript', 'svg'].includes(tag)) return NodeFilter.FILTER_REJECT;
        // Personal content (names, SOS messages, missing-person reports, passes, the scanner) stays as typed
        if (parent.closest('[data-no-translate], [translate="no"], .notranslate, [contenteditable="true"]')) return NodeFilter.FILTER_REJECT;
        return shouldTranslateText(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    const nodesToTranslate = [];
    let cur;
    while ((cur = walker.nextNode())) {
      nodesToTranslate.push(cur);
    }

    const needsGoogleFetch = [];
    const nodeMap = new Map();

    // Forget text nodes React has removed (otherwise the set grows for the whole session)
    for (const node of activeTrackedNodes) if (!node.isConnected) activeTrackedNodes.delete(node);

    for (const node of nodesToTranslate) {
      const orig = node.nodeValue;
      const clean = orig.trim();
      // Only English text reaches here, so this is the current React text (it may have changed since)
      node.__cgOrig = orig;
      activeTrackedNodes.add(node);

      // Check instant dictionary or cache
      const instant = COMMON_DICTIONARY_HI[clean] || translationCache.get(clean);
      if (instant) {
        node.nodeValue = orig.replace(clean, instant);
        node.__cgText = node.nodeValue;
      } else if (looksPersonal(clean)) {
        // never sent anywhere
      } else {
        if (!nodeMap.has(clean)) {
          nodeMap.set(clean, []);
          needsGoogleFetch.push(clean);
        }
        nodeMap.get(clean).push(node);
      }
    }

    // Also scan placeholders of input and textarea
    const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
    inputs.forEach((input) => {
      const ph = input.getAttribute('placeholder');
      if (ph && shouldTranslateText(ph) && !looksPersonal(ph) && !input.closest('[data-no-translate], [translate="no"]')) {
        if (!input.__cgOrigPh) input.__cgOrigPh = ph;
        const cleanPh = ph.trim();
        const instantPh = COMMON_DICTIONARY_HI[cleanPh] || translationCache.get(cleanPh);
        if (instantPh) {
          input.setAttribute('placeholder', instantPh);
        } else {
          needsGoogleFetch.push(cleanPh);
          if (!nodeMap.has(cleanPh)) nodeMap.set(cleanPh, []);
          nodeMap.get(cleanPh).push({ isPlaceholder: true, el: input, orig: cleanPh });
        }
      }
    });

    // Batch fetch any remaining phrases via Google
    if (needsGoogleFetch.length > 0) {
      translateWithGoogleBatch(needsGoogleFetch, 'hi').then((translatedMap) => {
        if (currentLanguage !== 'hi') return; // User switched back to English
        for (const [orig, trans] of Object.entries(translatedMap)) {
          const targets = nodeMap.get(orig) || [];
          for (const target of targets) {
            if (target.isPlaceholder) {
              if (target.el.closest('body')) {
                target.el.setAttribute('placeholder', trans);
              }
            } else if (target.isConnected && target.__cgOrig !== undefined && target.nodeValue === target.__cgOrig) {
              // only if React has not changed the text while the translation was on its way
              target.nodeValue = target.nodeValue.replace(orig, trans);
              target.__cgText = target.nodeValue;
            }
          }
        }
      });
    }
  } catch {
    /* silent background handling */
  }
}

function startDomObserver() {
  if (typeof MutationObserver === 'undefined' || domObserver) return;
  domObserver = new MutationObserver((mutations) => {
    if (currentLanguage !== 'hi') return;
    let shouldScan = false;
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
      if (m.type === 'characterData' && m.target && shouldTranslateText(m.target.nodeValue)) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      if (scanTimer) clearTimeout(scanTimer);
      scanTimer = setTimeout(scanAndTranslateDOM, 60);
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function stopDomObserver() {
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
  if (scanTimer) {
    clearTimeout(scanTimer);
    scanTimer = null;
  }
}

/**
 * Master function to apply or revert background translation across the whole website.
 */
export function applyBackgroundTranslation(targetLang) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  currentLanguage = targetLang;

  // Restore English completely and cleanly
  if (targetLang === 'en') {
    stopDomObserver();

    // Revert all modified text nodes instantly
    for (const node of activeTrackedNodes) {
      try {
        // Put English back only where our translation is still showing (never over newer React text)
        if (node.__cgOrig !== undefined && node.__cgText !== undefined && node.nodeValue === node.__cgText) {
          node.nodeValue = node.__cgOrig;
        }
        delete node.__cgText;
      } catch {
        /* node detached */
      }
    }
    activeTrackedNodes.clear();

    // Revert all input placeholders
    document.querySelectorAll('input, textarea').forEach((input) => {
      if (input.__cgOrigPh) {
        input.setAttribute('placeholder', input.__cgOrigPh);
        delete input.__cgOrigPh;
      }
    });

    // Revert any elements that had data-cg-orig
    document.querySelectorAll('[data-cg-orig]').forEach((el) => {
      const orig = el.getAttribute('data-cg-orig');
      if (orig) {
        el.textContent = orig;
        el.removeAttribute('data-cg-orig');
      }
    });
    return;
  }

  // Target is Hindi
  startDomObserver();
  if (scanTimer) clearTimeout(scanTimer);
  scanTimer = setTimeout(scanAndTranslateDOM, 30);
  // Also run a backup scan at 350ms to catch async API responses
  setTimeout(scanAndTranslateDOM, 350);
}

const fill = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : text);

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k, v) => fill(EN[k] ?? k, v) });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en-IN' : `${lang}-IN`;
    applyBackgroundTranslation(lang);
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!DICTS[code]) return;
    setLangState(code);
    try {
      localStorage.setItem(KEY, code);
    } catch {
      /* storage blocked */
    }
    applyBackgroundTranslation(code);
  }, []);

  const t = useCallback((key, vars) => fill(DICTS[lang][key] ?? EN[key] ?? key, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLang = () => useContext(LangContext);
// eslint-disable-next-line react-refresh/only-export-components
export const useT = () => useContext(LangContext).t;

/**
 * Bilingual switcher button: "A ⇄ अ"
 * Inspired by Indian transit apps (Railgun, UTS).
 * One tap flips between English and Hindi, updating internal dictionary translations
 * and syncing with client-side Google Translate (0 server load).
 */
export function LanguageSwitcherButton({ className = '' }) {
  const { lang, setLang } = useLang();
  const isHindi = lang === 'hi';

  const toggle = () => {
    const next = isHindi ? 'en' : 'hi';
    setLang(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`group relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-mist/80 px-3 py-1.5 text-ink transition-all hover:border-blue hover:bg-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue ${className}`}
      title={isHindi ? 'Switch to English (अंग्रेज़ी)' : 'Switch to Hindi (हिन्दी)'}
      aria-label={isHindi ? 'Switch to English' : 'Switch to Hindi'}
    >
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <span className={`text-base font-extrabold transition-colors ${!isHindi ? 'text-blue' : 'text-ink-faint group-hover:text-ink'}`}>
          A
        </span>
        <svg
          className="size-3.5 text-marigold transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span className={`text-base font-extrabold font-sans transition-colors ${isHindi ? 'text-terracotta' : 'text-ink-faint group-hover:text-ink'}`}>
          अ
        </span>
      </span>
      <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ink shadow-2xs border border-line">
        {isHindi ? 'हिन्दी' : 'EN'}
      </span>
    </button>
  );
}

/** Compact language picker for the header. */
export function LanguageSwitch({ className = '' }) {
  const { lang, setLang, t } = useLang();
  return (
    <label className={`inline-flex items-center ${className}`}>
      <span className="sr-only">{t('nav.language')}</span>
      <select className="min-h-11 rounded-xl border border-line bg-white px-2 text-sm font-semibold text-ink" value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('nav.language')}>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}
