import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export class WaterfallService {

  // Create a new waterfall for a project
  async createWaterfall(projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");

    const waterfall = await prisma.waterfallDefinition.create({ data: { projectId } });
    return waterfall;
  }

  // Add tiers to a waterfall
  async addTiers(waterfallId, tiers) {
    return prisma.waterfallTier.createMany({
      data: tiers.map(t => ({
        waterfallId,
        tierOrder: t.tierOrder,
        pctSplit: t.pctSplit,
        cap: t.cap,
        description: t.description
      }))
    });
  }

  // Add participants to a waterfall
  async addParticipants(waterfallId, participants) {
    return prisma.participant.createMany({
      data: participants.map(p => ({
        waterfallId,
        name: p.name,
        role: p.role,
        pctShare: p.pctShare,
        investmentAmount: p.investmentAmount,
        preferredReturn: p.preferredReturn,
        capAmount: p.capAmount,
        type: p.type,
        orderNo: p.orderNo,
        financingSourceId: p.financingSourceId
      }))
    });
  }

  // Add a revenue period
  async addPeriod(waterfallId, period) {
    return prisma.waterfallPeriod.create({
      data: {
        waterfallId,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        netRevenue: period.netRevenue
      }
    });
  }

  // Calculate payouts for a waterfall
  async calculateDistribution(waterfallId) {
    const waterfall = await prisma.waterfallDefinition.findUnique({
      where: { id: waterfallId },
      include: {
        tiers: { orderBy: { tierOrder: 'asc' } },
        participants: { orderBy: { orderNo: 'asc' } },
        periods: true
      }
    });

    if (!waterfall) throw new ApiError(StatusCodes.NOT_FOUND, "Waterfall not found");

    const payouts = [];

    for (const period of waterfall.periods) {
      let remaining = period.netRevenue;

      for (const tier of waterfall.tiers) {
        const tierParticipants = waterfall.participants.filter(p => p.orderNo === tier.tierOrder);
        if (!tierParticipants.length) continue;

        for (const participant of tierParticipants) {
          let payout = 0;

          // Preferred return
          if (participant.preferredReturn) {
            const pref = (participant.preferredReturn / 100) * (participant.investmentAmount || 0);
            const applied = Math.min(pref, remaining);
            payout += applied;
            remaining -= applied;
          }

          // % split
          if (participant.pctShare) {
            const splitAmount = remaining * (participant.pctShare / 100);
            if (participant.capAmount) {
              payout += Math.min(splitAmount, participant.capAmount - (participant.recoupedAmount || 0));
            } else {
              payout += splitAmount;
            }
            remaining -= splitAmount;
          }

          // Save payout
          const wfPayout = await prisma.waterfallPayout.create({
            data: {
              participantId: participant.id,
              periodStart: period.periodStart,
              periodEnd: period.periodEnd,
              amount: payout
            }
          });

          // Update recouped amount
          await prisma.participant.update({
            where: { id: participant.id },
            data: { recoupedAmount: { increment: payout } }
          });

          payouts.push(wfPayout);
        }
      }
    }

    return payouts;
  }
}
