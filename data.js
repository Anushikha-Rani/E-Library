// data.js

const users = [
  // Existing Student (John Doe)
  {
    roll: '22111234',
    password: 'pass123',
    name: 'John Doe',
    role: 'student', 
    universityRoll: '12345623145',
    semester: 6,
    college: 'ABC College',
    profilePic: '/assets/profile-placeholder.png',
    performance: [
      { sem: 1, gpa: 7.2 },
      { sem: 2, gpa: 7.5 },
      { sem: 3, gpa: 7.8 },
      { sem: 4, gpa: 8.0 },
      { sem: 5, gpa: 8.2 },
      { sem: 6, gpa: 8.5 }
    ],
    reportCards: {
      // Placeholder for report card links
      1: '/assets/marksheets/sem1.pdf' 
    }
  },
  // Admin User (Minimal required fields)
  {
    roll: 'admin001',
    password: 'adminpass',
    name: 'System Administrator',
    role: 'admin', 
    profilePic: '/assets/profile-placeholder.png', // Added default profile pic for consistency
  },
  // Librarian User (Minimal required fields)
  {
    roll: 'lib001',
    password: 'libpass',
    name: 'College Librarian',
    role: 'librarian',
    profilePic: '/assets/profile-placeholder.png', // Added default profile pic for consistency
  },
  // Teacher User (Example)
  {
    roll: 'teacher101',
    password: 'teachpass',
    name: 'Professor Smith',
    role: 'teacher', 
    classAssigned: 'B.Tech 6th Sem', // Field used for Teacher dashboard filtering
    profilePic: '/assets/profile-placeholder.png', // Added default profile pic for consistency
  }
];

const libraryData = {
  issuedBooks: [
    { title: 'DBMS', issueDate: '2025-11-10', returnDate: '2025-12-10' },
    { title: 'Operating Systems', issueDate: '2025-11-15', returnDate: '2025-12-15' }
  ],
  resources: [
    { type: 'Notes', subject: 'Computer Networks', topic: 'OSI Model', downloadUrl: '/assets/ebooks/cn-osi.pdf' },
    { type: 'PYQ', subject: 'Algorithms', topic: 'Greedy', downloadUrl: '/assets/ebooks/algo-greedy.pdf' }
  ]
};

// -----------------------------------------------------------
// DO NOT CHANGE THIS LINE: Ensures ES Module compatibility (import/export)
export { users, libraryData };
// -----------------------------------------------------------