import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import {
  connectMongo, disconnectMongo, createLogger, env, mongoose,
  createProducer, createMetrics, TOPICS,
} from "../../shared/index.js";

const log = createLogger("seed");
const metrics = createMetrics("seed");
const ticketCode = customAlphabet("0123456789ABCDEFGHJKMNPQRSTUVWXYZ", 8);

const loose = (collection) =>
  mongoose.model(collection, new mongoose.Schema({}, { strict: false, collection, timestamps: true }), collection);

/* ------------------------------------------------------------------ */

const CITIZENS = [
  { mobile: "9876543210", fullName: "Murugan Selvam",   district: "Tiruvallur",      occupation: "Farmer",            income: 95000,  category: "obc",     dob: "1964-04-12", gender: "male",   rural: true,  land: 2.5 },
  { mobile: "9876543211", fullName: "Lakshmi Devi",     district: "Madurai",         occupation: "Tailor",            income: 72000,  category: "sc",      dob: "1979-08-23", gender: "female", rural: false, land: null },
  { mobile: "9876543212", fullName: "Ravi Chandran",    district: "Coimbatore",      occupation: "Auto driver",       income: 118000, category: "obc",     dob: "1986-01-30", gender: "male",   rural: false, land: null },
  { mobile: "9876543213", fullName: "Anjali Krishnan",  district: "Chennai",         occupation: "Teacher",           income: 34000, category: "general", dob: "1991-11-05", gender: "female", rural: false, land: null },
  { mobile: "9876543214", fullName: "Subramani Iyer",   district: "Thanjavur",       occupation: "Farmer",            income: 88000,  category: "general", dob: "1958-06-18", gender: "male",   rural: true,  land: 4.0 },
  { mobile: "9876543215", fullName: "Meena Rajan",      district: "Salem",           occupation: "Domestic worker",   income: 54000,  category: "sc",      dob: "1983-03-09", gender: "female", rural: true,  land: null },
  { mobile: "9876543216", fullName: "Karthik Venkat",   district: "Tiruchirappalli", occupation: "Shopkeeper",        income: 165000, category: "obc",     dob: "1988-09-14", gender: "male",   rural: false, land: null },
  { mobile: "9876543217", fullName: "Saraswathi Muthu", district: "Tirunelveli",     occupation: "Agricultural labour",income: 48000,  category: "st",      dob: "1970-12-02", gender: "female", rural: true,  land: 0.5 },
  { mobile: "9876543218", fullName: "Ganesan Pillai",   district: "Vellore",         occupation: "Mason",             income: 132000, category: "obc",     dob: "1975-05-27", gender: "male",   rural: false, land: null },
  { mobile: "9876543219", fullName: "Priya Dharshini",  district: "Erode",           occupation: "Weaver",            income: 81000,  category: "obc",     dob: "1994-02-16", gender: "female", rural: true,  land: null },
  { mobile: "9876543220", fullName: "Arumugam Kannan",  district: "Dindigul",        occupation: "Farmer",            income: 103000, category: "sc",      dob: "1961-10-08", gender: "male",   rural: true,  land: 1.8 },
  { mobile: "9876543221", fullName: "Kavitha Suresh",   district: "Kanchipuram",     occupation: "Nurse",             income: 285000, category: "general", dob: "1990-07-21", gender: "female", rural: false, land: null },
];

const OFFICERS = [
  { mobile: "9000000001", fullName: "Rajesh Kumar IAS",   department: "Water Resources" },
  { mobile: "9000000002", fullName: "Devi Priya",         department: "Social Welfare" },
  { mobile: "9000000003", fullName: "Anand Subramanian",  department: "Revenue" },
];

