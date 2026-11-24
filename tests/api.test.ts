import { describe, it, expect, beforeEach } from "vitest";
import { setupTestDatabase } from "./setup";
import {
  user as userTable,
  workspaceMembers,
  mediaFiles,
  workspaces,
  campaigns,
} from "@/db/schema";
import { bootstrapFirstAdminIfNeeded, getOrCreateSharedWorkspace } from "@/lib/session";
import { GET as getFileRoute } from "@/app/api/files/[id]/route";
import { NextRequest } from "next/server";
import { storePrivateFile } from "@/lib/storage";

describe("API Security & Private Media Tests", () => {
  let db: any;
  let workspace: any;
  let admin: any;
  let member: any;
  let testFileRecord: any;

  beforeEach(async () => {
    const context = await setupTestDatabase();
    db = context.testDb;
    process.env.FIRST_ADMIN_EMAIL = "admin@company.com";

    workspace = await getOrCreateSharedWorkspace();

    // Admin
    [admin] = await db
      .insert(userTable)
      .values({
        id: "u-admin",
        email: "admin@company.com",
        name: "Admin Alice",
        displayName: "Alice",
        emailVerified: true,
      })
      .returning();
    await bootstrapFirstAdminIfNeeded(admin);

    // Active Member
    [member] = await db
      .insert(userTable)
      .values({
        id: "u-member",
        email: "member@company.com",
        name: "Member Bob",
        displayName: "Bob",
        emailVerified: true,
      })
      .returning();
    await db.insert(workspaceMembers).values({
      id: "wm-member",
      workspaceId: workspace.id,
      userId: member.id,
      role: "member",
      status: "active",
    });

    // Create a private file
    const samplePng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const { storageKey } = await storePrivateFile("test-screenshot.png", samplePng, "image/png");

    [testFileRecord] = await db
      .insert(mediaFiles)
      .values({
        id: "file-test-1",
        workspaceId: workspace.id,
        uploadedById: member.id,
        originalName: "test-screenshot.png",
        mimeType: "image/png",
        sizeBytes: samplePng.length,
        blobUrl: storageKey,
        purpose: "evidence",
      })
      .returning();
  });

  it("serves private file to active workspace member", async () => {
    const req = new NextRequest("http://localhost:3000/api/files/file-test-1", {
      headers: {
        "x-test-user-id": member.id,
      },
    });

    const res = await getFileRoute(req, {
      params: Promise.resolve({ id: "file-test-1" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toContain("private");
  });

  it("blocks unauthenticated users from accessing private files (401)", async () => {
    const req = new NextRequest("http://localhost:3000/api/files/file-test-1");

    const res = await getFileRoute(req, {
      params: Promise.resolve({ id: "file-test-1" }),
    });

    expect(res.status).toBe(401);
  });

  it("blocks non-workspace users from accessing private files (403)", async () => {
    // Uninvited stranger
    const [stranger] = await db
      .insert(userTable)
      .values({
        id: "u-stranger",
        email: "stranger@external.com",
        name: "Stranger",
      })
      .returning();

    const req = new NextRequest("http://localhost:3000/api/files/file-test-1", {
      headers: {
        "x-test-user-id": stranger.id,
      },
    });

    const res = await getFileRoute(req, {
      params: Promise.resolve({ id: "file-test-1" }),
    });

    expect(res.status).toBe(403);
  });
});
