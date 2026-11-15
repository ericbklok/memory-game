// Rich 2D Illustrated SVG Tile Renderer & 530+ Non-Repeating Puzzle Bank for Eagle Eye (眼明手快尋寶)
// Strictly ES2019 compatible (no optional chaining or nullish coalescing)

export const EAGLE_THEME_META = {
  vehicles: {
    id: 'vehicles',
    icon: '🚗',
    zh: '名車與港溫交通',
    en: '2D Cars & Transit'
  },
  pets: {
    id: 'pets',
    icon: '🐶',
    zh: '萌寵毛孩樂園',
    en: 'Cute Pets & Animals'
  },
  nature_critters: {
    id: 'nature_critters',
    icon: '🦉',
    zh: '花鳥魚蟲池畔',
    en: 'Birds & Pond Life'
  },
  cozy_world: {
    id: 'cozy_world',
    icon: '🏡',
    zh: '茶座花園與小屋',
    en: 'Cozy Garden & Tea'
  }
};

function wrapSvg(bgColor, groundSvg, innerSvg, flipX) {
  const content = flipX
    ? '<g transform="translate(100,0) scale(-1,1)">' + innerSvg + '</g>'
    : '<g>' + innerSvg + '</g>';
  return (
    '<svg class="eagle-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="2" y="2" width="96" height="96" rx="16" fill="' + bgColor + '" />' +
    (groundSvg || '') +
    content +
    '</svg>'
  );
}

function drawRoadBackdrop(skyHex) {
  return (
    '<rect x="2" y="2" width="96" height="96" rx="16" fill="' + skyHex + '" />' +
    '<circle cx="80" cy="20" r="8" fill="#FFE082" opacity="0.85" />' +
    '<path d="M16 24 Q22 18 29 23 Q35 19 40 25 Z" fill="#FFFFFF" opacity="0.85" />' +
    '<path d="M6 74 L94 74 L94 88 Q94 96 86 96 L14 96 Q6 96 6 88 Z" fill="#546373" />' +
    '<line x1="14" y1="84" x2="28" y2="84" stroke="#FFE082" stroke-width="2.5" stroke-linecap="round" />' +
    '<line x1="43" y1="84" x2="57" y2="84" stroke="#FFE082" stroke-width="2.5" stroke-linecap="round" />' +
    '<line x1="72" y1="84" x2="86" y2="84" stroke="#FFE082" stroke-width="2.5" stroke-linecap="round" />'
  );
}

function drawWaterBackdrop(skyHex) {
  return (
    '<rect x="2" y="2" width="96" height="96" rx="16" fill="' + skyHex + '" />' +
    '<path d="M18 21 Q25 15 32 20 Q38 16 44 21 Z" fill="#FFFFFF" opacity="0.85" />' +
    '<path d="M4 68 Q20 63 36 68 T68 68 T96 68 L96 86 Q96 96 86 96 L14 96 Q4 96 4 86 Z" fill="#4FA8D6" />' +
    '<path d="M14 78 Q26 74 38 78 T62 78 T86 78" fill="none" stroke="#B3E5FC" stroke-width="2.4" stroke-linecap="round" />' +
    '<path d="M20 88 Q34 84 48 88 T78 88" fill="none" stroke="#E1F5FE" stroke-width="2" stroke-linecap="round" />'
  );
}

function drawMeadowBackdrop(skyHex, grassHex) {
  return (
    '<rect x="2" y="2" width="96" height="96" rx="16" fill="' + skyHex + '" />' +
    '<ellipse cx="50" cy="84" rx="44" ry="13" fill="' + grassHex + '" />'
  );
}

/* 1. Classic 2D Car / Beetle / Coupe */
function svgCar(s) {
  const sky = s.sky || '#EBF6FF';
  const body = s.body || '#E53935';
  const trim = s.trim || '#FFFFFF';
  const rim = s.rim || '#CFD8DC';
  const light = s.headlightOn ? '#FFD54F' : '#B0BEC5';
  const beam = s.headlightOn
    ? '<polygon points="84,54 97,47 97,63" fill="#FFF59D" opacity="0.72" />'
    : '';
  const rack = s.roofRack
    ? '<line x1="35" y1="30" x2="63" y2="30" stroke="#37474F" stroke-width="2.4" />' +
      '<rect x="39" y="20" width="20" height="9" rx="2.5" fill="' + (s.rackColor || '#D84315') + '" stroke="#263238" stroke-width="2" />' +
      '<line x1="49" y1="20" x2="49" y2="29" stroke="#FFE082" stroke-width="2" />'
    : '';
  const flag = s.antennaFlag
    ? '<line x1="26" y1="36" x2="22" y2="20" stroke="#37474F" stroke-width="2" />' +
      '<polygon points="22,20 11,24 22,28" fill="' + (s.flagColor || '#FFB300') + '" stroke="#263238" stroke-width="1.5" />'
    : '';
  const cabin = s.convertible
    ? '<path d="M58 47 L66 35 L70 47 Z" fill="#B3E5FC" stroke="#263238" stroke-width="2.2" stroke-linejoin="round" />' +
      '<rect x="34" y="40" width="12" height="8" rx="3" fill="#5D4037" stroke="#263238" stroke-width="2" />'
    : '<path d="M27 48 C31 32, 63 31, 70 48 Z" fill="' + body + '" stroke="#263238" stroke-width="2.4" stroke-linejoin="round" />' +
      '<path d="M33 47 C35 36, 46 35, 47 47 Z" fill="#D7F0FF" stroke="#263238" stroke-width="2" />' +
      '<path d="M50 47 C51 35, 61 36, 65 47 Z" fill="#D7F0FF" stroke="#263238" stroke-width="2" />';
  const stripe = s.doorStripe
    ? '<rect x="22" y="56" width="54" height="5" rx="2" fill="' + trim + '" />' +
      '<circle cx="49" cy="58.5" r="5.5" fill="#FFFFFF" stroke="#263238" stroke-width="1.8" />' +
      '<circle cx="49" cy="58.5" r="2.2" fill="' + body + '" />'
    : '<line x1="46" y1="53" x2="53" y2="53" stroke="#263238" stroke-width="2.2" stroke-linecap="round" />';

  const inner =
    beam +
    rack +
    flag +
    cabin +
    '<path d="M14 58 C14 49, 22 47, 30 47 L69 47 C79 47, 86 52, 86 60 L86 66 C86 69, 83 70, 79 70 L20 70 C16 70, 14 68, 14 64 Z" fill="' +
    body +
    '" stroke="#263238" stroke-width="2.5" stroke-linejoin="round" />' +
    stripe +
    '<ellipse cx="83" cy="56" rx="3.2" ry="4.5" fill="' + light + '" stroke="#263238" stroke-width="1.8" />' +
    '<rect x="12" y="55" width="4" height="7" rx="1.5" fill="#FF5252" stroke="#263238" stroke-width="1.6" />' +
    '<rect x="11" y="65" width="9" height="4.5" rx="2" fill="#ECEFF1" stroke="#263238" stroke-width="1.8" />' +
    '<rect x="80" y="65" width="9" height="4.5" rx="2" fill="#ECEFF1" stroke="#263238" stroke-width="1.8" />' +
    '<circle cx="31" cy="71" r="9.5" fill="#263238" />' +
    '<circle cx="31" cy="71" r="5.2" fill="' + rim + '" />' +
    '<circle cx="31" cy="71" r="2" fill="#263238" />' +
    '<circle cx="68" cy="71" r="9.5" fill="#263238" />' +
    '<circle cx="68" cy="71" r="5.2" fill="' + rim + '" />' +
    '<circle cx="68" cy="71" r="2" fill="#263238" />';

  const content = s.flip
    ? '<g transform="translate(100,0) scale(-1,1)">' + inner + '</g>'
    : '<g>' + inner + '</g>';
  return (
    '<svg class="eagle-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    drawRoadBackdrop(sky) +
    content +
    '</svg>'
  );
}

/* 2. HK Taxi & City Van */
function svgTaxi(s) {
  const body = s.body || '#D32F2F';
  const signFill = s.signLit ? '#FFD54F' : '#546E7A';
  const rays = s.signLit
    ? '<line x1="49" y1="18" x2="49" y2="13" stroke="#FFA000" stroke-width="2.2" stroke-linecap="round" />' +
      '<line x1="39" y1="21" x2="35" y2="17" stroke="#FFA000" stroke-width="2.2" stroke-linecap="round" />' +
      '<line x1="59" y1="21" x2="63" y2="17" stroke="#FFA000" stroke-width="2.2" stroke-linecap="round" />'
    : '';
  const badge = s.doorBadge
    ? '<circle cx="50" cy="59" r="5.2" fill="#FFFDF7" stroke="#263238" stroke-width="1.8" />' +
      '<path d="M47 59 L53 59 M50 56 L50 62" stroke="' + body + '" stroke-width="2" stroke-linecap="round" />'
    : '';
  const rim = s.goldRim ? '#FFB300' : '#ECEFF1';
  const bumper = s.yellowBumper ? '#FFD54F' : '#CFD8DC';

  const inner =
    rays +
    '<rect x="41" y="23" width="16" height="7" rx="3" fill="' + signFill + '" stroke="#263238" stroke-width="2" />' +
    '<path d="M25 48 L32 30 L65 30 L73 48 Z" fill="#ECEFF1" stroke="#263238" stroke-width="2.4" stroke-linejoin="round" />' +
    '<polygon points="34,46 38,34 48,34 48,46" fill="#B3E5FC" stroke="#263238" stroke-width="1.8" />' +
    '<polygon points="51,46 51,34 62,34 68,46" fill="#B3E5FC" stroke="#263238" stroke-width="1.8" />' +
    '<rect x="13" y="48" width="74" height="22" rx="6" fill="' + body + '" stroke="#263238" stroke-width="2.5" />' +
    '<rect x="15" y="51" width="70" height="4" fill="#ECEFF1" />' +
    badge +
    '<rect x="82" y="54" width="5" height="7" rx="1.5" fill="#FFF176" stroke="#263238" stroke-width="1.8" />' +
    '<rect x="13" y="54" width="4" height="7" rx="1.5" fill="#FF8A80" stroke="#263238" stroke-width="1.8" />' +
    '<rect x="10" y="65" width="9" height="5" rx="2" fill="' + bumper + '" stroke="#263238" stroke-width="1.8" />' +
    '<rect x="81" y="65" width="9" height="5" rx="2" fill="' + bumper + '" stroke="#263238" stroke-width="1.8" />' +
    '<circle cx="30" cy="71" r="9" fill="#263238" />' +
    '<circle cx="30" cy="71" r="4.8" fill="' + rim + '" />' +
    '<circle cx="70" cy="71" r="9" fill="#263238" />' +
    '<circle cx="70" cy="71" r="4.8" fill="' + rim + '" />';

  const content = s.flip
    ? '<g transform="translate(100,0) scale(-1,1)">' + inner + '</g>'
    : '<g>' + inner + '</g>';
  return (
    '<svg class="eagle-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    drawRoadBackdrop(s.sky || '#FFF8E7') +
    content +
    '</svg>'
  );
}

