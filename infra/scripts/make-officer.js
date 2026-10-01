import bcrypt from "bcryptjs";
import { connectMongo, disconnectMongo, createLogger, env, mongoose } from "../../shared/index.js";

const log = createLogger("make-officer");

const userSchema = new mongoose.Schema({}, { strict: false, collection: "users", timestamps: true });
const User = mongoose.model("UserRaw", userSchema);

async function main() {
  await connectMongo(env.mongo.db.auth, log);

  const mobile = "9000000001";
  await User.deleteOne({ mobile });

  await User.create({
    mobile,
    email: "officer@civicconnect.gov",
    fullName: "Officer Rajesh Kumar",
    passwordHash: await bcrypt.hash("Officer@123", 12),
    role: "officer",
    department: "Water Resources",
    isVerified: true,
    isActive: true,
    failedAttempts: 0,
  });

  log.info(`Officer created — mobile ${mobile}, password Officer@123`);
  await disconnectMongo();
  process.exit(0);
}

main().catch((e) => { log.error({ err: e.message }); process.exit(1); });
