import { ArxivRule } from "../../rules/ArxivRule";

const table_html = `<table class="ltx_tabular ltx_centering ltx_guessed_headers ltx_align_middle" id="S6.T2.14.14">
<tbody class="ltx_tbody">
<tr class="ltx_tr" id="S6.T2.14.14.15.1">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row ltx_border_tt" id="S6.T2.14.14.15.1.1" rowspan="2"><span class="ltx_text" id="S6.T2.14.14.15.1.1.1">Model</span></th>
<td class="ltx_td ltx_align_center ltx_border_tt" colspan="2" id="S6.T2.14.14.15.1.2">BLEU</td>
<td class="ltx_td ltx_border_tt" id="S6.T2.14.14.15.1.3"></td>
<td class="ltx_td ltx_align_center ltx_border_tt" colspan="2" id="S6.T2.14.14.15.1.4">Training Cost (FLOPs)</td>
</tr>
<tr class="ltx_tr" id="S6.T2.14.14.16.2">
<td class="ltx_td ltx_align_center ltx_border_t" id="S6.T2.14.14.16.2.1">EN-DE</td>
<td class="ltx_td ltx_align_center ltx_border_t" id="S6.T2.14.14.16.2.2">EN-FR</td>
<td class="ltx_td" id="S6.T2.14.14.16.2.3"></td>
<td class="ltx_td ltx_align_center ltx_border_t" id="S6.T2.14.14.16.2.4">EN-DE</td>
<td class="ltx_td ltx_align_center ltx_border_t" id="S6.T2.14.14.16.2.5">EN-FR</td>
</tr>
<tr class="ltx_tr" id="S6.T2.14.14.17.3">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row ltx_border_t" id="S6.T2.14.14.17.3.1">ByteNet <cite class="ltx_cite ltx_citemacro_citep">[<a class="ltx_ref" href="#bib.bib18" title="">18</a>]</cite>
</th>
<td class="ltx_td ltx_align_center ltx_border_t" id="S6.T2.14.14.17.3.2">23.75</td>
<td class="ltx_td ltx_border_t" id="S6.T2.14.14.17.3.3"></td>
<td class="ltx_td ltx_border_t" id="S6.T2.14.14.17.3.4"></td>
<td class="ltx_td ltx_border_t" id="S6.T2.14.14.17.3.5"></td>
<td class="ltx_td ltx_border_t" id="S6.T2.14.14.17.3.6"></td>
</tr>
<tr class="ltx_tr" id="S6.T2.1.1.1">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row" id="S6.T2.1.1.1.2">Deep-Att + PosUnk <cite class="ltx_cite ltx_citemacro_citep">[<a class="ltx_ref" href="#bib.bib39" title="">39</a>]</cite>
</th>
<td class="ltx_td" id="S6.T2.1.1.1.3"></td>
<td class="ltx_td ltx_align_center" id="S6.T2.1.1.1.4">39.2</td>
<td class="ltx_td" id="S6.T2.1.1.1.5"></td>
<td class="ltx_td" id="S6.T2.1.1.1.6"></td>
<td class="ltx_td ltx_align_center" id="S6.T2.1.1.1.1"><math alttext="1.0\cdot 10^{20}" class="ltx_Math" display="inline" id="S6.T2.1.1.1.1.m1.1"></math></td>
</tr>
<tr class="ltx_tr" id="S6.T2.3.3.3">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row" id="S6.T2.3.3.3.3">GNMT + RL <cite class="ltx_cite ltx_citemacro_citep">[<a class="ltx_ref" href="#bib.bib38" title="">38</a>]</cite>
</th>
<td class="ltx_td ltx_align_center" id="S6.T2.3.3.3.4">24.6</td>
<td class="ltx_td ltx_align_center" id="S6.T2.3.3.3.5">39.92</td>
<td class="ltx_td" id="S6.T2.3.3.3.6"></td>
<td class="ltx_td ltx_align_center" id="S6.T2.2.2.2.1"><math alttext="2.3\cdot 10^{19}" class="ltx_Math" display="inline" id="S6.T2.2.2.2.1.m1.1"></math></td>
<td class="ltx_td ltx_align_center" id="S6.T2.3.3.3.2"><math alttext="1.4\cdot 10^{20}" class="ltx_Math" display="inline" id="S6.T2.3.3.3.2.m1.1"></math></td>
</tr>
<tr class="ltx_tr" id="S6.T2.5.5.5">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row" id="S6.T2.5.5.5.3">ConvS2S <cite class="ltx_cite ltx_citemacro_citep">[<a class="ltx_ref" href="#bib.bib9" title="">9</a>]</cite>
</th>
<td class="ltx_td ltx_align_center" id="S6.T2.5.5.5.4">25.16</td>
<td class="ltx_td ltx_align_center" id="S6.T2.5.5.5.5">40.46</td>
<td class="ltx_td" id="S6.T2.5.5.5.6"></td>
<td class="ltx_td ltx_align_center" id="S6.T2.4.4.4.1"><math alttext="9.6\cdot 10^{18}" class="ltx_Math" display="inline" id="S6.T2.4.4.4.1.m1.1"></math></td>
<td class="ltx_td ltx_align_center" id="S6.T2.5.5.5.2"><math alttext="1.5\cdot 10^{20}" class="ltx_Math" display="inline" id="S6.T2.5.5.5.2.m1.1"></math></td>
</tr>
<tr class="ltx_tr" id="S6.T2.7.7.7">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row" id="S6.T2.7.7.7.3">MoE <cite class="ltx_cite ltx_citemacro_citep">[<a class="ltx_ref" href="#bib.bib32" title="">32</a>]</cite>
</th>
<td class="ltx_td ltx_align_center" id="S6.T2.7.7.7.4">26.03</td>
<td class="ltx_td ltx_align_center" id="S6.T2.7.7.7.5">40.56</td>
<td class="ltx_td" id="S6.T2.7.7.7.6"></td>
<td class="ltx_td ltx_align_center" id="S6.T2.6.6.6.1"><math alttext="2.0\cdot 10^{19}" class="ltx_Math" display="inline" id="S6.T2.6.6.6.1.m1.1"></math></td>
<td class="ltx_td ltx_align_center" id="S6.T2.7.7.7.2"><math alttext="1.2\cdot 10^{20}" class="ltx_Math" display="inline" id="S6.T2.7.7.7.2.m1.1"></math></td>
</tr>
<tr class="ltx_tr" id="S6.T2.8.8.8">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row ltx_border_t" id="S6.T2.8.8.8.2">
<span class="ltx_rule" style="width:0.0pt;height:8.6pt;background:black;display:inline-block;"></span>Deep-Att + PosUnk Ensemble <cite class="ltx_cite ltx_citemacro_citep">[<a class="ltx_ref" href="#bib.bib39" title="">39</a>]</cite>
</th>
<td class="ltx_td ltx_border_t" id="S6.T2.8.8.8.3"></td>
<td class="ltx_td ltx_align_center ltx_border_t" id="S6.T2.8.8.8.4">40.4</td>
<td class="ltx_td ltx_border_t" id="S6.T2.8.8.8.5"></td>
<td class="ltx_td ltx_border_t" id="S6.T2.8.8.8.6"></td>
<td class="ltx_td ltx_align_center ltx_border_t" id="S6.T2.8.8.8.1"><math alttext="8.0\cdot 10^{20}" class="ltx_Math" display="inline" id="S6.T2.8.8.8.1.m1.1"></math></td>
</tr>
<tr class="ltx_tr" id="S6.T2.10.10.10">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row" id="S6.T2.10.10.10.3">GNMT + RL Ensemble <cite class="ltx_cite ltx_citemacro_citep">[<a class="ltx_ref" href="#bib.bib38" title="">38</a>]</cite>
</th>
<td class="ltx_td ltx_align_center" id="S6.T2.10.10.10.4">26.30</td>
<td class="ltx_td ltx_align_center" id="S6.T2.10.10.10.5">41.16</td>
<td class="ltx_td" id="S6.T2.10.10.10.6"></td>
<td class="ltx_td ltx_align_center" id="S6.T2.9.9.9.1"><math alttext="1.8\cdot 10^{20}" class="ltx_Math" display="inline" id="S6.T2.9.9.9.1.m1.1"></math></td>
<td class="ltx_td ltx_align_center" id="S6.T2.10.10.10.2"><math alttext="1.1\cdot 10^{21}" class="ltx_Math" display="inline" id="S6.T2.10.10.10.2.m1.1"></math></td>
</tr>
<tr class="ltx_tr" id="S6.T2.12.12.12">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row" id="S6.T2.12.12.12.3">ConvS2S Ensemble <cite class="ltx_cite ltx_citemacro_citep">[<a class="ltx_ref" href="#bib.bib9" title="">9</a>]</cite>
</th>
<td class="ltx_td ltx_align_center" id="S6.T2.12.12.12.4">26.36</td>
<td class="ltx_td ltx_align_center" id="S6.T2.12.12.12.5"><span class="ltx_text ltx_font_bold" id="S6.T2.12.12.12.5.1">41.29</span></td>
<td class="ltx_td" id="S6.T2.12.12.12.6"></td>
<td class="ltx_td ltx_align_center" id="S6.T2.11.11.11.1"><math alttext="7.7\cdot 10^{19}" class="ltx_Math" display="inline" id="S6.T2.11.11.11.1.m1.1"></math></td>
<td class="ltx_td ltx_align_center" id="S6.T2.12.12.12.2"><math alttext="1.2\cdot 10^{21}" class="ltx_Math" display="inline" id="S6.T2.12.12.12.2.m1.1"></math></td>
</tr>
<tr class="ltx_tr" id="S6.T2.13.13.13">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row ltx_border_t" id="S6.T2.13.13.13.2">
<span class="ltx_rule" style="width:0.0pt;height:9.5pt;background:black;display:inline-block;"></span>Transformer (base model)</th>
<td class="ltx_td ltx_align_center ltx_border_t" id="S6.T2.13.13.13.3">27.3</td>
<td class="ltx_td ltx_align_center ltx_border_t" id="S6.T2.13.13.13.4">38.1</td>
<td class="ltx_td ltx_border_t" id="S6.T2.13.13.13.5"></td>
<td class="ltx_td ltx_align_center ltx_border_t" colspan="2" id="S6.T2.13.13.13.1"><math alttext="3.3\cdot 10^{18}" class="ltx_Math" display="inline" id="S6.T2.13.13.13.1.m1.1"></math></td>
</tr>
<tr class="ltx_tr" id="S6.T2.14.14.14">
<th class="ltx_td ltx_align_left ltx_th ltx_th_row ltx_border_bb" id="S6.T2.14.14.14.2">Transformer (big)</th>
<td class="ltx_td ltx_align_center ltx_border_bb" id="S6.T2.14.14.14.3"><span class="ltx_text ltx_font_bold" id="S6.T2.14.14.14.3.1">28.4</span></td>
<td class="ltx_td ltx_align_center ltx_border_bb" id="S6.T2.14.14.14.4"><span class="ltx_text ltx_font_bold" id="S6.T2.14.14.14.4.1">41.8</span></td>
<td class="ltx_td ltx_border_bb" id="S6.T2.14.14.14.5"></td>
<td class="ltx_td ltx_align_center ltx_border_bb" colspan="2" id="S6.T2.14.14.14.1"><math alttext="2.3\cdot 10^{19}" class="ltx_Math" display="inline" id="S6.T2.14.14.14.1.m1.1"></math></td>
</tr>
</tbody>
</table>`;

