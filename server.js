// server.js - Improvised Version

import express from "express";
import session from "express-session";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import helmet from "helmet"; // IMPR: For security headers
import xss from "xss";       // IMPR: For input sanitization (Install: npm install helmet xss)

// IMPORTANT: Ensure data.js uses ES Module export syntax:
import { users, libraryData } from './data.js'; 

// 1. --- MODULE SETUP AND CONFIGURATION ---

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set up __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// 2. --- HELPER FUNCTION (Role-Based Access Control) ---

function checkRole(requiredRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    const userRole = req.session.user.role;
    
    if (requiredRoles.includes(userRole)) {
      next(); 
    } else {
      res.status(403).render('home', { 
        page: 'home', 
        error: `Access Denied: You do not have **${requiredRoles.join(' or ')}** permissions for this page.` 
      });
    }
  };
}


// 3. --- MIDDLEWARE SETUP ---

// Security Middleware (IMPR: Helps protect against known web vulnerabilities)
app.use(helmet()); 

// Setup view engine and static files
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Body parser (IMPR: Use Express built-in body parsers instead of body-parser module)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || "a_default_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: process.env.NODE_ENV === 'production' // IMPR: Set secure flag in production
  } 
}));

// Make session user available in templates (res.locals.user)
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// 4. --- ROUTES ---

// Home route (public)
app.get('/', (req, res) => {
  res.render('home', { page: 'home', error: null });
});

// ---------------------------
// Login / Logout
// ---------------------------

app.get("/login", (req, res) => {
  res.render("login", { page: "login", error: null });
});

app.post("/login", (req, res) => {
  let { roll, password } = req.body;
  
  // IMPR: Sanitize input for security (prevents basic XSS)
  roll = roll ? xss(roll.trim()) : '';
  password = password ? xss(password.trim()) : '';
  
  console.log(`Attempting login with Roll: [${roll}]`);

  const user = users.find(u => u.roll === roll && u.password === password);
  
  if (user) {
    req.session.user = user;
    
    // IMPR: Simplified redirect logic
    switch(user.role) {
      case 'admin': return res.redirect('/admin/dashboard');
      case 'librarian': return res.redirect('/librarian/control');
      case 'teacher': return res.redirect('/teacher/class');
      default: return res.redirect("/student");
    }
  } else {
    res.render("login", { page: "login", error: "Invalid roll or password" });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect("/");
  });
});

// ---------------------------------------------
// Sign-Up Routes (Role Selection + Dynamic Form)
// ---------------------------------------------

app.get("/signup", (req, res) => {
  res.render("signup-select", { page: "signup" }); 
});

app.get("/signup/:role", (req, res) => {
  const role = req.params.role.toLowerCase();
  const validRoles = ['student', 'teacher', 'librarian'];

  if (!validRoles.includes(role)) {
    return res.status(404).send("Invalid role selected. Please return to the signup page to choose a valid role.");
  }

  res.render("signup-form", { 
      page: "signup", 
      selectedRole: role, 
      error: null 
  });
});

app.post("/signup", (req, res) => {
  let { name, roll, password, role } = req.body;

  // IMPR: Sanitize all user-provided data
  name = name ? xss(name.trim()) : '';
  roll = roll ? xss(roll.trim()) : '';
  password = password ? xss(password.trim()) : '';
  role = role ? xss(role.trim()) : 'student';

  const existingUser = users.find(u => u.roll === roll);
  if (existingUser) {
    return res.render("signup-form", { 
        page: "signup", 
        selectedRole: role, 
        error: "Roll number already registered." 
    });
  }

  const newUser = {
    name: name,
    roll: roll,
    password: password, // WARNING: Store passwords as plain text for demonstration only. In production, use bcrypt.
    role: role,
    profilePic: '/assets/profile-placeholder.png',
  };
  
  if (role === 'student') {
      newUser.universityRoll = req.body.universityRoll ? xss(req.body.universityRoll.trim()) : '';
      newUser.semester = 1;
      newUser.college = 'N/A';
      newUser.performance = [];
      newUser.reportCards = {};
  } else if (role === 'teacher') {
      newUser.classAssigned = 'B.Tech 6th Sem (Default)';
  }
  
  users.push(newUser);
  req.session.user = newUser;
  
  console.log(`New user signed up: ${name} (${roll}) as ${role}`);
  
  // IMPR: Simplified redirect logic
  switch(role) {
    case 'admin': return res.redirect('/admin/dashboard');
    case 'librarian': return res.redirect('/librarian/control');
    case 'teacher': return res.redirect('/teacher/class');
    default: return res.redirect("/student");
  }
});