const GRIEVANCES = [
  { c: 0,  subject: "No drinking water supply for five days",            desc: "Our street in Tiruvallur has had no piped water supply since Monday. The borewell is also dry and around forty families are affected. We have informed the local office twice with no response.", cat: "water_supply", dept: "Water Resources",           sev: "high",     status: "in_progress", ageDays: 3,  reason: "Sustained loss of an essential service affecting many households" },
  { c: 1,  subject: "Old age pension not credited for three months",     desc: "My mother is 74 and has received the old age pension for two years. Since June nothing has been credited to her account. We visited the taluk office twice but received no clear answer. She depends on this for medicines.", cat: "pension", dept: "Social Welfare",           sev: "high",     status: "triaged",     ageDays: 1,  reason: "Delayed welfare payment causing sustained hardship to an elderly citizen" },
  { c: 2,  subject: "Street light not working on main road",             desc: "The street lights on Gandhi Road near the bus stand have not worked for two weeks. It is completely dark at night and there have been two accidents already. School children walk this route.", cat: "electricity", dept: "Electricity Board",     sev: "medium",   status: "resolved",    ageDays: 12, reason: "Public infrastructure defect with a safety dimension" },
  { c: 3,  subject: "Delay in issuing income certificate",               desc: "I applied for an income certificate at the e-Sevai centre 28 days ago. The prescribed time is 15 working days. My daughter's college admission depends on this document and the deadline is next week.", cat: "certificates", dept: "Revenue",              sev: "medium",   status: "in_progress", ageDays: 6,  reason: "Documentation delay past the stated service timeline" },
  { c: 4,  subject: "Crop insurance claim rejected without reason",      desc: "My paddy crop was damaged in the November floods. I reported within 72 hours as required and the field was inspected. The claim has been rejected with no explanation given. I have all receipts and the sowing certificate.", cat: "certificates", dept: "Agriculture",          sev: "high",     status: "triaged",     ageDays: 2,  reason: "Denied entitlement with no stated justification" },
  { c: 5,  subject: "Ration shop refusing to give full quota",           desc: "The fair price shop in our area has been giving only half the rice quota for the past two months. When we ask, they say stock has not arrived. Other shops nearby are giving the full amount.", cat: "ration", dept: "Civil Supplies",              sev: "high",     status: "in_progress", ageDays: 4,  reason: "Essential food entitlement being withheld" },
  { c: 6,  subject: "Garbage not collected in our street for ten days",  desc: "Waste collection has stopped in our ward for ten days. Garbage is piling up near the water tank and there is a bad smell. Children are falling sick and mosquitoes have increased.", cat: "sanitation", dept: "Municipal Administration", sev: "high",  status: "triaged",     ageDays: 1,  reason: "Sanitation failure creating a public health risk" },
  { c: 7,  subject: "Patta transfer pending for four months",            desc: "After my father passed away I applied for patta transfer with the legal heir certificate and death certificate. It has been four months. The VAO says it is with the Tahsildar and the Tahsildar says documents are missing.", cat: "land_records", dept: "Revenue",           sev: "medium",   status: "in_progress", ageDays: 9,  reason: "Land record transfer stalled well past normal processing time" },
  { c: 8,  subject: "Pothole on main road causing accidents",            desc: "There is a large pothole near the junction on the Vellore bypass. Two two-wheeler riders have fallen in the last week. It gets worse after rain because it fills with water and is not visible.", cat: "roads", dept: "Public Works",                 sev: "high",     status: "resolved",    ageDays: 18, reason: "Road defect with repeated injury incidents reported" },
  { c: 9,  subject: "Handloom subsidy application not processed",        desc: "I applied for the handloom weaver subsidy six months ago through the cooperative society. Other weavers who applied after me have received it. My application shows as pending with no reason given.", cat: "employment", dept: "Handlooms and Textiles", sev: "medium", status: "triaged",     ageDays: 5,  reason: "Subsidy application appears skipped in processing order" },
  { c: 10, subject: "PM-KISAN instalment not received",                  desc: "I have been receiving PM-KISAN for three years. The last two instalments have not come. My e-KYC is complete and my Aadhaar is linked to the bank account. The VAO office has no explanation.", cat: "pension", dept: "Agriculture",              sev: "high",     status: "in_progress", ageDays: 7,  reason: "Central scheme payment interrupted despite compliance" },
  { c: 11, subject: "Primary health centre has no doctor",               desc: "The PHC in our block has had no doctor posted for three weeks. Only a nurse is available. Patients including pregnant women are being sent to the district hospital which is 40 km away.", cat: "health", dept: "Health and Family Welfare",  sev: "critical", status: "in_progress", ageDays: 2,  reason: "Absence of medical staff creating a risk to life in a rural area" },
  { c: 0,  subject: "Agricultural mechanisation subsidy rejected",       desc: "I applied for a power tiller subsidy under the mechanisation scheme. I am a small farmer with 2.5 acres and should get 50 percent. The application was rejected saying targets were met, but applications are still open.", cat: "employment", dept: "Agriculture",           sev: "medium",   status: "triaged",     ageDays: 1,  reason: "Subsidy denial on grounds that appear inconsistent with open applications" },
  { c: 3,  subject: "School building roof leaking in classrooms",        desc: "The government primary school in our area has a badly leaking roof. During rain the children sit in wet classrooms and books get damaged. The headmaster has written to the block office twice.", cat: "education", dept: "School Education",       sev: "medium",   status: "triaged",     ageDays: 3,  reason: "School infrastructure defect affecting daily teaching" },
  { c: 5,  subject: "Community certificate application rejected twice",  desc: "I applied for a community certificate with my father's certificate and school records. It has been rejected twice without explanation. The e-Sevai centre says to reapply but does not say what is wrong.", cat: "certificates", dept: "Revenue",             sev: "medium",   status: "in_progress", ageDays: 11, reason: "Repeated rejection without stated deficiency" },
  { c: 7,  subject: "Widow pension application pending since March",     desc: "I applied for the widow pension in March after my husband passed away. It is now September. I have submitted the death certificate, income certificate and bank details. No response from the taluk office.", cat: "pension", dept: "Social Welfare",           sev: "high",     status: "triaged",     ageDays: 2,  reason: "Welfare application unaddressed for six months" },
  { c: 9,  subject: "Free bus pass not honoured by conductor",           desc: "Women travel free on ordinary town buses but the conductor on route 14B insisted on charging and argued when I explained the rule. This has happened three times on the same route.", cat: "other", dept: "Transport",                     sev: "low",      status: "resolved",    ageDays: 22, reason: "Stated entitlement not being applied by staff" },
  { c: 10, subject: "Borewell water contaminated in our village",        desc: "The borewell water in our village has turned yellowish and has a smell for the past month. Several people have had stomach problems. We are buying water but many families cannot afford it.", cat: "water_supply", dept: "Water Resources",     sev: "critical", status: "in_progress", ageDays: 5,  reason: "Contaminated drinking water with reported illness in the community" },
  { c: 2,  subject: "Transformer damaged, no power for three days",      desc: "The transformer serving our area burnt out three days ago. Around 200 houses have no electricity. The complaint was registered but no crew has come. Shops are losing stock in refrigerators.", cat: "electricity", dept: "Electricity Board",    sev: "high",     status: "resolved",    ageDays: 15, reason: "Complete power loss affecting a large number of households" },
  { c: 4,  subject: "Encroachment on village common land",               desc: "A portion of the village common land near the temple has been fenced off by a private party. This land has been used by the community for grazing for decades. The VAO has been informed but nothing has happened.", cat: "land_records", dept: "Revenue",       sev: "medium",   status: "triaged",     ageDays: 4,  reason: "Alleged encroachment on public land requiring revenue verification" },
];

