import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveDataToGitHub } from "./github-storage";
import { clearLocalStorage, setLastSyncTime, type NavData } from "./local-storage";
import { resolveSyncDirection } from "./sync-manager";

vi.mock("./github-storage", () => ({
  getDataFromGitHub: vi.fn(),
  saveDataToGitHub: vi.fn(),
}));

const mockedSaveDataToGitHub = vi.mocked(saveDataToGitHub);

function navData(title: string, lastModified: number): NavData {
  return {
    version: "1.0",
    lastModified,
    categories: [
      {
        id: "default",
        name: "默认分类",
        sort: 0,
        sites: [
          {
            id: "site-1",
            title,
            url: "https://example.com",
          },
        ],
      },
    ],
  };
}

describe("resolveSyncDirection", () => {
  beforeEach(() => {
    clearLocalStorage();
    mockedSaveDataToGitHub.mockReset();
  });

  it("本地和 GitHub 都基于上次同步版本变更时拒绝静默覆盖", async () => {
    const base = navData("Base", 100);
    const local = navData("Local", 300);
    const github = navData("GitHub", 200);
    setLastSyncTime(base);

    const result = await resolveSyncDirection(local, github, "token", "test");

    expect(result.success).toBe(false);
    expect(result.error).toContain("同步冲突");
    expect(mockedSaveDataToGitHub).not.toHaveBeenCalled();
  });

  it("时间戳相同但内容不同会返回冲突", async () => {
    const local = navData("Local", 100);
    const github = navData("GitHub", 100);

    const result = await resolveSyncDirection(local, github, "token", "test");

    expect(result.success).toBe(false);
    expect(result.error).toContain("时间戳相同但内容不同");
    expect(mockedSaveDataToGitHub).not.toHaveBeenCalled();
  });

  it("只有本地相对上次同步版本变更时仍然上传", async () => {
    const base = navData("Base", 100);
    const local = navData("Local", 300);
    setLastSyncTime(base);

    const result = await resolveSyncDirection(local, base, "token", "test");

    expect(result.success).toBe(true);
    expect(result.direction).toBe("upload");
    expect(mockedSaveDataToGitHub).toHaveBeenCalledOnce();
  });
});
