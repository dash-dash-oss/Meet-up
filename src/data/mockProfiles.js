const usLocations = [
  // California (8 cities)
  ['Los Angeles', 'California'],
  ['San Diego', 'California'],
  ['San Francisco', 'California'],
  ['San Jose', 'California'],
  ['Sacramento', 'California'],
  ['Fresno', 'California'],
  ['Oakland', 'California'],
  ['Long Beach', 'California'],
  // Florida (8 cities)
  ['Miami', 'Florida'],
  ['Orlando', 'Florida'],
  ['Tampa', 'Florida'],
  ['Jacksonville', 'Florida'],
  ['Fort Lauderdale', 'Florida'],
  ['Tallahassee', 'Florida'],
  ['St. Petersburg', 'Florida'],
  ['Gainesville', 'Florida'],
  // New York (8 cities)
  ['New York', 'New York'],
  ['Buffalo', 'New York'],
  ['Rochester', 'New York'],
  ['Yonkers', 'New York'],
  ['Syracuse', 'New York'],
  ['Albany', 'New York'],
  ['Bronx', 'New York'],
  ['Brooklyn', 'New York'],
  // Pennsylvania (8 cities)
  ['Philadelphia', 'Pennsylvania'],
  ['Pittsburgh', 'Pennsylvania'],
  ['Allentown', 'Pennsylvania'],
  ['Erie', 'Pennsylvania'],
  ['Reading', 'Pennsylvania'],
  ['Harrisburg', 'Pennsylvania'],
  ['Scranton', 'Pennsylvania'],
  ['Bethlehem', 'Pennsylvania'],
  // Illinois (8 cities)
  ['Chicago', 'Illinois'],
  ['Aurora', 'Illinois'],
  ['Naperville', 'Illinois'],
  ['Rockford', 'Illinois'],
  ['Joliet', 'Illinois'],
  ['Springfield', 'Illinois'],
  ['Peoria', 'Illinois'],
  ['Elgin', 'Illinois'],
  // Ohio (8 cities)
  ['Columbus', 'Ohio'],
  ['Cleveland', 'Ohio'],
  ['Cincinnati', 'Ohio'],
  ['Toledo', 'Ohio'],
  ['Akron', 'Ohio'],
  ['Dayton', 'Ohio'],
  ['Parma', 'Ohio'],
  ['Canton', 'Ohio'],
  // Georgia (8 cities)
  ['Atlanta', 'Georgia'],
  ['Augusta', 'Georgia'],
  ['Savannah', 'Georgia'],
  ['Columbus', 'Georgia'],
  ['Macon', 'Georgia'],
  ['Athens', 'Georgia'],
  ['Sandy Springs', 'Georgia'],
  ['Roswell', 'Georgia'],
  // North Carolina (8 cities)
  ['Charlotte', 'North Carolina'],
  ['Raleigh', 'North Carolina'],
  ['Greensboro', 'North Carolina'],
  ['Durham', 'North Carolina'],
  ['Winston-Salem', 'North Carolina'],
  ['Fayetteville', 'North Carolina'],
  ['Cary', 'North Carolina'],
  ['Wilmington', 'North Carolina'],
  // Michigan (8 cities)
  ['Detroit', 'Michigan'],
  ['Grand Rapids', 'Michigan'],
  ['Warren', 'Michigan'],
  ['Sterling Heights', 'Michigan'],
  ['Ann Arbor', 'Michigan'],
  ['Lansing', 'Michigan'],
  ['Flint', 'Michigan'],
  ['Dearborn', 'Michigan'],
  // Texas (8 cities)
  ['Houston', 'Texas'],
  ['San Antonio', 'Texas'],
  ['Dallas', 'Texas'],
  ['Austin', 'Texas'],
  ['Fort Worth', 'Texas'],
  ['El Paso', 'Texas'],
  ['Arlington', 'Texas'],
  ['Corpus Christi', 'Texas'],
];

const femaleNames = [
  'Ava', 'Mia', 'Luna', 'Sofia', 'Emma', 'Olivia', 'Aria', 'Nora', 'Grace', 'Chloe',
  'Ella', 'Scarlett', 'Aurora', 'Layla', 'Zoe', 'Harper', 'Ivy', 'Nova', 'Stella', 'Leah',
  'Naomi', 'Hazel', 'Ruby', 'Violet', 'Camila', 'Elena', 'Maya', 'Alice', 'Kinsley', 'Julia',
];

const maleNames = [
  'Liam', 'Noah', 'Ethan', 'Mason', 'Lucas', 'Logan', 'Elijah', 'James', 'Aiden', 'Benjamin',
  'Jacob', 'Jackson', 'Owen', 'Levi', 'Sebastian', 'Mateo', 'Julian', 'Ezra', 'Leo', 'Asher',
  'Caleb', 'Carter', 'Nathan', 'Ryan', 'Wyatt', 'Adrian', 'Miles', 'Connor', 'Dominic', 'Theo',
];

