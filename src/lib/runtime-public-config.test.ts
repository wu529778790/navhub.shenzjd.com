import { describe, expect, it } from "vitest";
import { buildRuntimePublicConfig } from "./runtime-public-config";

describe("buildRuntimePublicConfig", () => {
  it("从环境变量生成公开运行时配置", () => {
    expect(
      buildRuntimePublicConfig({
        NEXT_PUBLIC_GITHUB_CLIENT_ID: "client-id",
        NEXT_PUBLIC_GITHUB_OWNER: "owner",
        NEXT_PUBLIC_GITHUB_REPO: "repo",
        NEXT_PUBLIC_DATA_FILE_PATH: "data/custom.json",
      })
    ).toEqual({
      githubClientId: "client-id",
      githubOwner: "owner",
      githubRepo: "repo",
      dataFilePath: "data/custom.json",
    });
  });

  it("在环境变量缺失时回退到默认值", () => {
    expect(buildRuntimePublicConfig({})).toEqual({
      githubClientId: "",
      githubOwner: "wu529778790",
      githubRepo: "navhub.shenzjd.com",
      dataFilePath: "data/sites.json",
    });
  });
});
