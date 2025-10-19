/*import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

// Get all phases
router.get("/", async (req, res) => {
  try {
    const phases = await prisma.phaseEntity.findMany({
      include: { project: true },
    });
    res.json(phases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new phase for a project
router.post("/", async (req, res) => {
  try {
    const { name, orderNo, projectId } = req.body;

    const newPhase = await prisma.phaseEntity.create({
      data: {
        name,
        orderNo,
        projectId,
      },
    });

    res.status(201).json(newPhase);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all phases for a specific project
router.get("/project/:projectId", async (req, res) => {
  try {
    const projectPhases = await prisma.phaseEntity.findMany({
      where: { projectId: req.params.projectId },
    });
    res.json(projectPhases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
*/