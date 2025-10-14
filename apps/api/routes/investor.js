import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

// Get all investors (participants in waterfall definitions)
router.get("/", async (req, res) => {
  try {
    const investors = await prisma.participant.findMany({
      include: {
        waterfall: {
          include: { project: true },
        },
      },
    });
    res.json(investors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new investor (participant)
router.post("/", async (req, res) => {
  try {
    const { waterfallId, name, role, pctShare } = req.body;

    const newInvestor = await prisma.participant.create({
      data: {
        waterfallId,
        name,
        role,
        pctShare,
      },
    });

    res.status(201).json(newInvestor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get one investor by ID
router.get("/:id", async (req, res) => {
  try {
    const investor = await prisma.participant.findUnique({
      where: { id: req.params.id },
      include: {
        payouts: true,
        waterfall: {
          include: { project: true },
        },
      },
    });

    if (!investor) return res.status(404).json({ error: "Investor not found" });

    res.json(investor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
