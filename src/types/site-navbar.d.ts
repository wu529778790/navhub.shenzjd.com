/**
 * @wu529778790/site-navbar Web Component 的 JSX 类型声明。
 * 组件本体由 layout.tsx 引入的 unpkg 脚本注册，无需本地实现。
 */
import "react";

declare namespace JSX {
  interface IntrinsicElements {
    "site-navbar": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
  }
}

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "site-navbar": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        >;
      }
    }
  }
}
