// Fallback / seed list of subjects. In production these live in the
// Firestore `subjects` collection (see lib/waitlist.js listenToSubjects) so
// the team can add or remove subjects at any time without a code deploy —
// see scripts/seedSubjects.mjs to push this exact list into Firestore once.
//
// `id` doubles as the Firestore document id. Every subject has the same
// number of free "Verified Badge" seats (worth Rs. 3,000 each).

export const BADGE_SEATS_PER_SUBJECT = 2;

export const CATEGORIES = [
  'Pre-Medical',
  'Pre-Engineering',
  'Core Academics',
  'Test Prep',
  'Languages',
  'Programming & Tech',
  'Business & Skills',
  'Professional Exams',
  'Creative Arts',
];

export const SUBJECTS = [
  // Pre-Medical
  { id: 'fsc-biology', name: 'Biology (FSc / A-Level)', category: 'Pre-Medical' },
  { id: 'fsc-chemistry', name: 'Chemistry (FSc / A-Level)', category: 'Pre-Medical' },
  { id: 'anatomy-physiology', name: 'Anatomy & Physiology', category: 'Pre-Medical' },
  { id: 'biochemistry', name: 'Biochemistry', category: 'Pre-Medical' },

  // Pre-Engineering
  { id: 'fsc-physics', name: 'Physics (FSc / A-Level)', category: 'Pre-Engineering' },
  { id: 'mathematics', name: 'Mathematics (Matric / FSc)', category: 'Pre-Engineering' },
  { id: 'additional-maths', name: 'Additional Mathematics (O-Level)', category: 'Pre-Engineering' },
  { id: 'applied-maths', name: 'Applied Mathematics', category: 'Pre-Engineering' },
  { id: 'statistics', name: 'Statistics', category: 'Pre-Engineering' },
  { id: 'mechanics', name: 'Engineering Mechanics', category: 'Pre-Engineering' },
  { id: 'electrical-basics', name: 'Basic Electrical Engineering', category: 'Pre-Engineering' },

  // Core Academics
  { id: 'computer-studies', name: 'Computer Studies (Matric / O-Level)', category: 'Core Academics' },
  { id: 'islamic-studies', name: 'Islamic Studies', category: 'Core Academics' },
  { id: 'pakistan-studies', name: 'Pakistan Studies', category: 'Core Academics' },
  { id: 'social-studies', name: 'Social Studies / History', category: 'Core Academics' },
  { id: 'geography', name: 'Geography', category: 'Core Academics' },
  { id: 'home-economics', name: 'Home Economics', category: 'Core Academics' },
  { id: 'environmental-science', name: 'Environmental Science', category: 'Core Academics' },
  { id: 'general-science', name: 'General Science (Primary/Middle)', category: 'Core Academics' },

  // Test Prep
  { id: 'mdcat', name: 'MDCAT Prep', category: 'Test Prep' },
  { id: 'ecat', name: 'ECAT Prep', category: 'Test Prep' },
  { id: 'sat', name: 'SAT Prep', category: 'Test Prep' },
  { id: 'ielts', name: 'IELTS Prep', category: 'Test Prep' },
  { id: 'toefl', name: 'TOEFL Prep', category: 'Test Prep' },
  { id: 'gre', name: 'GRE Prep', category: 'Test Prep' },
  { id: 'gmat', name: 'GMAT Prep', category: 'Test Prep' },
  { id: 'css-pms', name: 'CSS / PMS Prep', category: 'Test Prep' },
  { id: 'nts', name: 'NTS Prep', category: 'Test Prep' },
  { id: 'lat', name: 'Law Admission Test (LAT) Prep', category: 'Test Prep' },

  // Languages
  { id: 'english', name: 'English Language & Literature', category: 'Languages' },
  { id: 'urdu', name: 'Urdu Language & Literature', category: 'Languages' },
  { id: 'arabic', name: 'Arabic Language', category: 'Languages' },
  { id: 'quran-tajweed', name: 'Quran Recitation & Tajweed', category: 'Languages' },
  { id: 'french', name: 'French Language', category: 'Languages' },
  { id: 'german', name: 'German Language', category: 'Languages' },
  { id: 'spanish', name: 'Spanish Language', category: 'Languages' },
  { id: 'chinese', name: 'Chinese (Mandarin)', category: 'Languages' },
  { id: 'turkish', name: 'Turkish Language', category: 'Languages' },

  // Programming & Tech
  { id: 'python', name: 'Python Programming', category: 'Programming & Tech' },
  { id: 'javascript', name: 'JavaScript & Web Development', category: 'Programming & Tech' },
  { id: 'java', name: 'Java Programming', category: 'Programming & Tech' },
  { id: 'cpp', name: 'C++ Programming', category: 'Programming & Tech' },
  { id: 'flutter', name: 'Mobile App Development (Flutter)', category: 'Programming & Tech' },
  { id: 'data-science', name: 'Data Science', category: 'Programming & Tech' },
  { id: 'machine-learning', name: 'Machine Learning & AI', category: 'Programming & Tech' },
  { id: 'cybersecurity', name: 'Cybersecurity Basics', category: 'Programming & Tech' },
  { id: 'wordpress', name: 'WordPress Development', category: 'Programming & Tech' },
  { id: 'ui-ux', name: 'UI/UX Design', category: 'Programming & Tech' },
  { id: 'sql-databases', name: 'SQL & Databases', category: 'Programming & Tech' },

  // Business & Skills
  { id: 'digital-marketing', name: 'Digital Marketing', category: 'Business & Skills' },
  { id: 'graphic-design', name: 'Graphic Design', category: 'Business & Skills' },
  { id: 'ms-excel', name: 'MS Excel', category: 'Business & Skills' },
  { id: 'accounting', name: 'Accounting & Bookkeeping', category: 'Business & Skills' },
  { id: 'business-studies', name: 'Business Studies', category: 'Business & Skills' },
  { id: 'economics', name: 'Economics', category: 'Business & Skills' },
  { id: 'financial-modeling', name: 'Financial Modeling', category: 'Business & Skills' },
  { id: 'public-speaking', name: 'Public Speaking & Communication', category: 'Business & Skills' },
  { id: 'content-writing', name: 'Content Writing & Copywriting', category: 'Business & Skills' },
  { id: 'video-editing', name: 'Video Editing', category: 'Business & Skills' },
  { id: 'photography', name: 'Photography', category: 'Business & Skills' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', category: 'Business & Skills' },

  // Professional Exams
  { id: 'acca', name: 'ACCA', category: 'Professional Exams' },
  { id: 'ca', name: 'Chartered Accountancy (CA)', category: 'Professional Exams' },
  { id: 'cfa', name: 'CFA Level I', category: 'Professional Exams' },

  // Creative Arts
  { id: 'music-theory', name: 'Music Theory & Instruments', category: 'Creative Arts' },
  { id: 'calligraphy', name: 'Calligraphy', category: 'Creative Arts' },
  { id: 'painting-sketching', name: 'Painting & Sketching', category: 'Creative Arts' },
];
