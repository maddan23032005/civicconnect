import {
  asyncHandler, NotFound, Forbidden, cache, TOPICS,
} from "../../../../shared/index.js";
import { CitizenProfile } from "../models/CitizenProfile.js";

const CACHE_TTL = 120;
const key = (userId) => `profile:${userId}`;

export function makeProfileController({ log, producer }) {
  return {
    /** Get my profile — auto-creates a stub on first call. */
    getMine: asyncHandler(async (req, res) => {
      const userId = req.user.sub;

      const hit = await cache.get(key(userId));
      if (hit) return res.json({ success: true, profile: hit, cached: true });

      let profile = await CitizenProfile.findOne({ userId });

      if (!profile) {
        profile = await CitizenProfile.create({
          userId,
          fullName: req.user.name || "Citizen",
          mobile: req.user.mobile,
        });
        log.info({ userId }, "Profile auto-created");
      }

      const payload = profile.toPublicJSON();
      await cache.set(key(userId), payload, CACHE_TTL);
      res.json({ success: true, profile: payload, cached: false });
    }),

    updateMine: asyncHandler(async (req, res) => {
      const userId = req.user.sub;

      const profile = await CitizenProfile.findOne({ userId });
      if (!profile) throw NotFound("Profile not found. Load your profile first.");

      const { address, ...rest } = req.body;
      Object.assign(profile, rest);
      if (address) profile.address = { ...profile.address.toObject(), ...address };

      await profile.save();
      await cache.del(key(userId));

      await producer.publish(TOPICS.auditLog, {
        event: "profile.updated",
        userId,
        completeness: profile.completeness,
      }, userId);

      res.json({ success: true, profile: profile.toPublicJSON() });
    }),

    /** Internal: other services fetch eligibility context by user id. */
    getEligibilityContext: asyncHandler(async (req, res) => {
      const { userId } = req.params;

      if (req.user.role === "citizen" && req.user.sub !== userId) {
        throw Forbidden("You can only access your own profile");
      }

      const profile = await CitizenProfile.findOne({ userId });
      if (!profile) throw NotFound("Profile not found");

      res.json({ success: true, context: profile.toEligibilityContext() });
    }),

    /** Officer/admin: paginated search. */
    search: asyncHandler(async (req, res) => {
      const { page, limit } = req.query;
      const { district, category, q } = req.query;

      const filter = {};
      if (district) filter["address.district"] = district;
      if (category) filter.category = category;
      if (q) filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { mobile: { $regex: q } },
      ];

      const [items, total] = await Promise.all([
        CitizenProfile.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
        CitizenProfile.countDocuments(filter),
      ]);

      res.json({
        success: true,
        profiles: items.map((p) => p.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }),
  };
}