/* 3. HK Double-Decker Tram ("Ding Ding") & City Bus */
function svgTramBus(s) {
  const body = s.body || '#2E7D32';
  const band = s.band || '#FFF8E1';
  const routeBox = s.routeColor || '#FFB300';
  const pole = s.hasPole
    ? '<line x1="46" y1="22" x2="34" y2="11" stroke="#37474F" stroke-width="2.4" stroke-linecap="round" />' +
      '<line x1="29" y1="11" x2="40" y2="11" stroke="#D84315" stroke-width="2.6" stroke-linecap="round" />'
    : '<rect x="38" y="16" width="22" height="5" rx="2.5" fill="#CFD8DC" stroke="#263238" stroke-width="1.8" />';

  const topWins = s.threeTopWins
    ? '<rect x="25" y="27" width="14" height="11" rx="2" fill="#D7F0FF" stroke="#263238" stroke-width="1.8" />' +
      '<rect x="43" y="27" width="14" height="11" rx="2" fill="#D7F0FF" stroke="#263238" stroke-width="1.8" />' +
      '<rect x="61" y="27" width="14" height="11" rx="2" fill="#D7F0FF" stroke="#263238" stroke-width="1.8" />'
    : '<rect x="23" y="27" width="11" height="11" rx="2" fill="#D7F0FF" stroke="#263238" stroke-width="1.8" />' +
      '<rect x="37" y="27" width="11" height="11" rx="2" fill="#D7F0FF" stroke="#263238" stroke-width="1.8" />' +
      '<rect x="51" y="27" width="11" height="11" rx="2" fill="#D7F0FF" stroke="#263238" stroke-width="1.8" />' +
      '<rect x="65" y="27" width="11" height="11" rx="2" fill="#D7F0FF" stroke="#263238" stroke-width="1.8" />';

  const lamp = s.twinLights
    ? '<circle cx="75" cy="63" r="3" fill="#FFE082" stroke="#263238" stroke-width="1.6" />' +
      '<circle cx="67" cy="63" r="3" fill="#FFE082" stroke="#263238" stroke-width="1.6" />'
    : '<circle cx="74" cy="63" r="3.8" fill="#FFE082" stroke="#263238" stroke-width="1.8" />';

  const inner =
    pole +
    '<rect x="19" y="22" width="62" height="48" rx="6" fill="' + body + '" stroke="#263238" stroke-width="2.5" />' +
    '<rect x="20" y="42" width="60" height="6" fill="' + band + '" />' +
    topWins +
    '<rect x="66" y="43" width="12" height="5" rx="1.5" fill="' + routeBox + '" stroke="#263238" stroke-width="1.5" />' +
    '<rect x="24" y="51" width="13" height="16" rx="2" fill="#FFF8E1" stroke="#263238" stroke-width="1.8" />' +
    '<rect x="41" y="51" width="11" height="11" rx="2" fill="#D7F0FF" stroke="#263238" stroke-width="1.8" />' +
    '<rect x="55" y="51" width="11" height="11" rx="2" fill="#D7F0FF" stroke="#263238" stroke-width="1.8" />' +
    lamp +
    '<circle cx="33" cy="72" r="7.5" fill="#263238" />' +
    '<circle cx="33" cy="72" r="3.6" fill="#CFD8DC" />' +
    '<circle cx="67" cy="72" r="7.5" fill="#263238" />' +
    '<circle cx="67" cy="72" r="3.6" fill="#CFD8DC" />';

  const content = s.flip
    ? '<g transform="translate(100,0) scale(-1,1)">' + inner + '</g>'
    : '<g>' + inner + '</g>';
  return (
    '<svg class="eagle-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    drawRoadBackdrop(s.sky || '#F2F9F1') +
    content +
    '</svg>'
  );
}

/* 4. Star Ferry & Striped Sailboat */
function svgBoat(s) {
  let inner = '';
  if (s.sailboat) {
    const hull = s.hull || '#D84315';
    const sail1 = s.sail1 || '#FFF8E1';
    const sail2 = s.sail2 || '#FF7043';
    const flagFill = s.flagColor || '#FFD54F';
    const stripe = s.sailStripe
      ? '<path d="M46 37 L24 37 L20 45 L46 45 Z" fill="' + sail2 + '" />'
      : '';
    const portholes = s.twoPortholes
      ? '<circle cx="40" cy="63" r="2.8" fill="#FFF59D" stroke="#263238" stroke-width="1.5" />' +
        '<circle cx="58" cy="63" r="2.8" fill="#FFF59D" stroke="#263238" stroke-width="1.5" />'
      : '<circle cx="35" cy="63" r="2.6" fill="#FFF59D" stroke="#263238" stroke-width="1.5" />' +
        '<circle cx="50" cy="63" r="2.6" fill="#FFF59D" stroke="#263238" stroke-width="1.5" />' +
        '<circle cx="65" cy="63" r="2.6" fill="#FFF59D" stroke="#263238" stroke-width="1.5" />';

    inner =
      '<line x1="49" y1="15" x2="49" y2="56" stroke="#4E342E" stroke-width="3" stroke-linecap="round" />' +
      '<polygon points="49,15 64,19 49,24" fill="' + flagFill + '" stroke="#263238" stroke-width="1.6" />' +
      '<polygon points="46,21 16,53 46,53" fill="' + sail1 + '" stroke="#263238" stroke-width="2.2" stroke-linejoin="round" />' +
      stripe +
      '<polygon points="52,25 80,53 52,53" fill="' + sail2 + '" stroke="#263238" stroke-width="2.2" stroke-linejoin="round" />' +
      '<path d="M16 56 L84 56 L74 70 L26 70 Z" fill="' + hull + '" stroke="#263238" stroke-width="2.4" stroke-linejoin="round" />' +
      portholes;
  } else {
    const hull = s.hull || '#1B5E20';
    const deck = s.deck || '#FFF8E1';
    const smoke = s.hasSmoke
      ? '<circle cx="43" cy="18" r="4.2" fill="#FFFFFF" opacity="0.92" />' +
        '<circle cx="34" cy="14" r="5.2" fill="#FFFFFF" opacity="0.82" />'
      : '';
    const emblem = s.lifebuoy
      ? '<circle cx="71" cy="61" r="4.5" fill="#FFFFFF" stroke="#E53935" stroke-width="2.6" />'
      : '<polygon points="71,56 72.6,59.5 76.4,60 73.6,62.6 74.3,66.3 71,64.5 67.7,66.3 68.4,62.6 65.6,60 69.4,59.5" fill="#FFD54F" stroke="#263238" stroke-width="1.2" />';

    inner =
      smoke +
      '<rect x="44" y="23" width="11" height="12" rx="2" fill="#E65100" stroke="#263238" stroke-width="2" />' +
      '<rect x="44" y="23" width="11" height="4" fill="#263238" />' +
      '<rect x="24" y="35" width="52" height="18" rx="4" fill="' + deck + '" stroke="#263238" stroke-width="2.2" />' +
      '<rect x="29" y="39" width="9" height="8" rx="1.5" fill="#B3E5FC" stroke="#263238" stroke-width="1.6" />' +
      '<rect x="42" y="39" width="9" height="8" rx="1.5" fill="#B3E5FC" stroke="#263238" stroke-width="1.6" />' +
      '<rect x="55" y="39" width="9" height="8" rx="1.5" fill="#B3E5FC" stroke="#263238" stroke-width="1.6" />' +
      '<path d="M14 53 L86 53 L77 70 L23 70 Z" fill="' + hull + '" stroke="#263238" stroke-width="2.5" stroke-linejoin="round" />' +
      emblem;
  }

  const content = s.flip
    ? '<g transform="translate(100,0) scale(-1,1)">' + inner + '</g>'
    : '<g>' + inner + '</g>';
  return (
    '<svg class="eagle-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    drawWaterBackdrop(s.sky || '#E8F6FF') +
    content +
    '</svg>'
  );
}

/* 5. Cute 2D Dog / Puppy (Shiba, Golden, Dalmatian, Corgi) */
function svgDog(s) {
  const coat = s.coat || '#E69A45';
  const muzzle = s.muzzle || '#FFF8E7';
  const collar = s.collar || '#D32F2F';
  const leftEar = s.floppyEar
    ? '<path d="M26 34 C16 36, 14 50, 24 52 C28 52, 31 44, 33 36 Z" fill="' + coat + '" stroke="#2A211B" stroke-width="2.4" stroke-linejoin="round" />'
    : '<polygon points="24,18 19,42 38,32" fill="' + coat + '" stroke="#2A211B" stroke-width="2.4" stroke-linejoin="round" />' +
      '<polygon points="26,23 23,37 34,31" fill="#FFCCBC" />';
  const rightEar =
    '<polygon points="76,18 81,42 62,32" fill="' + coat + '" stroke="#2A211B" stroke-width="2.4" stroke-linejoin="round" />' +
    '<polygon points="74,23 77,37 66,31" fill="#FFCCBC" />';

  const patch = s.eyePatch
    ? '<ellipse cx="38" cy="47" rx="8.5" ry="7.5" fill="#5D4037" opacity="0.85" />'
    : '';

  const eyes = s.wink
    ? '<circle cx="38" cy="47" r="4.2" fill="#2A211B" />' +
      '<circle cx="36.6" cy="45.5" r="1.5" fill="#FFFFFF" />' +
      '<path d="M57 48 Q62 42 67 48" fill="none" stroke="#2A211B" stroke-width="3" stroke-linecap="round" />'
    : '<circle cx="38" cy="47" r="4.2" fill="#2A211B" />' +
      '<circle cx="36.6" cy="45.5" r="1.5" fill="#FFFFFF" />' +
      '<circle cx="62" cy="47" r="4.2" fill="#2A211B" />' +
      '<circle cx="60.6" cy="45.5" r="1.5" fill="#FFFFFF" />';

  const mouth = s.tongue
    ? '<path d="M46 62 Q50 71 54 62 Z" fill="#FF708D" stroke="#2A211B" stroke-width="1.8" />' +
      '<path d="M43 60 Q46.5 64 50 60 Q53.5 64 57 60" fill="none" stroke="#2A211B" stroke-width="2.2" stroke-linecap="round" />'
    : '<path d="M43 60 Q46.5 64 50 60 Q53.5 64 57 60" fill="none" stroke="#2A211B" stroke-width="2.3" stroke-linecap="round" />';

  const charm = s.heartTag
    ? '<path d="M50 85 C45 81, 44 76, 47.5 76 C49 76, 50 77.5, 50 77.5 C50 77.5, 51 76, 52.5 76 C56 76, 55 81, 50 85 Z" fill="#FF5252" stroke="#2A211B" stroke-width="1.6" />'
    : '<circle cx="50" cy="80" r="4.5" fill="#FFD54F" stroke="#2A211B" stroke-width="1.8" />' +
      '<line x1="47" y1="80" x2="53" y2="80" stroke="#2A211B" stroke-width="1.4" />';

  const inner =
    '<path d="M30 88 C30 72, 70 72, 70 88 Z" fill="' + coat + '" stroke="#2A211B" stroke-width="2.4" />' +
    '<ellipse cx="50" cy="84" rx="12" ry="6" fill="' + muzzle + '" />' +
    leftEar +
    rightEar +
    '<ellipse cx="50" cy="50" rx="25" ry="22" fill="' + coat + '" stroke="#2A211B" stroke-width="2.5" />' +
    '<ellipse cx="50" cy="57" rx="14" ry="11" fill="' + muzzle + '" />' +
    patch +
    eyes +
    '<ellipse cx="50" cy="54" rx="4.6" ry="3.4" fill="#2A211B" />' +
    mouth +
    '<rect x="33" y="71" width="34" height="6.5" rx="3.2" fill="' + collar + '" stroke="#2A211B" stroke-width="2" />' +
    charm;

  return wrapSvg(s.bg || '#FFF8E8', drawMeadowBackdrop(s.bg || '#FFF8E8', '#DCECCB'), inner, false);
}

