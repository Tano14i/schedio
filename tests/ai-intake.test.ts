import assert from "node:assert/strict";
import { parseWorkIntakeHeuristically } from "@/lib/ai-intake";

{
  const suggestion = parseWorkIntakeHeuristically({
    text: "Ciao, tapparella bloccata in via Verdi 12, puoi passare domani mattina?"
  });

  assert.equal(suggestion.serviceType, "Riparazione tapparella");
  assert.equal(suggestion.address, "via Verdi 12");
  assert.equal(suggestion.urgency, "high");
  assert.equal(suggestion.preferredWindow, "domani mattina");
  assert.equal(suggestion.nextAction, "schedule_visit");
}

{
  const suggestion = parseWorkIntakeHeuristically({
    text: "Cliente nuovo, porta finestra da controllare, forse cerniere da cambiare, da richiamare lunedi"
  });

  assert.equal(suggestion.serviceType, "Riparazione porta o finestra");
  assert.equal(suggestion.visitNeeded, true);
  assert.equal(suggestion.preferredWindow, "lunedi");
}

{
  const suggestion = parseWorkIntakeHeuristically({
    text: "Tapparella elettrica rumorosa con foto gia inviate, servono cinghia e motore nuovo.",
    photoCount: 2
  });

  assert.deepEqual(suggestion.materialsMentioned, ["Cinghia", "Motore"]);
  assert.equal(suggestion.visitNeeded, false);
  assert.equal(suggestion.nextAction, "ask_clarification");
}

console.log("ai intake tests passed");
