/**
 * seed.js — Seed the database with sample users and tickets
 *
 * Run: npm run seed
 *      node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');
const Ticket   = require('./models/Ticket');

/* ── Seed data ── */
const USERS = [
  {
    name:     'Jane Doe',
    email:    'customer@ticketai.com',
    password: 'password123',
    role:     'customer',
    phone:    '+1-555-0100',
  },
  {
    name:               'Mike Adams',
    email:              'agent.network@ticketai.com',
    password:           'password123',
    role:               'agent',
    department:         'Network',
    specializationTags: ['Wi-Fi Troubleshooting', 'VPN Setup', 'Access Points', 'Cisco Networking'],
    availabilityStatus: 'online',
  },
  {
    name:               'Sarah Chen',
    email:              'agent.software@ticketai.com',
    password:           'password123',
    role:               'agent',
    department:         'Software',
    specializationTags: ['Outlook', 'Microsoft 365', 'Browser Issues', 'App Crashes'],
    availabilityStatus: 'online',
  },
  {
    name:               'Alex Kim',
    email:              'agent.hardware@ticketai.com',
    password:           'password123',
    role:               'agent',
    department:         'Hardware',
    specializationTags: ['Laptop Repair', 'Printer Drivers', 'Monitor Setup', 'Peripherals'],
    availabilityStatus: 'online',
  },
  {
    name:               'Priya Nair',
    email:              'agent.account@ticketai.com',
    password:           'password123',
    role:               'agent',
    department:         'Account',
    specializationTags: ['Password Resets', 'MFA Setup', 'Account Lockouts', 'SSO'],
    availabilityStatus: 'online',
  },
  {
    name:               'Jordan Lee',
    email:              'agent.payment@ticketai.com',
    password:           'password123',
    role:               'agent',
    department:         'Payment',
    specializationTags: ['Billing Disputes', 'Invoice Corrections', 'Refunds', 'Payment Gateway'],
    availabilityStatus: 'online',
  },
  {
    name:               'Sam Patel',
    email:              'agent.hr@ticketai.com',
    password:           'password123',
    role:               'agent',
    department:         'HR',
    specializationTags: ['Leave Requests', 'Payroll Inquiries', 'Onboarding', 'Benefits'],
    availabilityStatus: 'online',
  },
  {
    name:     'Admin User',
    email:    'admin@ticketai.com',
    password: 'password123',
    role:     'admin',
    department: 'General',
  },
];

/* ── Helper ─ wait for users to be created ── */
const createUsers = async () => {
  console.log('👤  Creating users…');
  const createdUsers = {};
  for (const u of USERS) {
    const user = await User.create(u);
    createdUsers[u.role + (u.department || '')] = user;
    console.log(`   ✅  ${user.role.padEnd(8)} | ${user.name} (${user.email})`);
  }
  return createdUsers;
};

