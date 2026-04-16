const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ── PERSISTENCE FILE ──
const DATA_FILE = path.join(__dirname, 'data.json');

// ── LOAD FROM DISK ──
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log(`✅ Data loaded — ${parsed.users?.length || 0} users, ${parsed.applications?.length || 0} applications`);
      return parsed;
    }
  } catch (err) {
    console.warn('⚠️  Could not load data.json, starting fresh:', err.message);
  }
  return null;
}

// ── SAVE TO DISK (debounced) ──
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (err) {
      console.error('❌ Save failed:', err.message);
    }
  }, 300);
}

// ── TRACKED ARRAY: auto-saves on mutation ──
function tracked(arr) {
  return new Proxy(arr, {
    get(target, prop) {
      const val = target[prop];
      if (['push', 'splice', 'pop', 'shift', 'unshift'].includes(prop)) {
        return (...args) => {
          const result = Array.prototype[prop].apply(target, args);
          scheduleSave();
          return result;
        };
      }
      return typeof val === 'function' ? val.bind(target) : val;
    },
    set(target, prop, value) {
      target[prop] = value;
      if (prop !== 'length') scheduleSave();
      return true;
    },
  });
}

// ── INIT ──
const existing = loadData();
const db = {
  users:         tracked(existing?.users         || []),
  scholarships:  tracked(existing?.scholarships  || []),
  applications:  tracked(existing?.applications  || []),
  notifications: tracked(existing?.notifications || []),
};