const SLA_HOURS = { critical: 24, high: 72, medium: 168, low: 336 };

/* ------------------------------------------------------------------ */

async function seedAuth() {
  await connectMongo(env.mongo.db.auth, log);
  const User = loose("users");

  const mobiles = [...CITIZENS, ...OFFICERS].map((u) => u.mobile);
  await User.deleteMany({ mobile: { $in: mobiles } });

  const citizenHash = await bcrypt.hash("Citizen@123", 12);
  const officerHash = await bcrypt.hash("Officer@123", 12);

  const citizenDocs = await User.insertMany(
    CITIZENS.map((c) => ({
      mobile: c.mobile, fullName: c.fullName, passwordHash: citizenHash,
      role: "citizen", isVerified: true, isActive: true, failedAttempts: 0,
      email: `${c.mobile}@citizen.in`, // Added to avoid MongoDB duplicate key E11000 on email
    }))
  );

  await User.insertMany(
    OFFICERS.map((o) => ({
      mobile: o.mobile, fullName: o.fullName, passwordHash: officerHash,
      role: "officer", department: o.department, isVerified: true, isActive: true, failedAttempts: 0,
      email: `${o.mobile}@officer.in`, // Added to avoid MongoDB duplicate key E11000 on email
    }))
  );

  log.info(`Seeded ${citizenDocs.length} citizens and ${OFFICERS.length} officers`);

  const ids = citizenDocs.map((d) => d._id.toString());
  await mongoose.connection.close();
  return ids;
}

async function seedProfiles(userIds) {
  await connectMongo(env.mongo.db.profile, log);
  const Profile = loose("citizenprofiles");

  await Profile.deleteMany({ userId: { $in: userIds } });

  const SCORED = 10;
  await Profile.insertMany(
    CITIZENS.map((c, i) => ({
      userId: userIds[i],
      fullName: c.fullName,
      mobile: c.mobile,
      email: `${c.mobile}@citizen.in`, // Changed from null to avoid duplicate key error just in case
      dateOfBirth: new Date(c.dob),
      gender: c.gender,
      address: { line1: "", line2: "", district: c.district, state: "Tamil Nadu", pincode: "600001" },
      occupation: c.occupation,
      annualIncome: c.income,
      category: c.category,
      isRuralResident: c.rural,
      landHoldingAcres: c.land,
      preferredLanguage: "en",
      completeness: Math.round((9 / SCORED) * 100),
    }))
  );

  log.info(`Seeded ${CITIZENS.length} citizen profiles`);
  await mongoose.connection.close();
}

