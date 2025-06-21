import { BaseReadabilityRule } from "../BaseReadabilityRule";
import TurndownService from "turndown";

export class SpaceACRule extends BaseReadabilityRule {
  name = "SpaceACRule";
  domainPatterns: string[] = ["spaces.ac.cn"];

  contentSelectors = [
    "#PostContent", // 主要文章内容容器(id="PostContent")
    ".PostContent", // 主要文章内容容器(class="PostContent")
  ];

  unwantedSelectors: string[] = [
    // 继承基类选择器，但排除通用的 "script"
    ...this.unwantedSelectors.filter((selector) => selector !== "script"),

    // 只移除特定类型的脚本，保留数学公式脚本
    'script[type="application/javascript"]',
    'script[type="text/javascript"]',
    'script[type="text/plain"]',
    "script[src]", // 移除外部脚本
    "script:not([type])", // 移除没有 type 属性的脚本
    'script[type=""]', // 移除 type 为空的脚本

    // spaces.ac.cn 页面结构特有的移除元素
    "#breadcrumb", // 面包屑导航
    ".PostHead", // 文章头部（包含日期、作者等）
    ".date-wrap", // 日期包装器
    ".title-wrap .submitted", // 提交信息
    ".title_button", // 标题按钮（Kimi、引用、打印、分享）
    "#kimi", // Kimi 按钮
    "#to_cite", // 引用按钮
    "#print", // 打印按钮
    "#share", // 分享按钮及其子元素
    "#share_position", // 分享位置容器

    // 页面底部元素
    "#content_tips", // 内容提示
    "#pay", // 打赏部分
    "#QR", // 二维码
    "#how_to_cite", // 引用信息
    ".cite_style", // 引用样式

    // 其他不需要的元素
    "#similar", // 相似文章
    "#tools", // 工具栏
    "#entrynavigation", // 条目导航
    "#PostComment", // 评论提示
    ".AllComments", // 所有评论
    ".ComListLi", // 评论列表项
    ".comment_reply", // 评论回复

    // 只移除预览元素，保留实际的数学公式脚本
    ".MathJax_Preview", // 移除 MathJax 预览元素
    "span.MathJax_Preview", // 移除 span 的 MathJax_Preview 元素
    "[class^='MathJax_Preview']",
    "[class*='MathJax notranslate']",
    "[class*='MathJax']",

    // 转载和版权信息（保留主要学术内容）
    'p[style*="color: #FF8800"]', // 橙色样式的转载说明
    'em[style*="color: #FF8800"]', // 橙色样式的强调文本
  ];

  mathConfig: {
    preserveLatex: boolean;
    mathJaxSelectors: string[];
    scriptSelectors: string[];
  } = {
    preserveLatex: true,
    mathJaxSelectors: [
      ".MathJax",
      ".MathJax_Display",
      ".MathJax_Preview",
      ".notranslate",
      '[id^="MathJax-Element"]',
      '[class*="MathJax"]',
    ],
    scriptSelectors: ['script[type="math/tex"]', 'script[type="math/tex; mode=display"]'],
  };

  // 转义 \[ \] \\ \_ 去掉\
  removeLatexEscape(html: string): string {
    // 替换 \[ \] \\ \_ 为 \[ \] \_
    html = html.replace(/\\\[/g, "[");
    html = html.replace(/\\\]/g, "]");
    html = html.replace(/\\\\/g, "\\");
    html = html.replace(/\\_/g, "_");
    // \*
    html = html.replace(/\\\*/g, "*");
    return html;
  }

  removeSpeciLatex(html: string): string {
    // 移除特定的LaTeX代码
    // \label{eq:local}
    html = html.replace(/\\label\{eq:[^\}]+\}/g, "");
    // \ref{eq:local}
    html = html.replace(/\\ref\{eq:[^\}]+\}/g, "");
    // \eqref{eq:local}
    html = html.replace(/\\eqref\{eq:[^\}]+\}/g, "");
    // \cite{key}
    html = html.replace(/\\cite\{[^\}]+\}/g, "");
    // \citep{key}
    html = html.replace(/\\citep\{[^\}]+\}/g, "");
    //\label{eq:opt}
    html = html.replace(/\\label\{eq:[^\}]+\}/g, "");
    // \ref{eq:opt}
    html = html.replace(/\\ref\{eq:[^\}]+\}/g, "");
    return html;
  }

  // html转markdown
  convertHtmlToMarkdown(html: string, url: string | null): string {
    // 定制解析Latex的规则
    // <script type="math/tex" id="MathJax-Element-1">\mathop{\text{msign}}</script>
    // 获取\mathop{\text{msign}}
    this.turndownService.addRule("latex", {
      filter: (node: Node): boolean => {
        return node.nodeName === "SCRIPT" && (node as HTMLScriptElement).type === "math/tex";
      },
      replacement: (content: string): string => {
        // 保留LaTeX代码，修正单个$符号的问题
        content = this.removeLatexEscape(content);
        // 如果内容以$开头和结尾，直接返回
        if (content.startsWith("$") && content.endsWith("$")) {
          return content.trim();
        }
        // 否则添加$符号
        content = content.replace(/^\$/, "").replace(/\$$/, ""); // 移除开头和结尾的$
        return `$${content.trim()}$`;
      },
    });

    this.turndownService.addRule("latex-display", {
      filter: (node: Node): boolean => {
        return (
          node.nodeName === "SCRIPT" &&
          (node as HTMLScriptElement).type === "math/tex; mode=display"
        );
      },
      replacement: (content: string): string => {
        // 保留LaTeX代码，修正单个$符号的问题
        content = this.removeLatexEscape(content);
        // 如果内容以$开头和结尾，直接返回
        if (content.startsWith("$") && content.endsWith("$")) {
          return content.trim();
        }
        // 否则添加$符号
        content = content.replace(/^\$/, "").replace(/\$$/, ""); // 移除开头和结尾的$
        return `$$\n${content.trim()}\n$$`;
      },
    });

    return this.turndownService.turndown(html);
  }
}