/* ── Tickets ── */
const buildTickets = (users) => [
  /* 1. Open — Critical ── */
  {
    title:       'Building B Wi-Fi completely down — all users affected',
    description: 'Our entire Building B (2nd and 3rd floor) has had no Wi-Fi access since 9 AM. Critical presentation in 2 hours. Multiple users affected — laptop, phones, tablets all cannot connect.',
    customerId:     users['customer'].id,
    customerName:   users['customer'].name,
    customerEmail:  users['customer'].email,
    department:     'Network',
    category:       'Network',
    priority:       'Critical',
    sentiment:      'Negative',
    aiConfidence:   91,
    aiSuggestedSolution: [
      'Check AP logs in the network controller for Building B',
      'Identify any channel congestion on AP-B2-02 and AP-B3-01',
      'Restart affected access points remotely',
      'Switch to a less congested channel (e.g. channel 11)',
      'Confirm connectivity on multiple devices after fix',
    ],
    status: 'Open',
    timeline: [{
      actorType: 'customer', actorName: users['customer'].name,
      actorId: users['customer']._id, action: 'created',
      message: 'Ticket created by customer.', createdAt: new Date(Date.now() - 3 * 3600000),
    }, {
      actorType: 'ai_bot', actorName: 'AI Assistant', action: 'status_changed',
      message: 'AI classified as Network · Critical priority · 91% confidence',
      meta: { category: 'Network', priority: 'Critical', confidence: 91 },
    }],
    createdAt: new Date(Date.now() - 3 * 3600000),
  },

  /* 2. In Progress — High ── */
  {
    title:       'Cannot access shared drives over VPN from home',
    description: 'I have been unable to access the shared drives (\\\\\\\\company\\\\files) over VPN since yesterday. I can connect to VPN but the drives show as disconnected. This is urgently blocking my work.',
    customerId:     users['customer'].id,
    customerName:   users['customer'].name,
    customerEmail:  users['customer'].email,
    department:     'Network',
    category:       'Network',
    priority:       'High',
    sentiment:      'Negative',
    aiConfidence:   83,
    aiSuggestedSolution: [
      'Check if VPN client is updated to the latest version',
      'Verify the user has NTFS permissions on the shared drive',
      'Check Group Policy for drive mapping scripts',
      'Test with net use command from CLI',
      'Escalate to Network team if drive mapping scripts fail',
    ],
    status:           'In Progress',
    assignedAgentId:   users['agentNetwork']._id,
    assignedAgentName: users['agentNetwork'].name,
    timeline: [{
      actorType: 'customer', actorName: users['customer'].name,
      actorId: users['customer']._id, action: 'created',
      message: 'Ticket created by customer.', createdAt: new Date(Date.now() - 5 * 3600000),
    }, {
      actorType: 'agent', actorName: users['agentNetwork'].name,
      actorId: users['agentNetwork']._id, action: 'accepted',
      message: `Ticket accepted by ${users['agentNetwork'].name}. Status changed to In Progress.`,
      createdAt: new Date(Date.now() - 4 * 3600000),
    }],
    replies: [{
      senderId: users['agentNetwork']._id,
      senderName: users['agentNetwork'].name,
      senderType: 'agent',
      message: 'Hi Jane, I\'m looking into this now. Can you confirm which VPN client you\'re using (GlobalProtect or Cisco AnyConnect) and what version?',
      visibleToCustomer: true,
      createdAt: new Date(Date.now() - 3.5 * 3600000),
    }],
    createdAt: new Date(Date.now() - 5 * 3600000),
  },

  /* 3. In Progress — High (Software) ── */
  {
    title:       'Outlook completely stopped syncing after password change',
    description: 'After I changed my domain password yesterday, Outlook on my laptop stopped syncing emails. It shows "Disconnected" in the status bar. I have tried restarting multiple times.',
    customerId:     users['customer'].id,
    customerName:   users['customer'].name,
    customerEmail:  users['customer'].email,
    department:     'Software',
    category:       'Software',
    priority:       'High',
    sentiment:      'Negative',
    aiConfidence:   87,
    aiSuggestedSolution: [
      'Go to File > Account Settings > Email and Repair the account',
      'Remove and re-add the email account with new credentials',
      'Clear the Outlook credential cache in Windows Credential Manager',
      'Delete and recreate the Outlook profile if the above fails',
      'Check if Modern Authentication is enforced by admin policy',
    ],
    status:           'In Progress',
    assignedAgentId:   users['agentSoftware']._id,
    assignedAgentName: users['agentSoftware'].name,
    timeline: [{
      actorType: 'customer', actorName: users['customer'].name,
      actorId: users['customer']._id, action: 'created',
      message: 'Ticket created.', createdAt: new Date(Date.now() - 6 * 3600000),
    }, {
      actorType: 'agent', actorName: users['agentSoftware'].name,
      actorId: users['agentSoftware']._id, action: 'accepted',
      message: 'Ticket accepted.', createdAt: new Date(Date.now() - 5 * 3600000),
    }],
    createdAt: new Date(Date.now() - 6 * 3600000),
  },

  /* 4. Resolved ── */
  {
    title:       'Slow internet speeds on entire 3rd floor',
    description: 'Our entire 3rd floor team has been experiencing very slow internet since Monday. Video calls keep dropping and file uploads take forever.',
    customerId:     users['customer'].id,
    customerName:   users['customer'].name,
    customerEmail:  users['customer'].email,
    department:     'Network',
    category:       'Network',
    priority:       'Medium',
    sentiment:      'Neutral',
    aiConfidence:   78,
    aiSuggestedSolution: [
      'Run a bandwidth test from multiple devices to confirm speed issue',
      'Check switch utilization on 3rd floor closet',
      'Identify if a specific application is consuming bandwidth',
      'Check QoS settings on the core switch',
    ],
    status:             'Resolved',
    assignedAgentId:     users['agentNetwork']._id,
    assignedAgentName:   users['agentNetwork'].name,
    resolvedAt:          new Date(Date.now() - 1 * 3600000),
    resolutionSummary:   'Found a misconfigured QoS policy on the 3rd floor switch. Corrected the policy and speeds returned to normal. Customer confirmed resolution.',
    timeline: [{
      actorType: 'customer', actorName: users['customer'].name,
      actorId: users['customer']._id, action: 'created', message: 'Ticket created.',
      createdAt: new Date(Date.now() - 26 * 3600000),
    }, {
      actorType: 'agent', actorName: users['agentNetwork'].name,
      actorId: users['agentNetwork']._id, action: 'accepted',
      message: 'Ticket accepted.', createdAt: new Date(Date.now() - 24 * 3600000),
    }, {
      actorType: 'agent', actorName: users['agentNetwork'].name,
      actorId: users['agentNetwork']._id, action: 'resolved',
      message: 'Resolved — QoS policy corrected on 3F core switch.',
      createdAt: new Date(Date.now() - 1 * 3600000),
    }],
    createdAt: new Date(Date.now() - 26 * 3600000),
  },

  /* 5. Open — Medium ── */
  {
    title:       'Cannot log into HR portal after account reset',
    description: 'I reset my account password using the self-service portal but still cannot log into the HR portal. It shows "Invalid credentials" even with the new password.',
    customerId:     users['customer'].id,
    customerName:   users['customer'].name,
    customerEmail:  users['customer'].email,
    department:     'Account',
    category:       'Account',
    priority:       'Medium',
    sentiment:      'Neutral',
    aiConfidence:   80,
    aiSuggestedSolution: [
      'Clear browser cache and cookies then retry',
      'Try logging in from a different browser or incognito mode',
      'Ensure the reset email link has not expired (valid for 1 hour)',
      'Check if the HR portal uses a separate identity from the main AD',
      'Manually reset the HR portal account via admin console',
    ],
    status: 'Open',
    timeline: [{
      actorType: 'customer', actorName: users['customer'].name,
      actorId: users['customer']._id, action: 'created', message: 'Ticket created.',
    }],
    createdAt: new Date(Date.now() - 1 * 3600000),
  },

  /* 6. Closed ── */
  {
    title:       'Request for additional Microsoft 365 license',
    description: 'Our new hire John Smith needs a Microsoft 365 Business license assigned. Employee ID: EMP-4521. Manager approved.',
    customerId:     users['customer'].id,
    customerName:   users['customer'].name,
    customerEmail:  users['customer'].email,
    department:     'Software',
    category:       'Software',
    priority:       'Low',
    sentiment:      'Positive',
    aiConfidence:   72,
    aiSuggestedSolution: [
      'Verify employee ID in HR system',
      'Check available license pool in M365 admin centre',
      'Assign license to the new hire\'s email account',
      'Send the new hire their login credentials and setup guide',
    ],
    status:             'Closed',
    assignedAgentId:     users['agentSoftware']._id,
    assignedAgentName:   users['agentSoftware'].name,
    resolvedAt:          new Date(Date.now() - 2 * 24 * 3600000),
    resolutionSummary:   'Microsoft 365 Business license assigned to john.smith@company.com. Credentials emailed.',
    timeline: [{
      actorType: 'customer', actorName: users['customer'].name,
      actorId: users['customer']._id, action: 'created', message: 'Ticket created.',
      createdAt: new Date(Date.now() - 3 * 24 * 3600000),
    }, {
      actorType: 'agent', actorName: users['agentSoftware'].name,
      actorId: users['agentSoftware']._id, action: 'resolved',
      message: 'License assigned and credentials emailed.',
      createdAt: new Date(Date.now() - 2 * 24 * 3600000),
    }, {
      actorType: 'agent', actorName: users['agentSoftware'].name,
      actorId: users['agentSoftware']._id, action: 'closed',
      message: 'Ticket closed.', createdAt: new Date(Date.now() - 2 * 24 * 3600000),
    }],
    createdAt: new Date(Date.now() - 3 * 24 * 3600000),
  },
];