async function seedGrievances(userIds) {
  await connectMongo(env.mongo.db.grievance, log);
  const Grievance = loose("grievances");
  await Grievance.deleteMany({});

  const docs = GRIEVANCES.map((g) => {
    const citizen = CITIZENS[g.c];
    const created = new Date(Date.now() - g.ageDays * 86400000);
    const slaDue = new Date(created.getTime() + (SLA_HOURS[g.sev] || 168) * 3600000);

    const timeline = [
      { status: "submitted", note: "Grievance received", actorRole: "citizen", at: created },
      { status: "triaged",   note: `Routed to ${g.dept} (ai)`, actorRole: "system", at: new Date(created.getTime() + 2000) },
    ];

    if (g.status === "in_progress" || g.status === "resolved") {
      timeline.push({
        status: "in_progress",
        note: "Assigned to the field team for inspection.",
        actorRole: "officer",
        at: new Date(created.getTime() + 86400000),
      });
    }

    if (g.status === "resolved") {
      timeline.push({
        status: "resolved",
        note: "Issue inspected and rectified. Closing the ticket.",
        actorRole: "officer",
        at: new Date(created.getTime() + 3 * 86400000),
      });
    }

    return {
      ticketId: `GRV-${ticketCode()}`,
      userId: userIds[g.c],
      citizenName: citizen.fullName,
      mobile: citizen.mobile,
      subject: g.subject,
      description: g.desc,
      district: citizen.district,
      category: g.cat,
      department: g.dept,
      severity: g.sev,
      status: g.status,
      slaDueAt: slaDue,
      resolvedAt: g.status === "resolved" ? new Date(created.getTime() + 3 * 86400000) : null,
      resolution: g.status === "resolved" ? "Issue inspected and rectified." : null,
      triage: {
        method: "ai",
        confidence: 0.78 + Math.random() * 0.18,
        reasoning: g.reason,
        draftResponse: `Thank you for reporting this. Your grievance has been registered and routed to ${g.dept}. An officer will review it and you will be notified of any update.`,
      },
      timeline,
      createdAt: created,
      updatedAt: timeline[timeline.length - 1].at,
    };
  });

  await Grievance.insertMany(docs);
  log.info(`Seeded ${docs.length} grievances`);
  await mongoose.connection.close();
  return docs;
}

async function seedNotifications(userIds, grievances) {
  await connectMongo(env.mongo.db.notification, log);
  const Notification = loose("notifications");
  await Notification.deleteMany({ userId: { $in: userIds } });

  const docs = [];

  for (const g of grievances) {
    docs.push({
      userId: g.userId,
      type: "grievance.created",
      title: `Grievance ${g.ticketId} received`,
      message: `Your complaint has been routed to ${g.department}. We aim to respond by ${g.slaDueAt.toLocaleDateString("en-IN")}.`,
      channel: "in_app",
      link: `/grievances/${g.ticketId}`,
      meta: { ticketId: g.ticketId, department: g.department, severity: g.severity },
      read: g.status === "resolved",
      readAt: g.status === "resolved" ? new Date() : null,
      createdAt: g.createdAt,
      updatedAt: g.createdAt,
    });

    if (g.status === "resolved") {
      docs.push({
        userId: g.userId,
        type: "grievance.updated",
        title: `Grievance ${g.ticketId} resolved`,
        message: "Status: resolved. Issue inspected and rectified.",
        channel: "in_app",
        link: `/grievances/${g.ticketId}`,
        meta: { ticketId: g.ticketId, status: "resolved" },
        read: false,
        createdAt: g.resolvedAt,
        updatedAt: g.resolvedAt,
      });
    }
  }

  await Notification.insertMany(docs);
  log.info(`Seeded ${docs.length} notifications`);
  await mongoose.connection.close();
}

/* ------------------------------------------------------------------ */

async function main() {
  log.info("Seeding CivicConnect demo data");

  const userIds = await seedAuth();
  await seedProfiles(userIds);
  const grievances = await seedGrievances(userIds);
  await seedNotifications(userIds, grievances);

  log.info("");
  log.info("Seed complete.");
  log.info("  Citizens: 9876543210 – 9876543221, password Citizen@123");
  log.info("  Officers: 9000000001 – 9000000003, password Officer@123");
  log.info(`  ${grievances.length} grievances across 10 departments`);

  process.exit(0);
}

main().catch((err) => {
  log.error({ err: err.message, stack: err.stack }, "Seeding failed");
  process.exit(1);
});