describe("ArxivRule.convertHtmlToMarkdown", () => {
  const rule = new ArxivRule();
  const baseUrl = "https://arxiv.org/abs/1234.5678";

  it("should convert inline math to markdown", () => {
    const html = '<math alttext="x^2+1" display="inline"></math>';
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    expect(md).toContain("$x^2+1$");
  });

  it("should convert block math to markdown", () => {
    const html = '<math alttext="y=mx+b" display="block"></math>';
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    expect(md).toContain("$$  \ny=mx+b  \n$$");
  });

  it("should convert block math to markdown", () => {
    const html = '<math alttext="\\displaystyle\\mathrm{MultiHead}(Q,K,V)" display="block"></math>';
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    expect(md).toContain("$$  \n\\displaystyle\\mathrm{MultiHead}(Q,K,V)  \n$$");
  });
  it("should convert inline math to markdown", () => {
    const html =
      '<math alttext="\\displaystyle\\mathrm{MultiHead}(Q,K,V)" display="inline"></math>';
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    expect(md).toContain("$\\displaystyle\\mathrm{MultiHead}(Q,K,V)$");
  });

  it("should convert inline math to markdown", () => {
    const html = '<math alttext="x_{2}" display="inline"></math>';
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    expect(md).toContain("$x_{2}$");
  });

  it("should convert inline math to markdown", () => {
    const html = '<math alttext="x%\ny" display="inline"></math>';
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    expect(md).toContain("$x%  \ny$");
  });

  it("should convert inline math to markdown", () => {
    const html =
      '<math alttext="\\displaystyle\\mathrm{MultiHead}(Q,K,V)" display="inline"></math>';
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    expect(md).toContain("$\\displaystyle\\mathrm{MultiHead}(Q,K,V)$");
  });

  it("should convert figure with image and caption", () => {
    const html = '<figure><img src="img.png"><figcaption>caption</figcaption></figure>';
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    expect(md).toContain("![caption](https://arxiv.org/abs/1234.5678/img.png)");
  });

  it("should convert table with math in cells", () => {
    const html = "<table><tr><td><math alttext='x^2' display='inline'></math></td></tr></table>";
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    console.info(md);
    expect(md).toContain("| $x^2$ |");
    expect(md).toContain("|---|");
  });

  it("should convert table with math in cells", () => {
    const html = `<table class="ltx_tabular ltx_centering ltx_guessed_headers ltx_align_middle" id="S6.T2.14.14.14">
      <tbody class="ltx_tbody">
      <tr class="ltx_tr" id="S6.T2.14.14.14.1">
        <td class="ltx_td ltx_align_center ltx_border_bb" id="S6.T2.14.14.14.1.1"><math alttext="x^2" class="ltx_Math" display="inline" id="S6.T2.14.14.14.1.1.m1.1"></math></td>
      </tr>
      </tbody>
    </table>`;
    const md = rule.convertHtmlToMarkdown(html, baseUrl);
    expect(md).toContain("| $x^2$ |");
    expect(md).toContain("|---|");
  });

  it("should convert table with math in cells", () => {
    const md = rule.convertHtmlToMarkdown(table_html, baseUrl);
    console.info(md);
    expect(md).toContain("| $x^2$ |");
    expect(md).toContain("|---|");
  });
});
