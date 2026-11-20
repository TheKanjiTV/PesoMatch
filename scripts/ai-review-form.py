"""Create a blank, offline blinded review form from a prepared synthetic packet."""
import argparse
import csv
import html
import json
from pathlib import Path


def build(directory):
    packet = Path(directory)
    with (packet / 'matching-ratings.csv').open(encoding='utf-8-sig', newline='') as source:
        reader = csv.DictReader(source)
        fields, rows = reader.fieldnames, list(reader)
    if any(row.get('relevance_grade') or row.get('reviewer_id') for row in rows):
        raise ValueError('Use a blank packet; completed ratings must never be copied into a new reviewer form.')
    evidence = (packet / 'blind-matching.md').read_text(encoding='utf-8')
    sections = {}
    for block in evidence.split('\n## ')[1:]:
        heading, _, body = block.partition('\n')
        sections[heading.strip()] = body.strip()
    cards = []
    for index, row in enumerate(rows):
        key = f"{row['case_id']} / candidate {row['candidate_id']}"
        if key not in sections:
            raise ValueError('Packet evidence does not match the blank rating rows.')
        cards.append(f'''<section><h2>{html.escape(key)}</h2>
<pre>{html.escape(sections[key])}</pre>
<label>Relevance grade<select name="grade-{index}" required><option value="">Choose your independent judgment</option>
<option value="0">0 — Unrelated</option><option value="1">1 — Partial</option><option value="2">2 — Relevant</option><option value="3">3 — Strongly relevant</option></select></label>
<label>Reason, with evidence<textarea name="reason-{index}" required rows="3"></textarea></label>
<label>Qualification evidence notes (optional)<textarea name="qualification-{index}" rows="2"></textarea></label></section>''')
    data = json.dumps({'fields': fields, 'rows': rows}, ensure_ascii=False).replace('</', '<\\/')
    document = r'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PesoMatch independent blind relevance review</title><style>
*{box-sizing:border-box}body{margin:0;background:#f8f8f1;color:#163b34;font:16px/1.65 system-ui,sans-serif}main{max-width:980px;margin:auto;padding:32px 20px}h1,h2{font-family:Georgia,serif;line-height:1.25}h1{font-size:34px}h2{font-size:23px}p{max-width:75ch}section{padding:28px 0;border-top:1px solid #a4bfb1;margin-top:24px}label{display:block;margin:18px 0 0;font-weight:600}input,select,textarea,button{font:inherit;width:100%;margin-top:6px;padding:12px;border:1px solid #638a7a;border-radius:8px;background:white;color:inherit}textarea{resize:vertical}input[type=checkbox]{width:20px;min-height:20px;margin-right:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:20px;border:1px solid #a4bfb1;border-radius:8px;font:14px/1.7 ui-monospace,monospace}button{cursor:pointer;background:#153f35;color:white;font-weight:600;min-height:48px}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #b45d23;outline-offset:3px}.notice{padding:16px;background:#e9efdf;border-radius:8px}.identity{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}@media(max-width:620px){.identity{display:block}h1{font-size:28px}main{padding:20px 16px}}@media print{button{display:none}body{background:white}section{break-inside:avoid}}
</style><main><h1>Independent blind relevance review</h1>
<p>Para sa aktuwal na PESO staff o qualified reviewer. Synthetic cases lang ito. Basahin ang profile at vacancy, pagkatapos magbigay ng sarili mong judgment at dahilan. Huwag muna buksan ang AI outputs o model scores.</p>
<p class="notice">Walang prefilled rating o result. Ang semantic relevance ay hiwalay sa verified qualifications. “Hindi nakasaad” ay hindi katumbas ng “walang skill.” Do not use model-generated judgments as independent human ratings.</p>
<form><div class="identity"><label>Reviewer ID (use a study code)<input name="reviewer_id" required maxlength="100"></label><label>Actual role and relevant experience<input name="reviewer_role_and_experience" required maxlength="500"></label><label>Actual review date<input type="date" name="reviewed_at" required></label></div>
<label><input type="checkbox" name="independent" required>I independently reviewed these cases and did not author or tune their prompts. These ratings are my own human judgments.</label>
CARDS
<button type="submit">Download my completed matching ratings CSV</button><p id="status" role="status"></p></form>
<p>No information is sent to a server or stored in this browser. Download before closing. Keep your original signed review records with the study coordinator. Afterwards, use the separate grounding/writing/interview worksheet for claim-level review; it is not included here to preserve blinding.</p>
<script>
const packet=DATA;
document.querySelector('form').addEventListener('submit',event=>{
event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const values=new FormData(form);
const result=packet.rows.map((row,index)=>({...row,reviewer_id:values.get('reviewer_id'),reviewer_role_and_experience:values.get('reviewer_role_and_experience'),reviewed_at:values.get('reviewed_at'),independent_review_confirmed:'yes',relevance_grade:values.get('grade-'+index),reason:values.get('reason-'+index),qualification_evidence_notes:values.get('qualification-'+index)}));
const cell=value=>'"'+String(value??'').replaceAll('"','""')+'"';const csv=[packet.fields.map(cell).join(','),...result.map(row=>packet.fields.map(field=>cell(row[field])).join(','))].join('\r\n');
const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='matching-ratings-'+String(values.get('reviewer_id')).replace(/[^a-z0-9_-]/ig,'_')+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#status').textContent='CSV exported. Submit it to your study coordinator; no evaluation score was invented or calculated here.';
});
</script></main></html>'''.replace('CARDS', '\n'.join(cards)).replace('DATA', data)
    output = packet / 'START-blind-review.html'
    output.write_text(document, encoding='utf-8')
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('packet_directory')
    print(build(parser.parse_args().packet_directory))
