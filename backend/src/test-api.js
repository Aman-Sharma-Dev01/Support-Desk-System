/**
 * Comprehensive Backend API Test Suite
 * Tests all endpoints against the running server at localhost:5000
 * Run: node src/test-api.js
 */

const BASE = 'http://localhost:5000/api';
let passed = 0;
let failed = 0;
const errors = [];

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
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
  console.log('\n══════════════════════════════════════════');
  console.log('  SUPPORT DESK SYSTEM — BACKEND API TESTS');
  console.log('══════════════════════════════════════════\n');

  // ──────── 1. HEALTH CHECK ────────
  console.log('▶ Health Check');
  const health = await api('GET', '/health');
  assert('GET /api/health returns ok', health.status === 'ok');

  // ──────── 2. AGENTS ────────
  console.log('\n▶ Agents');
  const agents = await api('GET', '/agents');
  assert('GET /api/agents returns agents array', agents.success && Array.isArray(agents.data));
  assert('Seeded 4 agents', agents.data.length === 4);

  // Create agent
  const newAgent = await api('POST', '/agents', { name: 'Test Agent', email: 'test@test.com' });
  assert('POST /api/agents creates agent', newAgent.success && newAgent.data.name === 'Test Agent', JSON.stringify(newAgent));

  // Duplicate agent email
  const dupAgent = await api('POST', '/agents', { name: 'Dup Agent', email: 'test@test.com' });
  assert('POST /api/agents rejects duplicate email (409)', !dupAgent.success);

  // Missing fields
  const badAgent = await api('POST', '/agents', { name: '' });
  assert('POST /api/agents rejects missing email (400)', !badAgent.success);

  // ──────── 3. TICKETS - CREATE ────────
  console.log('\n▶ Tickets — Create');
  const newTicket = await api('POST', '/tickets', {
    subject: 'API Test Ticket',
    customer: 'test@customer.com',
    description: 'Testing ticket creation via API',
    priority: 'High',
  });
  assert('POST /api/tickets creates ticket (201)', newTicket.success && newTicket.data._id, JSON.stringify(newTicket));
  const ticketId = newTicket.data?._id;

  // Required field validation
  const noSubject = await api('POST', '/tickets', { customer: 'a@b.com', description: 'test' });
  assert('Rejects ticket without subject', !noSubject.success);

  const noCustomer = await api('POST', '/tickets', { subject: 'test', description: 'test' });
  assert('Rejects ticket without customer', !noCustomer.success);

  const noDesc = await api('POST', '/tickets', { subject: 'test', customer: 'a@b.com' });
  assert('Rejects ticket without description', !noDesc.success);

  // Invalid enum
  const badStatus = await api('POST', '/tickets', {
    subject: 'test', customer: 'a@b.com', description: 'test', status: 'InvalidStatus',
  });
  assert('Rejects invalid status', !badStatus.success);

  const badPriority = await api('POST', '/tickets', {
    subject: 'test', customer: 'a@b.com', description: 'test', priority: 'SuperHigh',
  });
  assert('Rejects invalid priority', !badPriority.success);

  // ──────── 4. TICKETS - LIST, SEARCH, FILTER, SORT ────────
  console.log('\n▶ Tickets — List, Search, Filter, Sort');
  const allTickets = await api('GET', '/tickets');
  assert('GET /api/tickets returns tickets', allTickets.success && Array.isArray(allTickets.data));
  assert('Has seeded + new tickets (≥6)', allTickets.total >= 6, `total=${allTickets.total}`);

  // Search
  const searchResult = await api('GET', '/tickets?search=payment');
  assert('Search by subject keyword "payment"', searchResult.success && searchResult.data.length >= 1);

  const searchEmail = await api('GET', '/tickets?search=billing@enterprise');
  assert('Search by customer email', searchEmail.success && searchEmail.data.length >= 1);

  // Filter by status
  const openOnly = await api('GET', '/tickets?status=Open');
  assert('Filter status=Open', openOnly.success && openOnly.data.every((t) => t.status === 'Open'));

  const resolvedOnly = await api('GET', '/tickets?status=Resolved');
  assert('Filter status=Resolved', resolvedOnly.success && resolvedOnly.data.every((t) => t.status === 'Resolved'));

  // Filter by priority
  const urgentOnly = await api('GET', '/tickets?priority=Urgent');
  assert('Filter priority=Urgent', urgentOnly.success && urgentOnly.data.every((t) => t.priority === 'Urgent'));

  // Filter by assignee
  const sarahTickets = await api('GET', '/tickets?assignee=Sarah Jenkins');
  assert('Filter assignee=Sarah Jenkins', sarahTickets.success && sarahTickets.data.every((t) => t.assignee === 'Sarah Jenkins'));

  // Combined filters
  const combo = await api('GET', '/tickets?status=Open&priority=Low');
  assert('Combined filter status=Open + priority=Low', combo.success && combo.data.every((t) => t.status === 'Open' && t.priority === 'Low'));

  // Sort by priority
  const byPriority = await api('GET', '/tickets?sortBy=priority');
  assert('Sort by priority returns results', byPriority.success && byPriority.data.length > 0);
  if (byPriority.data.length >= 2) {
    const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
    const first = priorityOrder[byPriority.data[0].priority] || 0;
    const second = priorityOrder[byPriority.data[1].priority] || 0;
    assert('Priority sort order is descending', first >= second);
  }

  // Overdue filter
  const overdueTickets = await api('GET', '/tickets?overdueOnly=true');
  assert('Overdue filter returns results', overdueTickets.success);
  assert('Overdue tickets are not Resolved', overdueTickets.data.every((t) => t.status !== 'Resolved'));

  // Pagination
  const page1 = await api('GET', '/tickets?page=1&limit=2');
  assert('Pagination page=1 limit=2', page1.success && page1.data.length <= 2 && page1.totalPages >= 1);

  // ──────── 5. TICKETS - GET BY ID ────────
  console.log('\n▶ Tickets — Get By ID');
  const fetchedTicket = await api('GET', `/tickets/${ticketId}`);
  assert('GET /api/tickets/:id returns ticket', fetchedTicket.success && fetchedTicket.data._id === ticketId);
  assert('isOverdue virtual is present', fetchedTicket.data.isOverdue !== undefined);

  // Invalid ID
  const badId = await api('GET', '/tickets/invalidid123');
  assert('Invalid ObjectId returns 400', !badId.success);

  // Non-existent ID
  const fakeId = await api('GET', '/tickets/507f1f77bcf86cd799439011');
  assert('Non-existent ticket returns 404', !fakeId.success);

  // ──────── 6. TICKETS - UPDATE ────────
  console.log('\n▶ Tickets — Update');
  const updated = await api('PATCH', `/tickets/${ticketId}`, {
    status: 'In Progress',
    updatedBy: 'Test Agent',
  });
  assert('PATCH updates status to In Progress', updated.success && updated.data.status === 'In Progress');

  const updatedPriority = await api('PATCH', `/tickets/${ticketId}`, {
    priority: 'Urgent',
    updatedBy: 'Test Agent',
  });
  assert('PATCH updates priority to Urgent', updatedPriority.success && updatedPriority.data.priority === 'Urgent');

  const updatedAssignee = await api('PATCH', `/tickets/${ticketId}`, {
    assignee: 'Sarah Jenkins',
    updatedBy: 'Test Agent',
  });
  assert('PATCH updates assignee', updatedAssignee.success && updatedAssignee.data.assignee === 'Sarah Jenkins');

  // Update subject & description
  const updatedDetails = await api('PUT', `/tickets/${ticketId}`, {
    subject: 'Updated Subject',
    description: 'Updated description text',
  });
  assert('PUT updates subject and description', updatedDetails.success && updatedDetails.data.subject === 'Updated Subject');

  // Invalid update
  const badUpdate = await api('PATCH', `/tickets/${ticketId}`, { status: 'FakeStatus' });
  assert('Rejects invalid status update', !badUpdate.success);

  // ──────── 7. COMMENTS (Replies & Notes) ────────
  console.log('\n▶ Comments — Replies & Internal Notes');

  // Add public reply
  const reply = await api('POST', `/tickets/${ticketId}/comments`, {
    type: 'reply',
    content: 'This is a public reply to the customer',
    authorName: 'Test Agent',
  });
  assert('POST reply creates comment (201)', reply.success && reply.data.type === 'reply');

  // Add internal note
  const note = await api('POST', `/tickets/${ticketId}/comments`, {
    type: 'note',
    content: 'Internal team note — do not share with customer',
    authorName: 'Test Agent',
  });
  assert('POST note creates internal note (201)', note.success && note.data.type === 'note');

  // Get comments
  const comments = await api('GET', `/tickets/${ticketId}/comments`);
  assert('GET comments returns array', comments.success && Array.isArray(comments.data));
  assert('Comments are in chronological order', comments.data.length >= 2);
  if (comments.data.length >= 2) {
    const times = comments.data.map((c) => new Date(c.createdAt).getTime());
    const sorted = times.every((t, i) => i === 0 || t >= times[i - 1]);
    assert('Comments sorted chronologically', sorted);
  }

  // Check reply and note are distinguishable
  const hasReply = comments.data.some((c) => c.type === 'reply');
  const hasNote = comments.data.some((c) => c.type === 'note');
  assert('Reply type is distinguishable', hasReply);
  assert('Note type is distinguishable', hasNote);

  // Validation: missing content
  const noContent = await api('POST', `/tickets/${ticketId}/comments`, { authorName: 'Agent' });
  assert('Rejects comment without content', !noContent.success);

  // Validation: missing author
  const noAuthor = await api('POST', `/tickets/${ticketId}/comments`, { content: 'Test' });
  assert('Rejects comment without authorName', !noAuthor.success);

  // Comment on non-existent ticket
  const ghostComment = await api('POST', '/tickets/507f1f77bcf86cd799439011/comments', {
    content: 'test', authorName: 'Agent', type: 'reply',
  });
  assert('Rejects comment on non-existent ticket (404)', !ghostComment.success);

  // ──────── 8. ACTIVITY HISTORY ────────
  console.log('\n▶ Activity History');
  const activities = await api('GET', `/tickets/${ticketId}/activities`);
  assert('GET activities returns array', activities.success && Array.isArray(activities.data));
  assert('Has CREATED activity', activities.data.some((a) => a.action === 'CREATED'));
  assert('Has STATUS_CHANGED activity', activities.data.some((a) => a.action === 'STATUS_CHANGED'));
  assert('Has PRIORITY_CHANGED activity', activities.data.some((a) => a.action === 'PRIORITY_CHANGED'));
  assert('Has ASSIGNEE_CHANGED activity', activities.data.some((a) => a.action === 'ASSIGNEE_CHANGED'));
  assert('Has REPLY_ADDED activity', activities.data.some((a) => a.action === 'REPLY_ADDED'));
  assert('Has NOTE_ADDED activity', activities.data.some((a) => a.action === 'NOTE_ADDED'));

  // Activities in chronological order
  if (activities.data.length >= 2) {
    const times = activities.data.map((a) => new Date(a.createdAt).getTime());
    const sorted = times.every((t, i) => i === 0 || t >= times[i - 1]);
    assert('Activities sorted chronologically', sorted);
  }

  // Check seeded ticket activities
  const seededTickets = await api('GET', '/tickets');
  const seededTicketWithActivities = seededTickets.data.find((t) => t.subject.includes('payment webhook'));
  if (seededTicketWithActivities) {
    const seededActs = await api('GET', `/tickets/${seededTicketWithActivities._id}/activities`);
    assert('Seeded ticket 1 has ≥5 activities', seededActs.success && seededActs.data.length >= 5, `count=${seededActs.data?.length}`);
  }

  // ──────── 9. DASHBOARD ────────
  console.log('\n▶ Dashboard Stats');
  const dash = await api('GET', '/dashboard/stats');
  assert('GET /api/dashboard/stats returns data', dash.success && dash.data);
  assert('totalTickets is a number > 0', typeof dash.data.totalTickets === 'number' && dash.data.totalTickets > 0);
  assert('openTickets is a number', typeof dash.data.openTickets === 'number');
  assert('inProgressTickets is a number', typeof dash.data.inProgressTickets === 'number');
  assert('resolvedTickets is a number', typeof dash.data.resolvedTickets === 'number');
  assert('urgentTickets is a number', typeof dash.data.urgentTickets === 'number');
  assert('overdueTickets is a number', typeof dash.data.overdueTickets === 'number');
  assert('priorityBreakdown has all levels', dash.data.priorityBreakdown && 'Low' in dash.data.priorityBreakdown && 'Urgent' in dash.data.priorityBreakdown);
  assert('sampleOverdueTickets is array', Array.isArray(dash.data.sampleOverdueTickets));

  // Verify resolved ticket doesn't count as overdue
  assert('Resolved tickets should not be overdue (overdue < total - resolved)',
    dash.data.overdueTickets <= dash.data.totalTickets - dash.data.resolvedTickets);

  // Verify counts add up (open + inProgress + waiting + resolved may equal total)
  const sum = dash.data.openTickets + dash.data.inProgressTickets + dash.data.waitingTickets + dash.data.resolvedTickets;
  assert('Status counts sum to total', sum === dash.data.totalTickets, `sum=${sum}, total=${dash.data.totalTickets}`);

  // ──────── 10. TICKET DELETE (Cascade) ────────
  console.log('\n▶ Ticket Delete — Cascade');
  const delResult = await api('DELETE', `/tickets/${ticketId}`);
  assert('DELETE /api/tickets/:id succeeds', delResult.success);

  // Verify ticket is gone
  const gone = await api('GET', `/tickets/${ticketId}`);
  assert('Deleted ticket returns 404', !gone.success);

  // Verify comments are cascade-deleted
  const orphanComments = await api('GET', `/tickets/${ticketId}/comments`);
  assert('Comments cascade-deleted (empty)', orphanComments.success && orphanComments.data.length === 0);

  // Verify activities are cascade-deleted
  const orphanActs = await api('GET', `/tickets/${ticketId}/activities`);
  assert('Activities cascade-deleted (empty)', orphanActs.success && orphanActs.data.length === 0);

  // Delete non-existent ticket
  const delMissing = await api('DELETE', '/tickets/507f1f77bcf86cd799439011');
  assert('Delete non-existent ticket returns 404', !delMissing.success);

  // ──────── 11. 404 ROUTE ────────
  console.log('\n▶ Edge Cases');
  const notFound = await api('GET', '/nonexistent');
  assert('Unknown route returns 404', !notFound.success);

  // ──────────── SUMMARY ────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════');
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
