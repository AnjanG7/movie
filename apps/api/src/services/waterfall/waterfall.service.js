import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export class WaterfallService {

  // Create a new waterfall for a project
  async createWaterfall(projectId,user) {

        const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }

    const isAdmin = user.roles?.includes("Admin");

    if (
      !isAdmin &&
      project.ownerId !== user?.id &&
      !(await prisma.projectUser.findFirst({
        where: { projectId, userId: user?.id },
      }))
    ) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You do not have permission");
    }
 
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
      periodStart: new Date(period.periodStart), // convert string -> Date
      periodEnd: new Date(period.periodEnd),
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
  // Get already stored payouts
  async getPayouts(waterfallId) {
    return prisma.waterfallPayout.findMany({
      where: { participant: { waterfallId } },
      include: { participant: true },
      orderBy: { periodStart: 'asc' }
    });
  }

  async getWaterfallById(waterfallId) {
  const waterfall = await prisma.waterfallDefinition.findUnique({
    where: { id: waterfallId },
    include: {
      tiers: true,
      participants: true,
      periods: true
    }
  });

  if (!waterfall) throw new ApiError(StatusCodes.NOT_FOUND, "Waterfall not found");

  return waterfall;
}

async getWaterfallByProject(projectId, page = 1, limit = 10) {
  const waterfall = await prisma.waterfallDefinition.findFirst({
    where: { projectId },
    include: {
      tiers: true,
      participants: true,
      periods: true
    }
  });

  if (!waterfall) throw new ApiError(StatusCodes.NOT_FOUND, "Waterfall not found");

  // Paginate the nested arrays in-memory
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    ...waterfall,
    tiers: waterfall.tiers.slice(start, end),
    participants: waterfall.participants.slice(start, end),
    periods: waterfall.periods.slice(start, end),
    pagination: {
      page,
      limit,
      totalTiers: waterfall.tiers.length,
      totalParticipants: waterfall.participants.length,
      totalPeriods: waterfall.periods.length,
      totalPages: Math.ceil(Math.max(
        waterfall.tiers.length,
        waterfall.participants.length,
        waterfall.periods.length
      ) / limit)
    }
  };
}

async listWaterfalls(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.waterfallDefinition.findMany({
      skip,
      take: limit,
      include: { tiers: true, participants: true, periods: true }
    }),
    prisma.waterfallDefinition.count()
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}



  async updateTier(tierId, data) {
    return prisma.waterfallTier.update({
      where: { id: tierId },
      data
    });
  }

  async deleteTier(tierId) {
    return prisma.waterfallTier.delete({
      where: { id: tierId }
    });
  }

  async updateParticipant(participantId, data) {
    return prisma.participant.update({
      where: { id: participantId },
      data
    });
  }

  async deleteParticipant(participantId) {
    return prisma.participant.delete({
      where: { id: participantId }
    });
  }

  async updatePeriod(periodId, data) {
    return prisma.waterfallPeriod.update({
      where: { id: periodId },
      data
    });
  }

  async deletePeriod(periodId) {
    return prisma.waterfallPeriod.delete({
      where: { id: periodId }
    });
  }

}