// ---------------------------
// Student/General Routes (with RBAC)
// ---------------------------

app.get('/student', checkRole(['student']), (req, res) => {
  res.render('student', { page: 'student', student: req.session.user });
});

app.get('/library', checkRole(['student', 'librarian', 'admin']), (req, res) => {
  res.render('library', { page: 'library', libraryData });
});

app.get('/guidance', checkRole(['student', 'teacher', 'admin']), (req, res) => {
  res.render('guidance', { page: 'guidance' });
});


// ---------------------------
// ROLE-SPECIFIC DASHBOARDS
// ---------------------------

app.get('/admin/dashboard', checkRole(['admin']), (req, res) => {
  res.render('admin/dashboard', { 
    page: 'admin', 
    foundStudent: null,
    searchQuery: null 
  });
});

app.post('/admin/search', checkRole(['admin']), (req, res) => {
  const { roll } = req.body;
  // IMPR: Sanitize input
  const sanitizedRoll = roll ? xss(roll.trim()) : '';
  const student = users.find(u => u.roll === sanitizedRoll && u.role === 'student');

  res.render('admin/dashboard', { 
    page: 'admin', 
    foundStudent: student,
    searchQuery: roll
  });
});

app.get('/librarian/control', checkRole(['librarian']), (req, res) => {
  res.render('librarian/control', { 
    page: 'librarian', 
    libraryData: libraryData, 
    studentIssueRecords: null,
    searchRoll: null
  });
});

app.post('/librarian/search-student', checkRole(['librarian']), (req, res) => {
  const { roll } = req.body;
  // IMPR: Sanitize input
  const sanitizedRoll = roll ? xss(roll.trim()) : '';
  const student = users.find(u => u.roll === sanitizedRoll && u.role === 'student');

  let issueRecords = null;
  if (student) {
    issueRecords = {
      studentName: student.name,
      studentRoll: student.roll,
      books: (student.roll === '22111234') ? libraryData.issuedBooks : []
    };
  }

  res.render('librarian/control', { 
    page: 'librarian', 
    libraryData: libraryData, 
    studentIssueRecords: issueRecords,
    searchRoll: roll
  });
});

app.get('/teacher/class', checkRole(['teacher']), (req, res) => {
  const teacher = req.session.user;
  const assignedSemester = 6; 
  
  const classStudents = users.filter(user => 
    user.role === 'student' && user.semester === assignedSemester
  );
    
  res.render('teacher/class', { 
    page: 'teacher', 
    teacher: teacher,
    classStudents: classStudents,
    assignedClass: teacher.classAssigned
  });
});

// ---------------------------
// Chat / AI assistant endpoint
// ---------------------------

app.post("/chat", async (req, res) => {
  // IMPR: Sanitize user message before sending to OpenAI
  const userMsg = req.body.message ? xss(req.body.message.trim()) : '';
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert Career Development Counselor for college students. Your role is to provide personalized roadmaps, detailed guidance, necessary resources." },
        { role: "user", content: userMsg }
      ]
    });
    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ reply: "Sorry — something went wrong." });
  }
});


// ---------------------------
// IMPR: 404 CATCH-ALL HANDLER
// ---------------------------
app.use((req, res) => {
  res.status(404).render('home', {
    page: 'error',
    error: `404: The page you requested (${req.originalUrl}) was not found.`
  });
});


// 5. --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});