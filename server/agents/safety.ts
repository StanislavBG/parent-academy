/**
 * Safety & Escalation System.
 *
 * Detects high-risk signals in parent messages and routes
 * to crisis resources. Implements the "humility protocol":
 * when in doubt, escalate rather than continue coaching.
 */

import type { SafetyCheck } from "./types";

/** Patterns that indicate high-risk situations */
const HIGH_RISK_PATTERNS = {
  selfHarm: [
    /\b(suicid|kill\s*(myself|themselves|him|her)|want\s*to\s*die|end\s*(it|my\s*life)|hurt\s*myself)\b/i,
    /\b(self[- ]?harm|cutting|overdose)\b/i,
  ],
  childAbuse: [
    /\b(hit(ting)?\s*(the\s*)?child|beat(ing)?\s*(the\s*)?child|shak(e|ing)\s*(the\s*)?baby)\b/i,
    /\b(abuse|neglect|starv(e|ing)|lock(ed)?\s*(in|up)|burn(ed|ing)?)\b/i,
    /\b(someone\s*(is\s*)?(hurting|touching|abusing))\b/i,
  ],
  domesticViolence: [
    /\b(partner\s*(hit|hits|hurt|hurts|beat|beats|chok|threat))\b/i,
    /\b(domestic\s*violence|afraid\s*of\s*(my\s*)?(husband|wife|partner|spouse))\b/i,
    /\b(he('s|s)?\s*(going\s*to|gonna)\s*(kill|hurt))\b/i,
  ],
  postpartumDistress: [
    /\b(can'?t\s*bond|don'?t\s*(love|want)\s*(my\s*)?baby|regret\s*(having|the\s*baby))\b/i,
    /\b(postpartum\s*(depression|psychosis)|intrusive\s*thoughts?\s*(about|of)\s*(harm|hurt))\b/i,
    /\b(thoughts?\s*(of|about)\s*harming\s*(my\s*)?(baby|child|infant))\b/i,
  ],
  medicalEmergency: [
    /\b(not\s*breathing|unconscious|seizure|convuls|choking|blue\s*(lips|face)|unresponsive)\b/i,
    /\b(poisoned|swallowed|ingested|overdose|allergic\s*reaction|anaphyla)\b/i,
    /\b(head\s*injury|fall|fell|blood|bleeding\s*(heavily|a\s*lot))\b/i,
  ],
};

/** Crisis resources */
const CRISIS_RESOURCES = {
  general: [
    "Emergency Services: Call your local emergency number (911 in the US)",
    "Crisis Text Line: Text HOME to 741741",
    "National Suicide Prevention Lifeline: 988 (call or text)",
  ],
  childAbuse: [
    "Childhelp National Child Abuse Hotline: 1-800-422-4453",
    "Contact your local child protective services",
  ],
  domesticViolence: [
    "National Domestic Violence Hotline: 1-800-799-7233",
    "Text START to 88788",
  ],
  postpartum: [
    "Postpartum Support International Helpline: 1-800-944-4773",
    "Text 'HELP' to 988",
    "Crisis Text Line: Text HOME to 741741",
  ],
  medical: [
    "Call your local emergency number immediately (911 in the US)",
    "Poison Control Center: 1-800-222-1222",
  ],
};

/** Check a message for high-risk safety signals */
export function checkSafety(message: string): SafetyCheck {
  const signals: string[] = [];
  let recommendedAction: SafetyCheck["recommendedAction"] = "continue";
  const resources: string[] = [];

  // Check each category
  for (const [category, patterns] of Object.entries(HIGH_RISK_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        signals.push(category);
        recommendedAction = "escalate";

        switch (category) {
          case "selfHarm":
            resources.push(...CRISIS_RESOURCES.general);
            recommendedAction = "crisis";
            break;
          case "childAbuse":
            resources.push(...CRISIS_RESOURCES.childAbuse, ...CRISIS_RESOURCES.general);
            recommendedAction = "crisis";
            break;
          case "domesticViolence":
            resources.push(...CRISIS_RESOURCES.domesticViolence, ...CRISIS_RESOURCES.general);
            recommendedAction = "crisis";
            break;
          case "postpartumDistress":
            resources.push(...CRISIS_RESOURCES.postpartum, ...CRISIS_RESOURCES.general);
            break;
          case "medicalEmergency":
            resources.push(...CRISIS_RESOURCES.medical);
            recommendedAction = "crisis";
            break;
        }
        break; // Found a match in this category, move on
      }
    }
  }

  // Deduplicate resources
  const uniqueResources = Array.from(new Set(resources));

  return {
    isHighRisk: signals.length > 0,
    signals: Array.from(new Set(signals)),
    recommendedAction,
    crisisResources: uniqueResources.length > 0 ? uniqueResources : undefined,
  };
}

/** Generate a safety-first response when high-risk signals are detected */
export function generateSafetyResponse(check: SafetyCheck): string {
  if (!check.isHighRisk) return "";

  const parts: string[] = [];

  parts.push("I want to make sure you and your family are safe. What you've shared sounds like it may need immediate attention from a professional who can help right now.");
  parts.push("");
  parts.push("**Parent Academy is not a substitute for emergency services or professional help.** Please reach out to one of these resources:");
  parts.push("");

  if (check.crisisResources) {
    for (const resource of check.crisisResources) {
      parts.push(`- ${resource}`);
    }
  }

  parts.push("");

  if (check.recommendedAction === "crisis") {
    parts.push("**If you or someone else is in immediate danger, please contact emergency services right away.**");
  } else {
    parts.push("Please consider reaching out to a qualified professional. You deserve support, and these situations benefit from expert guidance beyond what a coaching platform can provide.");
  }

  parts.push("");
  parts.push("I'm here for parenting coaching when you're ready, but right now your safety comes first.");

  return parts.join("\n");
}
