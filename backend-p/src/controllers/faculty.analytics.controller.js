  import { facultyAnalytics } from "../dal/faculty.analytics.dal.js";

  export async function getFacultyAnalytics(req, res, next) {
    try {
      const data = await facultyAnalytics();
      return res.json({ ok: true, data });
    } catch (err) {
      console.error("faculty.analytics.controller:", err);
      next(err);
    }
  }