/* ── Main seed function ── */
const seed = async () => {
  try {
    console.log('\n🌱  TicketAI Database Seeder');
    console.log('══════════════════════════════════════');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB\n');

    // Clear existing data
    await Promise.all([User.deleteMany({}), Ticket.deleteMany({})]);
    // Reset ticker counter
    await mongoose.connection.db.collection('counters').deleteMany({});
    console.log('🧹  Cleared existing data\n');

    // Create users
    const users = await createUsers();
    const userMap = {
      customer:      users['customer']       || users['customerundefined'],
      agentNetwork:  users['agentNetwork'],
      agentSoftware: users['agentSoftware'],
      admin:         users['adminGeneral']   || users['adminundefined'],
    };

    // Find users by email as fallback
    const [customer, agentNetwork, agentSoftware] = await Promise.all([
      User.findOne({ email: 'customer@ticketai.com' }),
      User.findOne({ email: 'agent.network@ticketai.com' }),
      User.findOne({ email: 'agent.software@ticketai.com' }),
    ]);

    const resolvedMap = { customer, agentNetwork, agentSoftware };

    // Create tickets
    console.log('\n🎫  Creating sample tickets…');
    const ticketData = buildTickets(resolvedMap);
    for (const td of ticketData) {
      const t = await Ticket.create(td);
      console.log(`   ✅  ${t.ticketId} | ${t.priority.padEnd(8)} | ${t.status.padEnd(11)} | ${t.title.slice(0,55)}`);
    }

    console.log('\n══════════════════════════════════════');
    console.log('🎉  Seeding complete!\n');
    console.log('📧  Test accounts:');
    console.log('   Customer  → customer@ticketai.com    / password123');
    console.log('   Agent 1   → agent.network@ticketai.com / password123  (Network dept)');
    console.log('   Agent 2   → agent.software@ticketai.com / password123 (Software dept)');
    console.log('   Agent 3   → agent.hardware@ticketai.com / password123 (Hardware dept)');
    console.log('   Agent 4   → agent.account@ticketai.com / password123 (Account dept)');
    console.log('   Agent 5   → agent.payment@ticketai.com / password123 (Payment dept)');
    console.log('   Agent 6   → agent.hr@ticketai.com      / password123 (HR dept)');
    console.log('   Admin     → admin@ticketai.com       / password123');
    console.log('\n🔗  Start the server: npm run dev');
    console.log('🔗  API base URL: http://localhost:5000/api\n');

  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
    if (process.env.NODE_ENV === 'development') console.error(err.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌  MongoDB disconnected\n');
    process.exit(0);
  }
};

seed();
