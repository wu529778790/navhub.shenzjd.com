import { describe, expect, it } from "vitest";
import { countDescendantSites, findNode, findPath, visibleCategories } from "@/lib/nav-tree";
import type { Category } from "@/types";

function makeTree(): Category[] {
  return [
    {
      id: "a",
      name: "01　影视",
      sort: 0,
      sites: [],
      children: [
        {
          id: "a1",
          name: "在线观看",
          sort: 0,
          sites: [
            { id: "s1", title: "站A", url: "https://a.example", sort: 0 },
            { id: "s2", title: "站B", url: "https://b.example", sort: 1 },
          ],
        },
        {
          id: "a2",
          name: "下载",
          sort: 1,
          sites: [{ id: "s3", title: "站C", url: "https://c.example", sort: 0 }],
        },
      ],
    },
    {
      id: "b",
      name: "工具",
      sort: 1,
      sites: [{ id: "s4", title: "站D", url: "https://d.example", sort: 0 }],
    },
  ];
}

describe("findNode", () => {
  it("找到任意深度的节点", () => {
    expect(findNode(makeTree(), "a2")?.name).toBe("下载");
    expect(findNode(makeTree(), "b")?.name).toBe("工具");
  });

  it("找不到或 id 为空返回 null", () => {
    expect(findNode(makeTree(), "nope")).toBeNull();
    expect(findNode(makeTree(), null)).toBeNull();
  });
});

describe("findPath", () => {
  it("返回根到节点的完整路径", () => {
    const path = findPath(makeTree(), "a2");
    expect(path.map((c) => c.id)).toEqual(["a", "a2"]);
  });

  it("顶级节点路径只含自身", () => {
    expect(findPath(makeTree(), "b").map((c) => c.id)).toEqual(["b"]);
  });

  it("找不到返回空数组", () => {
    expect(findPath(makeTree(), "nope")).toEqual([]);
  });
});

describe("countDescendantSites", () => {
  it("统计含子孙的全部站点", () => {
    expect(countDescendantSites(makeTree()[0])).toBe(3);
    expect(countDescendantSites(makeTree()[1])).toBe(1);
  });
});

describe("visibleCategories", () => {
  it("过滤顶层墓碑分类与其站点的墓碑", () => {
    const tree = [
      {
        id: "keep",
        name: "保留",
        sort: 0,
        sites: [
          { id: "ok", title: "正常", url: "https://ok.example", sort: 0 },
          { id: "gone", title: "已删", url: "https://gone.example", sort: 1, _deleted: true },
        ],
      },
      { id: "del", name: "删除", sort: 1, sites: [], _deleted: true },
    ] satisfies Category[];

    const result = visibleCategories(tree);
    expect(result.map((c) => c.id)).toEqual(["keep"]);
    expect(result[0].sites.map((s) => s.id)).toEqual(["ok"]);
  });

  it("递归过滤子层级的墓碑分类与站点墓碑", () => {
    const tree = [
      {
        id: "top",
        name: "顶级",
        sort: 0,
        sites: [],
        children: [
          {
            id: "alive",
            name: "存活子分类",
            sort: 0,
            sites: [
              { id: "s1", title: "站1", url: "https://1.example", sort: 0 },
              { id: "s2", title: "站2", url: "https://2.example", sort: 1, _deleted: true },
            ],
          },
          {
            id: "ghost",
            name: "幽灵子分类",
            sort: 1,
            sites: [{ id: "s4", title: "墓碑挂的站", url: "https://4.example", sort: 0 }],
            _deleted: true,
            children: [{ id: "deep-ghost", name: "墓碑下的深层", sort: 0, sites: [] }],
          },
          {
            id: "branch",
            name: "存活但深层有墓碑",
            sort: 2,
            sites: [],
            children: [
              { id: "g2", name: "深层幽灵", sort: 0, sites: [], _deleted: true },
              {
                id: "ok2",
                name: "深层存活",
                sort: 1,
                sites: [{ id: "s3", title: "站3", url: "https://3.example", sort: 0 }],
              },
            ],
          },
        ],
      },
    ] satisfies Category[];

    const result = visibleCategories(tree);
    expect(result).toHaveLength(1);
    const kids = result[0].children!;
    expect(kids.map((c) => c.id)).toEqual(["alive", "branch"]);
    expect(kids[0].sites.map((s) => s.id)).toEqual(["s1"]);
    expect(kids[1].children!.map((c) => c.id)).toEqual(["ok2"]);
  });
});
