const SLA_RISK_THRESHOLD = 0.2;

const parseIsoDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const addMinutesIso = (dateValue, minutes) => {
  const baseDate = parseIsoDate(dateValue);
  if (!baseDate || minutes === null || minutes === undefined) {
    return null;
  }

  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    return null;
  }

  return new Date(baseDate.getTime() + parsedMinutes * 60000).toISOString();
};

const getPendingMilestones = (ticket) => {
  const pending = [];

  if (!ticket.slaFirstRespondedAt && ticket.slaResponseDueAt) {
    pending.push({
      dueAt: ticket.slaResponseDueAt,
      startAt: ticket.createdAt,
    });
  }

  if (!ticket.slaResolvedAt && ticket.slaResolutionDueAt) {
    pending.push({
      dueAt: ticket.slaResolutionDueAt,
      startAt: ticket.createdAt,
    });
  }

  return pending;
};

const isMilestoneBreached = (completedAtValue, dueAtValue, nowDate) => {
  const dueAt = parseIsoDate(dueAtValue);
  if (!dueAt) {
    return false;
  }

  const completedAt = parseIsoDate(completedAtValue);
  if (completedAt) {
    return completedAt > dueAt;
  }

  return dueAt < nowDate;
};

const computeSlaState = (ticket, now = new Date()) => {
  if (!ticket || !ticket.slaPolicyId) {
    return 'none';
  }

  const nowDate = now instanceof Date ? now : new Date(now);

  const responseBreached = isMilestoneBreached(
    ticket.slaFirstRespondedAt,
    ticket.slaResponseDueAt,
    nowDate,
  );

  const resolutionBreached = isMilestoneBreached(
    ticket.slaResolvedAt,
    ticket.slaResolutionDueAt,
    nowDate,
  );

  if (responseBreached && resolutionBreached) {
    return 'breached';
  }

  if (resolutionBreached) {
    return 'resolution_breached';
  }

  if (responseBreached) {
    return 'response_breached';
  }

  const pendingMilestones = getPendingMilestones(ticket);

  if (ticket.slaFirstRespondedAt && ticket.slaResolvedAt) {
    return 'met';
  }

  const createdAt = parseIsoDate(ticket.createdAt);
  const atRisk = pendingMilestones.some((milestone) => {
    const dueAt = parseIsoDate(milestone.dueAt);
    const startAt = parseIsoDate(milestone.startAt) || createdAt;
    if (!dueAt || !startAt) {
      return false;
    }

    const totalMs = dueAt.getTime() - startAt.getTime();
    const remainingMs = dueAt.getTime() - nowDate.getTime();
    if (totalMs <= 0) {
      return false;
    }

    return remainingMs / totalMs <= SLA_RISK_THRESHOLD;
  });

  return atRisk ? 'at_risk' : 'on_track';
};

export {
  addMinutesIso,
  computeSlaState,
};