/* 6. Cute 2D Cat / Kitten */
function svgCat(s) {
  const coat = s.coat || '#FF9E43';
  const tailX = s.tailLeft
    ? '<path d="M27 83 C14 78, 13 58, 22 55 C26 54, 27 60, 23 63 C19 66, 21 75, 30 78" fill="none" stroke="' + coat + '" stroke-width="7" stroke-linecap="round" />' +
      '<path d="M27 83 C14 78, 13 58, 22 55" fill="none" stroke="#2A211B" stroke-width="2.2" stroke-linecap="round" />'
    : '<path d="M73 83 C86 78, 87 58, 78 55 C74 54, 73 60, 77 63 C81 66, 79 75, 70 78" fill="none" stroke="' + coat + '" stroke-width="7" stroke-linecap="round" />' +
      '<path d="M73 83 C86 78, 87 58, 78 55" fill="none" stroke="#2A211B" stroke-width="2.2" stroke-linecap="round" />';

  const stripes = s.stripes
    ? '<line x1="50" y1="30" x2="50" y2="38" stroke="#8D4E15" stroke-width="2.6" stroke-linecap="round" />' +
      '<line x1="44" y1="31" x2="46" y2="38" stroke="#8D4E15" stroke-width="2.4" stroke-linecap="round" />' +
      '<line x1="56" y1="31" x2="54" y2="38" stroke="#8D4E15" stroke-width="2.4" stroke-linecap="round" />'
    : '';

  const eyes = s.wink
    ? '<circle cx="38" cy="49" r="4.2" fill="#2A211B" />' +
      '<circle cx="36.6" cy="47.5" r="1.5" fill="#FFFFFF" />' +
      '<path d="M57 50 Q62 44 67 50" fill="none" stroke="#2A211B" stroke-width="2.8" stroke-linecap="round" />'
    : '<circle cx="38" cy="49" r="4.2" fill="#2A211B" />' +
      '<circle cx="36.6" cy="47.5" r="1.5" fill="#FFFFFF" />' +
      '<circle cx="62" cy="49" r="4.2" fill="#2A211B" />' +
      '<circle cx="60.6" cy="47.5" r="1.5" fill="#FFFFFF" />';

  const blush = s.blush
    ? '<ellipse cx="32" cy="56" rx="4.5" ry="2.6" fill="#FF8A80" opacity="0.72" />' +
      '<ellipse cx="68" cy="56" rx="4.5" ry="2.6" fill="#FF8A80" opacity="0.72" />'
    : '';

  const neckwear = s.bowtie
    ? '<polygon points="50,76 38,70 38,82" fill="' + (s.bowColor || '#E53935') + '" stroke="#2A211B" stroke-width="1.8" />' +
      '<polygon points="50,76 62,70 62,82" fill="' + (s.bowColor || '#E53935') + '" stroke="#2A211B" stroke-width="1.8" />' +
      '<circle cx="50" cy="76" r="3.4" fill="#FFD54F" stroke="#2A211B" stroke-width="1.6" />'
    : '<rect x="35" y="72" width="30" height="5.5" rx="2.8" fill="' + (s.bowColor || '#1E88E5') + '" stroke="#2A211B" stroke-width="1.8" />' +
      '<circle cx="50" cy="79" r="4" fill="#FFD54F" stroke="#2A211B" stroke-width="1.6" />';

  const inner =
    tailX +
    '<path d="M31 88 C31 72, 69 72, 69 88 Z" fill="' + coat + '" stroke="#2A211B" stroke-width="2.4" />' +
    '<polygon points="24,18 22,43 41,31" fill="' + coat + '" stroke="#2A211B" stroke-width="2.4" stroke-linejoin="round" />' +
    '<polygon points="26,23 25,38 37,31" fill="#FFAB91" />' +
    '<polygon points="76,18 78,43 59,31" fill="' + coat + '" stroke="#2A211B" stroke-width="2.4" stroke-linejoin="round" />' +
    '<polygon points="74,23 75,38 63,31" fill="#FFAB91" />' +
    '<ellipse cx="50" cy="51" rx="24" ry="21" fill="' + coat + '" stroke="#2A211B" stroke-width="2.5" />' +
    stripes +
    eyes +
    blush +
    '<polygon points="47,55 53,55 50,59" fill="#FF708D" stroke="#2A211B" stroke-width="1.5" />' +
    '<path d="M44 61 Q47 64 50 60 Q53 64 56 61" fill="none" stroke="#2A211B" stroke-width="2" stroke-linecap="round" />' +
    '<line x1="18" y1="52" x2="30" y2="54" stroke="#2A211B" stroke-width="1.8" stroke-linecap="round" />' +
    '<line x1="18" y1="58" x2="30" y2="58" stroke="#2A211B" stroke-width="1.8" stroke-linecap="round" />' +
    '<line x1="82" y1="52" x2="70" y2="54" stroke="#2A211B" stroke-width="1.8" stroke-linecap="round" />' +
    '<line x1="82" y1="58" x2="70" y2="58" stroke="#2A211B" stroke-width="1.8" stroke-linecap="round" />' +
    neckwear;

  return wrapSvg(s.bg || '#FDF2F8', drawMeadowBackdrop(s.bg || '#FDF2F8', '#F8BBD0'), inner, false);
}

/* 7. Giant Panda & Honey Bear */
function svgPandaBear(s) {
  const isPanda = !!s.isPanda;
  const fur = isPanda ? '#FFFFFF' : (s.fur || '#A1663E');
  const earFill = isPanda ? '#263238' : fur;
  const patches = isPanda
    ? '<ellipse cx="38" cy="48" rx="7.5" ry="6.5" transform="rotate(-15 38 48)" fill="#263238" />' +
      '<ellipse cx="62" cy="48" rx="7.5" ry="6.5" transform="rotate(15 62 48)" fill="#263238" />'
    : '';
  const eyeDot = isPanda ? '#FFFFFF' : '#263238';
  const eyes = s.wink
    ? '<circle cx="38" cy="48" r="3" fill="' + eyeDot + '" />' +
      '<path d="M58 48 Q62 43 66 48" fill="none" stroke="' + eyeDot + '" stroke-width="2.6" stroke-linecap="round" />'
    : '<circle cx="38" cy="48" r="3" fill="' + eyeDot + '" />' +
      '<circle cx="62" cy="48" r="3" fill="' + eyeDot + '" />';

  const prop = s.bamboo
    ? '<line x1="76" y1="86" x2="82" y2="48" stroke="#2E7D32" stroke-width="3.4" stroke-linecap="round" />' +
      '<ellipse cx="74" cy="56" rx="6" ry="2.8" transform="rotate(-25 74 56)" fill="#4CAF50" stroke="#1B5E20" stroke-width="1.4" />' +
      '<ellipse cx="86" cy="63" rx="6" ry="2.8" transform="rotate(25 86 63)" fill="#4CAF50" stroke="#1B5E20" stroke-width="1.4" />'
    : '';

  const bow = s.headBow
    ? '<polygon points="33,24 24,19 24,29" fill="' + (s.bowColor || '#E91E63') + '" stroke="#263238" stroke-width="1.6" />' +
      '<polygon points="33,24 42,19 42,29" fill="' + (s.bowColor || '#E91E63') + '" stroke="#263238" stroke-width="1.6" />' +
      '<circle cx="33" cy="24" r="2.8" fill="#FFD54F" stroke="#263238" stroke-width="1.4" />'
    : '';

  const scarf = s.scarf
    ? '<rect x="33" y="71" width="34" height="7" rx="3.5" fill="' + (s.scarfColor || '#E53935') + '" stroke="#263238" stroke-width="1.8" />' +
      '<rect x="53" y="75" width="8" height="12" rx="2.5" fill="' + (s.scarfColor || '#E53935') + '" stroke="#263238" stroke-width="1.8" />'
    : '';

  const inner =
    '<path d="M28 88 C28 70, 72 70, 72 88 Z" fill="' + (isPanda ? '#263238' : fur) + '" stroke="#263238" stroke-width="2.4" />' +
    '<circle cx="28" cy="27" r="9.5" fill="' + earFill + '" stroke="#263238" stroke-width="2.4" />' +
    '<circle cx="72" cy="27" r="9.5" fill="' + earFill + '" stroke="#263238" stroke-width="2.4" />' +
    '<ellipse cx="50" cy="51" rx="25" ry="22" fill="' + fur + '" stroke="#263238" stroke-width="2.5" />' +
    (isPanda ? '' : '<ellipse cx="50" cy="57" rx="11" ry="8.5" fill="#FFE0B2" />') +
    patches +
    eyes +
    '<ellipse cx="50" cy="55" rx="4.2" ry="3" fill="' + (s.redNose ? '#E53935' : '#263238') + '" />' +
    '<path d="M45 61 Q50 65 55 61" fill="none" stroke="#263238" stroke-width="2.2" stroke-linecap="round" />' +
    scarf +
    bow +
    prop;

  return wrapSvg(s.bg || '#EBF7EE', drawMeadowBackdrop(s.bg || '#EBF7EE', '#C8E6C9'), inner, false);
}

/* 8. Cute 2D Bunny Rabbit */
function svgBunny(s) {
  const fur = s.fur || '#FFFFFF';
  const leftEar = s.lopEar
    ? '<path d="M38 35 C22 30, 14 45, 22 53 C27 57, 34 46, 40 38 Z" fill="' + fur + '" stroke="#2A211B" stroke-width="2.4" stroke-linejoin="round" />'
    : '<ellipse cx="38" cy="23" rx="7" ry="17" fill="' + fur + '" stroke="#2A211B" stroke-width="2.4" />' +
      '<ellipse cx="38" cy="24" rx="3.5" ry="11" fill="#F8BBD0" />';

  const rightEar =
    '<ellipse cx="62" cy="23" rx="7" ry="17" fill="' + fur + '" stroke="#2A211B" stroke-width="2.4" />' +
    '<ellipse cx="62" cy="24" rx="3.5" ry="11" fill="#F8BBD0" />';

  const eyes = s.wink
    ? '<circle cx="39" cy="53" r="3.8" fill="#2A211B" />' +
      '<path d="M57 53 Q61 48 65 53" fill="none" stroke="#2A211B" stroke-width="2.6" stroke-linecap="round" />'
    : '<circle cx="39" cy="53" r="3.8" fill="#2A211B" />' +
      '<circle cx="61" cy="53" r="3.8" fill="#2A211B" />';

  const carrot = s.carrot
    ? '<polygon points="62,86 82,70 86,77" fill="#FF7043" stroke="#2A211B" stroke-width="1.8" stroke-linejoin="round" />' +
      '<path d="M84 73 L91 68 M85 75 L92 74" stroke="#43A047" stroke-width="2.2" stroke-linecap="round" />'
    : '';

  const bow = s.earBow
    ? '<circle cx="62" cy="36" r="4.5" fill="' + (s.bowColor || '#EC407A') + '" stroke="#2A211B" stroke-width="1.6" />'
    : '<polygon points="50,77 40,72 40,82" fill="' + (s.bowColor || '#EC407A') + '" stroke="#2A211B" stroke-width="1.6" />' +
      '<polygon points="50,77 60,72 60,82" fill="' + (s.bowColor || '#EC407A') + '" stroke="#2A211B" stroke-width="1.6" />';

  const inner =
    '<path d="M32 89 C32 73, 68 73, 68 89 Z" fill="' + fur + '" stroke="#2A211B" stroke-width="2.4" />' +
    leftEar +
    rightEar +
    '<ellipse cx="50" cy="56" rx="23" ry="19" fill="' + fur + '" stroke="#2A211B" stroke-width="2.5" />' +
    eyes +
    '<ellipse cx="32" cy="59" rx="4" ry="2.4" fill="#F48FB1" opacity="0.75" />' +
    '<ellipse cx="68" cy="59" rx="4" ry="2.4" fill="#F48FB1" opacity="0.75" />' +
    '<ellipse cx="50" cy="58" rx="3.4" ry="2.5" fill="#EC407A" />' +
    '<path d="M45 63 Q50 67 55 63" fill="none" stroke="#2A211B" stroke-width="2" stroke-linecap="round" />' +
    bow +
    carrot;

  return wrapSvg(s.bg || '#FFF3F8', drawMeadowBackdrop(s.bg || '#FFF3F8', '#DCEDC8'), inner, false);
}

