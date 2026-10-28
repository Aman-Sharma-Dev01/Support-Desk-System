/**
 * Comprehensive Backend API Test Suite (with Auth)
 * Tests all endpoints against the running server at localhost:5000
 * Run: node src/test-api.js
 */

const BASE = 'http://localhost:5000/api';
let passed = 0;
let failed = 0;
const errors = [];

async function api(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, ...data };
}

function assert(testName, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    const msg = `  ❌ ${testName}${detail ? ' — ' + detail : ''}`;
    console.log(msg);
    errors.push(msg);
  }
}

async function run() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  SUPPORT DESK SYSTEM — BACKEND API TESTS (AUTH)');
  console.log('══════════════════════════════════════════════\n');

  // ──────── 1. HEALTH CHECK (Public) ────────
  console.log('▶ Health Check');
  const health = await api('GET', '/health');
  assert('GET /api/health returns ok (no auth needed)', health.status === 'ok');

  // ──────── 2. AUTH — Login ────────
  console.log('\n▶ Auth — Login');

  // Missing credentials
  const noEmail = await api('POST', '/auth/login', { password: 'admin123' });
  assert('Login rejects missing email', !noEmail.success);

  // Wrong password
  const wrongPass = await api('POST', '/auth/login', { email: 'admin@supportdesk.com', password: 'wrong' });
  assert('Login rejects wrong password (401)', !wrongPass.success);

  // Wrong email
  const wrongEmail = await api('POST', '/auth/login', { email: 'nobody@x.com', password: 'admin123' });
  assert('Login rejects unknown email (401)', !wrongEmail.success);

  // Admin login
  const adminLogin = await api('POST', '/auth/login', { email: 'admin@supportdesk.com', password: 'admin123' });
  assert('Admin login succeeds', adminLogin.success && adminLogin.data.token);
  assert('Admin role is correct', adminLogin.data.agent.role === 'Admin');
  const adminToken = adminLogin.data?.token;

  // Agent login
  const agentLogin = await api('POST', '/auth/login', { email: 'sarah@supportdesk.com', password: 'agent123' });
  assert('Agent login succeeds', agentLogin.success && agentLogin.data.token);
  assert('Agent role is correct', agentLogin.data.agent.role === 'Agent');
  const agentToken = agentLogin.data?.token;

  // ──────── 3. AUTH — Protected routes without token ────────
  console.log('\n▶ Auth — Protected Routes');
  const noToken = await api('GET', '/tickets');
  assert('GET /tickets without token returns 401', !noToken.success);

  const badToken = await api('GET', '/tickets', null, 'invalid.token.here');
  assert('GET /tickets with bad token returns 401', !badToken.success);

  // ──────── 4. AUTH — Get Me ────────
  console.log('\n▶ Auth — Get Me');
  const me = await api('GET', '/auth/me', null, adminToken);
  assert('GET /auth/me returns logged-in agent', me.success && me.data.email === 'admin@supportdesk.com');

  // ──────── 5. AGENTS ────────
  console.log('\n▶ Agents');
  const agents = await api('GET', '/agents', null, adminToken);
  assert('GET /api/agents returns agents array', agents.success && Array.isArray(agents.data));
  assert('Seeded 4 agents', agents.data.length === 4);

  // Agent trying to create agent (should fail — Admin only)
  const agentCreate = await api('POST', '/agents', { name: 'Test', email: 'test@t.com', password: 'test123' }, agentToken);
  assert('Agent cannot create new agents (403)', !agentCreate.success);

  // Admin creating agent
  const newAgent = await api('POST', '/agents', { name: 'Test Agent', email: 'test@test.com', password: 'test123' }, adminToken);
  assert('Admin can create new agent (201)', newAgent.success);

  // ──────── 6. TICKETS — CREATE ────────
  console.log('\n▶ Tickets — Create');
  const newTicket = await api('POST', '/tickets', {
    subject: 'API Test Ticket',
    customer: 'test@customer.com',
    description: 'Testing ticket creation via API',
    priority: 'High',
  }, agentToken);
  assert('POST /api/tickets creates ticket (agent can create)', newTicket.success && newTicket.data._id);
  const ticketId = newTicket.data?._id;

  // Validation
  const noSubject = await api('POST', '/tickets', { customer: 'a@b.com', description: 'test' }, agentToken);
  assert('Rejects ticket without subject', !noSubject.success);

  const noCustomer = await api('POST', '/tickets', { subject: 'test', description: 'test' }, agentToken);
  assert('Rejects ticket without customer', !noCustomer.success);

  const noDesc = await api('POST', '/tickets', { subject: 'test', customer: 'a@b.com' }, agentToken);
  assert('Rejects ticket without description', !noDesc.success);

  const badStatus = await api('POST', '/tickets', {
    subject: 'test', customer: 'a@b.com', description: 'test', status: 'InvalidStatus',
  }, agentToken);
  assert('Rejects invalid status', !badStatus.success);

  // ──────── 7. TICKETS — LIST, SEARCH, FILTER, SORT ────────
  console.log('\n▶ Tickets — List, Search, Filter, Sort');
  const allTickets = await api('GET', '/tickets', null, agentToken);
  assert('GET /api/tickets returns tickets', allTickets.success && Array.isArray(allTickets.data));
  assert('Has seeded + new tickets (≥6)', allTickets.total >= 6, `total=${allTickets.total}`);

  const searchResult = await api('GET', '/tickets?search=payment', null, agentToken);
  assert('Search by subject keyword', searchResult.success && searchResult.data.length >= 1);

  const openOnly = await api('GET', '/tickets?status=Open', null, agentToken);
  assert('Filter status=Open', openOnly.success && openOnly.data.every((t) => t.status === 'Open'));

  const urgentOnly = await api('GET', '/tickets?priority=Urgent', null, agentToken);
  assert('Filter priority=Urgent', urgentOnly.success && urgentOnly.data.every((t) => t.priority === 'Urgent'));

  const combo = await api('GET', '/tickets?status=Open&priority=Low', null, agentToken);
  assert('Combined filters', combo.success && combo.data.every((t) => t.status === 'Open' && t.priority === 'Low'));

  const byPriority = await api('GET', '/tickets?sortBy=priority', null, agentToken);
  assert('Sort by priority', byPriority.success && byPriority.data.length > 0);

  const overdueTickets = await api('GET', '/tickets?overdueOnly=true', null, agentToken);
  assert('Overdue filter — none Resolved', overdueTickets.success && overdueTickets.data.every((t) => t.status !== 'Resolved'));

  const page1 = await api('GET', '/tickets?page=1&limit=2', null, agentToken);
  assert('Pagination', page1.success && page1.data.length <= 2);

  // ──────── 8. TICKETS — GET BY ID ────────
  console.log('\n▶ Tickets — Get By ID');
  const fetched = await api('GET', `/tickets/${ticketId}`, null, agentToken);
  assert('GET ticket by ID', fetched.success && fetched.data._id === ticketId);
  assert('isOverdue virtual present', fetched.data.isOverdue !== undefined);

  const badId = await api('GET', '/tickets/invalidid123', null, agentToken);
  assert('Invalid ObjectId returns 400', !badId.success);

  const fakeId = await api('GET', '/tickets/507f1f77bcf86cd799439011', null, agentToken);
  assert('Non-existent ticket returns 404', !fakeId.success);

  // ──────── 9. TICKETS — UPDATE ────────
  console.log('\n▶ Tickets — Update');
  const updated = await api('PATCH', `/tickets/${ticketId}`, { status: 'In Progress' }, agentToken);
  assert('PATCH updates status', updated.success && updated.data.status === 'In Progress');

  const updatedPri = await api('PATCH', `/tickets/${ticketId}`, { priority: 'Urgent' }, agentToken);
  assert('PATCH updates priority', updatedPri.success && updatedPri.data.priority === 'Urgent');

  // Agent assigning to self (should work)
  const selfAssign = await api('PATCH', `/tickets/${ticketId}`, { assignee: 'Sarah Jenkins' }, agentToken);
  assert('Agent can assign ticket to self', selfAssign.success && selfAssign.data.assignee === 'Sarah Jenkins');

  // Agent assigning to another agent (should fail)
  const otherAssign = await api('PATCH', `/tickets/${ticketId}`, { assignee: 'David Kim' }, agentToken);
  assert('Agent cannot assign to another agent (403)', !otherAssign.success);

  // Admin assigning to anyone (should work)
  const adminAssign = await api('PATCH', `/tickets/${ticketId}`, { assignee: 'David Kim' }, adminToken);
  assert('Admin can assign to any agent', adminAssign.success && adminAssign.data.assignee === 'David Kim');

  // Update subject
  const updatedDet = await api('PUT', `/tickets/${ticketId}`, { subject: 'Updated Subject' }, agentToken);
  assert('PUT updates subject', updatedDet.success && updatedDet.data.subject === 'Updated Subject');

  // Invalid update
  const badUpdate = await api('PATCH', `/tickets/${ticketId}`, { status: 'FakeStatus' }, agentToken);
  assert('Rejects invalid status update', !badUpdate.success);

  // ──────── 10. COMMENTS ────────
  console.log('\n▶ Comments — Replies & Internal Notes');
  const reply = await api('POST', `/tickets/${ticketId}/comments`, {
    type: 'reply', content: 'Public reply to customer', authorName: 'Sarah Jenkins',
  }, agentToken);
  assert('POST reply creates comment', reply.success && reply.data.type === 'reply');

  const note = await api('POST', `/tickets/${ticketId}/comments`, {
    type: 'note', content: 'Internal team note', authorName: 'Sarah Jenkins',
  }, agentToken);
  assert('POST note creates internal note', note.success && note.data.type === 'note');

  const comments = await api('GET', `/tickets/${ticketId}/comments`, null, agentToken);
  assert('GET comments returns array', comments.success && Array.isArray(comments.data));
  assert('Has both reply and note types', comments.data.some((c) => c.type === 'reply') && comments.data.some((c) => c.type === 'note'));

  const noContent = await api('POST', `/tickets/${ticketId}/comments`, { authorName: 'Agent' }, agentToken);
  assert('Rejects comment without content', !noContent.success);

  const noAuthor = await api('POST', `/tickets/${ticketId}/comments`, { content: 'Test' }, agentToken);
  assert('Rejects comment without authorName', !noAuthor.success);

  // ──────── 11. ACTIVITY HISTORY ────────
  console.log('\n▶ Activity History');
  const activities = await api('GET', `/tickets/${ticketId}/activities`, null, agentToken);
  assert('GET activities returns array', activities.success && Array.isArray(activities.data));
  assert('Has CREATED activity', activities.data.some((a) => a.action === 'CREATED'));
  assert('Has STATUS_CHANGED activity', activities.data.some((a) => a.action === 'STATUS_CHANGED'));
  assert('Has PRIORITY_CHANGED activity', activities.data.some((a) => a.action === 'PRIORITY_CHANGED'));
  assert('Has ASSIGNEE_CHANGED activity', activities.data.some((a) => a.action === 'ASSIGNEE_CHANGED'));
  assert('Has REPLY_ADDED activity', activities.data.some((a) => a.action === 'REPLY_ADDED'));
  assert('Has NOTE_ADDED activity', activities.data.some((a) => a.action === 'NOTE_ADDED'));

  // ──────── 12. DASHBOARD ────────
  console.log('\n▶ Dashboard Stats');
  const dash = await api('GET', '/dashboard/stats', null, agentToken);
  assert('GET /api/dashboard/stats returns data', dash.success && dash.data);
  assert('totalTickets > 0', dash.data.totalTickets > 0);
  assert('priorityBreakdown has all levels', 'Low' in dash.data.priorityBreakdown && 'Urgent' in dash.data.priorityBreakdown);

  const sum = dash.data.openTickets + dash.data.inProgressTickets + dash.data.waitingTickets + dash.data.resolvedTickets;
  assert('Status counts sum to total', sum === dash.data.totalTickets, `sum=${sum}, total=${dash.data.totalTickets}`);

  assert('Overdue excludes Resolved', dash.data.overdueTickets <= dash.data.totalTickets - dash.data.resolvedTickets);

  // ──────── 13. DELETE — Role based ────────
  console.log('\n▶ Ticket Delete — Role Based');

  // Agent trying to delete (should fail)
  const agentDelete = await api('DELETE', `/tickets/${ticketId}`, null, agentToken);
  assert('Agent cannot delete ticket (403)', !agentDelete.success);

  // Admin can delete
  const adminDelete = await api('DELETE', `/tickets/${ticketId}`, null, adminToken);
  assert('Admin can delete ticket', adminDelete.success);

  // Verify cascade
  const gone = await api('GET', `/tickets/${ticketId}`, null, adminToken);
  assert('Deleted ticket returns 404', !gone.success);

  const orphanComments = await api('GET', `/tickets/${ticketId}/comments`, null, adminToken);
  assert('Comments cascade-deleted or return 404', orphanComments.status === 404 || (orphanComments.success && orphanComments.data.length === 0));

  const orphanActs = await api('GET', `/tickets/${ticketId}/activities`, null, adminToken);
  assert('Activities cascade-deleted or return 404', orphanActs.status === 404 || (orphanActs.success && orphanActs.data.length === 0));

  // ──────── 14. AUTH — Register (Admin only) ────────
  console.log('\n▶ Auth — Register (Admin Only)');
  const agentRegister = await api('POST', '/auth/register', {
    name: 'New Guy', email: 'new@test.com', password: 'test123',
  }, agentToken);
  assert('Agent cannot register new agents (403)', !agentRegister.success);

  const adminRegister = await api('POST', '/auth/register', {
    name: 'New Admin', email: 'new@admin.com', password: 'test123', role: 'Agent',
  }, adminToken);
  assert('Admin can register new agents', adminRegister.success);

  // ──────── 15. CUSTOMER / USER ROLE (Self-Service) ────────
  console.log('\n▶ Customer / User Role (Self-Service)');
  
  // Public signup
  const userSignup = await api('POST', '/auth/signup', {
    name: 'Customer Bob',
    email: `bob_${Date.now()}@example.com`,
    password: 'password123',
  });
  assert('Customer can register via /auth/signup', userSignup.success && userSignup.data.token);
  assert('Registered role is "User"', userSignup.data.agent.role === 'User');
  const userToken = userSignup.data.token;
  const userEmail = userSignup.data.agent.email;

  // User blocked from Staff endpoints
  const userAgents = await api('GET', '/agents', null, userToken);
  assert('Customer cannot access /api/agents (403)', userAgents.status === 403);

  const userDash = await api('GET', '/dashboard/stats', null, userToken);
  assert('Customer cannot access /api/dashboard/stats (403)', userDash.status === 403);

  // User creates a ticket (raising a ticket)
  const userTicketRes = await api('POST', '/tickets', {
    subject: 'My order #1234 has not shipped yet',
    description: 'Placed order 3 days ago and need an update.',
    priority: 'Medium',
  }, userToken);
  assert('Customer can raise a ticket', userTicketRes.success && userTicketRes.data._id);
  assert('Customer name/email auto-bound to ticket', userTicketRes.data.customer.includes(userEmail));
  assert('Ticket defaults to Open status', userTicketRes.data.status === 'Open');
  const userTicketId = userTicketRes.data._id;

  // User lists tickets — only sees their own
  const userTickets = await api('GET', '/tickets', null, userToken);
  assert('Customer can list tickets', userTickets.success);
  assert('Customer only sees their own tickets', userTickets.data.length === 1 && userTickets.data[0]._id === userTicketId);

  // User cannot access another ticket belonging to someone else
  const adminAllTickets = await api('GET', '/tickets', null, adminToken);
  const otherTicket = adminAllTickets.data.find((t) => !t.customer.includes(userEmail));
  const forbiddenTicket = await api('GET', `/tickets/${otherTicket._id}`, null, userToken);
  assert('Customer cannot view other users tickets (403)', forbiddenTicket.status === 403);

  // User can view their own ticket
  const ownTicket = await api('GET', `/tickets/${userTicketId}`, null, userToken);
  assert('Customer can view their own ticket (200)', ownTicket.success && ownTicket.data._id === userTicketId);

  // User cannot directly change ticket status or priority (403)
  const userUpdate = await api('PATCH', `/tickets/${userTicketId}`, { status: 'Resolved' }, userToken);
  assert('Customer cannot edit ticket fields directly (403)', userUpdate.status === 403);

  // User can reply to their ticket
  const userReply = await api('POST', `/tickets/${userTicketId}/comments`, {
    content: 'Thank you for looking into this!',
  }, userToken);
  assert('Customer can post a reply to their ticket', userReply.success && userReply.data.type === 'reply');

  // Staff adds internal note to user ticket
  await api('POST', `/tickets/${userTicketId}/comments`, {
    type: 'note',
    content: 'Staff internal note: Carrier delayed shipment.',
    authorName: 'Sarah Jenkins',
  }, agentToken);

  // Customer checks comments — should NOT see internal notes!
  const userComments = await api('GET', `/tickets/${userTicketId}/comments`, null, userToken);
  assert('Customer comments query succeeds', userComments.success);
  assert('Customer cannot see internal notes', !userComments.data.some((c) => c.type === 'note'));

  // User cannot delete ticket
  const userDelete = await api('DELETE', `/tickets/${userTicketId}`, null, userToken);
  assert('Customer cannot delete ticket (403)', userDelete.status === 403);

  // ──────── 16. EDGE CASES ────────
  console.log('\n▶ Edge Cases');
  const notFound = await api('GET', '/nonexistent', null, adminToken);
  assert('Unknown route returns 404', !notFound.success);


  // ──────────── SUMMARY ────────────
  console.log('\n══════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════');
  if (errors.length > 0) {
    console.log('\n  Failed tests:');
    errors.forEach((e) => console.log(e));
  }
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