const lastNames = [
  'Hayes', 'Brooks', 'Parker', 'Morgan', 'Bennett', 'Reed', 'Foster', 'Griffin', 'Diaz', 'Rivera',
  'Coleman', 'Ward', 'Hayden', 'Bishop', 'Sullivan', 'Pierce', 'Keller', 'Hughes', 'West', 'Shaw',
];

const ethnicities = ['Caucasian', 'Black', 'Asian', 'Latino', 'Mixed', 'Middle Eastern'];
const hairColors = ['Black', 'Brown', 'Blonde', 'Auburn', 'Red'];
const eyeColors = ['Brown', 'Blue', 'Hazel', 'Green'];
const languages = [['English'], ['English', 'Spanish'], ['English', 'French'], ['English', 'Portuguese']];
const availabilityOptions = ['Available Today', 'Available Tonight', 'Available Now'];
const responseTimes = ['Within 2 minutes', 'Within 4 minutes', 'Within 6 minutes', 'Within 12 minutes', 'Within 1 minutes', 'Within 3 minutes', 'Within 5 minutes'];
const servicesPool = [
  ['Quickie', 'Massage', 'Long bite'],
  ['Freaky fun', 'Daddy Play', 'Strip Dance'],
  ['Roleplay', 'Girlfriend experience', 'Boyfriend experience'],
  ['Anal', 'Blowjob', 'Headgame'],
];

const profileTypesByPrefix = {
  male: { label: 'Straight Men', gender: 'Male', orientation: 'Straight', names: maleNames },
  man: { label: 'Straight Men', gender: 'Male', orientation: 'Straight', names: maleNames },
  gay: { label: 'Gay Men', gender: 'Male', orientation: 'Gay', names: maleNames },
  woman: { label: 'Straight Women', gender: 'Female', orientation: 'Straight', names: femaleNames },
  lesbian: { label: 'Lesbian Women', gender: 'Female', orientation: 'Lesbian', names: femaleNames },
};

const assetModules = import.meta.glob('../assets/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true });

const getAssetPrefix = (filename) => {
  const lower = filename.toLowerCase();
  if (lower.startsWith('male')) return 'male';
  if (lower.startsWith('man')) return 'man';
  if (lower.startsWith('gay')) return 'gay';
  if (lower.startsWith('woman')) return 'woman';
  if (lower.startsWith('lesbian')) return 'lesbian';
  return null;
};

const assetEntries = Object.entries(assetModules)
  .map(([assetPath, module]) => {
    const filename = assetPath.split('/').pop() || '';
    const prefix = getAssetPrefix(filename);
    if (!prefix) return null;
    return {
      filename,
      prefix,
      imageUrl: module.default || module,
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.filename.localeCompare(b.filename));

const buildProfile = (asset, index, typeIndex) => {
  const type = profileTypesByPrefix[asset.prefix];
  const [city, state] = usLocations[index % usLocations.length];
  const firstName = type.names[typeIndex % type.names.length];
  const lastName = lastNames[(index * 3) % lastNames.length];
  const age = 22 + (index % 12);
  const rate = 150 + ((index * 11) % 151);
  const rating = Number((4.5 + ((index % 6) * 0.1)).toFixed(1));

  return {
    id: index + 1,
    name: `${firstName} ${lastName}`,
    age,
    gender: type.gender,
    orientation: type.orientation,
    category: type.label,
    location: `${city}, ${state}, USA`,
    height: type.gender === 'Male' ? `6'${index % 5}"` : `5'${(index % 8) + 1}"`,
    weight: type.gender === 'Male' ? `${160 + (index % 40)} lbs` : `${110 + (index % 30)} lbs`,
    measurements: type.gender === 'Male' ? `${38 + (index % 6)}-${30 + (index % 4)}-${38 + (index % 6)}` : `${32 + (index % 5)}-${24 + (index % 4)}-${33 + (index % 5)}`,
    ethnicity: ethnicities[index % ethnicities.length],
    hairColor: hairColors[index % hairColors.length],
    eyeColor: eyeColors[index % eyeColors.length],
    languages: languages[index % languages.length],
    rate,
    rateUnit: 'hour',
    rating,
    reviews: 3 + (index % 40),
    verified: index % 4 !== 0,
    featured: index % 9 === 0,
    about: `${type.label} profile based in ${city}, ${state}. Friendly, respectful, and great company for social events.`,
    services: servicesPool[index % servicesPool.length],
    image: asset.imageUrl,
    gallery: [asset.imageUrl],
    availability: availabilityOptions[index % availabilityOptions.length],
    responseTime: responseTimes[index % responseTimes.length],
  };
};

const typeCounters = { male: 0, man: 0, gay: 0, woman: 0, lesbian: 0 };
const mockProfiles = assetEntries.map((asset, index) => {
  const typeIndex = typeCounters[asset.prefix];
  typeCounters[asset.prefix] += 1;
  return buildProfile(asset, index, typeIndex);
});

export default mockProfiles;