/* 9. Cute 2D Duckling, Owl & Penguin */
function svgBird(s) {
  if (s.kind === 'owl') {
    const body = s.body || '#8D6E63';
    const belly = s.belly || '#FFF8E1';
    const eyes = s.wink
      ? '<circle cx="40" cy="41" r="8" fill="#FFFFFF" stroke="#2A211B" stroke-width="2.2" />' +
        '<circle cx="40" cy="41" r="3.8" fill="#2A211B" />' +
        '<circle cx="60" cy="41" r="8" fill="#FFFFFF" stroke="#2A211B" stroke-width="2.2" />' +
        '<path d="M55 41 Q60 36 65 41" fill="none" stroke="#2A211B" stroke-width="2.6" stroke-linecap="round" />'
      : '<circle cx="40" cy="41" r="8" fill="#FFFFFF" stroke="#2A211B" stroke-width="2.2" />' +
        '<circle cx="40" cy="41" r="3.8" fill="#2A211B" />' +
        '<circle cx="60" cy="41" r="8" fill="#FFFFFF" stroke="#2A211B" stroke-width="2.2" />' +
        '<circle cx="60" cy="41" r="3.8" fill="#2A211B" />';

    const wingR = s.wingUp
      ? '<path d="M71 48 C84 36, 90 48, 76 60 Z" fill="' + body + '" stroke="#2A211B" stroke-width="2.2" />'
      : '<path d="M72 46 C80 54, 78 68, 69 68 Z" fill="' + body + '" stroke="#2A211B" stroke-width="2.2" />';

    const leaf = s.branchLeaf
      ? '<ellipse cx="83" cy="77" rx="6.5" ry="3.5" transform="rotate(-25 83 77)" fill="#66BB6A" stroke="#2A211B" stroke-width="1.6" />'
      : '';

    const inner =
      '<line x1="14" y1="82" x2="86" y2="82" stroke="#5D4037" stroke-width="5" stroke-linecap="round" />' +
      leaf +
      '<ellipse cx="50" cy="53" rx="23" ry="26" fill="' + body + '" stroke="#2A211B" stroke-width="2.5" />' +
      '<polygon points="30,30 24,19 39,26" fill="' + body + '" stroke="#2A211B" stroke-width="2.2" />' +
      '<polygon points="70,30 76,19 61,26" fill="' + body + '" stroke="#2A211B" stroke-width="2.2" />' +
      '<ellipse cx="50" cy="61" rx="14" ry="14" fill="' + belly + '" />' +
      '<path d="M44 59 Q47 63 50 59 M50 59 Q53 63 56 59 M46 66 Q50 70 54 66" fill="none" stroke="#8D6E63" stroke-width="1.8" stroke-linecap="round" />' +
      '<path d="M28 46 C20 54, 22 68, 31 68 Z" fill="' + body + '" stroke="#2A211B" stroke-width="2.2" />' +
      wingR +
      eyes +
      '<polygon points="46,47 54,47 50,54" fill="#FFB300" stroke="#2A211B" stroke-width="1.8" />';

    return wrapSvg(s.bg || '#EEF7FF', '', inner, false);
  }

  if (s.kind === 'penguin') {
    const coat = s.coat || '#263238';
    const scarf = s.hasScarf
      ? '<rect x="33" y="49" width="34" height="6.5" rx="3" fill="' + (s.scarfColor || '#E53935') + '" stroke="#263238" stroke-width="1.8" />' +
        '<rect x="54" y="53" width="7.5" height="12" rx="2" fill="' + (s.scarfColor || '#E53935') + '" stroke="#263238" stroke-width="1.8" />'
      : '';
    const hat = s.pomHat
      ? '<path d="M34 26 Q50 10 66 26 Z" fill="' + (s.scarfColor || '#E53935') + '" stroke="#263238" stroke-width="2" />' +
        '<circle cx="50" cy="14" r="4.5" fill="#FFFFFF" stroke="#263238" stroke-width="1.6" />'
      : '';
    const wingR = s.wingUp
      ? '<path d="M70 48 C84 36, 88 46, 74 58 Z" fill="' + coat + '" stroke="#263238" stroke-width="2.2" />'
      : '<path d="M71 48 C79 56, 77 70, 69 69 Z" fill="' + coat + '" stroke="#263238" stroke-width="2.2" />';

    const inner =
      '<ellipse cx="41" cy="83" rx="7" ry="3.5" fill="#FFA000" stroke="#263238" stroke-width="1.8" />' +
      '<ellipse cx="59" cy="83" rx="7" ry="3.5" fill="#FFA000" stroke="#263238" stroke-width="1.8" />' +
      '<ellipse cx="50" cy="54" rx="22" ry="28" fill="' + coat + '" stroke="#263238" stroke-width="2.4" />' +
      '<ellipse cx="50" cy="59" rx="14" ry="20" fill="#FFFFFF" />' +
      '<path d="M29 48 C21 56, 23 70, 31 69 Z" fill="' + coat + '" stroke="#263238" stroke-width="2.2" />' +
      wingR +
      '<circle cx="42" cy="37" r="3.2" fill="#FFFFFF" />' +
      '<circle cx="42" cy="37" r="1.8" fill="#263238" />' +
      '<circle cx="58" cy="37" r="3.2" fill="#FFFFFF" />' +
      '<circle cx="58" cy="37" r="1.8" fill="#263238" />' +
      '<polygon points="45,42 55,42 50,48" fill="#FFB300" stroke="#263238" stroke-width="1.6" />' +
      scarf +
      hat;

    return wrapSvg(s.bg || '#E8F6FF', drawMeadowBackdrop(s.bg || '#E8F6FF', '#D4EEFC'), inner, false);
  }

  // Pond Duckling
  const body = s.body || '#FFD54F';
  const tuft = s.tuft
    ? '<path d="M56 22 Q53 13 60 16 Q63 11 65 21" fill="none" stroke="' + body + '" stroke-width="3.5" stroke-linecap="round" />' +
      '<path d="M56 22 Q53 13 60 16 Q63 11 65 21" fill="none" stroke="#2A211B" stroke-width="1.6" stroke-linecap="round" />'
    : '';
  const wing = s.wingUp
    ? '<path d="M44 54 C35 38, 52 36, 56 52 Z" fill="#FFB300" stroke="#2A211B" stroke-width="2.2" />'
    : '<path d="M35 56 C46 49, 58 55, 53 64 C46 67, 36 64, 35 56 Z" fill="#FFB300" stroke="#2A211B" stroke-width="2.2" />';
  const beak = s.openBeak
    ? '<polygon points="73,34 87,31 75,39" fill="#FF7043" stroke="#2A211B" stroke-width="1.8" />' +
      '<polygon points="73,39 86,43 73,43" fill="#FF7043" stroke="#2A211B" stroke-width="1.8" />'
    : '<path d="M73 34 L86 38 L73 42 Z" fill="#FF7043" stroke="#2A211B" stroke-width="2" stroke-linejoin="round" />';

  const inner =
    tuft +
    '<path d="M21 56 C21 46, 34 45, 48 47 C62 48, 73 54, 71 65 C69 72, 26 72, 21 63 Z" fill="' + body + '" stroke="#2A211B" stroke-width="2.4" />' +
    '<circle cx="61" cy="36" r="14" fill="' + body + '" stroke="#2A211B" stroke-width="2.4" />' +
    '<circle cx="65" cy="34" r="3.2" fill="#2A211B" />' +
    '<circle cx="64" cy="32.8" r="1.2" fill="#FFFFFF" />' +
    beak +
    wing;

  const content = s.flip
    ? '<g transform="translate(100,0) scale(-1,1)">' + inner + '</g>'
    : '<g>' + inner + '</g>';
  return (
    '<svg class="eagle-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    drawWaterBackdrop(s.bg || '#EDF8FF') +
    content +
    '</svg>'
  );
}

/* 10. Koi Fish & Lily-Pad Frog */
function svgFishFrog(s) {
  if (s.kind === 'frog') {
    const skin = s.skin || '#66BB6A';
    const crown = s.crown
      ? '<polygon points="39,25 42,14 50,21 58,14 61,25" fill="#FFD54F" stroke="#263238" stroke-width="1.8" stroke-linejoin="round" />'
      : '';
    const eyes = s.wink
      ? '<circle cx="36" cy="33" r="8" fill="' + skin + '" stroke="#263238" stroke-width="2.2" />' +
        '<circle cx="36" cy="33" r="3.8" fill="#263238" />' +
        '<circle cx="64" cy="33" r="8" fill="' + skin + '" stroke="#263238" stroke-width="2.2" />' +
        '<path d="M60 33 Q64 29 68 33" fill="none" stroke="#263238" stroke-width="2.5" stroke-linecap="round" />'
      : '<circle cx="36" cy="33" r="8" fill="' + skin + '" stroke="#263238" stroke-width="2.2" />' +
        '<circle cx="36" cy="33" r="3.8" fill="#263238" />' +
        '<circle cx="64" cy="33" r="8" fill="' + skin + '" stroke="#263238" stroke-width="2.2" />' +
        '<circle cx="64" cy="33" r="3.8" fill="#263238" />';

    const flower = s.lotus
      ? '<circle cx="22" cy="77" r="6" fill="#F48FB1" stroke="#263238" stroke-width="1.6" />' +
        '<circle cx="22" cy="77" r="2.2" fill="#FFD54F" />'
      : '';

    const inner =
      '<ellipse cx="50" cy="80" rx="38" ry="10" fill="#2E7D32" stroke="#1B5E20" stroke-width="2" />' +
      '<polygon points="50,80 88,76 88,84" fill="#B3E5FC" />' +
      flower +
      '<ellipse cx="50" cy="56" rx="26" ry="20" fill="' + skin + '" stroke="#263238" stroke-width="2.4" />' +
      '<ellipse cx="50" cy="63" rx="16" ry="10" fill="#DCEDC8" />' +
      eyes +
      crown +
      '<ellipse cx="32" cy="54" rx="4" ry="2.5" fill="#FF8A80" opacity="0.75" />' +
      '<ellipse cx="68" cy="54" rx="4" ry="2.5" fill="#FF8A80" opacity="0.75" />' +
      '<path d="M38 56 Q50 66 62 56" fill="none" stroke="#263238" stroke-width="2.5" stroke-linecap="round" />';

    return wrapSvg(s.bg || '#E1F5FE', '', inner, false);
  }

  // Koi Fish
  const body = s.body || '#FFFFFF';
  const spotColor = s.spotColor || '#FF5722';
  const fin = s.finColor || '#FFB300';
  const bubbles = s.bubbles
    ? '<circle cx="84" cy="34" r="3.8" fill="#FFFFFF" stroke="#0288D1" stroke-width="1.6" />' +
      '<circle cx="89" cy="24" r="2.6" fill="#FFFFFF" stroke="#0288D1" stroke-width="1.5" />' +
      '<circle cx="81" cy="18" r="2" fill="#FFFFFF" stroke="#0288D1" stroke-width="1.4" />'
    : '';
  const spots = s.threeSpots
    ? '<circle cx="42" cy="48" r="5.5" fill="' + spotColor + '" />' +
      '<circle cx="56" cy="54" r="4.8" fill="' + spotColor + '" />' +
      '<circle cx="66" cy="46" r="4" fill="' + spotColor + '" />'
    : '<circle cx="48" cy="50" r="6.5" fill="' + spotColor + '" />';

  const inner =
    bubbles +
    '<path d="M30 50 L12 36 L17 50 L12 64 Z" fill="' + fin + '" stroke="#263238" stroke-width="2.2" stroke-linejoin="round" />' +
    '<path d="M44 38 Q52 25 62 38 Z" fill="' + fin + '" stroke="#263238" stroke-width="2" />' +
    '<path d="M46 62 Q52 73 60 62 Z" fill="' + fin + '" stroke="#263238" stroke-width="2" />' +
    '<ellipse cx="54" cy="50" rx="26" ry="15" fill="' + body + '" stroke="#263238" stroke-width="2.5" />' +
    spots +
    '<circle cx="70" cy="47" r="3.4" fill="#263238" />' +
    '<circle cx="69" cy="45.8" r="1.2" fill="#FFFFFF" />' +
    '<path d="M62 42 Q59 50 62 58" fill="none" stroke="#263238" stroke-width="2" stroke-linecap="round" />';

  return wrapSvg(s.bg || '#DDF4FF', '', inner, !!s.flip);
}

/* 11. Cozy Cottage & Hot-Air Balloon */
function svgCottageBalloon(s) {
  if (s.kind === 'balloon') {
    const c1 = s.c1 || '#EF5350';
    const c2 = s.c2 || '#FFD54F';
    const flag = s.basketFlag
      ? '<line x1="60" y1="74" x2="72" y2="70" stroke="#263238" stroke-width="1.8" />' +
        '<polygon points="72,70 65,67 66,74" fill="#29B6F6" stroke="#263238" stroke-width="1.3" />'
      : '';
    const band = s.waistBand
      ? '<rect x="27" y="40" width="46" height="6" rx="2" fill="#FFFFFF" stroke="#263238" stroke-width="1.8" />'
      : '';

    const inner =
      '<path d="M16 26 Q22 20 29 25 Z" fill="#FFFFFF" opacity="0.9" />' +
      '<path d="M74 32 Q80 26 87 31 Z" fill="#FFFFFF" opacity="0.9" />' +
      '<line x1="42" y1="63" x2="44" y2="74" stroke="#4E342E" stroke-width="2" />' +
      '<line x1="58" y1="63" x2="56" y2="74" stroke="#4E342E" stroke-width="2" />' +
      '<ellipse cx="50" cy="39" rx="24" ry="26" fill="' + c1 + '" stroke="#263238" stroke-width="2.5" />' +
      '<ellipse cx="50" cy="39" rx="11" ry="26" fill="' + c2 + '" stroke="#263238" stroke-width="2" />' +
      band +
      '<rect x="41" y="74" width="18" height="13" rx="3" fill="#A1663E" stroke="#263238" stroke-width="2.2" />' +
      flag;

    return wrapSvg(s.bg || '#E6F5FF', '', inner, false);
  }

  // Storybook Cottage
  const roof = s.roof || '#D84315';
  const door = s.door || '#1E88E5';
  const wall = s.wall || '#FFFDF7';
  const smoke = s.smoke
    ? '<circle cx="70" cy="17" r="3.8" fill="#FFFFFF" opacity="0.9" />' +
      '<circle cx="76" cy="11" r="4.8" fill="#FFFFFF" opacity="0.8" />'
    : '';
  const attic = s.atticWin
    ? '<circle cx="50" cy="38" r="5" fill="#FFF59D" stroke="#263238" stroke-width="2" />'
    : '';

  const inner =
    smoke +
    '<rect x="64" y="21" width="9" height="16" fill="#8D6E63" stroke="#263238" stroke-width="2" />' +
    '<rect x="24" y="46" width="52" height="37" rx="2" fill="' + wall + '" stroke="#263238" stroke-width="2.4" />' +
    '<polygon points="16,48 50,20 84,48" fill="' + roof + '" stroke="#263238" stroke-width="2.5" stroke-linejoin="round" />' +
    attic +
    '<path d="M43 83 L43 63 C43 58, 57 58, 57 63 L57 83 Z" fill="' + door + '" stroke="#263238" stroke-width="2.2" />' +
    '<circle cx="53.5" cy="72" r="1.6" fill="#FFD54F" />' +
    '<rect x="29" y="56" width="10" height="10" rx="1.5" fill="#B3E5FC" stroke="#263238" stroke-width="1.8" />' +
    '<rect x="61" y="56" width="10" height="10" rx="1.5" fill="#B3E5FC" stroke="#263238" stroke-width="1.8" />';

  return wrapSvg(s.bg || '#EEF9F0', drawMeadowBackdrop(s.bg || '#EEF9F0', '#C5E1A5'), inner, false);
}

