(function (root) {
  'use strict';

  function mix(p) {
    var brand = p.budget * p.brandShare;
    var leadgen = p.budget - brand;
    var coverage = Math.min(1, leadgen / (p.accounts * p.costWork));
    var reach = Math.min(1, brand / (p.accounts * p.costRemember));
    var a = p.aware0, rows = [], total = 0;
    for (var q = 1; q <= p.quarters; q++) {
      var response = p.respCold + (p.respKnown - p.respCold) * a;
      var opps = p.accounts * p.inMarket * coverage * response;
      rows.push({ q: q, awareness: a, response: response, opps: opps });
      total += opps;
      a = a * (1 - p.decay) + (1 - a) * reach;
    }
    return { rows: rows, total: total, coverage: coverage, reach: reach, brand: brand, leadgen: leadgen };
  }

  function bestMix(p) {
    var best = { share: 0, total: -1 };
    for (var s = 0; s <= 100; s += 5) {
      var q = {}; for (var k in p) q[k] = p[k];
      q.brandShare = s / 100;
      var t = mix(q).total;
      if (t > best.total + 1e-9) best = { share: s, total: t };
    }
    return best;
  }

  function ledger(p) {
    var margin = p.partnerMargin + (p.partnerSourced ? p.regBonus : 0);
    var vendorNet = p.price * (1 - margin);
    var mdf = p.price * p.mdf;
    var channel = p.price * p.channelCost;
    var viaPartner = vendorNet - mdf - channel;
    var direct = p.price * (1 - p.directCost);
    var licence = p.price * margin;
    var servicesRevenue = p.price * p.servicesRatio;
    var services = servicesRevenue * p.servicesMargin;
    var partnerTotal = licence + services;
    return {
      margin: margin,
      vendor: { net: vendorNet, mdf: mdf, channel: channel, viaPartner: viaPartner, direct: direct, gap: direct - viaPartner },
      partner: { licence: licence, servicesRevenue: servicesRevenue, services: services, total: partnerTotal,
                 servicesShare: partnerTotal > 0 ? services / partnerTotal : 0 }
    };
  }

  function jointQuarter(p) {
    var calls = p.days * p.callers * p.callsPerCaller;
    var conversations = calls * p.reachRate;
    var meetingsCalls = conversations * p.meetingPerConversation;
    var attendees = p.events * p.invited * p.attendRate;
    var meetingsEvents = attendees * p.meetingPerAttendee;
    var meetings = meetingsCalls + meetingsEvents;
    var opps = meetings * p.oppRate;
    var cost = p.events * p.eventCost + p.days * p.dayCost;
    var funded = cost * p.fundShare;
    return { calls: calls, conversations: conversations, meetingsCalls: meetingsCalls, attendees: attendees, meetingsEvents: meetingsEvents,
             meetings: meetings, opps: opps, pipeline: opps * p.deal, cost: cost, funded: funded, partnerCost: cost - funded,
             costPerOpp: opps > 0 ? cost / opps : null };
  }

  function pipelineRun(p) {
    var deals = Math.ceil(p.target / p.deal);
    var oppsYear = Math.ceil(deals / p.win);
    var oppsMonth = oppsYear / 12;
    var capacity = p.aes * p.oppsPerAe;
    return { deals: deals, oppsYear: oppsYear, oppsMonth: oppsMonth, meetingsMonth: oppsMonth / p.meetToOpp,
             capacity: capacity, gap: oppsMonth - capacity, aesNeeded: Math.ceil(oppsMonth / p.oppsPerAe) };
  }

  function eventRoi(p) {
    var opps = p.meetings * p.meetToOpp;
    var pipeline = opps * p.deal;
    var revenue = pipeline * p.win;
    var perMeeting = p.meetToOpp * p.win * p.deal;
    return { opps: opps, pipeline: pipeline, revenue: revenue, costPerOpp: opps > 0 ? p.cost / opps : null,
             breakEven: perMeeting > 0 ? p.cost / perMeeting : null, ratio: p.cost > 0 ? revenue / p.cost : null };
  }

  function routes(p) {
    var perDirect = p.directDeals * p.deal * (1 - p.directCost);
    var perPartner = p.partnerDeals * p.deal * (1 - p.partnerMargin - p.channelCost);
    var d = 0, pr = 0, cross = null, cd = 0, cp = 0;
    for (var m = 1; m <= 36; m++) {
      cd += perDirect;
      if (m > p.ramp) cp += perPartner;
      if (m <= p.months) { d = cd; pr = cp; }
      if (cross === null && cp >= cd && cp > 0) cross = m;
    }
    return { direct: d, partner: pr, perDirect: perDirect, perPartner: perPartner, cross: cross };
  }

  function claimCheck(text, gruppi) {
    var t = String(text || '').toLowerCase().replace(/[\u2019\u2018]/g, "'");
    var voci = [];
    gruppi.forEach(function (g) { g.formule.forEach(function (f) { voci.push({ frase: f, chiave: f.toLowerCase(), gruppo: g.nome, perche: g.perche }); }); });
    voci.sort(function (a, b) { return b.chiave.length - a.chiave.length; });
    var presi = [], found = [], total = 0;
    voci.forEach(function (v) {
      var n = 0, da = 0, i;
      while ((i = t.indexOf(v.chiave, da)) !== -1) {
        var fine = i + v.chiave.length, libero = true;
        for (var k = 0; k < presi.length; k++) { if (i < presi[k][1] && fine > presi[k][0]) { libero = false; break; } }
        if (libero) { presi.push([i, fine]); n++; }
        da = fine;
      }
      if (n) { found.push({ frase: v.frase, gruppo: v.gruppo, perche: v.perche, n: n }); total += n; }
    });
    return { found: found, total: total };
  }

  var api = { mix: mix, bestMix: bestMix, ledger: ledger, jointQuarter: jointQuarter,
              pipelineRun: pipelineRun, eventRoi: eventRoi, routes: routes, claimCheck: claimCheck };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CyberCalc = api;
})(typeof window !== 'undefined' ? window : this);
