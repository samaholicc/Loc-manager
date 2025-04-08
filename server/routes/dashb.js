const express = require("express");
const router = express.Router();
const db = require("../mysql_connect");

router.post("/admin", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const totalOwnerPromise = new Promise((resolve, reject) => {
      db.totalowner((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const totalTenantPromise = new Promise((resolve, reject) => {
      db.totaltenant((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const totalEmployeePromise = new Promise((resolve, reject) => {
      db.totalemployee((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const [totalowner, totaltenant, totalemployee] = await Promise.all([
      totalOwnerPromise,
      totalTenantPromise,
      totalEmployeePromise,
    ]);

    res.json({ totalowner, totaltenant, totalemployee });
  } catch (err) {
    console.error("Error fetching admin dashboard data:", err);
    res.status(500).json({ error: "Error fetching admin dashboard data" });
  }
});

router.post("/tenant", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    await db.gettenantdata(userId, (err, result) => {
      if (err) {
        console.error("Error fetching tenant data:", err);
        return res.status(500).json({ error: "Error fetching tenant data" });
      }
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      res.json(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/owner", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const totalEmployeePromise = new Promise((resolve, reject) => {
      db.totalemployee((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const totalComplaintPromise = new Promise((resolve, reject) => {
      db.totalcomplaint((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const ownerDataPromise = new Promise((resolve, reject) => {
      db.getdata("owner", (err, result) => {
        if (err) reject(err);
        else {
          const owner = result.find((o) => `o-${o.owner_id}` === userId);
          resolve(owner);
        }
      });
    });

    const [totalemployee, totalcomplaint, owner] = await Promise.all([
      totalEmployeePromise,
      totalComplaintPromise,
      ownerDataPromise,
    ]);

    if (!owner) {
      return res.status(404).json({ error: "Owner not found" });
    }

    res.json({ totalemployee, totalcomplaint, owner });
  } catch (err) {
    console.error("Error fetching owner dashboard data:", err);
    res.status(500).json({ error: "Error fetching owner dashboard data" });
  }
});

router.post("/employee", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const totalComplaintPromise = new Promise((resolve, reject) => {
      db.totalcomplaint((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const salaryPromise = new Promise((resolve, reject) => {
      db.empsalary(userId, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const [totalcomplaint, salaryResult] = await Promise.all([
      totalComplaintPromise,
      salaryPromise,
    ]);

    if (!salaryResult || salaryResult.length === 0) {
      return res.status(404).json({ error: "Employee salary not found" });
    }

    res.json({ totalcomplaint, salary: salaryResult[0].salary });
  } catch (err) {
    console.error("Error fetching employee dashboard data:", err);
    res.status(500).json({ error: "Error fetching employee dashboard data" });
  }
});

module.exports = router;