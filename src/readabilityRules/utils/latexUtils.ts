import exp from "constants";

export function removeLatexEscape(html: string): string {
  // 替换 \[ \] \\ \_ 为 \[ \] \_ \
  html = html.replace(/\\\[/g, "[");
  html = html.replace(/\\\]/g, "]");
  html = html.replace(/\\\\/g, "\\");
  html = html.replace(/\\_/g, "_");
  // \*
  html = html.replace(/\\\*/g, "*");
  return html;
}

export function removeSpeciLatex(html: string): string {
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

// 只处理数学公式区域的多余反斜杠
export function processMathBlock(md: string): string {
  md = md.replace(/\$\$([\s\S]*?)\$\$/g, (m) => removeLatexEscape(m.replace(/\\\\/g, "\\")));
  md = md.replace(/\$([^$]+)\$/g, (m) => removeLatexEscape(m.replace(/\\\\/g, "\\")));
  md = removeLatexEscape(md);
  return md;
}