/* 12. Potted Flower, Porcelain Teapot, Dim Sum Steamer & Ivory Seal */
function svgFlowerTea(s) {
  if (s.kind === 'flower') {
    const petal = s.petal || '#FF7043';
    const center = s.center || '#FFD54F';
    const leaves = s.twoLeaves
      ? '<ellipse cx="41" cy="57" rx="8" ry="4" transform="rotate(-25 41 57)" fill="#43A047" stroke="#263238" stroke-width="1.8" />' +
        '<ellipse cx="59" cy="55" rx="8" ry="4" transform="rotate(25 59 55)" fill="#43A047" stroke="#263238" stroke-width="1.8" />'
      : '<ellipse cx="41" cy="57" rx="8" ry="4" transform="rotate(-25 41 57)" fill="#43A047" stroke="#263238" stroke-width="1.8" />';
    const bug = s.ladybug
      ? '<circle cx="60" cy="74" r="4.2" fill="#E53935" stroke="#263238" stroke-width="1.5" />' +
        '<circle cx="59" cy="73" r="1" fill="#263238" /><circle cx="61.5" cy="75" r="1" fill="#263238" />'
      : '';

    const inner =
      '<line x1="50" y1="38" x2="50" y2="66" stroke="#2E7D32" stroke-width="3.6" stroke-linecap="round" />' +
      leaves +
      '<circle cx="50" cy="22" r="7.5" fill="' + petal + '" stroke="#263238" stroke-width="1.8" />' +
      '<circle cx="62" cy="30" r="7.5" fill="' + petal + '" stroke="#263238" stroke-width="1.8" />' +
      '<circle cx="58" cy="43" r="7.5" fill="' + petal + '" stroke="#263238" stroke-width="1.8" />' +
      '<circle cx="42" cy="43" r="7.5" fill="' + petal + '" stroke="#263238" stroke-width="1.8" />' +
      '<circle cx="38" cy="30" r="7.5" fill="' + petal + '" stroke="#263238" stroke-width="1.8" />' +
      '<circle cx="50" cy="33" r="8" fill="' + center + '" stroke="#263238" stroke-width="2" />' +
      '<polygon points="34,65 66,65 61,86 39,86" fill="#D86B43" stroke="#263238" stroke-width="2.2" stroke-linejoin="round" />' +
      '<rect x="31" y="61" width="38" height="6" rx="2" fill="#E58058" stroke="#263238" stroke-width="2" />' +
      bug;

    return wrapSvg(s.bg || '#FFFDF2', '', inner, false);
  }

  if (s.kind === 'teapot') {
    const body = s.body || '#FFF8E7';
    const motif = s.motif || '#1E88E5';
    const steam = s.steam
      ? '<path d="M78 36 Q74 28 79 22" fill="none" stroke="#90CAF9" stroke-width="2.4" stroke-linecap="round" />' +
        '<path d="M85 39 Q81 31 86 25" fill="none" stroke="#90CAF9" stroke-width="2.2" stroke-linecap="round" />'
      : '';
    const dot = s.flowerDot
      ? '<circle cx="50" cy="58" r="6" fill="' + motif + '" />' +
        '<circle cx="50" cy="58" r="2.2" fill="#FFD54F" />'
      : '<rect x="37" y="55" width="26" height="5" rx="2.5" fill="' + motif + '" />';

    const inner =
      steam +
      '<path d="M30 48 C16 48, 16 68, 30 68" fill="none" stroke="' + body + '" stroke-width="6" />' +
      '<path d="M30 48 C16 48, 16 68, 30 68" fill="none" stroke="#263238" stroke-width="2.4" />' +
      '<path d="M68 56 C78 52, 80 42, 85 42" fill="none" stroke="' + body + '" stroke-width="6.5" stroke-linecap="round" />' +
      '<path d="M68 56 C78 52, 80 42, 85 42" fill="none" stroke="#263238" stroke-width="2.4" stroke-linecap="round" />' +
      '<ellipse cx="50" cy="59" rx="22" ry="18" fill="' + body + '" stroke="#263238" stroke-width="2.5" />' +
      '<path d="M35 43 Q50 35 65 43 Z" fill="' + motif + '" stroke="#263238" stroke-width="2" />' +
      '<circle cx="50" cy="36" r="4" fill="' + (s.goldKnob ? '#FFD54F' : motif) + '" stroke="#263238" stroke-width="1.8" />' +
      dot;

    return wrapSvg(s.bg || '#FFF6EC', '', inner, false);
  }

  if (s.kind === 'dimsum') {
    const topColor = s.greenTop ? '#43A047' : '#E53935';
    const steam = s.steam
      ? '<path d="M38 24 Q34 17 39 12" fill="none" stroke="#BCAAA4" stroke-width="2.2" stroke-linecap="round" />' +
        '<path d="M62 24 Q58 17 63 12" fill="none" stroke="#BCAAA4" stroke-width="2.2" stroke-linecap="round" />'
      : '';

    const inner =
      steam +
      '<ellipse cx="50" cy="54" rx="34" ry="17" fill="#D7A86E" stroke="#4E342E" stroke-width="2.4" />' +
      '<ellipse cx="50" cy="51" rx="29" ry="13" fill="#8D6E63" stroke="#4E342E" stroke-width="1.8" />' +
      '<circle cx="41" cy="48" r="8.5" fill="#FFE082" stroke="#4E342E" stroke-width="2" />' +
      '<circle cx="41" cy="46" r="3" fill="' + topColor + '" />' +
      '<circle cx="59" cy="48" r="8.5" fill="#FFE082" stroke="#4E342E" stroke-width="2" />' +
      '<circle cx="59" cy="46" r="3" fill="' + topColor + '" />' +
      '<circle cx="50" cy="56" r="8.5" fill="#FFE082" stroke="#4E342E" stroke-width="2" />' +
      '<circle cx="50" cy="54" r="3" fill="' + topColor + '" />' +
      '<path d="M16 54 L16 69 C16 80, 84 80, 84 69 L84 54 C84 65, 16 65, 16 54 Z" fill="#E6BE8A" stroke="#4E342E" stroke-width="2.4" />';

    return wrapSvg(s.bg || '#FFF8EE', '', inner, false);
  }

  // Illustrated Ivory Calligraphy / Mahjong Tile (curated classic nod)
  const glyph = s.glyph || '福';
  const ink = s.ink || '#B71C1C';
  const inner =
    '<rect x="19" y="13" width="62" height="74" rx="10" fill="#D7CCC8" stroke="#3E2723" stroke-width="2.4" />' +
    '<rect x="19" y="11" width="62" height="70" rx="10" fill="#FFFDF7" stroke="#3E2723" stroke-width="2.4" />' +
    '<rect x="25" y="17" width="50" height="58" rx="6" fill="none" stroke="#E0CFA9" stroke-width="1.6" />' +
    '<text x="50" y="57" text-anchor="middle" font-size="34" font-weight="900" fill="' + ink + '" font-family="serif">' + glyph + '</text>';

  return wrapSvg('#F4EFE6', '', inner, false);
}

export function renderEagleSpecSvg(spec) {
  if (!spec) return '';
  switch (spec.type) {
    case 'car':
      return svgCar(spec);
    case 'taxi':
      return svgTaxi(spec);
    case 'tram_bus':
      return svgTramBus(spec);
    case 'boat':
      return svgBoat(spec);
    case 'dog':
      return svgDog(spec);
    case 'cat':
      return svgCat(spec);
    case 'panda_bear':
      return svgPandaBear(spec);
    case 'bunny':
      return svgBunny(spec);
    case 'bird':
      return svgBird(spec);
    case 'fish_frog':
      return svgFishFrog(spec);
    case 'cottage_balloon':
      return svgCottageBalloon(spec);
    case 'flower_tea':
      return svgFlowerTea(spec);
    default:
      return '';
  }
}

export function renderEagleTileHtml(pair, isOdd) {
  if (pair && pair.majSpec && pair.oddSpec) {
    return renderEagleSpecSvg(isOdd ? pair.oddSpec : pair.majSpec);
  }
  const raw = isOdd ? pair.odd : pair.majority;
  return '<span class="eagle-glyph">' + String(raw) + '</span>';
}

/* =========================================================================
   Deterministic 530+ Unique 2D Illustrated Puzzle Builder
   ========================================================================= */
function cloneAssign(base, diff) {
  const out = {};
  const k1 = Object.keys(base);
  for (let i = 0; i < k1.length; i++) out[k1[i]] = base[k1[i]];
  const k2 = Object.keys(diff);
  for (let j = 0; j < k2.length; j++) out[k2[j]] = diff[k2[j]];
  return out;
}

