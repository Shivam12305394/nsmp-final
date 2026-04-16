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

// ── SEED SCHOLARSHIPS — only if data.json had none ──
if (db.scholarships.length === 0) {
  console.log('🎓 No scholarships in data.json — seeding from db.js defaults skipped (data.json is source of truth)');
}

module.exports = db;
