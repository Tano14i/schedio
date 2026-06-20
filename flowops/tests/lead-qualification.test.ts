import assert from "node:assert/strict";
import { evaluateLeadQualification, matchServiceArea } from "@/lib/lead-qualification";

const serviceAreas = [
  {
    id: "area_1",
    companyId: "company_1",
    label: "Milano",
    city: "Milano",
    postalCodePrefix: "20",
    active: true,
    createdAt: "2026-03-26T10:00:00.000Z"
  }
];

assert.equal(matchServiceArea("Via Torino 18, Milano", serviceAreas), "inside");
assert.equal(matchServiceArea("Via Firenze 10, Roma", serviceAreas), "outside");

assert.equal(
  evaluateLeadQualification({
    serviceType: "Riparazione tapparella",
    description: "Tapparella bloccata a meta corsa con due foto allegate.",
    address: "Via Torino 18, Milano",
    photoCount: 2,
    measurements: "140x160",
    jobSize: "small",
    budgetRange: "medium",
    serviceAreas
  }).qualificationStatus,
  "qualified"
);

assert.equal(
  evaluateLeadQualification({
    serviceType: "Riparazione tapparella",
    description: "Tapparella bloccata a meta corsa.",
    address: "Via Torino 18, Milano",
    photoCount: 0,
    measurements: "",
    jobSize: "small",
    budgetRange: "medium",
    serviceAreas
  }).qualificationStatus,
  "needs_clarification"
);

assert.equal(
  evaluateLeadQualification({
    serviceType: "Riparazione tapparella",
    description: "Tapparella bloccata a meta corsa con foto.",
    address: "Via Firenze 10, Roma",
    photoCount: 2,
    measurements: "140x160",
    jobSize: "small",
    budgetRange: "medium",
    serviceAreas
  }).qualificationStatus,
  "out_of_area"
);

console.log("Lead qualification tests passed.");
