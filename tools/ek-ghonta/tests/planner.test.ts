import assert from "node:assert/strict";
import test from "node:test";
import { createInvitation, getActionPlan } from "../lib/planner";

test("each time and setting gives a complete self-directed plan", () => {
  for (const minutes of [10, 30, 60]) {
    for (const setting of ["home", "nearby", "friends"]) {
      const plan = getActionPlan({ minutes, setting });
      assert.ok(plan);
      assert.equal(plan.minutes, minutes);
      assert.equal(plan.steps.length, 3);
      assert.ok(plan.title && plan.note);
    }
  }
});

test("invalid selectors are rejected without silently substituting a plan", () => {
  for (const selection of [
    { minutes: 15, setting: "home" },
    { minutes: NaN, setting: "home" },
    { minutes: 30, setting: "__proto__" },
    { minutes: 30, setting: "constructor" },
  ]) assert.equal(getActionPlan(selection), null);
});

test("an invitation includes the action and duration without claiming an event", () => {
  const plan = getActionPlan({ minutes: 30, setting: "nearby" });
  assert.ok(plan);
  const invitation = createInvitation(plan);
  assert.ok(invitation.includes(plan.title));
  assert.ok(invitation.includes("৩০ মিনিট"));
  assert.ok(invitation.includes("এটি কোনো আয়োজকের অনুষ্ঠান নয়"));
  assert.ok(invitation.includes("সময় ও জায়গা আমরা আলোচনা করে ঠিক করব"));
});