// ── SEED ADMIN (only once) ──
if (!db.users.find(u => u.email === 'admin@nsmp.gov.in')) {
  db.users.push({
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@nsmp.gov.in',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  });
  console.log('👤 Admin seeded');
}

// ── SEED SCHOLARSHIPS (only once) ──
if (db.scholarships.length === 0) {
  const list = [
    { name:'PM National Merit Scholarship', provider:'Ministry of Education', amount:75000, deadline:'2025-06-30', minMarks:80, maxIncome:800000, categories:['General','OBC'], courses:['Engineering','Medical','Science'], gender:'All', location:'All India', disability:false, description:'Flagship merit scholarship for academically excellent students.', eligibility:'Min 80% in Class 12, family income below ₹8 LPA', benefits:'₹75,000/year + laptop allowance + mentorship', applicants:1240, featured:true },
    { name:'SC/ST Excellence Award', provider:'Ministry of Social Justice', amount:50000, deadline:'2025-07-15', minMarks:60, maxIncome:600000, categories:['SC','ST'], courses:['Engineering','Medical','Law','Science','Arts','Commerce'], gender:'All', location:'All India', disability:false, description:'Empowering SC/ST students with financial support.', eligibility:'SC/ST category, min 60%, income below ₹6 LPA', benefits:'₹50,000/year + hostel allowance + book grant', applicants:2310, featured:false },
    { name:'Girl Child Education Fund', provider:'Ministry of Women & Child Development', amount:40000, deadline:'2025-08-01', minMarks:65, maxIncome:500000, categories:['General','OBC','SC','ST','EWS'], courses:['Engineering','Medical','Science','Commerce','Arts'], gender:'Female', location:'All India', disability:false, description:'Encouraging female students to pursue STEM education.', eligibility:'Female students, min 65%, income below ₹5 LPA', benefits:'₹40,000/year + career counseling + internship', applicants:3100, featured:true },
    { name:'EWS Higher Education Grant', provider:'Ministry of Finance', amount:35000, deadline:'2025-05-30', minMarks:70, maxIncome:300000, categories:['EWS'], courses:['Engineering','Medical','Law','Science','Commerce'], gender:'All', location:'All India', disability:false, description:'Financial assistance for economically weaker sections.', eligibility:'EWS certificate, min 70%, income below ₹3 LPA', benefits:'₹35,000/year + exam fee reimbursement', applicants:870, featured:false },
    { name:'Disability Welfare Scholarship', provider:'Dept of Empowerment of PwD', amount:60000, deadline:'2025-09-01', minMarks:50, maxIncome:900000, categories:['General','OBC','SC','ST','EWS'], courses:['Engineering','Medical','Science','Commerce','Arts','Law'], gender:'All', location:'All India', disability:true, description:'Supporting differently-abled students.', eligibility:'Disability certificate (min 40%), any course', benefits:'₹60,000/year + assistive devices + priority placement', applicants:430, featured:false },
    { name:'OBC Central Sector Scholarship', provider:'Ministry of Social Justice', amount:30000, deadline:'2025-07-20', minMarks:65, maxIncome:450000, categories:['OBC'], courses:['Engineering','Medical','Science','Commerce','Arts','Pharmacy'], gender:'All', location:'All India', disability:false, description:'Dedicated scholarship for OBC students.', eligibility:'OBC category, min 65%, income below ₹4.5 LPA', benefits:'₹30,000/year + coaching assistance', applicants:1890, featured:false },
    { name:'North-East Special Initiative', provider:'Ministry of NE Region', amount:45000, deadline:'2025-06-15', minMarks:60, maxIncome:700000, categories:['General','OBC','SC','ST'], courses:['Engineering','Medical','Science','Commerce','Arts'], gender:'All', location:'North-East India', disability:false, description:'Promoting education in North-Eastern states.', eligibility:'NE state resident, min 60%, income below ₹7 LPA', benefits:'₹45,000/year + travel allowance', applicants:560, featured:false },
    { name:'STEM Innovators Award', provider:'Department of Science & Technology', amount:100000, deadline:'2025-10-01', minMarks:90, maxIncome:1200000, categories:['General','OBC','SC','ST','EWS'], courses:['Engineering','Science'], gender:'All', location:'All India', disability:false, description:'Rewarding top STEM performers for research-oriented education.', eligibility:'Min 90% in PCM/B, top-tier institution', benefits:'₹1,00,000/year + research grant + mentorship', applicants:320, featured:true },
    { name:'Rural Talent Development Fund', provider:'Ministry of Rural Development', amount:25000, deadline:'2025-08-15', minMarks:60, maxIncome:250000, categories:['General','OBC','SC','ST','EWS'], courses:['Engineering','Medical','Science','Commerce','Arts','Law'], gender:'All', location:'Rural India', disability:false, description:'Supporting talented rural students.', eligibility:'Rural domicile, min 60%, income below ₹2.5 LPA', benefits:'₹25,000/year + digital device + internet allowance', applicants:2100, featured:false },
    { name:'Legal Education Scholarship', provider:'Bar Council of India', amount:55000, deadline:'2025-07-30', minMarks:70, maxIncome:600000, categories:['General','OBC','SC','ST','EWS'], courses:['Law'], gender:'All', location:'All India', disability:false, description:'Access to legal education for meritorious students.', eligibility:'Recognized Law school, min 70%, income below ₹6 LPA', benefits:'₹55,000/year + moot court coaching + placement', applicants:210, featured:false },
    { name:'Pharmaceutical Sciences Grant', provider:'Ministry of Health', amount:48000, deadline:'2025-09-15', minMarks:72, maxIncome:550000, categories:['General','OBC','SC','ST'], courses:['Pharmacy','Medical'], gender:'All', location:'All India', disability:false, description:'Supporting future healthcare professionals.', eligibility:'B.Pharma or MBBS, min 72%, income below ₹5.5 LPA', benefits:'₹48,000/year + lab fee waiver + hospital internship', applicants:490, featured:false },
    { name:'Arts & Culture Preservation Award', provider:'Ministry of Culture', amount:20000, deadline:'2025-06-01', minMarks:55, maxIncome:400000, categories:['General','OBC','SC','ST','EWS'], courses:['Arts','Fine Arts','Music'], gender:'All', location:'All India', disability:false, description:"Preserving India's rich cultural heritage.", eligibility:'Arts/cultural program, min 55%, income below ₹4 LPA', benefits:'₹20,000/year + exhibition + cultural tour', applicants:380, featured:false },
    { name:'Sports Achievers Scholarship', provider:'Ministry of Youth Affairs & Sports', amount:80000, deadline:'2025-11-01', minMarks:50, maxIncome:1000000, categories:['General','OBC','SC','ST','EWS'], courses:['Sports Management','Physical Education','Engineering','Science','Commerce'], gender:'All', location:'All India', disability:false, description:'For national/state level athletes.', eligibility:'Sports achievement + min 50% marks', benefits:'₹80,000/year + coaching + equipment allowance', applicants:150, featured:true },
    { name:'Minority Education Empowerment', provider:'Ministry of Minority Affairs', amount:42000, deadline:'2025-08-30', minMarks:60, maxIncome:500000, categories:['General'], courses:['Engineering','Medical','Law','Science','Commerce','Arts'], gender:'All', location:'All India', disability:false, description:'Financial empowerment for minority community students.', eligibility:'Minority certificate, min 60%, income below ₹5 LPA', benefits:'₹42,000/year + vocational training + placement', applicants:920, featured:false },
  ];
  list.forEach(s => db.scholarships.push({ id: uuidv4(), ...s, createdAt: new Date().toISOString() }));
  console.log(`🎓 ${list.length} scholarships seeded`);
}

module.exports = db;
