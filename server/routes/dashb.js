const express = require("express");
const router = express.Router();
const db = require("../mysql_connect");

router.post("/admin", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const totalowner = await db.totalowner();
    const totaltenant = await db.totaltenant();
    const totalemployee = await db.totalemployee();
    const avgOwnerAge = await db.getAverageOwnerAge();
    const avgTenantAge = await db.getAverageTenantAge();
    const avgEmployeeAge = await db.getAverageEmployeeAge();
    const activeOwners = await db.getActiveOwners();
    const activeTenants = await db.getActiveTenants();
    const activeEmployees = await db.getActiveEmployees();

    res.json({
      totalowner: totalowner || 0,
      totaltenant: totaltenant || 0,
      totalemployee: totalemployee || 0,
      avgOwnerAge: avgOwnerAge || 0,
      avgTenantAge: avgTenantAge || 0,
      avgEmployeeAge: avgEmployeeAge || 0,
      activeOwners: activeOwners || 0,
      activeTenants: activeTenants || 0,
      activeEmployees: activeEmployees || 0,
    });
  } catch (err) {
    console.error("Error fetching admin dashboard data:", err);
    res.status(500).json({ error: "Error fetching admin dashboard data: " + err.message });
  }
});




router.post("/employee", async (req, res) => {
  const { userId } = req.body;
  try {
    // Debug: Log the userId
    console.log("Fetching employee data for userId:", userId);

    // Step 1: Fetch the auth ID
    const authSql = "SELECT id FROM auth WHERE user_id = ?";
    const authResults = await db.query(authSql, [userId]);
    console.log("Auth query result:", authResults);

    // Handle authResults as either an array or a single object
    let authId;
    if (Array.isArray(authResults)) {
      if (authResults.length === 0) {
        console.log("No auth record found for userId:", userId);
        return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
      }
      authId = authResults[0].id;
    } else if (authResults && typeof authResults === 'object' && 'id' in authResults) {
      // If authResults is a single object
      authId = authResults.id;
    } else {
      console.log("Unexpected auth query result format:", authResults);
      return res.status(500).json({ error: "Unexpected auth query result format" });
    }

    console.log("Auth ID:", authId);

    // Step 2: Fetch employee data, including email and is_email_verified
    const sql = "SELECT emp_name, salary, block_no, email, is_email_verified FROM employee WHERE emp_id = ?";
    const results = await db.query(sql, [authId]);
    console.log("Employee query result:", results);

    // Ensure results is an array
    if (!Array.isArray(results)) {
      console.log("Employee query result is not an array:", results);
      return res.status(500).json({ error: "Unexpected employee query result format" });
    }

    if (results.length === 0) {
      console.log("No employee record found for emp_id:", authId);
      return res.status(404).json({ error: "Employee not found" });
    }

    // Step 3: Fetch block_name from the block table using block_no
    const blockNo = results[0].block_no;
    let blockName = "Inconnu";
    if (blockNo) {
      const blockSql = "SELECT block_name FROM block WHERE block_no = ?";
      const blockResults = await db.query(blockSql, [blockNo]);
      console.log("Block query result:", blockResults);

      if (Array.isArray(blockResults) && blockResults.length > 0) {
        blockName = blockResults[0].block_name || "Inconnu";
      }
    }

    // Step 4: Fetch total complaints
    const totalComplaintSql = "SELECT COUNT(*) AS totalcomplaint FROM block WHERE complaints IS NOT NULL";
    const complaintResult = await db.query(totalComplaintSql);
    console.log("Total complaints:", complaintResult);

    // Ensure complaintResult is an array
    if (!Array.isArray(complaintResult) || complaintResult.length === 0) {
      console.log("Total complaints query result is not valid:", complaintResult);
      return res.status(500).json({ error: "Unexpected total complaints query result format" });
    }

    // Step 5: Send response with email and is_email_verified
    res.json({
      emp_name: results[0].emp_name,
      salary: results[0].salary,
      block_no: results[0].block_no,
      block_name: blockName,
      email: results[0].email || "", // Include email
      is_email_verified: results[0].is_email_verified || false, // Include verification status
      totalcomplaint: complaintResult[0].totalcomplaint,
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});
module.exports = router;