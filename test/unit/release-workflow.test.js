import { selectRequest } from "../../lib/release-workflow.js";

describe("candidate workflow request selection", () => {
  test("a draft update does not run candidate checks", () => {
    expect(selectRequest("pull_request", {
      action: "synchronize", pull_request: { draft: true },
    })).toBe("skip");
  });

  test.each(["opened", "synchronize", "reopened", "ready_for_review"])(
    "%s runs checks only for a ready PR", action => {
      expect(selectRequest("pull_request", { action, pull_request: { draft: false } })).toBe("check");
    });

  test("conversion to draft stops an earlier ready request", () => {
    expect(selectRequest("pull_request", {
      action: "converted_to_draft", pull_request: { draft: false },
    })).toBe("skip");
  });

  test.each([["check", "check"], ["release", "release"]])(
    "manual %s selects only its stated operation", (request, expected) => {
      expect(selectRequest("workflow_dispatch", { inputs: { request } })).toBe(expected);
    });

  test("a created release requests checks and evidence validation, not publication", () => {
    expect(selectRequest("release", { action: "created" })).toBe("release");
  });

  test.each([
    ["push", {}], ["pull_request_target", {}],
    ["pull_request", { action: "opened", pull_request: {} }],
    ["pull_request", { action: "opened", pull_request: { draft: "false" } }],
    ["pull_request", { action: "closed", pull_request: { draft: false } }],
    ["release", { action: "published" }],
    ["workflow_dispatch", {}], ["workflow_dispatch", { inputs: { request: "publish" } }],
    ["workflow_dispatch", { inputs: { request: "release\npublish" } }],
  ])("refuses an unsupported or malformed %s request: %j", (eventName, event) => {
    expect(() => selectRequest(eventName, event)).toThrow("Unsupported candidate request");
  });
});
