import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { requireWrite, isWriteEnabled } from "../../src/utils/write-gate.js";

describe("write-gate", () => {
  const originalEnv = process.env.VULTR_WRITE_ENABLED;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.VULTR_WRITE_ENABLED = originalEnv;
    } else {
      delete process.env.VULTR_WRITE_ENABLED;
    }
  });

  describe("isWriteEnabled", () => {
    it("returns false when env var is unset", () => {
      delete process.env.VULTR_WRITE_ENABLED;
      expect(isWriteEnabled()).toBe(false);
    });

    it("returns false when env var is not 'true'", () => {
      process.env.VULTR_WRITE_ENABLED = "false";
      expect(isWriteEnabled()).toBe(false);
    });

    it("returns true when env var is 'true'", () => {
      process.env.VULTR_WRITE_ENABLED = "true";
      expect(isWriteEnabled()).toBe(true);
    });
  });

  describe("requireWrite", () => {
    it("returns error when env var is not set", () => {
      delete process.env.VULTR_WRITE_ENABLED;
      const result = requireWrite(true, "vm_create");
      expect(result).toContain("VULTR_WRITE_ENABLED");
      expect(result).toContain("not set");
    });

    it("returns error when confirm is false", () => {
      process.env.VULTR_WRITE_ENABLED = "true";
      const result = requireWrite(false, "vm_create");
      expect(result).toContain("confirm must be set to true");
    });

    it("returns error when confirm is undefined", () => {
      process.env.VULTR_WRITE_ENABLED = "true";
      const result = requireWrite(undefined, "vm_create");
      expect(result).toContain("confirm must be set to true");
    });

    it("returns null when both gates pass", () => {
      process.env.VULTR_WRITE_ENABLED = "true";
      const result = requireWrite(true, "vm_create");
      expect(result).toBeNull();
    });

    it("includes operation name in error message", () => {
      delete process.env.VULTR_WRITE_ENABLED;
      const result = requireWrite(true, "vm_delete");
      expect(result).toContain("vm_delete");
    });
  });
});