function buildAllEaglePuzzles() {
  const list = [];
  let seq = 1;

  function add(bucket, baseSpec, oddPatch, tipZh, tipEn) {
    const id = 'eg_2d_' + String(seq).padStart(3, '0');
    seq += 1;
    const majSpec = cloneAssign(baseSpec, {});
    const oddSpec = cloneAssign(baseSpec, oddPatch);
    list.push({
      id: id,
      bucket: bucket,
      theme: EAGLE_THEME_META[bucket],
      majSpec: majSpec,
      oddSpec: oddSpec,
      majority: id + ':maj',
      odd: id + ':odd',
      tip: { zh: tipZh, en: tipEn }
    });
  }

  /* ---------------- BUCKET 1: VEHICLES (136 unique 2D puzzles) ---------------- */
  const carPaints = [
    { body: '#E53935', sky: '#EBF6FF', nameZh: '紅色私家車', nameEn: 'red car' },
    { body: '#1E88E5', sky: '#FFF8E7', nameZh: '藍色私家車', nameEn: 'blue car' },
    { body: '#FDD835', sky: '#EEF7FF', nameZh: '黃色甲蟲車', nameEn: 'yellow beetle' },
    { body: '#43A047', sky: '#FFF6EC', nameZh: '翠綠房車', nameEn: 'green coupe' },
    { body: '#FB8C00', sky: '#EBF6FF', nameZh: '橙色跑車', nameEn: 'orange coupe' },
    { body: '#8E24AA', sky: '#FFF8E8', nameZh: '紫色老爺車', nameEn: 'purple classic car' },
    { body: '#00897B', sky: '#FFF3F8', nameZh: '湖水綠房車', nameEn: 'teal car' },
    { body: '#F4511E', sky: '#EEF9F0', nameZh: '珊瑚紅房車', nameEn: 'coral car' }
  ];

  for (let i = 0; i < carPaints.length; i++) {
    const c = carPaints[i];
    const base = {
      type: 'car',
      body: c.body,
      sky: c.sky,
      rim: '#ECEFF1',
      headlightOn: false,
      roofRack: false,
      antennaFlag: false,
      doorStripe: false,
      convertible: false,
      flip: i % 2 === 1
    };
    add('vehicles', base, { roofRack: true, rackColor: i % 2 === 0 ? '#6D4C41' : '#1565C0' }, '留意邊架' + c.nameZh + '車頂多咗個行李篋！', 'Spot the ' + c.nameEn + ' carrying a suitcase on its roof rack!');
    add('vehicles', base, { headlightOn: true }, '留意邊架' + c.nameZh + '開着咗黃色車頭大燈！', 'Find the ' + c.nameEn + ' with its golden headlight beam switched on!');
    add('vehicles', base, { doorStripe: true }, '留意邊架' + c.nameZh + '車門多咗賽車條紋同圓章！', 'Spot the ' + c.nameEn + ' with a racing stripe and badge on its door!');
    add('vehicles', base, { convertible: true }, '留意邊架' + c.nameZh + '變成開篷跑車！', 'Find the open-top convertible ' + c.nameEn + '!');
    add('vehicles', base, { antennaFlag: true, flagColor: '#FFD54F' }, '留意邊架' + c.nameZh + '車尾多咗支小旗仔天線！', 'Spot the ' + c.nameEn + ' with a little pennant flag on its antenna!');
    add('vehicles', base, { rim: '#FFB300' }, '留意車轆鈴蓋顏色（金色 vs 銀色）！', 'Check the wheel hubcap color (gold vs. silver rims)!');
    add('vehicles', base, { flip: !base.flip }, '留意邊架' + c.nameZh + '行駛方向同其他相反！', 'Find the ' + c.nameEn + ' facing the opposite direction!');
  }

  // HK Taxis (Red Urban, Green NT, Blue Lantau, Vintage Cream)
  const taxiStyles = [
    { body: '#D32F2F', sky: '#FFF8E7', zh: '市區紅的', en: 'HK red taxi' },
    { body: '#2E7D32', sky: '#EBF6FF', zh: '新界綠的', en: 'NT green taxi' },
    { body: '#0277BD', sky: '#FFF6EC', zh: '大嶼山藍的', en: 'Lantau blue taxi' },
    { body: '#F57C00', sky: '#EEF7FF', zh: '城際專車', en: 'city cab' },
    { body: '#6A1B9A', sky: '#FFF8E7', zh: '復古的士', en: 'vintage cab' }
  ];
  for (let i = 0; i < taxiStyles.length; i++) {
    const tx = taxiStyles[i];
    const base = {
      type: 'taxi',
      body: tx.body,
      sky: tx.sky,
      signLit: true,
      doorBadge: false,
      goldRim: false,
      yellowBumper: false,
      flip: i % 2 === 0
    };
    add('vehicles', base, { signLit: false }, '留意邊架' + tx.zh + '車頂「TAXI」燈熄咗！', 'Spot the ' + tx.en + ' whose roof TAXI lamp is turned off!');
    add('vehicles', base, { doorBadge: true }, '留意邊架' + tx.zh + '車門中間多咗個圓形徽章！', 'Find the ' + tx.en + ' with a round medallion on its door!');
    add('vehicles', base, { yellowBumper: true }, '留意前後防撞欄顏色（黃色 vs 銀色）！', 'Check the front & rear bumper color (yellow vs. silver)!');
    add('vehicles', base, { goldRim: true }, '留意邊架' + tx.zh + '換咗金色車轆鈴！', 'Spot the ' + tx.en + ' with golden wheel hubs!');
    add('vehicles', base, { flip: !base.flip }, '留意邊架' + tx.zh + '車頭方向唔同！', 'Find the ' + tx.en + ' facing the other way!');
  }

  // Double-Decker Trams & Buses
  const tramStyles = [
    { body: '#2E7D32', band: '#FFF8E1', hasPole: true, zh: '香港綠色電車', en: 'green HK tram' },
    { body: '#C62828', band: '#FFF8E1', hasPole: true, zh: '懷舊紅色電車', en: 'red HK tram' },
    { body: '#1565C0', band: '#E3F2FD', hasPole: false, zh: '溫哥華雙層巴士', en: 'blue city bus' },
    { body: '#EF6C00', band: '#FFF3E0', hasPole: false, zh: '雙層觀光巴士', en: 'sightseeing bus' },
    { body: '#00695C', band: '#E0F2F1', hasPole: true, zh: '海濱叮叮電車', en: 'harbour tram' }
  ];
  for (let i = 0; i < tramStyles.length; i++) {
    const tr = tramStyles[i];
    const base = {
      type: 'tram_bus',
      body: tr.body,
      band: tr.band,
      hasPole: tr.hasPole,
      threeTopWins: false,
      twinLights: false,
      routeColor: '#FFB300',
      flip: false
    };
    add('vehicles', base, { threeTopWins: true }, '數下上層車窗格數（3 格闊窗 vs 4 格窗）！', 'Count the upper-deck windows (3 wide windows vs. 4)!');
    add('vehicles', base, { routeColor: '#E91E63' }, '留意車頭路線牌顏色唔同！', 'Spot the ' + tr.en + ' with a pink/magenta route sign!');
    add('vehicles', base, { twinLights: true }, '留意車頭有兩盞圓燈定一盞燈！', 'Check whether the front has twin headlights or a single lamp!');
    add('vehicles', base, { hasPole: !tr.hasPole }, '留意車頂集電桿／冷氣頂蓋唔同！', 'Check the roof pole / top fixture on the ' + tr.en + '!');
    add('vehicles', base, { flip: true }, '留意邊架' + tr.zh + '行駛方向相反！', 'Find the ' + tr.en + ' heading the opposite way!');
  }

  // Ferries & Sailboats
  const ferryStyles = [
    { sailboat: false, hull: '#1B5E20', deck: '#FFF8E1', zh: '天星小輪', en: 'Star Ferry' },
    { sailboat: false, hull: '#0D47A1', deck: '#FFFFFF', zh: '海港渡輪', en: 'harbour ferry' },
    { sailboat: false, hull: '#B71C1C', deck: '#FFF8E1', zh: '離島渡輪', en: 'island ferry' }
  ];
  for (let i = 0; i < ferryStyles.length; i++) {
    const fy = ferryStyles[i];
    const base = { type: 'boat', sailboat: false, hull: fy.hull, deck: fy.deck, hasSmoke: true, lifebuoy: false, flip: false };
    add('vehicles', base, { hasSmoke: false }, '留意邊隻' + fy.zh + '煙囪無噴白煙！', 'Spot the ' + fy.en + ' with no white steam puffs above its funnel!');
    add('vehicles', base, { lifebuoy: true }, '留意船頭係金色星星定紅白救生圈！', 'Check the bow emblem (golden star vs. red-and-white lifebuoy)!');
    add('vehicles', base, { flip: true }, '留意邊隻' + fy.zh + '航行方向相反！', 'Find the ' + fy.en + ' sailing the opposite direction!');
  }

  const sailStyles = [
    { hull: '#D84315', sail1: '#FFF8E1', sail2: '#FF7043', zh: '橙紅帆船', en: 'coral sailboat' },
    { hull: '#1565C0', sail1: '#FFFFFF', sail2: '#42A5F5', zh: '海藍帆船', en: 'blue sailboat' },
    { hull: '#2E7D32', sail1: '#FFFDE7', sail2: '#66BB6A', zh: '翠綠帆船', en: 'green sailboat' },
    { hull: '#6A1B9A', sail1: '#FFF8E1', sail2: '#AB47BC', zh: '紫帆遊艇', en: 'purple sailboat' },
    { hull: '#F57F17', sail1: '#FFFFFF', sail2: '#FFCA28', zh: '金黃帆船', en: 'golden sailboat' }
  ];
  for (let i = 0; i < sailStyles.length; i++) {
    const sb = sailStyles[i];
    const base = {
      type: 'boat',
      sailboat: true,
      hull: sb.hull,
      sail1: sb.sail1,
      sail2: sb.sail2,
      flagColor: '#FFD54F',
      sailStripe: false,
      twoPortholes: false,
      flip: i % 2 === 1
    };
    add('vehicles', base, { sailStripe: true }, '留意邊隻' + sb.zh + '主帆多咗一條橫紋！', 'Spot the ' + sb.en + ' with a horizontal stripe across its main sail!');
    add('vehicles', base, { twoPortholes: true }, '數下船身圓窗數量（2 個 vs 3 個）！', 'Count the round portholes on the hull (2 vs. 3)!');
    add('vehicles', base, { flagColor: '#E53935' }, '留意桅杆頂部三角旗顏色！', 'Check the color of the mast pennant flag at the top!');
    add('vehicles', base, { flip: !base.flip }, '留意邊隻' + sb.zh + '航行方向唔同！', 'Find the ' + sb.en + ' sailing the other way!');
  }

  /* ---------------- BUCKET 2: CUTE PETS & ANIMALS (140 unique 2D puzzles) ---------------- */
  const dogs = [
    { coat: '#E69A45', muzzle: '#FFF8E7', collar: '#D32F2F', zh: '柴犬', en: 'Shiba puppy' },
    { coat: '#F3C677', muzzle: '#FFFDF7', collar: '#1E88E5', zh: '金毛尋回犬', en: 'Golden puppy' },
    { coat: '#8D5B3C', muzzle: '#FFE8CC', collar: '#2E7D32', zh: '朱古力小狗', en: 'brown puppy' },
    { coat: '#ECEFF1', muzzle: '#FFFFFF', collar: '#D81B60', zh: '斑點小白狗', en: 'white puppy' },
    { coat: '#D97B38', muzzle: '#FFF8E1', collar: '#6A1B9A', zh: '哥基小狗', en: 'Corgi puppy' },
    { coat: '#BCAAA4', muzzle: '#FFFDF9', collar: '#00897B', zh: '奶茶色小狗', en: 'cream terrier' },
    { coat: '#546E7A', muzzle: '#ECEFF1', collar: '#F57C00', zh: '雪納瑞小狗', en: 'grey pup' }
  ];
  for (let i = 0; i < dogs.length; i++) {
    const d = dogs[i];
    const base = {
      type: 'dog',
      coat: d.coat,
      muzzle: d.muzzle,
      collar: d.collar,
      floppyEar: false,
      eyePatch: i === 3,
      wink: false,
      tongue: false,
      heartTag: false
    };
    add('pets', base, { wink: true }, '搵下邊隻' + d.zh + '單眼笑緊！', 'Spot the ' + d.en + ' giving a cute wink!');
    add('pets', base, { tongue: true }, '搵下邊隻' + d.zh + '伸出粉紅色脷仔！', 'Find the ' + d.en + ' sticking its pink tongue out!');
    add('pets', base, { floppyEar: true }, '留意邊隻' + d.zh + '有一隻耳仔垂低咗！', 'Spot the ' + d.en + ' with one floppy folded ear!');
    add('pets', base, { heartTag: true }, '留意狗帶吊飾係紅心定金色鈴鐺！', 'Check the collar charm (red heart tag vs. golden bell)!');
    add('pets', base, { eyePatch: !base.eyePatch }, '留意眼睛周圍有無深色斑紋！', 'Look closely for the dark eye-patch marking on the ' + d.en + '!');
    add('pets', base, { collar: '#FFB300' }, '留意邊隻' + d.zh + '戴住金黃色頸圈！', 'Find the ' + d.en + ' wearing a bright gold collar!');
  }

  const cats = [
    { coat: '#FF9E43', bowColor: '#E53935', zh: '橘貓仔', en: 'orange tabby' },
    { coat: '#ECEFF1', bowColor: '#D81B60', zh: '白雪貓咪', en: 'white kitten' },
    { coat: '#607D8B', bowColor: '#FFB300', zh: '英國短毛灰貓', en: 'blue-grey cat' },
    { coat: '#FFE0B2', bowColor: '#1E88E5', zh: '忌廉小貓', en: 'cream kitten' },
    { coat: '#8D6E63', bowColor: '#43A047', zh: '可可色貓咪', en: 'cocoa cat' },
    { coat: '#F8BBD0', bowColor: '#8E24AA', zh: '粉紅夢幻貓', en: 'pastel kitty' },
    { coat: '#FFD54F', bowColor: '#00897B', zh: '金吉拉小貓', en: 'golden kitty' }
  ];
  for (let i = 0; i < cats.length; i++) {
    const kt = cats[i];
    const base = {
      type: 'cat',
      coat: kt.coat,
      bowColor: kt.bowColor,
      tailLeft: false,
      stripes: i % 2 === 0,
      wink: false,
      blush: false,
      bowtie: true
    };
    add('pets', base, { wink: true }, '搵下邊隻' + kt.zh + '單眼眨眼！', 'Spot the ' + kt.en + ' winking at you!');
    add('pets', base, { tailLeft: true }, '留意貓尾喺左邊定右邊翹起！', 'Check which side the curled tail peeks out on!');
    add('pets', base, { bowtie: false }, '留意頸部係蝴蝶結定圓形鈴鐺頸圈！', 'Spot the ' + kt.en + ' wearing a bell collar instead of a bow tie!');
    add('pets', base, { stripes: !base.stripes }, '留意額頭有無三條虎斑紋！', 'Check the forehead tabby stripes on the ' + kt.en + '!');
    add('pets', base, { blush: true }, '留意邊隻' + kt.zh + '面珠仔紅卜卜！', 'Find the ' + kt.en + ' with rosy pink cheeks!');
  }

  // Pandas & Bears
  const bears = [
    { isPanda: true, fur: '#FFFFFF', zh: '大熊貓', en: 'giant panda' },
    { isPanda: false, fur: '#A1663E', zh: '蜜糖棕熊', en: 'honey bear' },
    { isPanda: false, fur: '#D7A86E', zh: '泰迪小熊', en: 'teddy bear' },
    { isPanda: false, fur: '#ECEFF1', zh: '北極小白熊', en: 'polar bear' },
    { isPanda: false, fur: '#8D6E63', zh: '森林小熊', en: 'woodland bear' }
  ];
  for (let i = 0; i < bears.length; i++) {
    const b = bears[i];
    const base = {
      type: 'panda_bear',
      isPanda: b.isPanda,
      fur: b.fur,
      wink: false,
      bamboo: b.isPanda,
      headBow: false,
      scarf: false,
      redNose: false
    };
    add('pets', base, { bamboo: !base.bamboo }, '留意手上有無攞住翠綠竹葉！', 'Check which ' + b.en + ' has (or lacks) a green bamboo sprig!');
    add('pets', base, { headBow: true, bowColor: '#E91E63' }, '留意邊隻' + b.zh + '耳仔戴住蝴蝶結！', 'Spot the ' + b.en + ' wearing a ribbon bow on its ear!');
    add('pets', base, { scarf: true, scarfColor: '#E53935' }, '留意邊隻' + b.zh + '圍住紅色頸巾！', 'Find the ' + b.en + ' wrapped in a cozy red scarf!');
    add('pets', base, { wink: true }, '搵下邊隻' + b.zh + '單眼微笑！', 'Spot the winking ' + b.en + '!');
    add('pets', base, { redNose: true }, '留意邊隻' + b.zh + '係紅卜卜鼻哥！', 'Check the nose color (berry red vs. charcoal)!');
  }

  // Bunnies
  const bunnies = [
    { fur: '#FFFFFF', bowColor: '#EC407A', zh: '小白兔', en: 'white bunny' },
    { fur: '#FFE0B2', bowColor: '#1E88E5', zh: '忌廉兔仔', en: 'cream bunny' },
    { fur: '#CFD8DC', bowColor: '#AB47BC', zh: '銀灰兔仔', en: 'silver bunny' },
    { fur: '#FFCCBC', bowColor: '#2E7D32', zh: '蜜桃兔仔', en: 'peach bunny' },
    { fur: '#D7CCC8', bowColor: '#F57C00', zh: '摩卡兔仔', en: 'mocha bunny' },
    { fur: '#FFF9C4', bowColor: '#D32F2F', zh: '檸檬黃小兔', en: 'sunny bunny' }
  ];
  for (let i = 0; i < bunnies.length; i++) {
    const bn = bunnies[i];
    const base = {
      type: 'bunny',
      fur: bn.fur,
      bowColor: bn.bowColor,
      lopEar: false,
      wink: false,
      carrot: false,
      earBow: false
    };
    add('pets', base, { lopEar: true }, '搵下邊隻' + bn.zh + '摺低咗一隻長耳仔！', 'Spot the ' + bn.en + ' with one cute folded lop ear!');
    add('pets', base, { carrot: true }, '搵下邊隻' + bn.zh + '抱住紅蘿蔔！', 'Find the ' + bn.en + ' holding an orange carrot!');
    add('pets', base, { earBow: true }, '留意蝴蝶結戴喺耳仔定頸下面！', 'Check whether the ribbon is on the ear or at the neck!');
    add('pets', base, { wink: true }, '搵下邊隻' + bn.zh + '單眼眨眼！', 'Spot the winking ' + bn.en + '!');
  }

  /* ---------------- BUCKET 3: BIRDS & POND CRITTERS (132 unique 2D puzzles) ---------------- */
  const ducks = [
    { body: '#FFD54F', bg: '#EDF8FF', zh: '小黃鴨', en: 'yellow duckling' },
    { body: '#FFFFFF', bg: '#E3F2FD', zh: '小白鴨', en: 'white duckling' },
    { body: '#FFB74D', bg: '#E8F5E9', zh: '蜜柑小鴨', en: 'amber duckling' },
    { body: '#AED581', bg: '#E1F5FE', zh: '綠頭小鴨', en: 'mallard duckling' },
    { body: '#F8BBD0', bg: '#FFF8E7', zh: '粉紅小鴨', en: 'pink duckling' }
  ];
  for (let i = 0; i < ducks.length; i++) {
    const dk = ducks[i];
    const base = { type: 'bird', kind: 'duck', body: dk.body, bg: dk.bg, tuft: false, wingUp: false, openBeak: false, flip: false };
    add('nature_critters', base, { tuft: true }, '留意邊隻' + dk.zh + '頭頂多咗兩條呆毛！', 'Spot the ' + dk.en + ' with cute head tuft feathers!');
    add('nature_critters', base, { wingUp: true }, '留意邊隻' + dk.zh + '拍翼舉起對翼！', 'Find the ' + dk.en + ' flapping its wing upward!');
    add('nature_critters', base, { openBeak: true }, '留意邊隻' + dk.zh + '張開嘴仔唱歌！', 'Spot the ' + dk.en + ' with its beak open chirping!');
    add('nature_critters', base, { flip: true }, '留意邊隻' + dk.zh + '游水方向相反！', 'Find the ' + dk.en + ' swimming the opposite way!');
  }

  const owls = [
    { body: '#8D6E63', belly: '#FFF8E1', zh: '森林貓頭鷹', en: 'brown owl' },
    { body: '#546E7A', belly: '#ECEFF1', zh: '銀灰貓頭鷹', en: 'slate owl' },
    { body: '#D87A3B', belly: '#FFF3E0', zh: '琥珀貓頭鷹', en: 'tawny owl' },
    { body: '#7E57C2', belly: '#F3E5F5', zh: '星夜貓頭鷹', en: 'twilight owl' },
    { body: '#00897B', belly: '#E0F2F1', zh: '松林貓頭鷹', en: 'pine owl' }
  ];
  for (let i = 0; i < owls.length; i++) {
    const ow = owls[i];
    const base = { type: 'bird', kind: 'owl', body: ow.body, belly: ow.belly, wink: false, wingUp: false, branchLeaf: false };
    add('nature_critters', base, { wink: true }, '搵下邊隻' + ow.zh + '單眼眨眼！', 'Spot the ' + ow.en + ' winking one big eye!');
    add('nature_critters', base, { wingUp: true }, '留意邊隻' + ow.zh + '舉起右邊翅膀打招呼！', 'Find the ' + ow.en + ' waving one wing upward!');
    add('nature_critters', base, { branchLeaf: true }, '留意樹枝右邊有無多出一片綠葉！', 'Check which branch has a green leaf sprouting on the right!');
  }

  const penguins = [
    { coat: '#263238', scarfColor: '#E53935', zh: '小企鵝（紅巾）', en: 'penguin' },
    { coat: '#1A237E', scarfColor: '#FFB300', zh: '藍企鵝（金巾）', en: 'royal penguin' },
    { coat: '#37474F', scarfColor: '#2E7D32', zh: '冰原企鵝（綠巾）', en: 'arctic penguin' },
    { coat: '#4A148C', scarfColor: '#EC407A', zh: '雪國企鵝（粉巾）', en: 'snow penguin' },
    { coat: '#004D40', scarfColor: '#FF7043', zh: '南極企鵝（橙巾）', en: 'antarctic penguin' }
  ];
  for (let i = 0; i < penguins.length; i++) {
    const pg = penguins[i];
    const base = { type: 'bird', kind: 'penguin', coat: pg.coat, scarfColor: pg.scarfColor, hasScarf: true, pomHat: false, wingUp: false };
    add('nature_critters', base, { pomHat: true }, '搵下邊隻' + pg.zh + '頭頂戴住毛毛冷帽！', 'Spot the ' + pg.en + ' wearing a cozy pom-pom winter hat!');
    add('nature_critters', base, { hasScarf: false }, '留意邊隻' + pg.zh + '無圍到頸巾！', 'Find the ' + pg.en + ' without a scarf!');
    add('nature_critters', base, { wingUp: true }, '搵下邊隻' + pg.zh + '舉起翼仔揮手！', 'Spot the ' + pg.en + ' waving its flipper up high!');
  }

  // Koi Fish & Frogs
  const kois = [
    { body: '#FFFFFF', spotColor: '#FF5722', finColor: '#FFB300', zh: '紅白錦鯉', en: 'red-and-white koi' },
    { body: '#FFF8E1', spotColor: '#D32F2F', finColor: '#FF7043', zh: '丹頂錦鯉', en: 'crimson koi' },
    { body: '#FFD54F', spotColor: '#E65100', finColor: '#FFF8E1', zh: '黃金錦鯉', en: 'golden koi' },
    { body: '#E1F5FE', spotColor: '#1565C0', finColor: '#29B6F6', zh: '淺蔥藍錦鯉', en: 'azure koi' },
    { body: '#FCE4EC', spotColor: '#AD1457', finColor: '#F06292', zh: '櫻花錦鯉', en: 'blossom koi' },
    { body: '#E8F5E9', spotColor: '#2E7D32', finColor: '#AED581', zh: '翡翠游魚', en: 'jade fish' },
    { body: '#EDE7F6', spotColor: '#6A1B9A', finColor: '#BA68C8', zh: '紫霞游魚', en: 'violet fish' },
    { body: '#FFF3E0', spotColor: '#4E342E', finColor: '#FFB74D', zh: '三色錦鯉', en: 'calico koi' },
    { body: '#FFFFFF', spotColor: '#F57C00', finColor: '#FFD54F', zh: '琥珀錦鯉', en: 'amber koi' }
  ];
  for (let i = 0; i < kois.length; i++) {
    const k = kois[i];
    const base = {
      type: 'fish_frog',
      kind: 'koi',
      body: k.body,
      spotColor: k.spotColor,
      finColor: k.finColor,
      bubbles: true,
      threeSpots: true,
      flip: i % 2 === 1
    };
    add('nature_critters', base, { bubbles: false }, '留意邊條' + k.zh + '嘴邊無水泡仔！', 'Spot the ' + k.en + ' with no water bubbles in front of it!');
    add('nature_critters', base, { threeSpots: false }, '數下魚背花斑數量（1 點大斑 vs 3 點斑）！', 'Count the dorsal spots on the ' + k.en + ' (1 spot vs. 3 spots)!');
    add('nature_critters', base, { finColor: '#E53935' }, '留意魚尾同魚鰭顏色唔同！', 'Check the tail & fin color on the ' + k.en + '!');
    add('nature_critters', base, { flip: !base.flip }, '搵下邊條' + k.zh + '游水方向相反！', 'Find the ' + k.en + ' swimming in the opposite direction!');
  }

  const frogs = [
    { skin: '#66BB6A', zh: '荷葉小青蛙', en: 'green lily-pad frog' },
    { skin: '#26A69A', zh: '翡翠樹蛙', en: 'jade tree frog' },
    { skin: '#9CCC65', zh: '嫩綠小蛙', en: 'lime frog' },
    { skin: '#42A5F5', zh: '藍寶石小蛙', en: 'blue pond frog' },
    { skin: '#FFCA28', zh: '金福小蛙', en: 'golden frog' },
    { skin: '#AB47BC', zh: '紫蓮小蛙', en: 'orchid frog' }
  ];
  for (let i = 0; i < frogs.length; i++) {
    const fg = frogs[i];
    const base = { type: 'fish_frog', kind: 'frog', skin: fg.skin, crown: false, wink: false, lotus: false };
    add('nature_critters', base, { crown: true }, '搵下邊隻' + fg.zh + '頭頂戴住金色小皇冠！', 'Spot the ' + fg.en + ' wearing a tiny golden crown!');
    add('nature_critters', base, { lotus: true }, '留意荷葉左邊有無開咗一朵粉紅蓮花！', 'Find the lily pad with a blooming pink lotus flower!');
    add('nature_critters', base, { wink: true }, '搵下邊隻' + fg.zh + '單眼眨眼！', 'Spot the winking ' + fg.en + '!');
  }

  /* ---------------- BUCKET 4: COZY GARDEN, COTTAGES, BALLOONS & TEA-HOUSE (132 unique 2D puzzles) ---------------- */
  const cottages = [
    { roof: '#D84315', door: '#1E88E5', wall: '#FFFDF7', zh: '紅頂小屋', en: 'red-roof cottage' },
    { roof: '#1565C0', door: '#FFB300', wall: '#FFFDF7', zh: '藍頂渡假屋', en: 'blue-roof cottage' },
    { roof: '#2E7D32', door: '#E53935', wall: '#FFF8E7', zh: '森林木屋', en: 'green-roof cabin' },
    { roof: '#6A1B9A', door: '#26A69A', wall: '#FDF2F8', zh: '童話花園屋', en: 'storybook cottage' },
    { roof: '#EF6C00', door: '#5D4037', wall: '#FFFDE7', zh: '暖陽農舍', en: 'sunny farmhouse' },
    { roof: '#00838F', door: '#FF7043', wall: '#F1F8E9', zh: '海風小屋', en: 'seaside house' }
  ];
  for (let i = 0; i < cottages.length; i++) {
    const ct = cottages[i];
    const base = { type: 'cottage_balloon', kind: 'cottage', roof: ct.roof, door: ct.door, wall: ct.wall, smoke: true, atticWin: true };
    add('cozy_world', base, { smoke: false }, '留意邊間' + ct.zh + '煙囪無白煙升起！', 'Spot the ' + ct.en + ' with no smoke puffs above its chimney!');
    add('cozy_world', base, { atticWin: false }, '留意屋頂閣樓有無圓形小窗！', 'Check whether the roof gable has a round attic window!');
    add('cozy_world', base, { door: '#8E24AA' }, '留意大門顏色唔同嗰間' + ct.zh + '！', 'Spot the ' + ct.en + ' with a different front door color!');
  }

  const balloons = [
    { c1: '#EF5350', c2: '#FFD54F', zh: '紅黃熱氣球', en: 'red-and-gold balloon' },
    { c1: '#29B6F6', c2: '#FFF176', zh: '天藍熱氣球', en: 'sky-blue balloon' },
    { c1: '#66BB6A', c2: '#FFFFFF', zh: '翠綠熱氣球', en: 'emerald balloon' },
    { c1: '#AB47BC', c2: '#FFD54F', zh: '紫金熱氣球', en: 'purple-and-gold balloon' },
    { c1: '#FF7043', c2: '#FFF8E1', zh: '夕陽橙熱氣球', en: 'tangerine balloon' },
    { c1: '#EC407A', c2: '#B3E5FC', zh: '繽紛粉熱氣球', en: 'pink-and-blue balloon' }
  ];
  for (let i = 0; i < balloons.length; i++) {
    const bl = balloons[i];
    const base = { type: 'cottage_balloon', kind: 'balloon', c1: bl.c1, c2: bl.c2, basketFlag: false, waistBand: false };
    add('cozy_world', base, { basketFlag: true }, '留意藤籃右邊有無插住藍色小旗仔！', 'Spot the ' + bl.en + ' flying a little blue flag on its basket!');
    add('cozy_world', base, { waistBand: true }, '留意球身中間有無多一條白色橫帶！', 'Find the ' + bl.en + ' with a white horizontal band across the middle!');
    add('cozy_world', base, { c2: '#26A69A' }, '留意熱氣球中間條紋顏色唔同！', 'Check the center stripe color of the ' + bl.en + '!');
  }

  const flowers = [
    { petal: '#FF7043', center: '#FFD54F', zh: '向日葵盆栽', en: 'coral blossom' },
    { petal: '#EC407A', center: '#FFF176', zh: '粉紅花盆栽', en: 'pink flower' },
    { petal: '#AB47BC', center: '#FFD54F', zh: '紫羅蘭盆栽', en: 'violet flower' },
    { petal: '#29B6F6', center: '#FFF59D', zh: '繡球藍花盆栽', en: 'blue flower' },
    { petal: '#FFCA28', center: '#6D4C41', zh: '太陽花盆栽', en: 'sunflower' },
    { petal: '#EF5350', center: '#FFE082', zh: '紅山茶盆栽', en: 'camellia flower' },
    { petal: '#26A69A', center: '#FFF59D', zh: '薄荷綠花盆栽', en: 'mint blossom' }
  ];
  for (let i = 0; i < flowers.length; i++) {
    const fl = flowers[i];
    const base = { type: 'flower_tea', kind: 'flower', petal: fl.petal, center: fl.center, twoLeaves: true, ladybug: false };
    add('cozy_world', base, { twoLeaves: false }, '數下花莖上面有幾多塊綠葉（1 塊 vs 2 塊）！', 'Count the green leaves on the stem (1 leaf vs. 2 leaves)!');
    add('cozy_world', base, { ladybug: true }, '搵下邊盆' + fl.zh + '花盆上有隻紅甲蟲（瓢蟲）！', 'Spot the tiny red ladybug resting on the flower pot!');
    add('cozy_world', base, { center: '#E53935' }, '留意花蕊中心圓點顏色唔同！', 'Check the flower center disk color!');
  }

  const teapots = [
    { body: '#FFF8E7', motif: '#1E88E5', zh: '青花瓷茶壺', en: 'blue-and-white teapot' },
    { body: '#FCE4EC', motif: '#D81B60', zh: '胭脂紅彩茶壺', en: 'rose porcelain teapot' },
    { body: '#E8F5E9', motif: '#2E7D32', zh: '翡翠青瓷茶壺', en: 'celadon teapot' },
    { body: '#FFF3E0', motif: '#D84315', zh: '紫砂暖茶壺', en: 'terracotta teapot' },
    { body: '#EDE7F6', motif: '#6A1B9A', zh: '紫韻花茶壺', en: 'lavender teapot' },
    { body: '#E0F7FA', motif: '#00838F', zh: '湖水青茶壺', en: 'teal teapot' }
  ];
  for (let i = 0; i < teapots.length; i++) {
    const tp = teapots[i];
    const base = { type: 'flower_tea', kind: 'teapot', body: tp.body, motif: tp.motif, steam: true, flowerDot: true, goldKnob: false };
    add('cozy_world', base, { steam: false }, '留意邊個' + tp.zh + '壺嘴無熱氣升起！', 'Spot the ' + tp.en + ' with no steam rising from its spout!');
    add('cozy_world', base, { flowerDot: false }, '留意壺身圖案係圓花定橫紋！', 'Check the teapot belly pattern (round flower vs. stripe)!');
    add('cozy_world', base, { goldKnob: true }, '留意壺蓋頂部珠仔顏色（金色 vs 同色）！', 'Check the color of the knob on top of the teapot lid!');
  }

  // Dim Sum Steamers
  const dimsumBgs = [
    { bg: '#FFF8EE', greenTop: false, steam: true },
    { bg: '#EEF8F2', greenTop: true, steam: true },
    { bg: '#EEF6FF', greenTop: false, steam: false },
    { bg: '#FDF2F8', greenTop: true, steam: false },
    { bg: '#FFFDE7', greenTop: false, steam: true },
    { bg: '#F3E5F5', greenTop: true, steam: true }
  ];
  for (let i = 0; i < dimsumBgs.length; i++) {
    const ds = dimsumBgs[i];
    const base = { type: 'flower_tea', kind: 'dimsum', bg: ds.bg, greenTop: ds.greenTop, steam: ds.steam };
    add('cozy_world', base, { greenTop: !ds.greenTop }, '留意燒賣上面粒點綴係紅蟹籽定青豆！', 'Check the shumai topping color (red roe vs. green pea)!');
    add('cozy_world', base, { steam: !ds.steam }, '留意竹蒸籠上面有無熱騰騰白煙！', 'Check whether warm steam curls rise above the bamboo steamer!');
  }

  // Curated 25 Illustrated Ivory Calligraphy / Mahjong Tiles (classic heritage nod, <5% of total)
  const classicGlyphs = [
    ['烏', '鳥', '#263238', '搵下邊隻字多／少咗一點眼睛（烏 vs 鳥）！', 'Spot the subtle eye-stroke difference (烏 vs 鳥)!'],
    ['茶', '荼', '#1B5E20', '留意下面係「木」定「余」（茶 vs 荼）！', 'Check the bottom strokes carefully (茶 vs 荼)!'],
    ['末', '未', '#B71C1C', '比較上下兩橫嘅長短（末 vs 未）！', 'Compare the top and middle horizontal strokes (末 vs 未)!'],
    ['福', '富', '#B71C1C', '喺吉祥「福」字牌入面搵出「富」字！', 'Find 富 hiding among the lucky 福 ivory tiles!'],
    ['春', '泰', '#AD1457', '留意下半部係「日」定「水」（春 vs 泰）！', 'Compare the lower half of the character (春 vs 泰)!'],
    ['晴', '睛', '#0D47A1', '留意左邊係日字旁定目字旁（晴 vs 睛）！', 'Check the left radical (晴 sun vs. 睛 eye)!'],
    ['候', '侯', '#4E342E', '留意中間有無多一豎（候 vs 侯）！', 'Look closely for the tiny middle vertical stroke (候 vs 侯)!'],
    ['酒', '洒', '#6A1B9A', '留意「酉」入面有無多一橫（酒 vs 洒）！', 'Spot the horizontal bar inside the right side (酒 vs 洒)!'],
    ['贏', '羸', '#B71C1C', '留意中間係「貝」定「羊」（贏 vs 羸）！', 'Check the middle component carefully (贏 vs 羸)!'],
    ['壺', '壼', '#1B5E20', '細心睇下茶壺個「壺」字筆畫差異！', 'Spot the subtle stroke difference inside 壺!'],
    ['東', '柬', '#0D47A1', '喺「東」字象牙牌入面搵出「柬」字！', 'Find 柬 hiding among the 東 ivory tiles!'],
    ['南', '楠', '#2E7D32', '搵出多咗木字旁嘅「楠」字牌！', 'Spot 楠 hiding among the 南 tiles!'],
    ['發', '撥', '#1B5E20', '喺「發」財牌入面搵出「撥」字！', 'Find 撥 hiding among the green 發 tiles!'],
    ['中', '申', '#C62828', '喺紅「中」牌入面搵出「申」字！', 'Spot 申 hiding among the red 中 tiles!'],
    ['萬', '邁', '#B71C1C', '喺「萬」字牌入面搵出「邁」字！', 'Find 邁 hiding among the 萬 tiles!'],
    ['九', '丸', '#37474F', '留意有無多一點（九 vs 丸）！', 'Spot the extra dot (九 vs 丸)!'],
    ['玉', '王', '#00695C', '留意右下角有無一點翠玉（玉 vs 王）！', 'Check for the jade dot on the lower right (玉 vs 王)!'],
    ['免', '兔', '#6D4C41', '留意右下角有無兔仔一點尾（免 vs 兔）！', 'Check for the tiny bunny-tail dot (免 vs 兔)!'],
    ['土', '士', '#5D4037', '比較上下兩橫長短（土 vs 士）！', 'Compare the top and bottom horizontal strokes (土 vs 士)!'],
    ['瓜', '爪', '#2E7D32', '留意中間筆畫差異（瓜 vs 爪）！', 'Spot the subtle inner stroke difference (瓜 vs 爪)!'],
    ['千', '干', '#1565C0', '留意第一筆係撇定橫（千 vs 干）！', 'Compare the top stroke (slanted 千 vs. flat 干)!'],
    ['午', '牛', '#B71C1C', '留意中間一豎有無穿出頭（午 vs 牛）！', 'Check whether the vertical stroke pokes through the top (午 vs 牛)!'],
    ['貝', '見', '#AD1457', '留意下面兩腳筆畫（貝 vs 見）！', 'Compare the bottom strokes (貝 vs 見)!'],
    ['間', '閒', '#1B5E20', '留意門入面係「日」定「月」（間 vs 閒）！', 'Check whether 日 or 月 sits inside the gate (間 vs 閒)!']
  ];
  for (let i = 0; i < classicGlyphs.length; i++) {
    const cg = classicGlyphs[i];
    add(
      'cozy_world',
      { type: 'flower_tea', kind: 'seal', glyph: cg[0], ink: cg[2] },
      { glyph: cg[1] },
      cg[3],
      cg[4]
    );
  }

  return list;
}

export const EAGLE_ILLUSTRATED_PAIRS = buildAllEaglePuzzles();
export const EAGLE_PAIRS = EAGLE_ILLUSTRATED_PAIRS;

export const EAGLE_BUCKETS = {
  vehicles: EAGLE_ILLUSTRATED_PAIRS.filter(function (p) { return p.bucket === 'vehicles'; }),
  pets: EAGLE_ILLUSTRATED_PAIRS.filter(function (p) { return p.bucket === 'pets'; }),
  nature_critters: EAGLE_ILLUSTRATED_PAIRS.filter(function (p) { return p.bucket === 'nature_critters'; }),
  cozy_world: EAGLE_ILLUSTRATED_PAIRS.filter(function (p) { return p.bucket === 'cozy_world'; })
};
